"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { PropertyListItem } from "@/lib/types";
import {
  propertyCardAddressLine,
  propertyCardNeighbourhoodLine,
  propertyCardPricePlaceholder,
  propertyCardTypePlaceholder,
  trustScoreDisplayFacelift,
} from "@/lib/facelift-mappers";
import { TrustScoreBadge } from "./TrustScoreBadge";

type FaceliftPropertyCardProps = {
  item: PropertyListItem;
  variant?: "grid" | "list";
  onHeartClick?: (id: string) => void;
  isShortlisted?: boolean;
};

export function FaceliftPropertyCard({
  item,
  variant = "grid",
  onHeartClick,
  isShortlisted = false,
}: FaceliftPropertyCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const address = propertyCardAddressLine(item);
  const neighbourhood = propertyCardNeighbourhoodLine(item);
  const type = propertyCardTypePlaceholder(item);
  const price = propertyCardPricePlaceholder(item);
  const trustScore = trustScoreDisplayFacelift(item.trustscore_display_0_5);
  const reviewCount = item.review_count;
  const imageUrl = item.primary_image_url;

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onHeartClick?.(item.id);
  };

  if (variant === "list") {
    return (
      <Link href={`/properties/${item.id}`}>
        <motion.div
          className="bg-white border border-[#E2DDD6] rounded-[16px] overflow-hidden hover:shadow-lg transition-shadow"
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex gap-4 p-4">
            <div className="w-48 h-32 shrink-0 overflow-hidden rounded-lg bg-[#E2DDD6]">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={address}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="flex flex-1 justify-between">
              <div>
                <h3
                  className="mb-1 text-lg font-semibold text-[#0F1F38]"
                  style={{
                    fontFamily: "var(--font-lora), ui-serif, Georgia, serif",
                  }}
                >
                  {address}
                </h3>
                <p className="mb-2 text-sm text-[#717182]">{neighbourhood}</p>
                <div className="mb-2 flex gap-2">
                  <span className="rounded-full bg-[#F7F4EF] px-3 py-1 text-xs text-[#0F1F38]">
                    {type}
                  </span>
                </div>
                <p className="text-sm text-[#717182]">
                  {reviewCount} reviews
                </p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button
                  type="button"
                  onClick={handleHeartClick}
                  className="rounded-full p-2 transition-colors hover:bg-[#F7F4EF]"
                >
                  <Heart
                    className={`h-5 w-5 ${isShortlisted ? "fill-[#E8913A] text-[#E8913A]" : "text-[#717182]"}`}
                  />
                </button>
                <div className="text-right">
                  <TrustScoreBadge score={trustScore} size="md" />
                  <p className="mt-2 text-lg font-semibold text-[#0F1F38]">
                    {price}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link href={`/properties/${item.id}`}>
      <motion.div
        className="relative overflow-hidden rounded-[16px] border border-[#E2DDD6] bg-white"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        animate={{ y: isHovered ? -8 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="relative">
          <div className="h-48 w-full bg-[#E2DDD6]">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={address}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleHeartClick}
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 backdrop-blur-sm transition-colors hover:bg-white"
          >
            <Heart
              className={`h-5 w-5 ${isShortlisted ? "fill-[#E8913A] text-[#E8913A]" : "text-[#717182]"}`}
            />
          </button>
          <div className="absolute bottom-3 left-3">
            <TrustScoreBadge score={trustScore} size="sm" />
          </div>
        </div>
        <div className="p-4">
          <h3
            className="mb-1 text-base font-semibold text-[#0F1F38]"
            style={{
              fontFamily: "var(--font-lora), ui-serif, Georgia, serif",
            }}
          >
            {address}
          </h3>
          <p className="mb-3 text-sm text-[#717182]">{neighbourhood}</p>
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-[#F7F4EF] px-3 py-1 text-xs text-[#0F1F38]">
              {type}
            </span>
            <span className="text-xs text-[#717182]">
              {reviewCount} reviews
            </span>
          </div>
          <p className="text-lg font-semibold text-[#0F1F38]">{price}</p>
        </div>
      </motion.div>
    </Link>
  );
}
