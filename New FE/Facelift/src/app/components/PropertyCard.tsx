import { Heart } from 'lucide-react';
import { Link } from 'react-router';
import { TrustScoreBadge } from './TrustScoreBadge';
import { motion } from 'motion/react';
import { useState } from 'react';

interface PropertyCardProps {
  id: string;
  address: string;
  neighbourhood: string;
  type: string;
  price: string;
  trustScore: number;
  reviewCount: number;
  imageUrl: string;
  variant?: 'grid' | 'list';
  onHeartClick?: (id: string) => void;
  isShortlisted?: boolean;
}

export function PropertyCard({ 
  id, 
  address, 
  neighbourhood, 
  type, 
  price, 
  trustScore, 
  reviewCount,
  imageUrl,
  variant = 'grid',
  onHeartClick,
  isShortlisted = false
}: PropertyCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onHeartClick?.(id);
  };

  if (variant === 'list') {
    return (
      <Link to={`/property/${id}`}>
        <motion.div 
          className="bg-white border border-[#E2DDD6] rounded-[16px] overflow-hidden hover:shadow-lg transition-shadow"
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex gap-4 p-4">
            <img src={imageUrl} alt={address} className="w-48 h-32 object-cover rounded-lg" />
            <div className="flex-1 flex justify-between">
              <div>
                <h3 className="text-lg font-['Lora'] font-semibold text-[#0F1F38] mb-1">{address}</h3>
                <p className="text-sm text-[#717182] mb-2">{neighbourhood}</p>
                <div className="flex gap-2 mb-2">
                  <span className="px-3 py-1 bg-[#F7F4EF] text-xs text-[#0F1F38] rounded-full">{type}</span>
                </div>
                <p className="text-sm text-[#717182]">{reviewCount} reviews</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={handleHeartClick}
                  className="p-2 hover:bg-[#F7F4EF] rounded-full transition-colors"
                >
                  <Heart className={`w-5 h-5 ${isShortlisted ? 'fill-[#E8913A] text-[#E8913A]' : 'text-[#717182]'}`} />
                </button>
                <div className="text-right">
                  <TrustScoreBadge score={trustScore} size="md" />
                  <p className="text-lg font-semibold text-[#0F1F38] mt-2">{price}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link to={`/property/${id}`}>
      <motion.div 
        className="bg-white border border-[#E2DDD6] rounded-[16px] overflow-hidden relative"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        animate={{ y: isHovered ? -8 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="relative">
          <img src={imageUrl} alt={address} className="w-full h-48 object-cover" />
          <button
            onClick={handleHeartClick}
            className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full transition-colors backdrop-blur-sm"
          >
            <Heart className={`w-5 h-5 ${isShortlisted ? 'fill-[#E8913A] text-[#E8913A]' : 'text-[#717182]'}`} />
          </button>
          <div className="absolute bottom-3 left-3">
            <TrustScoreBadge score={trustScore} size="sm" />
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-base font-['Lora'] font-semibold text-[#0F1F38] mb-1">{address}</h3>
          <p className="text-sm text-[#717182] mb-3">{neighbourhood}</p>
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 bg-[#F7F4EF] text-xs text-[#0F1F38] rounded-full">{type}</span>
            <span className="text-xs text-[#717182]">{reviewCount} reviews</span>
          </div>
          <p className="text-lg font-semibold text-[#0F1F38]">{price}</p>
        </div>
      </motion.div>
    </Link>
  );
}
