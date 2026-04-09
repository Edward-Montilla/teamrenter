import { CheckCircle } from 'lucide-react';

interface ReviewCardProps {
  author: string;
  verified: boolean;
  tenantFit?: string;
  date: string;
  overallScore: number;
  content: string;
  helpful: number;
}

export function ReviewCard({ author, verified, tenantFit, date, overallScore, content, helpful }: ReviewCardProps) {
  return (
    <div className="bg-white border border-[#E2DDD6] rounded-[16px] p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#E8913A] rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">{author[0]}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-[#0F1F38]">{author}</span>
              {verified && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Verified Renter
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#717182]">{date}</span>
              {tenantFit && (
                <span className="px-2 py-0.5 bg-[#F7F4EF] text-xs text-[#0F1F38] rounded-full">
                  {tenantFit}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-['Lora'] font-semibold text-[#E8913A]">{overallScore.toFixed(1)}</div>
          <div className="text-xs text-[#717182]">Overall</div>
        </div>
      </div>
      <p className="text-[#0F1F38] leading-relaxed mb-4">{content}</p>
      <div className="flex items-center gap-4 text-sm text-[#717182]">
        <button className="hover:text-[#E8913A] transition-colors">
          Helpful ({helpful})
        </button>
        <button className="hover:text-[#E8913A] transition-colors">
          Report
        </button>
      </div>
    </div>
  );
}
