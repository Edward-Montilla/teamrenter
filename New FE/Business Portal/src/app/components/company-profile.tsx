import { useState } from "react";
import { Building2, Upload, Save } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { properties } from "../data/mock-data";

export function CompanyProfile() {
  const [companyName, setCompanyName] = useState("Skyline Property Management");
  const [contactEmail, setContactEmail] = useState("contact@skylinepm.com");
  const [contactPhone, setContactPhone] = useState("+1 (403) 555-0123");
  const [website, setWebsite] = useState("www.skylinepm.com");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Company Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your company information and branding
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Company Logo</Label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-[#0f1f3a] rounded-lg flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-[#f59e0b]" />
                </div>
                <Button variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload New Logo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Recommended: 512x512px, PNG or JPG format
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Contact Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="bg-white"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Associated Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{property.name}</div>
                    <div className="text-sm text-muted-foreground">{property.address}</div>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Add Property
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            className="bg-[#f59e0b] hover:bg-[#d97706] text-[#0a1628] gap-2 min-w-32"
          >
            {saved ? (
              <>
                <Save className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
