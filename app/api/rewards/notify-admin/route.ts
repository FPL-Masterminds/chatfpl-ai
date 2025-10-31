import { NextResponse } from "next/server";
import { Resend } from "resend";
import { wrapEmailContent } from "@/lib/email-templates";

/**
 * Internal API endpoint to send admin notification emails
 * Called when users submit reward claims
 */
export async function POST(request: Request) {
  try {
    const { userName, userEmail, actionType, rewardMessages, proofUrl } = await request.json();

    const resend = new Resend(process.env.RESEND_API_KEY);

    const content = `
      <h2 style="color: #2E0032;">🎁 New Reward Claim Submitted</h2>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #00FF86;">User Details</h3>
        <p style="margin: 8px 0;"><strong>Name:</strong> ${userName || "Not provided"}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> ${userEmail}</p>
      </div>

      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #00FF86;">Claim Details</h3>
        <p style="margin: 8px 0;"><strong>Action Type:</strong> ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}</p>
        <p style="margin: 8px 0;"><strong>Reward Amount:</strong> ${rewardMessages} messages</p>
        ${proofUrl ? `<p style="margin: 8px 0;"><strong>Proof URL:</strong> <a href="${proofUrl}" target="_blank" style="color: #00FF86; word-break: break-all;">${proofUrl}</a></p>` : ''}
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://chatfpl.ai/admin" class="button">
          Review in Admin Dashboard
        </a>
      </div>

      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        This is an automated notification from ChatFPL AI.ai. Log into your admin dashboard to approve or reject this claim.
      </p>
    `;

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "ChatFPL AI <noreply@chatfpl.ai>",
      to: "ChatFPL AIai@gmail.com",
      subject: `🎁 New Reward Claim: ${actionType} (${rewardMessages} messages)`,
      html: wrapEmailContent(content),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to send admin notification:", error);
    // Don't fail the reward claim if email fails
    return NextResponse.json({ success: false, error: "Email failed" }, { status: 500 });
  }
}

