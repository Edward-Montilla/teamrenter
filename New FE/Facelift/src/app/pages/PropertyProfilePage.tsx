import { useParams, Link } from 'react-router';
import { Heart, MapPin, Share2, Flag } from 'lucide-react';
import { useState } from 'react';
import { TrustScoreBadge } from '../components/TrustScoreBadge';
import { CategoryScoreBar } from '../components/CategoryScoreBar';
import { ReviewCard } from '../components/ReviewCard';
import { properties, reviews, categories } from '../data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { motion } from 'motion/react';

export function PropertyProfilePage() {
  const { id } = useParams();
  const property = properties.find(p => p.id === id);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  if (!property) {
    return <div className="py-20 text-center">Property not found</div>;
  }

  const propertyReviews = reviews.filter(r => r.propertyId === id);
  const avgScores = {
    landlordResponsiveness: property.landlordResponsiveness,
    maintenance: property.maintenance,
    valueForMoney: property.valueForMoney,
    cleanliness: property.cleanliness,
    location: property.location,
    safety: property.safety,
    amenities: property.amenities,
  };

  return (
    <div className="min-h-screen">
      {/* Hero Image */}
      <div className="relative h-96">
        <img src={property.imageUrl} alt={property.address} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-6 left-0 right-0">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between">
              <div className="text-white">
                <h1 className="text-4xl font-['Lora'] font-bold mb-2">{property.address}</h1>
                <div className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5" />
                  <span>{property.neighbourhood}, {property.city}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="p-3 bg-white/90 hover:bg-white rounded-full transition-colors backdrop-blur-sm">
                  <Share2 className="w-5 h-5 text-[#0F1F38]" />
                </button>
                <button
                  onClick={() => setIsShortlisted(!isShortlisted)}
                  className="p-3 bg-white/90 hover:bg-white rounded-full transition-colors backdrop-blur-sm"
                >
                  <Heart className={`w-5 h-5 ${isShortlisted ? 'fill-[#E8913A] text-[#E8913A]' : 'text-[#0F1F38]'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* TrustScore Section */}
            <div className="bg-white border border-[#E2DDD6] rounded-[16px] p-8 mb-6">
              <div className="flex items-start gap-8">
                <div>
                  <TrustScoreBadge score={property.trustScore} size="hero" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-['Lora'] font-bold text-[#0F1F38] mb-2">
                    TrustScore Rating
                  </h2>
                  <p className="text-[#717182] mb-6">
                    Based on {property.reviewCount} verified renter reviews
                  </p>
                  <div className="grid grid-cols-1 gap-4">
                    <CategoryScoreBar
                      category="Landlord Responsiveness"
                      score={avgScores.landlordResponsiveness}
                      average={8.0}
                    />
                    <CategoryScoreBar
                      category="Maintenance"
                      score={avgScores.maintenance}
                      average={7.5}
                    />
                    <CategoryScoreBar
                      category="Value for Money"
                      score={avgScores.valueForMoney}
                      average={7.8}
                    />
                    <CategoryScoreBar
                      category="Cleanliness"
                      score={avgScores.cleanliness}
                      average={8.2}
                    />
                    <CategoryScoreBar
                      category="Location"
                      score={avgScores.location}
                      average={8.5}
                    />
                    <CategoryScoreBar
                      category="Safety"
                      score={avgScores.safety}
                      average={8.0}
                    />
                    <CategoryScoreBar
                      category="Amenities"
                      score={avgScores.amenities}
                      average={7.6}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="bg-white border border-[#E2DDD6] rounded-[16px] p-8 mb-6">
              <h2 className="text-2xl font-['Lora'] font-bold text-[#0F1F38] mb-4">
                About This Property
              </h2>
              <p className="text-[#0F1F38] leading-relaxed mb-4">{property.description}</p>
              <div className="flex gap-4 flex-wrap">
                <div className="px-4 py-2 bg-[#F7F4EF] rounded-full">
                  <span className="text-sm text-[#0F1F38]">{property.type}</span>
                </div>
                <div className="px-4 py-2 bg-[#F7F4EF] rounded-full">
                  <span className="text-sm text-[#0F1F38]">{property.price}</span>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white border border-[#E2DDD6] rounded-[16px] p-8">
              <h2 className="text-2xl font-['Lora'] font-bold text-[#0F1F38] mb-6">
                Renter Reviews
              </h2>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="all">All Reviews</TabsTrigger>
                  <TabsTrigger value="positive">Positive</TabsTrigger>
                  <TabsTrigger value="critical">Critical</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {propertyReviews.map((review) => (
                      <ReviewCard key={review.id} {...review} />
                    ))}
                  </motion.div>
                </TabsContent>

                <TabsContent value="positive" className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {propertyReviews.filter(r => r.overallScore >= 8).map((review) => (
                      <ReviewCard key={review.id} {...review} />
                    ))}
                  </motion.div>
                </TabsContent>

                <TabsContent value="critical" className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {propertyReviews.filter(r => r.overallScore < 8).map((review) => (
                      <ReviewCard key={review.id} {...review} />
                    ))}
                  </motion.div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Sticky Sidebar CTA */}
          <aside className="w-80 flex-shrink-0">
            <div className="bg-white border border-[#E2DDD6] rounded-[16px] p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="text-3xl font-['Lora'] font-bold text-[#0F1F38] mb-2">
                  {property.price}
                </div>
                <p className="text-sm text-[#717182]">{property.type}</p>
              </div>

              <Link to="/write-review">
                <button className="w-full bg-[#E8913A] hover:bg-[#d17f2f] text-white py-3 rounded-[12px] font-semibold mb-3 transition-colors">
                  Write a Review
                </button>
              </Link>

              <button className="w-full bg-[#0F1F38] hover:bg-[#1a2f4f] text-white py-3 rounded-[12px] font-semibold mb-4 transition-colors">
                Contact Landlord
              </button>

              <button className="w-full flex items-center justify-center gap-2 text-[#717182] hover:text-[#E8913A] py-2 transition-colors">
                <Flag className="w-4 h-4" />
                Report Issue
              </button>

              <div className="mt-6 pt-6 border-t border-[#E2DDD6]">
                <h4 className="font-semibold text-[#0F1F38] mb-3">Compare Similar</h4>
                <Link
                  to="/comparison"
                  className="text-sm text-[#E8913A] hover:text-[#d17f2f] transition-colors"
                >
                  Compare 3 properties →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
