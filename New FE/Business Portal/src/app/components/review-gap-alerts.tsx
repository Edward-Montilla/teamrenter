import { useState } from "react";
import { AlertTriangle, Send, Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { properties } from "../data/mock-data";

export function ReviewGapAlerts() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const insufficientReviews = properties.filter((p) => p.reviewCount < 30);

  const handleInvite = (propertyName: string) => {
    setSelectedProperty(propertyName);
    setModalOpen(true);
    setCopied(false);
  };

  const handleCopy = () => {
    const inviteLink = `https://livedin.com/review/${selectedProperty.toLowerCase().replace(/\s+/g, "-")}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Review Gap Alerts
        </h1>
        <p className="text-muted-foreground">
          Properties needing more reviews to display public TrustScore
        </p>
      </div>

      {insufficientReviews.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Check className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All properties have sufficient reviews!</h3>
            <p className="text-muted-foreground">
              Every property in your portfolio has enough reviews to display a public TrustScore.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {insufficientReviews.map((property) => {
            const reviewsNeeded = 30 - property.reviewCount;
            const progress = (property.reviewCount / 30) * 100;

            return (
              <Card key={property.id} className="border-amber-200 bg-amber-50/30">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <div>
                          <h3 className="font-semibold">{property.name}</h3>
                          <p className="text-sm text-muted-foreground">{property.address}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">
                            {property.reviewCount} of 30 reviews
                          </span>
                          <span className="font-medium text-amber-700">
                            {reviewsNeeded} more needed
                          </span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <Badge variant="outline" className="bg-white">
                        {property.reviewCount === 0 ? "No reviews yet" : "Insufficient for TrustScore"}
                      </Badge>
                    </div>

                    <Button
                      onClick={() => handleInvite(property.name)}
                      className="ml-4 bg-[#f59e0b] hover:bg-[#d97706] text-[#0a1628] gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Invite Tenants
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Tenants to Review</DialogTitle>
            <DialogDescription>
              Share this link with tenants at {selectedProperty} to collect reviews
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={`https://livedin.com/review/${selectedProperty.toLowerCase().replace(/\s+/g, "-")}`}
                className="flex-1"
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> Send this link via email to current and past tenants. 
                Reviews help prospective renters make informed decisions and improve your property's visibility.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
