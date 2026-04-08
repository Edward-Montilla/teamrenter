import { Heart, FileText, Settings } from 'lucide-react';
import { useState } from 'react';
import { PropertyCard } from '../components/PropertyCard';
import { ReviewCard } from '../components/ReviewCard';
import { properties, reviews } from '../data/mockData';

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'shortlist' | 'reviews'>('shortlist');
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set(['1', '3', '5']));

  const handleHeartClick = (id: string) => {
    setShortlisted(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const shortlistedProperties = properties.filter(p => shortlisted.has(p.id));
  const myReviews = reviews.slice(0, 2); // Mock user's reviews

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-['Lora'] font-bold text-[#0F1F38] mb-2">
              My Dashboard
            </h1>
            <p className="text-[#717182]">Manage your shortlist and reviews</p>
          </div>
          <button className="p-3 hover:bg-[#F7F4EF] rounded-full transition-colors">
            <Settings className="w-6 h-6 text-[#0F1F38]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-[#E2DDD6]">
          <button
            onClick={() => setActiveTab('shortlist')}
            className={`pb-4 px-6 font-semibold flex items-center gap-2 transition-colors relative ${
              activeTab === 'shortlist'
                ? 'text-[#E8913A]'
                : 'text-[#717182] hover:text-[#0F1F38]'
            }`}
          >
            <Heart className="w-5 h-5" />
            Shortlist ({shortlisted.size})
            {activeTab === 'shortlist' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E8913A]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 px-6 font-semibold flex items-center gap-2 transition-colors relative ${
              activeTab === 'reviews'
                ? 'text-[#E8913A]'
                : 'text-[#717182] hover:text-[#0F1F38]'
            }`}
          >
            <FileText className="w-5 h-5" />
            My Reviews ({myReviews.length})
            {activeTab === 'reviews' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E8913A]" />
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'shortlist' && (
          <div>
            {shortlistedProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shortlistedProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    {...property}
                    onHeartClick={handleHeartClick}
                    isShortlisted={shortlisted.has(property.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-[#E2DDD6] rounded-[16px] p-12 text-center">
                <Heart className="w-16 h-16 text-[#E2DDD6] mx-auto mb-4" />
                <h3 className="text-xl font-['Lora'] font-semibold text-[#0F1F38] mb-2">
                  No properties shortlisted yet
                </h3>
                <p className="text-[#717182] mb-6">
                  Start exploring properties and save your favorites here
                </p>
                <button
                  onClick={() => window.location.href = '/search'}
                  className="bg-[#E8913A] hover:bg-[#d17f2f] text-white px-6 py-3 rounded-[12px] font-semibold transition-colors"
                >
                  Browse Properties
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            {myReviews.length > 0 ? (
              <div className="space-y-4">
                {myReviews.map((review) => {
                  const property = properties.find(p => p.id === review.propertyId);
                  return (
                    <div key={review.id}>
                      <div className="mb-2">
                        <h3 className="font-semibold text-[#0F1F38]">
                          Review for {property?.address}
                        </h3>
                      </div>
                      <ReviewCard {...review} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-[#E2DDD6] rounded-[16px] p-12 text-center">
                <FileText className="w-16 h-16 text-[#E2DDD6] mx-auto mb-4" />
                <h3 className="text-xl font-['Lora'] font-semibold text-[#0F1F38] mb-2">
                  No reviews yet
                </h3>
                <p className="text-[#717182] mb-6">
                  Share your rental experience to help others
                </p>
                <button
                  onClick={() => window.location.href = '/write-review'}
                  className="bg-[#E8913A] hover:bg-[#d17f2f] text-white px-6 py-3 rounded-[12px] font-semibold transition-colors"
                >
                  Write a Review
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
