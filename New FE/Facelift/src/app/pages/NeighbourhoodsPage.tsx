import { Link } from 'react-router';
import { neighbourhoods } from '../data/mockData';
import { MapPin, TrendingUp, Home } from 'lucide-react';
import { motion } from 'motion/react';

export function NeighbourhoodsPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-['Lora'] font-bold text-[#0F1F38] mb-4">
            Explore Neighbourhoods
          </h1>
          <p className="text-xl text-[#717182]">
            Discover the best places to live in Toronto with insights from real renters
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {neighbourhoods.map((neighbourhood, index) => (
            <Link key={neighbourhood.id} to={`/neighbourhood/${neighbourhood.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-white border border-[#E2DDD6] rounded-[16px] overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-64">
                  <img
                    src={neighbourhood.imageUrl}
                    alt={neighbourhood.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{neighbourhood.city}</span>
                    </div>
                    <h2 className="text-2xl font-['Lora'] font-bold text-white">
                      {neighbourhood.name}
                    </h2>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-[#717182] mb-6">
                    {neighbourhood.description}
                  </p>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="flex justify-center mb-2">
                        <TrendingUp className="w-5 h-5 text-[#E8913A]" />
                      </div>
                      <div className="text-xl font-['Lora'] font-bold text-[#E8913A]">
                        {neighbourhood.averageTrustScore}
                      </div>
                      <div className="text-xs text-[#717182]">TrustScore</div>
                    </div>

                    <div className="text-center">
                      <div className="flex justify-center mb-2">
                        <Home className="w-5 h-5 text-[#E8913A]" />
                      </div>
                      <div className="text-xl font-['Lora'] font-bold text-[#0F1F38]">
                        {neighbourhood.propertyCount}
                      </div>
                      <div className="text-xs text-[#717182]">Properties</div>
                    </div>

                    <div className="text-center">
                      <div className="text-xl font-['Lora'] font-bold text-[#0F1F38]">
                        {neighbourhood.averageRent}
                      </div>
                      <div className="text-xs text-[#717182]">Avg Rent</div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-[#E2DDD6]">
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-[#717182]">Walk: </span>
                        <span className="font-semibold text-[#0F1F38]">{neighbourhood.walkScore}</span>
                      </div>
                      <div>
                        <span className="text-[#717182]">Transit: </span>
                        <span className="font-semibold text-[#0F1F38]">{neighbourhood.transitScore}</span>
                      </div>
                      <div>
                        <span className="text-[#717182]">Bike: </span>
                        <span className="font-semibold text-[#0F1F38]">{neighbourhood.bikeScore}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
