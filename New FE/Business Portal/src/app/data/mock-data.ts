export interface Property {
  id: string;
  name: string;
  address: string;
  imageUrl: string;
  trustScore: number;
  reviewCount: number;
  vacancyStatus: "available" | "full" | "limited";
  trend: "up" | "down" | "stable";
  categoryScores: {
    maintenance: number;
    responsiveness: number;
    value: number;
    safety: number;
    noise: number;
    moveInOut: number;
    cleanliness: number;
  };
  pageViews30d: number;
  profileVisits30d: number;
  conversionRate: number;
  sparklineData: number[];
}

export interface Review {
  id: string;
  propertyId: string;
  propertyName: string;
  renterInitials: string;
  rating: number;
  snippet: string;
  fullText: string;
  timestamp: string;
  isFlagged: boolean;
  flagReason?: string;
  status?: "pending" | "approved" | "removed";
  category: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Regional Manager" | "Leasing Agent";
  accessLevel: "Full" | "Read-only";
}

export const properties: Property[] = [
  {
    id: "1",
    name: "The Metropolitan",
    address: "123 8th Avenue SW, Calgary, AB",
    imageUrl: "",
    trustScore: 8.4,
    reviewCount: 47,
    vacancyStatus: "limited",
    trend: "up",
    categoryScores: {
      maintenance: 8.2,
      responsiveness: 8.8,
      value: 7.9,
      safety: 9.1,
      noise: 7.4,
      moveInOut: 8.5,
      cleanliness: 8.7,
    },
    pageViews30d: 1247,
    profileVisits30d: 342,
    conversionRate: 12.4,
    sparklineData: [120, 145, 132, 178, 165, 189, 203, 198, 215, 234, 256, 289, 312, 342],
  },
  {
    id: "2",
    name: "Beltline Tower",
    address: "456 10th Street SW, Calgary, AB",
    imageUrl: "",
    trustScore: 7.2,
    reviewCount: 34,
    vacancyStatus: "available",
    trend: "down",
    categoryScores: {
      maintenance: 6.8,
      responsiveness: 7.1,
      value: 7.5,
      safety: 8.2,
      noise: 6.4,
      moveInOut: 7.8,
      cleanliness: 7.0,
    },
    pageViews30d: 892,
    profileVisits30d: 198,
    conversionRate: 8.2,
    sparklineData: [245, 232, 221, 208, 195, 187, 176, 168, 155, 148, 142, 135, 128, 198],
  },
  {
    id: "3",
    name: "Eau Claire Residences",
    address: "789 3rd Street SW, Calgary, AB",
    imageUrl: "",
    trustScore: 8.9,
    reviewCount: 62,
    vacancyStatus: "full",
    trend: "up",
    categoryScores: {
      maintenance: 9.1,
      responsiveness: 8.7,
      value: 8.3,
      safety: 9.4,
      noise: 8.6,
      moveInOut: 9.0,
      cleanliness: 9.2,
    },
    pageViews30d: 2134,
    profileVisits30d: 567,
    conversionRate: 18.3,
    sparklineData: [345, 378, 412, 445, 478, 501, 523, 534, 545, 551, 558, 562, 565, 567],
  },
  {
    id: "4",
    name: "Kensington Place",
    address: "234 Kensington Road NW, Calgary, AB",
    imageUrl: "",
    trustScore: 7.6,
    reviewCount: 28,
    vacancyStatus: "available",
    trend: "stable",
    categoryScores: {
      maintenance: 7.4,
      responsiveness: 7.8,
      value: 7.2,
      safety: 8.0,
      noise: 7.9,
      moveInOut: 7.5,
      cleanliness: 7.6,
    },
    pageViews30d: 1056,
    profileVisits30d: 234,
    conversionRate: 10.1,
    sparklineData: [220, 225, 228, 232, 230, 228, 231, 233, 232, 234, 235, 234, 233, 234],
  },
  {
    id: "5",
    name: "Inglewood Lofts",
    address: "567 9th Avenue SE, Calgary, AB",
    imageUrl: "",
    trustScore: 6.9,
    reviewCount: 18,
    vacancyStatus: "limited",
    trend: "down",
    categoryScores: {
      maintenance: 6.2,
      responsiveness: 6.8,
      value: 7.4,
      safety: 7.5,
      noise: 6.1,
      moveInOut: 7.0,
      cleanliness: 6.5,
    },
    pageViews30d: 678,
    profileVisits30d: 145,
    conversionRate: 6.8,
    sparklineData: [198, 189, 176, 165, 158, 152, 148, 145, 143, 142, 144, 145, 145, 145],
  },
  {
    id: "6",
    name: "Mission District",
    address: "890 4th Street SW, Calgary, AB",
    imageUrl: "",
    trustScore: 0,
    reviewCount: 12,
    vacancyStatus: "available",
    trend: "stable",
    categoryScores: {
      maintenance: 0,
      responsiveness: 0,
      value: 0,
      safety: 0,
      noise: 0,
      moveInOut: 0,
      cleanliness: 0,
    },
    pageViews30d: 445,
    profileVisits30d: 89,
    conversionRate: 4.2,
    sparklineData: [85, 87, 88, 89, 88, 87, 88, 89, 90, 89, 88, 89, 89, 89],
  },
];

