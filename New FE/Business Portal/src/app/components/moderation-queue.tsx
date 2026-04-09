import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, Star } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { reviews as initialReviews } from "../data/mock-data";

export function ModerationQueue() {
  const [reviews, setReviews] = useState(
    initialReviews.filter((r) => r.isFlagged)
  );

  const handleApprove = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId ? { ...review, status: "approved" as const } : review
      )
    );
  };

  const handleRemove = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId ? { ...review, status: "removed" as const } : review
      )
    );
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "fill-[#f59e0b] text-[#f59e0b]" : "text-gray-300"}`}
      />
    ));
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "removed":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Removed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Moderation Queue
        </h1>
        <p className="text-muted-foreground">
          Review and take action on flagged reviews
        </p>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
              <p className="text-muted-foreground">No flagged reviews pending moderation.</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg mb-2">{review.propertyName}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex">{getRatingStars(review.rating)}</div>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{review.timestamp}</span>
                    </div>
                  </div>
                  {getStatusBadge(review.status)}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-4">
                  <p className="text-foreground mb-3">{review.fullText}</p>
                  {review.flagReason && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-900">Flag Reason:</p>
                        <p className="text-sm text-amber-800">{review.flagReason}</p>
                      </div>
                    </div>
                  )}
                </div>

                {review.status === "pending" && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApprove(review.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve Review
                    </Button>
                    <Button
                      onClick={() => handleRemove(review.id)}
                      variant="destructive"
                      className="flex-1 gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Remove Review
                    </Button>
                  </div>
                )}

                {review.status === "approved" && (
                  <p className="text-sm text-green-700 text-center py-2">
                    This review has been approved and is now visible to the public.
                  </p>
                )}

                {review.status === "removed" && (
                  <p className="text-sm text-red-700 text-center py-2">
                    This review has been removed and is hidden from public view.
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
