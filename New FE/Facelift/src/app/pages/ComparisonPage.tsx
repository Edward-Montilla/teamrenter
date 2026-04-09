import { TrustScoreBadge } from '../components/TrustScoreBadge';
import { properties } from '../data/mockData';
import { Check, X } from 'lucide-react';

export function ComparisonPage() {
  const compareProperties = properties.slice(0, 3);
  const categories = [
    { key: 'trustScore', label: 'Overall TrustScore' },
    { key: 'landlordResponsiveness', label: 'Landlord Responsiveness' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'valueForMoney', label: 'Value for Money' },
    { key: 'cleanliness', label: 'Cleanliness' },
    { key: 'location', label: 'Location' },
    { key: 'safety', label: 'Safety' },
    { key: 'amenities', label: 'Amenities' },
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-['Lora'] font-bold text-[#0F1F38] mb-2">
            Compare Properties
          </h1>
          <p className="text-[#717182]">
            Side-by-side comparison to help you make the right choice
          </p>
        </div>

        <div className="bg-white border border-[#E2DDD6] rounded-[16px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2DDD6]">
                  <th className="text-left p-6 bg-[#F7F4EF] font-semibold text-[#0F1F38] w-64">
                    Property
                  </th>
                  {compareProperties.map((property) => (
                    <th key={property.id} className="p-6 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <img
                          src={property.imageUrl}
                          alt={property.address}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div>
                          <h3 className="font-['Lora'] font-semibold text-[#0F1F38] mb-1">
                            {property.address}
                          </h3>
                          <p className="text-sm text-[#717182]">{property.neighbourhood}</p>
                        </div>
                        <div className="text-xl font-semibold text-[#0F1F38]">
                          {property.price}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((category, idx) => {
                  const isHeader = category.key === 'trustScore';
                  return (
                    <tr
                      key={category.key}
                      className={`border-b border-[#E2DDD6] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F7F4EF]/30'}`}
                    >
                      <td className={`p-6 font-semibold text-[#0F1F38] ${isHeader ? 'bg-[#F7F4EF]' : ''}`}>
                        {category.label}
                      </td>
                      {compareProperties.map((property) => {
                        const value = property[category.key as keyof typeof property];
                        if (isHeader) {
                          return (
                            <td key={property.id} className="p-6 text-center">
                              <div className="flex justify-center">
                                <TrustScoreBadge score={value as number} size="lg" />
                              </div>
                            </td>
                          );
                        }
                        return (
                          <td key={property.id} className="p-6 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-2xl font-['Lora'] font-semibold text-[#E8913A]">
                                {typeof value === 'number' ? value.toFixed(1) : value}
                              </span>
                              {typeof value === 'number' && value >= 8 && (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  Excellent
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Additional Info */}
                <tr className="border-b border-[#E2DDD6]">
                  <td className="p-6 font-semibold text-[#0F1F38] bg-[#F7F4EF]">
                    Property Type
                  </td>
                  {compareProperties.map((property) => (
                    <td key={property.id} className="p-6 text-center text-[#0F1F38]">
                      {property.type}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[#E2DDD6] bg-[#F7F4EF]/30">
                  <td className="p-6 font-semibold text-[#0F1F38]">
                    Reviews
                  </td>
                  {compareProperties.map((property) => (
                    <td key={property.id} className="p-6 text-center text-[#0F1F38]">
                      {property.reviewCount} reviews
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-[#F7F4EF] border-t border-[#E2DDD6]">
            <div className="flex justify-center gap-4">
              {compareProperties.map((property) => (
                <button
                  key={property.id}
                  onClick={() => window.location.href = `/property/${property.id}`}
                  className="flex-1 bg-[#E8913A] hover:bg-[#d17f2f] text-white py-3 rounded-[12px] font-semibold transition-colors"
                >
                  View {property.address.split(',')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
