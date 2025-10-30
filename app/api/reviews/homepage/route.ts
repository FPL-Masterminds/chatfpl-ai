import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch all approved reviews with display_on_homepage = true
    const reviews = await prisma.socialAction.findMany({
      where: {
        action_type: "review",
        status: "verified",
        display_on_homepage: true
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        verified_at: 'desc'
      }
    });

    // Format reviews for frontend
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      userName: review.user.name || "Anonymous",
      rating: review.metadata && typeof review.metadata === 'object' && 'rating' in review.metadata 
        ? review.metadata.rating as number 
        : 5,
      description: review.metadata && typeof review.metadata === 'object' && 'description' in review.metadata
        ? review.metadata.description as string
        : "Subscriber",
      reviewText: review.metadata && typeof review.metadata === 'object' && 'reviewText' in review.metadata
        ? review.metadata.reviewText as string
        : null,
      reviewType: review.metadata && typeof review.metadata === 'object' && 'reviewType' in review.metadata
        ? review.metadata.reviewType as string
        : "written",
      proofUrl: review.proof_url,
      createdAt: review.created_at.toISOString()
    }));

    return NextResponse.json({
      reviews: formattedReviews,
      total: formattedReviews.length
    }, { status: 200 });

  } catch (error) {
    console.error("Fetch homepage reviews error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

