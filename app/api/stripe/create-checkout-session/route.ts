import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await request.json();

    if (!plan || (plan !== "Premium" && plan !== "Elite")) {
      return NextResponse.json({ error: "Valid plan is required" }, { status: 400 });
    }

    // Look up price ID based on plan (server-side only, never exposed)
    const priceId = plan === "Elite" 
      ? process.env.STRIPE_PRICE_ID_ELITE 
      : process.env.STRIPE_PRICE_ID_PREMIUM;
      
    if (!priceId) {
      return NextResponse.json({ error: "Price configuration error" }, { status: 500 });
    }

    // Check if user has existing subscription
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: {
          take: 1,
          orderBy: { id: 'desc' }
        }
      }
    });

    const existingSubscription = user?.subscriptions[0];
    const existingCustomerId = existingSubscription?.stripe_customer_id;
    const existingSubId = existingSubscription?.stripe_subscription_id;

    // If user has active subscription, upgrade it instead of creating new one
    if (existingCustomerId && existingSubId && existingSubscription?.status === 'active') {
      try {
        // Get the current subscription from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(existingSubId);
        
        // Update the subscription with new price (Stripe handles proration automatically)
        const updatedSubscription = await stripe.subscriptions.update(existingSubId, {
          items: [{
            id: stripeSubscription.items.data[0].id,
            price: priceId,
          }],
          proration_behavior: 'create_prorations', // Pro-rate the difference
        });

        return NextResponse.json({ 
          sessionId: null, 
          url: `${process.env.NEXTAUTH_URL}/admin?upgraded=true`,
          upgraded: true 
        });
      } catch (upgradeError: any) {
        console.error("Error upgrading subscription:", upgradeError);
        // Fall through to create new checkout session if upgrade fails
      }
    }

    const planName = `${plan} Subscription`;

    // Create Stripe checkout session for new subscription
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: session.user.email,
      customer: existingCustomerId || undefined, // Use existing customer if available
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL}/admin?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/#pricing`,
      metadata: {
        user_email: session.user.email,
        plan_name: planName,
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