export const reviews: Review[] = [
  {
    id: "r1",
    propertyId: "1",
    propertyName: "The Metropolitan",
    renterInitials: "JD",
    rating: 5,
    snippet: "Excellent management team. Maintenance requests handled within 24 hours...",
    fullText: "Excellent management team. Maintenance requests handled within 24 hours. Building is well-maintained and the location is perfect for downtown access.",
    timestamp: "2 hours ago",
    isFlagged: false,
    category: "Management Responsiveness",
  },
  {
    id: "r2",
    propertyId: "2",
    propertyName: "Beltline Tower",
    renterInitials: "SA",
    rating: 2,
    snippet: "Constant noise from neighbors above. Management didn't help resolve...",
    fullText: "Constant noise from neighbors above. Management didn't help resolve the issue despite multiple complaints. Very frustrating experience.",
    timestamp: "5 hours ago",
    isFlagged: false,
    category: "Noise & Neighbours",
  },
  {
    id: "r3",
    propertyId: "3",
    propertyName: "Eau Claire Residences",
    renterInitials: "MK",
    rating: 5,
    snippet: "Best rental experience I've had. Clean, safe, and great value...",
    fullText: "Best rental experience I've had. Clean, safe, and great value for the location. The staff goes above and beyond.",
    timestamp: "1 day ago",
    isFlagged: false,
    category: "Overall Experience",
  },
  {
    id: "r4",
    propertyId: "1",
    propertyName: "The Metropolitan",
    renterInitials: "RT",
    rating: 4,
    snippet: "Good building overall. Slight delay in getting deposit back but...",
    fullText: "Good building overall. Slight delay in getting deposit back but otherwise smooth move-out process.",
    timestamp: "1 day ago",
    isFlagged: false,
    category: "Move-in/Move-out",
  },
  {
    id: "r5",
    propertyId: "2",
    propertyName: "Beltline Tower",
    renterInitials: "LC",
    rating: 1,
    snippet: "This place is a complete scam. They steal your money and...",
    fullText: "This place is a complete scam. They steal your money and the manager is incompetent and rude.",
    timestamp: "2 days ago",
    isFlagged: true,
    flagReason: "Contains inflammatory language",
    status: "pending",
    category: "Value for Money",
  },
  {
    id: "r6",
    propertyId: "4",
    propertyName: "Kensington Place",
    renterInitials: "PB",
    rating: 4,
    snippet: "Love the neighborhood. Building is quiet and well-kept...",
    fullText: "Love the neighborhood. Building is quiet and well-kept. Minor maintenance issues but staff is responsive.",
    timestamp: "3 days ago",
    isFlagged: false,
    category: "Overall Cleanliness",
  },
  {
    id: "r7",
    propertyId: "3",
    propertyName: "Eau Claire Residences",
    renterInitials: "AH",
    rating: 5,
    snippet: "Security is top-notch. Feel very safe here...",
    fullText: "Security is top-notch. Feel very safe here. The building has great amenities and the concierge is always helpful.",
    timestamp: "4 days ago",
    isFlagged: false,
    category: "Building Safety",
  },
  {
    id: "r8",
    propertyId: "5",
    propertyName: "Inglewood Lofts",
    renterInitials: "NK",
    rating: 3,
    snippet: "Average experience. Price is fair but maintenance could be faster...",
    fullText: "Average experience. Price is fair but maintenance could be faster. Some common areas need updating.",
    timestamp: "5 days ago",
    isFlagged: false,
    category: "Maintenance",
  },
];

