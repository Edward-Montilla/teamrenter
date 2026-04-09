import { useState } from "react";
import { Bell, Mail, TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

export function NotificationSettings() {
  const [newReview, setNewReview] = useState(true);
  const [flagRaised, setFlagRaised] = useState(true);
  const [scoreDrops, setScoreDrops] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [threshold, setThreshold] = useState("7.5");

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Notification Settings
        </h1>
        <p className="text-muted-foreground">
          Configure how you receive alerts and updates
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Review Notifications
            </CardTitle>
            <CardDescription>
              Get notified when reviews are submitted or flagged
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="new-review" className="text-base">
                  New review submitted
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive an alert when a renter submits a new review
                </p>
              </div>
              <Switch
                id="new-review"
                checked={newReview}
                onCheckedChange={setNewReview}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="flag-raised" className="text-base">
                  Flag raised on review
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when a review is flagged for moderation
                </p>
              </div>
              <Switch
                id="flag-raised"
                checked={flagRaised}
                onCheckedChange={setFlagRaised}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Performance Alerts
            </CardTitle>
            <CardDescription>
              Monitor changes in your TrustScore
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="score-drops" className="text-base">
                  Score drops below threshold
                </Label>
                <p className="text-sm text-muted-foreground">
                  Alert when any property's TrustScore falls below your set threshold
                </p>
                {scoreDrops && (
                  <div className="mt-3 flex items-center gap-2">
                    <Label htmlFor="threshold" className="text-sm whitespace-nowrap">
                      Threshold:
                    </Label>
                    <Input
                      id="threshold"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      className="w-20 bg-white"
                    />
                    <span className="text-sm text-muted-foreground">/ 10</span>
                  </div>
                )}
              </div>
              <Switch
                id="score-drops"
                checked={scoreDrops}
                onCheckedChange={setScoreDrops}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Digest
            </CardTitle>
            <CardDescription>
              Receive periodic summaries of your portfolio activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-digest" className="text-base">
                  Weekly digest email
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get a summary of reviews, scores, and trends every Monday
                </p>
              </div>
              <Switch
                id="weekly-digest"
                checked={weeklyDigest}
                onCheckedChange={setWeeklyDigest}
              />
            </div>
          </CardContent>
        </Card>

        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Notifications are sent to your account email (sarah.mitchell@livedin.com). 
            You can update your email in your account settings.
          </p>
        </div>
      </div>
    </div>
  );
}
