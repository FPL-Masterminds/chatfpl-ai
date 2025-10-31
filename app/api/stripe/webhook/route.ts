export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

export async function POST(request: Request) {
  console.log('[Webhook] Received request');
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error('[Webhook] Error: Missing signature or secret');
    return NextResponse.json({ error: 'Webhook secret or signature missing.' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    console.log('[Webhook] Constructing event...');
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`[Webhook] Event constructed successfully: ${event.id}, Type: ${event.type}`);
  } catch (err: any) {
    console.error(`[Webhook] Signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    console.log(`[Webhook] Handling relevant event: ${event.type}`);
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          console.log(`[Webhook] Checkout session completed ID: ${checkoutSession.id}`);

          const customerEmail = checkoutSession.customer_details?.email;
          const stripeSubscriptionId = checkoutSession.subscription as string;
          const stripeCustomerId = checkoutSession.customer as string;

          console.log(`[Webhook] Extracted data - Email: ${customerEmail}, SubID: ${stripeSubscriptionId}, CustID: ${stripeCustomerId}`);

          if (!stripeSubscriptionId || !stripeCustomerId || !customerEmail) {
            console.error('[Webhook] Error: checkout.session.completed missing required data');
            return NextResponse.json({ error: 'Webhook error: Missing required data in session' }, { status: 400 });
          }

          console.log(`[Webhook] Finding user with email: ${customerEmail}`);
          const user = await prisma.user.findUnique({
            where: { email: customerEmail },
          });
          console.log(`[Webhook] User lookup result:`, user ? { id: user.id, email: user.email } : 'Not Found');

          if (!user) {
            console.error(`[Webhook] Error: User not found for email: ${customerEmail}`);
            return NextResponse.json({ error: `User not found for email: ${customerEmail}` }, { status: 404 });
          }

          // Retrieve the full subscription object
          console.log(`[Webhook] Retrieving full subscription details for SubID: ${stripeSubscriptionId}`);
          const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
          
          // Handle timestamp conversion with fallback
          const rawPeriodStart = subscription.current_period_start;
          const rawPeriodEnd = subscription.current_period_end;
          console.log('[Webhook] Stripe timestamps - Start:', rawPeriodStart, 'End:', rawPeriodEnd);
          
          const periodStartForDb = rawPeriodStart && !isNaN(rawPeriodStart)
            ? new Date(rawPeriodStart * 1000)
            : null;
          const periodEndForDb = rawPeriodEnd && !isNaN(rawPeriodEnd)
            ? new Date(rawPeriodEnd * 1000)
            : null;
          console.log(`[Webhook] Converted dates - Start:`, periodStartForDb, 'End:', periodEndForDb);
          
          const stripePriceId = subscription.items.data[0]?.price.id;
          console.log(`[Webhook] PriceID: ${stripePriceId}, Status: ${subscription.status}`);

          if (!stripePriceId) {
            console.error(`[Webhook] Error: Could not retrieve Price ID`);
            return NextResponse.json({ error: 'Could not determine price ID from subscription.' }, { status: 400 });
          }

          // Determine plan based on price ID
          let plan = 'Premium';
          if (stripePriceId === process.env.STRIPE_PRICE_ID_ELITE) {
            plan = 'Elite';
          }

          // Determine messages_limit based on plan
          const messagesLimit = plan === 'Elite' ? 500 : 100;

          console.log(`[Webhook] Upserting subscription for UserID: ${user.id}, Plan: ${plan}`);
          await prisma.subscription.upsert({
            where: { userId: user.id },
            update: {
              stripeSubscriptionId: stripeSubscriptionId,
              stripeCustomerId: stripeCustomerId,
              stripePriceId: stripePriceId,
              currentPeriodStart: periodStartForDb,
              currentPeriodEnd: periodEndForDb,
              plan: plan,
              status: subscription.status,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
            create: {
              userId: user.id,
              stripeSubscriptionId: stripeSubscriptionId,
              stripeCustomerId: stripeCustomerId,
              stripePriceId: stripePriceId,
              currentPeriodStart: periodStartForDb,
              currentPeriodEnd: periodEndForDb,
              plan: plan,
              status: subscription.status,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          });

          // Update usage tracking for the user
          const now = new Date();
          await prisma.usageTracking.upsert({
            where: {
              user_id_month_year: {
                userId: user.id,
                month: now.getMonth() + 1,
                year: now.getFullYear(),
              },
            },
            update: {
              messagesLimit: messagesLimit,
              messagesUsed: 0, // Reset on new subscription
            },
            create: {
              userId: user.id,
              month: now.getMonth() + 1,
              year: now.getFullYear(),
              messagesUsed: 0,
              messagesLimit: messagesLimit,
            },
          });

          // Send admin notification
          try {
            await fetch(`${process.env.NEXTAUTH_URL}/api/admin/notify-signup`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userName: user.name,
                userEmail: user.email,
                plan: plan,
              }),
            });
          } catch (err) {
            console.error('[Webhook] Failed to send admin notification:', err);
          }

          console.log(`[Webhook] DB Upsert completed for UserID: ${user.id}`);
          break;
        }
        
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`[Webhook] Handling customer.subscription.updated for SubID: ${subscription.id}`);
          
          const rawPeriodStartUpdated = subscription.current_period_start;
          const rawPeriodEndUpdated = subscription.current_period_end;
          const updatedPeriodStartForDb = rawPeriodStartUpdated && !isNaN(rawPeriodStartUpdated)
            ? new Date(rawPeriodStartUpdated * 1000)
            : null;
          const updatedPeriodEndForDb = rawPeriodEndUpdated && !isNaN(rawPeriodEndUpdated)
            ? new Date(rawPeriodEndUpdated * 1000)
            : null;
          
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              status: subscription.status,
              stripePriceId: subscription.items.data[0]?.price.id,
              currentPeriodStart: updatedPeriodStartForDb,
              currentPeriodEnd: updatedPeriodEndForDb,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          });
          console.log(`[Webhook] DB Update completed for SubID: ${subscription.id}`);
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`[Webhook] Handling customer.subscription.deleted for SubID: ${subscription.id}`);
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              status: subscription.status,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          });
          console.log(`[Webhook] DB Delete (status update) completed for SubID: ${subscription.id}`);
          break;
        }
        
        default:
          console.warn(`[Webhook] Unhandled relevant event type: ${event.type}`);
      }
    } catch (error: any) {
      console.error('[Webhook] Error handling event:', error);
      return NextResponse.json({ error: `Webhook handler failed: ${error.message || 'Unknown error'}` }, { status: 500 });
    }
  }

  console.log('[Webhook] Event processed successfully or ignored. Sending 200 OK.');
  return NextResponse.json({ received: true });
}
