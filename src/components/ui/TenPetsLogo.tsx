import React from 'react';

interface TenPetsLogoProps {
  variant?: 'full' | 'horizontal' | 'icon-only' | 'badge' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  onClick?: () => void;
}

export const TenPetsLogo: React.FC<TenPetsLogoProps> = ({
  variant = 'full',
  size = 'md',
  showSubtitle = false,
  className = '',
  onClick
}) => {
  // Brand Olive Green from Official Logo Manual / Image
  const BRAND_GREEN = '#587837';
  const DARK_GREEN = '#3A5223';
  const LIGHT_BG = '#F5F7F2';

  const isDark = variant === 'dark';

  // Size mappings
  const iconSizeMap = {
    sm: 'w-6 h-6',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20'
  };

  const textSizeMap = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  // Official TenPets Dog + Leaf Ears + Heart Nose Emblem (SVG)
  const TenPetsEmblem = (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${iconSizeMap[size]} shrink-0 transition-transform duration-300 group-hover:scale-105`}
    >
      {/* Outer Muzzle & Cheeks Contour */}
      <path
        d="M 50,85 C 35,90 28,105 38,125 C 48,142 75,148 100,148 C 125,148 152,142 162,125 C 172,105 165,90 150,85"
        stroke={isDark ? '#81A858' : BRAND_GREEN}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Muzzle Split & Chin Curve */}
      <path
        d="M 100,105 L 100,128 C 90,140 110,140 100,128"
        stroke={isDark ? '#81A858' : BRAND_GREEN}
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* Heart-shaped Nose in Center */}
      <path
        d="M 100,98 C 96,90 85,90 85,99 C 85,107 100,116 100,116 C 100,116 115,107 115,99 C 115,90 104,90 100,98 Z"
        fill="none"
        stroke={isDark ? '#81A858' : BRAND_GREEN}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Top Head Curve */}
      <path
        d="M 75,55 C 88,48 112,48 125,55"
        stroke={isDark ? '#81A858' : BRAND_GREEN}
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Left Leaf Ear */}
      <path
        d="M 76,54 C 55,30 25,45 28,78 C 30,100 62,95 72,78 Z"
        stroke={isDark ? '#81A858' : BRAND_GREEN}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left Ear Vein */}
      <path
        d="M 42,65 L 68,66"
        stroke={isDark ? '#81A858' : BRAND_GREEN}
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* Right Leaf Ear */}
      <path
        d="M 124,54 C 145,30 175,45 172,78 C 170,100 138,95 128,78 Z"
        stroke={isDark ? '#81A858' : BRAND_GREEN}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right Ear Vein */}
      <path
        d="M 158,65 L 132,66"
        stroke={isDark ? '#81A858' : BRAND_GREEN}
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );

  // Paw Print Icon SVG between "ten" and "pets"
  const PawSeparator = (
    <svg viewBox="0 0 24 24" fill={isDark ? '#81A858' : BRAND_GREEN} className="w-3.5 h-3.5 inline-block mx-0.5 my-auto">
      <circle cx="12" cy="16" r="4.5" />
      <circle cx="6" cy="11" r="2.2" />
      <circle cx="9.5" cy="6.5" r="2.2" />
      <circle cx="14.5" cy="6.5" r="2.2" />
      <circle cx="18" cy="11" r="2.2" />
    </svg>
  );

  if (variant === 'icon-only') {
    return (
      <div onClick={onClick} className={`inline-flex items-center cursor-pointer ${className}`}>
        {TenPetsEmblem}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all cursor-pointer ${
          isDark
            ? 'bg-emerald-950/80 border-emerald-700/50 text-emerald-100'
            : 'bg-[#F5F7F2] border-[#587837]/30 text-[#587837] hover:bg-[#ebf0e6]'
        } ${className}`}
      >
        {TenPetsEmblem}
        <div className="flex items-center font-extrabold tracking-tight text-sm font-sans">
          <span>ten</span>
          {PawSeparator}
          <span>pets</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none cursor-pointer group ${className}`}
    >
      {TenPetsEmblem}

      <div className="flex flex-col">
        {/* Wordmark: ten 🐾 pets */}
        <div
          className={`font-black tracking-tight flex items-center leading-none ${textSizeMap[size]}`}
          style={{ color: isDark ? '#A3CF75' : BRAND_GREEN, fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          <span>ten</span>
          <span className="px-0.5">{PawSeparator}</span>
          <span className="relative">
            pets
            {/* Organic leaf stroke on "pets" */}
            <span
              className="absolute -top-1 right-0 w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: isDark ? '#A3CF75' : BRAND_GREEN }}
            />
          </span>
        </div>

        {showSubtitle && (
          <span
            className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
              isDark ? 'text-emerald-300' : 'text-[#587837]/80'
            }`}
          >
            Resgates & Ciência Veterinária
          </span>
        )}
      </div>
    </div>
  );
};
