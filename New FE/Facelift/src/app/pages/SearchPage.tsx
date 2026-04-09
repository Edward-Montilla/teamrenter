import { useState } from 'react';
import { SlidersHorizontal, Grid, List } from 'lucide-react';
import { PropertyCard } from '../components/PropertyCard';
import { properties } from '../data/mockData';

export function SearchPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState([1000, 4000]);
  const [bedroomFilter, setBedroomFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('trustScore');
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

  const sortedProperties = [...properties].sort((a, b) => {
    if (sortBy === 'trustScore') return b.trustScore - a.trustScore;
    if (sortBy === 'priceAsc') return parseFloat(a.price.replace(/[^0-9]/g, '')) - parseFloat(b.price.replace(/[^0-9]/g, ''));
    if (sortBy === 'priceDesc') return parseFloat(b.price.replace(/[^0-9]/g, '')) - parseFloat(a.price.replace(/[^0-9]/g, ''));
    return 0;
  });

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-8">
          {/* Left Sidebar - Filters */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white border border-[#E2DDD6] rounded-[16px] p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <SlidersHorizontal className="w-5 h-5 text-[#0F1F38]" />
                <h3 className="font-semibold text-[#0F1F38]">Filters</h3>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#0F1F38] mb-3">
                  Price Range
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1000"
                    max="4000"
                    step="100"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-[#717182]">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Bedrooms */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#0F1F38] mb-3">
                  Bedrooms
                </label>
                <div className="space-y-2">
                  {['all', 'Studio', '1 Bed', '2 Bed', '3+ Bed'].map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="bedrooms"
                        value={option}
                        checked={bedroomFilter === option}
                        onChange={(e) => setBedroomFilter(e.target.value)}
                        className="text-[#E8913A]"
                      />
                      <span className="text-sm text-[#0F1F38]">{option === 'all' ? 'All' : option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* TrustScore */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#0F1F38] mb-3">
                  Minimum TrustScore
                </label>
                <select className="w-full px-3 py-2 border border-[#E2DDD6] rounded-lg text-sm">
                  <option>Any</option>
                  <option>7.0+</option>
                  <option>8.0+</option>
                  <option>9.0+</option>
                </select>
              </div>

              {/* Verified Only */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-[#E8913A]" />
                <span className="text-sm text-[#0F1F38]">Verified reviews only</span>
              </label>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-['Lora'] font-bold text-[#0F1F38] mb-2">
                  Toronto Rentals
                </h1>
                <p className="text-[#717182]">{properties.length} properties found</p>
              </div>
              <div className="flex items-center gap-4">
                {/* Sort */}
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-[#E2DDD6] rounded-lg text-sm"
                >
                  <option value="trustScore">Highest TrustScore</option>
                  <option value="priceAsc">Price: Low to High</option>
                  <option value="priceDesc">Price: High to Low</option>
                </select>

                {/* View Toggle */}
                <div className="flex gap-2 border border-[#E2DDD6] rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'grid' ? 'bg-[#E8913A] text-white' : 'text-[#717182] hover:text-[#0F1F38]'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'list' ? 'bg-[#E8913A] text-white' : 'text-[#717182] hover:text-[#0F1F38]'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Properties Grid/List */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
              {sortedProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  {...property}
                  variant={viewMode}
                  onHeartClick={handleHeartClick}
                  isShortlisted={shortlisted.has(property.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
