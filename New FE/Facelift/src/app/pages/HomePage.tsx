import { Search, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { PropertyCard } from '../components/PropertyCard';
import { properties, neighbourhoods } from '../data/mockData';

export function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState<string | null>(null);
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/search', { state: { query: searchQuery } });
  };

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

  const filteredProperties = selectedNeighbourhood
    ? properties.filter(p => p.neighbourhood === selectedNeighbourhood)
    : properties.slice(0, 6);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-[#0F1F38] text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-['Lora'] font-bold mb-4">
              Find Your Next Home with Confidence
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Honest reviews from real renters. Make informed decisions about where you live.
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="bg-white rounded-[16px] p-2 flex gap-2">
              <div className="flex-1 flex items-center gap-3 px-4">
                <MapPin className="w-5 h-5 text-[#717182]" />
                <input
                  type="text"
                  placeholder="Search by address, neighbourhood, or city..."
                  className="flex-1 outline-none text-[#0F1F38]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                className="bg-[#E8913A] hover:bg-[#d17f2f] text-white px-8 py-3 rounded-[12px] font-semibold flex items-center gap-2 transition-colors"
              >
                <Search className="w-5 h-5" />
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Neighbourhood Filters */}
      <section className="py-8 border-b border-[#E2DDD6]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedNeighbourhood(null)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedNeighbourhood === null
                  ? 'bg-[#E8913A] text-white'
                  : 'bg-white border border-[#E2DDD6] text-[#0F1F38] hover:border-[#E8913A]'
              }`}
            >
              All Neighbourhoods
            </button>
            {neighbourhoods.map((n) => (
              <button
                key={n.id}
                onClick={() => setSelectedNeighbourhood(n.name)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  selectedNeighbourhood === n.name
                    ? 'bg-[#E8913A] text-white'
                    : 'bg-white border border-[#E2DDD6] text-[#0F1F38] hover:border-[#E8913A]'
                }`}
              >
                {n.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-['Lora'] font-bold text-[#0F1F38] mb-2">
                {selectedNeighbourhood ? `Properties in ${selectedNeighbourhood}` : 'Featured Properties'}
              </h2>
              <p className="text-[#717182]">Highly-rated rentals in Toronto</p>
            </div>
            <button
              onClick={() => navigate('/search')}
              className="text-[#E8913A] hover:text-[#d17f2f] font-semibold transition-colors"
            >
              View all →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                {...property}
                onHeartClick={handleHeartClick}
                isShortlisted={shortlisted.has(property.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#0F1F38] text-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-['Lora'] font-bold mb-4">
            Have you rented before?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Share your experience and help others make better decisions
          </p>
          <button
            onClick={() => navigate('/write-review')}
            className="bg-[#E8913A] hover:bg-[#d17f2f] text-white px-8 py-4 rounded-[16px] font-semibold text-lg transition-colors"
          >
            Write a Review
          </button>
        </div>
      </section>
    </div>
  );
}
