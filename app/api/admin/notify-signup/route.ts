import { NextResponse } from "next/server";
import { Resend } from "resend";
import { wrapEmailContent } from "@/lib/email-templates";

/**
 * Internal API endpoint to notify admin of new user signups
 */
export async function POST(request: Request) {
  try {
    const { userName, userEmail, plan } = await request.json();

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Different subject/content based on plan
    let subject = "";
    let emoji = "";
    let message = "";

    if (plan === "Free") {
      subject = "🆓 New Free User Signup";
      emoji = "🆓";
      message = "A new user has signed up for the Free trial (5 messages).";
    } else if (plan === "Premium") {
      subject = "💰 New Premium Subscriber!";
      emoji = "💰";
      message = "A new user has subscribed to the Premium plan (£19.99/month, 100 messages).";
    } else if (plan === "Elite") {
      subject = "🏆 New Elite Subscriber!";
      emoji = "🏆";
      message = "A new user has subscribed to the Elite plan (£49.99/month, 500 messages).";
    } else {
      subject = "👤 New User Signup";
      emoji = "👤";
      message = "A new user has signed up.";
    }

    const content = `
      <h2 style="color: #2E0032;">${emoji} ${subject.replace(emoji + " ", "")}</h2>
      <p>${message}</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #00FF86;">User Details</h3>
        <p style="margin: 8px 0;"><strong>Name:</strong> ${userName || "Not provided"}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> ${userEmail}</p>
        <p style="margin: 8px 0;"><strong>Plan:</strong> ${plan}</p>
        ${plan !== "Free" ? '<p style="margin: 8px 0;"><strong>💵 Revenue Impact:</strong> +£' + (plan === "Premium" ? "19.99" : "49.99") + '/month</p>' : ''}
      </div>

      ${plan !== "Free" ? `
      <div style="background: linear-gradient(135deg, #00FF86 0%, #00FFFF 100%); padding: 15px; border-radius: 8px; text-align: center;">
        <p style="margin: 0; color: #2E0032; font-size: 18px; font-weight: bold;">
          💰 New Revenue: £${plan === "Premium" ? "19.99" : "49.99"}/month
        </p>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://chatfpl.ai/admin" 
           style="display: inline-block; background-color: #00FF86; color: #2E0032; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          View in Admin Dashboard
        </a>
      </div>

      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        This is an automated notification from ChatFPL.ai.
      </p>
    `;

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "ChatFPL <noreply@chatfpl.ai>",
      to: "ChatFPLai@gmail.com",
      subject: subject,
      html: wrapEmailContent(content),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to send admin signup notification:", error);
    return NextResponse.json({ success: false, error: "Email failed" }, { status: 500 });
  }
}

