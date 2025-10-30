import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Generate referral link using user's ID
    // For Phase 1, we'll use a simple base64 encoding of the user ID
    const referralCode = Buffer.from(user.id).toString('base64').replace(/=/g, '');
    const referralLink = `${process.env.NEXTAUTH_URL || 'https://chatfpl.ai'}?ref=${referralCode}`;

    return NextResponse.json({
      referralLink,
      referralCode
    }, { status: 200 });

  } catch (error) {
    console.error("Generate referral error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

