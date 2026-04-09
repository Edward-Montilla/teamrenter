import { Link } from 'react-router';
import { Search, User } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-[#E2DDD6] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#E8913A] rounded-full flex items-center justify-center">
              <span className="text-white font-['Lora'] font-bold text-lg">L</span>
            </div>
            <span className="text-xl font-['Lora'] font-bold text-[#0F1F38]">LivedIn</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/search" className="text-[#0F1F38] hover:text-[#E8913A] transition-colors">
              Search Properties
            </Link>
            <Link to="/neighbourhoods" className="text-[#0F1F38] hover:text-[#E8913A] transition-colors">
              Neighbourhoods
            </Link>
            <Link to="/write-review" className="text-[#0F1F38] hover:text-[#E8913A] transition-colors">
              Write a Review
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 hover:bg-[#F7F4EF] rounded-full transition-colors">
              <User className="w-5 h-5 text-[#0F1F38]" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
