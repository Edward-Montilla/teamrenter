import { useState } from "react";
import { useNavigate } from "react-router";
import { Flag, Star } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { reviews as initialReviews } from "../data/mock-data";

export function ReviewFeed() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState("all");

  const handleFlag = (reviewId: string) => {
    setReviews(prev =>
      prev.map(review =>
        review.id === reviewId
          ? { ...review, isFlagged: true, flagReason: "Flagged by manager for review", status: "pending" as const }
          : review
      )
    );
    // Navigate to moderation queue after flagging
    setTimeout(() => navigate("/portal/moderation"), 500);
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "fill-[#f59e0b] text-[#f59e0b]" : "text-gray-300"}`}
      />
    ));
  };

  const filteredReviews = filter === "all" 
    ? reviews 
    : reviews.filter(r => !r.isFlagged);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Review Feed
        </h1>
        <p className="text-muted-foreground">
          Incoming reviews across all properties
        </p>
      </div>

      <div className="mb-6 flex gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter reviews" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reviews</SelectItem>
            <SelectItem value="unflagged">Unflagged Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <div
            key={review.id}
            className="bg-white border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-[#0f1f3a] text-white">
                    {review.renterInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{review.propertyName}</span>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{review.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">{getRatingStars(review.rating)}</div>
                    <Badge variant="outline" className="text-xs">
                      {review.category}
                    </Badge>
                  </div>
                  <p className="text-foreground">{review.snippet}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {review.isFlagged ? (
                  <Badge variant="destructive" className="gap-1">
                    <Flag className="w-3 h-3" />
                    Flagged
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFlag(review.id)}
                    className="gap-2"
                  >
                    <Flag className="w-4 h-4" />
                    Flag
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
