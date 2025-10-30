import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * Internal API endpoint to send admin notification emails
 * Called when users submit reward claims
 */
export async function POST(request: Request) {
  try {
    const { userName, userEmail, actionType, rewardMessages, proofUrl } = await request.json();

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "ChatFPL <noreply@chatfpl.ai>",
      to: "ChatFPLai@gmail.com",
      subject: `🎁 New Reward Claim: ${actionType} (${rewardMessages} messages)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2E0032;">🎁 New Reward Claim Submitted</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #00FF86;">User Details</h3>
            <p><strong>Name:</strong> ${userName || "Not provided"}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
          </div>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #00FF86;">Claim Details</h3>
            <p><strong>Action Type:</strong> ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}</p>
            <p><strong>Reward Amount:</strong> ${rewardMessages} messages</p>
            ${proofUrl ? `<p><strong>Proof URL:</strong> <a href="${proofUrl}" target="_blank" style="color: #00FF86;">${proofUrl}</a></p>` : ''}
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://chatfpl.ai/admin" 
               style="display: inline-block; background-color: #00FF86; color: #2E0032; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Review in Admin Dashboard
            </a>
          </div>

          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This is an automated notification from ChatFPL.ai. Log into your admin dashboard to approve or reject this claim.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to send admin notification:", error);
    // Don't fail the reward claim if email fails
    return NextResponse.json({ success: false, error: "Email failed" }, { status: 500 });
  }
}

