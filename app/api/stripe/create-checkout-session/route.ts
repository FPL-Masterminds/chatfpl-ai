import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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

    const planName = `${plan} Subscription`;

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: session.user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL}/account?success=true`,
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

