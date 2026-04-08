import { useNavigate, useParams } from "react-router";
import { Building2, Star, ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { properties, reviews } from "../data/mock-data";

export function PropertyPublicView() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const property = properties.find((p) => p.id === id) || properties[0];
  const propertyReviews = reviews.filter((r) => r.propertyId === property.id && !r.isFlagged);

  const categoryLabels = {
    maintenance: "Maintenance",
    responsiveness: "Management Responsiveness",
    value: "Value for Money",
    safety: "Building Safety",
    noise: "Noise & Neighbours",
    moveInOut: "Move-in/Move-out",
    cleanliness: "Overall Cleanliness",
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "fill-[#f59e0b] text-[#f59e0b]" : "text-gray-300"}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-[#f59e0b]" />
            <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              LivedIn
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/portal")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#0f1f3a] to-[#2a4266] text-white py-12">
        <div className="max-w-6xl mx-auto px-8">
          <Badge className="bg-[#f59e0b] text-[#0a1628] mb-4">Public View</Badge>
          <h1 className="text-4xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            {property.name}
          </h1>
          <p className="text-lg text-gray-300">{property.address}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* TrustScore Display */}
        <Card className="mb-8 border-2 border-[#f59e0b]">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">TrustScore</div>
              <div className="text-7xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                {property.trustScore.toFixed(1)}
              </div>
              <div className="text-xl text-muted-foreground mb-4">out of 10</div>
              <p className="text-muted-foreground">
                Based on {property.reviewCount} verified renter reviews
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <div className="mb-8">
          <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
            Category Scores
          </h2>
          <div className="grid gap-4">
            {Object.entries(categoryLabels).map(([key, label]) => {
              const score = property.categoryScores[key as keyof typeof property.categoryScores];
              return (
                <Card key={key}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{label}</span>
                      <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                        {score.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#f59e0b] rounded-full transition-all"
                        style={{ width: `${score * 10}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="mb-8">
          <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
            Recent Reviews
          </h2>
          <div className="space-y-4">
            {propertyReviews.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reviews yet</p>
                </CardContent>
              </Card>
            ) : (
              propertyReviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-[#0f1f3a] text-white">
                          {review.renterInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">{getRatingStars(review.rating)}</div>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{review.timestamp}</span>
                        </div>
                        <p className="text-foreground mb-2">{review.fullText}</p>
                        <Badge variant="outline" className="text-xs">
                          {review.category}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Write Review CTA */}
        <Card className="bg-gradient-to-br from-[#0f1f3a] to-[#2a4266] text-white border-none">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              Have you lived here?
            </h3>
            <p className="text-gray-300 mb-6">
              Share your experience to help others make informed decisions
            </p>
            <Button
              size="lg"
              className="bg-[#f59e0b] hover:bg-[#d97706] text-[#0a1628] gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              Write a Review
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
