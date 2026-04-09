"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { readShortlistIds, writeShortlistIds } from "@/lib/shortlist-local";

type Props = {
  propertyId: string;
};

export function FaceliftPropertyShortlistHeart({ propertyId }: Props) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(readShortlistIds().includes(propertyId));
  }, [propertyId]);

  const toggle = () => {
    const ids = readShortlistIds();
    const next = ids.includes(propertyId)
      ? ids.filter((id) => id !== propertyId)
      : [...ids, propertyId];
    writeShortlistIds(next);
    setSaved(next.includes(propertyId));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full bg-white/90 p-3 backdrop-blur-sm transition-colors hover:bg-white"
      aria-label={saved ? "Remove from shortlist" : "Save to shortlist"}
    >
      <Heart
        className={`h-5 w-5 ${saved ? "fill-[#E8913A] text-[#E8913A]" : "text-[#0F1F38]"}`}
      />
    </button>
  );
}
