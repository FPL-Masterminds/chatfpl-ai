# Stripe Payment Notifications (Not Yet Implemented)

## Overview
This file documents the Premium/Elite subscription notification system that needs to be implemented once Stripe integration is complete.

## What's Needed

### 1. Stripe Webhook Handler
Create `app/api/stripe/webhook/route.ts` to handle Stripe events:

```typescript
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  // Handle checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Extract user and plan details
    const userEmail = session.customer_email;
    const plan = session.metadata?.plan; // "Premium" or "Elite"
    
    // Update user's subscription in database
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (user) {
      // Notify admin of new paying customer
      await fetch(`${process.env.NEXTAUTH_URL}/api/admin/notify-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: user.name,
          userEmail: user.email,
          plan: plan, // "Premium" or "Elite"
        }),
      });
    }
  }

  return NextResponse.json({ received: true });
}
```

### 2. Admin Notification Email
The existing `/api/admin/notify-signup` endpoint already supports Premium/Elite notifications. It will:
- Send email to ChatFPLai@gmail.com
- Show revenue impact (£19.99 or £49.99/month)
- Highlight the payment with a gold banner
- Include direct link to admin dashboard

### 3. Email Templates
Already implemented in `lib/email-templates.ts` and `/api/admin/notify-signup`:
- **Premium**: 💰 New Premium Subscriber! (+£19.99/month)
- **Elite**: 🏆 New Elite Subscriber! (+£49.99/month)
- Includes ChatFPL logo header/footer
- Branded with site colors

## Current Status
✅ Email notification system built and ready
✅ Admin notification endpoint supports Premium/Elite
✅ Branded email templates with logo
❌ Stripe webhook handler (awaiting Stripe integration)
❌ Stripe checkout integration

## When Stripe is Implemented
1. Create webhook endpoint at `/api/stripe/webhook/route.ts`
2. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to environment variables
3. Configure Stripe webhook in dashboard to point to `https://chatfpl.ai/api/stripe/webhook`
4. Test with Stripe CLI: `stripe trigger checkout.session.completed`

## Testing
Once Stripe is live, test notifications by:
1. Creating a test Premium subscription
2. Checking ChatFPLai@gmail.com for notification
3. Creating a test Elite subscription
4. Verifying revenue calculations in emails

