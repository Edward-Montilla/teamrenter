import { useParams } from 'react-router';
import { MapPin, TrendingUp, Users, DollarSign } from 'lucide-react';
import { PropertyCard } from '../components/PropertyCard';
import { neighbourhoods, properties } from '../data/mockData';
import { useState } from 'react';

export function NeighbourhoodPage() {
  const { id } = useParams();
  const neighbourhood = neighbourhoods.find(n => n.id === id);
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());

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

  if (!neighbourhood) {
    return <div className="py-20 text-center">Neighbourhood not found</div>;
  }

  const neighbourhoodProperties = properties.filter(
    p => p.neighbourhood === neighbourhood.name
  );

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative h-96">
        <img
          src={neighbourhood.imageUrl}
          alt={neighbourhood.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 py-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-2 text-white/80 mb-2">
              <MapPin className="w-5 h-5" />
              <span>{neighbourhood.city}</span>
            </div>
            <h1 className="text-5xl font-['Lora'] font-bold text-white mb-4">
              {neighbourhood.name}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl">
              {neighbourhood.description}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white border border-[#E2DDD6] rounded-[16px] p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-[#E8913A]" />
              <span className="text-3xl font-['Lora'] font-bold text-[#E8913A]">
                {neighbourhood.averageTrustScore}
              </span>
            </div>
            <p className="text-sm text-[#717182]">Avg TrustScore</p>
          </div>

          <div className="bg-white border border-[#E2DDD6] rounded-[16px] p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-[#E8913A]" />
              <span className="text-3xl font-['Lora'] font-bold text-[#0F1F38]">
                {neighbourhood.propertyCount}
              </span>
            </div>
            <p className="text-sm text-[#717182]">Properties</p>
          </div>

          <div className="bg-white border border-[#E2DDD6] rounded-[16px] p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-[#E8913A]" />
              <span className="text-3xl font-['Lora'] font-bold text-[#0F1F38]">
                {neighbourhood.averageRent}
              </span>
            </div>
            <p className="text-sm text-[#717182]">Avg Rent</p>
          </div>

          <div className="bg-white border border-[#E2DDD6] rounded-[16px] p-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#717182]">Walk Score</span>
                <span className="font-semibold text-[#0F1F38]">{neighbourhood.walkScore}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#717182]">Transit Score</span>
                <span className="font-semibold text-[#0F1F38]">{neighbourhood.transitScore}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#717182]">Bike Score</span>
                <span className="font-semibold text-[#0F1F38]">{neighbourhood.bikeScore}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Properties List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-['Lora'] font-bold text-[#0F1F38]">
              Available Properties
            </h2>
            <p className="text-[#717182]">
              {neighbourhoodProperties.length} properties
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {neighbourhoodProperties.map((property) => (
              <PropertyCard
                key={property.id}
                {...property}
                onHeartClick={handleHeartClick}
                isShortlisted={shortlisted.has(property.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