export const teamMembers: TeamMember[] = [
  {
    id: "t1",
    name: "Sarah Mitchell",
    email: "sarah.mitchell@livedin.com",
    role: "Admin",
    accessLevel: "Full",
  },
  {
    id: "t2",
    name: "James Park",
    email: "james.park@livedin.com",
    role: "Regional Manager",
    accessLevel: "Full",
  },
  {
    id: "t3",
    name: "Emily Chen",
    email: "emily.chen@livedin.com",
    role: "Leasing Agent",
    accessLevel: "Read-only",
  },
  {
    id: "t4",
    name: "Michael Torres",
    email: "michael.torres@livedin.com",
    role: "Leasing Agent",
    accessLevel: "Read-only",
  },
  {
    id: "t5",
    name: "Amanda Foster",
    email: "amanda.foster@livedin.com",
    role: "Regional Manager",
    accessLevel: "Full",
  },
];

export const calgaryAverages = {
  maintenance: 7.3,
  responsiveness: 7.5,
  value: 7.1,
  safety: 8.0,
  noise: 7.2,
  moveInOut: 7.6,
  cleanliness: 7.4,
};

// Historical data for trends (12 months)
export const historicalData = [
  { month: "Apr", maintenance: 7.8, responsiveness: 8.2, value: 7.5, safety: 8.9, noise: 7.1, moveInOut: 8.0, cleanliness: 8.3 },
  { month: "May", maintenance: 7.9, responsiveness: 8.3, value: 7.6, safety: 9.0, noise: 7.2, moveInOut: 8.1, cleanliness: 8.4 },
  { month: "Jun", maintenance: 8.0, responsiveness: 8.4, value: 7.7, safety: 9.0, noise: 7.3, moveInOut: 8.2, cleanliness: 8.5 },
  { month: "Jul", maintenance: 8.1, responsiveness: 8.5, value: 7.8, safety: 9.1, noise: 7.4, moveInOut: 8.3, cleanliness: 8.6 },
  { month: "Aug", maintenance: 8.0, responsiveness: 8.6, value: 7.7, safety: 9.1, noise: 7.3, moveInOut: 8.4, cleanliness: 8.6 },
  { month: "Sep", maintenance: 8.1, responsiveness: 8.7, value: 7.8, safety: 9.1, noise: 7.4, moveInOut: 8.5, cleanliness: 8.7 },
  { month: "Oct", maintenance: 8.2, responsiveness: 8.7, value: 7.9, safety: 9.1, noise: 7.4, moveInOut: 8.5, cleanliness: 8.7 },
  { month: "Nov", maintenance: 8.2, responsiveness: 8.8, value: 7.9, safety: 9.1, noise: 7.4, moveInOut: 8.5, cleanliness: 8.7 },
  { month: "Dec", maintenance: 8.1, responsiveness: 8.8, value: 7.9, safety: 9.1, noise: 7.3, moveInOut: 8.5, cleanliness: 8.6 },
  { month: "Jan", maintenance: 8.2, responsiveness: 8.8, value: 7.9, safety: 9.1, noise: 7.4, moveInOut: 8.5, cleanliness: 8.7 },
  { month: "Feb", maintenance: 8.2, responsiveness: 8.8, value: 7.9, safety: 9.1, noise: 7.4, moveInOut: 8.5, cleanliness: 8.7 },
  { month: "Mar", maintenance: 8.2, responsiveness: 8.8, value: 7.9, safety: 9.1, noise: 7.4, moveInOut: 8.5, cleanliness: 8.7 },
];
