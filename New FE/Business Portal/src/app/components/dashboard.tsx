import { useNavigate } from "react-router";
import { TrendingUp, TrendingDown, Minus, Building2, Eye } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { properties } from "../data/mock-data";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function Dashboard() {
  const navigate = useNavigate();

  const getVacancyBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Available</Badge>;
      case "limited":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Limited</Badge>;
      case "full":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Full</Badge>;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "down":
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Portfolio Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of your property portfolio performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <Card
            key={property.id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div 
              className="h-48 bg-gradient-to-br from-[#0f1f3a] to-[#2a4266] relative cursor-pointer"
              onClick={() => navigate("/portal/performance")}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Building2 className="w-16 h-16 text-[#f59e0b] opacity-50" />
              </div>
              <div className="absolute top-4 right-4">
                {getVacancyBadge(property.vacancyStatus)}
              </div>
            </div>
            <CardContent className="p-6">
              <div 
                className="cursor-pointer"
                onClick={() => navigate("/portal/performance")}
              >
                <h3 className="font-semibold mb-1">{property.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{property.address}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">TrustScore</div>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                        {property.trustScore > 0 ? property.trustScore.toFixed(1) : "—"}
                      </span>
                      <span className="text-muted-foreground">/10</span>
                      {property.trustScore > 0 && getTrendIcon(property.trend)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Reviews</div>
                    <div className="text-2xl font-semibold">{property.reviewCount}</div>
                  </div>
                </div>

                {property.trustScore === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-amber-800">
                      Insufficient reviews to display TrustScore
                    </p>
                  </div>
                )}
              </div>

              {property.trustScore > 0 && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/property/${property.id}`);
                  }}
                >
                  <Eye className="w-4 h-4" />
                  Preview Public Profile
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}