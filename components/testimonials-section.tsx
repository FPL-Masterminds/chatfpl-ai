"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { User } from "lucide-react"

interface Review {
  id: string
  userName: string
  rating: number
  description: string
  reviewText: string | null
  reviewType: string
  proofUrl: string | null
  createdAt: string
}

const colorPalette = [
  { circleColor: "#00FF86", iconColor: "#2E0032" },
  { circleColor: "#2E0032", iconColor: "#FFFFFF" },
  { circleColor: "#00FFFF", iconColor: "#2E0032" }
]

export function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [displayedReviews, setDisplayedReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews/homepage")
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews)
        
        // Randomly select 3 reviews or use all if less than 3
        const selectedReviews = selectRandomReviews(data.reviews, 3)
        setDisplayedReviews(selectedReviews)
      } else {
        // Fallback to static reviews if API fails
        setDisplayedReviews(getStaticReviews())
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error)
      // Fallback to static reviews
      setDisplayedReviews(getStaticReviews())
    } finally {
      setLoading(false)
    }
  }

  const selectRandomReviews = (reviewsList: Review[], count: number) => {
    if (reviewsList.length <= count) {
      return reviewsList
    }
    
    const shuffled = [...reviewsList].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  const getStaticReviews = () => {
    return [
      {
        id: "static-1",
        userName: "Ryan Anderson",
        rating: 5,
        description: "Premium Subscriber",
        reviewText: "I asked ChatFPL for a detailed player comparison between Haaland and Joao Pedro. It gave me expected goals, form trends, and fixture difficulty - exactly what I needed for my transfer decision.",
        reviewType: "written",
        proofUrl: null,
        createdAt: new Date().toISOString()
      },
      {
        id: "static-2",
        userName: "Oliver Hughes",
        rating: 5,
        description: "Content Creator",
        reviewText: "I use ChatFPL to write my FPL YouTube scripts. It analyses the data and helps me create engaging content about captain picks and differentials in minutes instead of hours.",
        reviewType: "written",
        proofUrl: null,
        createdAt: new Date().toISOString()
      },
      {
        id: "static-3",
        userName: "Daniel Brown",
        rating: 5,
        description: "Elite Subscriber",
        reviewText: "Every gameweek I ask for transfer suggestions based on my team. ChatFPL considers fixtures, form, and my budget to give me 3-4 solid options with detailed reasoning.",
        reviewType: "written",
        proofUrl: null,
        createdAt: new Date().toISOString()
      }
    ]
  }

  if (loading) {
    return (
      <section id="testimonials" className="bg-muted/30 py-24">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 
              className="mb-4 text-balance text-4xl font-bold uppercase"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '7px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>What </span>
              <span style={{ color: '#00FFFF' }}>users </span>
              <span style={{ color: '#00FF86' }}>say</span>
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-lg" style={{ color: '#4B5563' }}>
              Real feedback from FPL managers using ChatFPL
            </p>
          </div>
          <div className="text-center text-lg text-muted-foreground">
            Loading reviews...
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="testimonials" className="bg-muted/30 py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-16 text-center">
          <h2 
            className="mb-4 text-balance text-4xl font-bold uppercase"
            style={{ 
              fontFamily: "'Futura Maxi CG', sans-serif",
              WebkitTextStroke: '7px #2E0032',
              paintOrder: 'stroke fill'
            }}
          >
            <span style={{ color: 'white' }}>What </span>
            <span style={{ color: '#00FFFF' }}>users </span>
            <span style={{ color: '#00FF86' }}>say</span>
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-lg" style={{ color: '#4B5563' }}>
            Real feedback from FPL managers using ChatFPL
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {displayedReviews.map((review, i) => {
            const colors = colorPalette[i % colorPalette.length]
            
            return (
              <Card key={review.id} className="overflow-hidden border-0 bg-white shadow-md">
                <div className="bg-white p-6">
                  {/* User Icon Circle */}
                  <div className="mb-4 flex justify-center">
                    <div 
                      className="flex h-16 w-16 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.circleColor }}
                    >
                      <User className="h-8 w-8" style={{ color: colors.iconColor }} strokeWidth={2} />
                    </div>
                  </div>
                  
                  {/* Stars */}
                  <div className="mb-4 flex justify-center gap-1">
                    {[...Array(5)].map((_, starIndex) => (
                      <svg
                        key={starIndex}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill={starIndex < review.rating ? "#D4AF37" : "#E5E7EB"}
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  
                  {/* Name */}
                  <h3 className="mb-1 text-center text-lg font-bold text-foreground">
                    {review.userName}
                  </h3>
                  
                  {/* Role */}
                  <p className="mb-4 text-center text-sm font-semibold" style={{ color: '#2E0032' }}>
                    {review.description}
                  </p>
                  
                  {/* Quote */}
                  <p className="text-center text-sm leading-relaxed text-muted-foreground">
                    "{review.reviewText}"
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

