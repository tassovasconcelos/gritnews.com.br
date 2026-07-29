import React from 'react';

interface GritNewsLogoProps {
  variant?: 'default' | 'light' | 'icon-only' | 'stacked' | 'footer';
  size?: 'sm' | 'md' | 'lg';
  showSlogan?: boolean;
  className?: string;
  onClick?: () => void;
}

export const GritNewsLogo: React.FC<GritNewsLogoProps> = ({
  variant = 'default',
  size = 'md',
  showSlogan = true,
  className = '',
  onClick
}) => {
  const isLight = variant === 'light' || variant === 'footer';

  // Sizing definitions
  const iconSizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const titleSizeMap = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const sloganSizeMap = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs'
  };

  // Official Emblem Icon according to Brand Manual:
  // Palette: Navy #0B1F3A | Blue #1565F5 | Orange #F7931E | White #FFFFFF
  const LogoIcon = (
    <div className={`relative flex items-center justify-center ${iconSizeMap[size]} shrink-0 transition-transform duration-300 group-hover:scale-105`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        {/* Navy Blue Badge Container */}
        <rect width="100" height="100" rx="22" fill="#0B1F3A" />
        
        {/* Crisp "G" Outer Ring Arc in Brand Royal Blue */}
        <path
          d="M 72 26 C 58 14 36 14 24 28 C 12 42 12 64 24 78 C 38 92 62 92 76 78 C 82 72 86 63 86 52 H 50 V 38 H 96 V 54 C 96 70 88 84 76 92 C 54 104 24 100 10 82 C -4 62 -2 34 14 16 C 34 -2 68 -2 88 18 Z"
          fill="#1565F5"
          className="hidden"
        />

        {/* Precision Geometric "G" Mark */}
        <path
          d="M 66 26 C 55 18 38 18 28 28 C 16 38 16 58 28 68 C 38 78 55 78 66 70 C 72 65 74 58 74 50 H 50 V 38 H 86 V 54 C 86 66 80 76 70 84 C 52 96 26 92 12 76 C -2 60 -2 34 12 18 C 28 2 56 2 72 16 Z"
          fill="#1565F5"
        />

        {/* Central White "G" Counter Balance */}
        <path
          d="M 50 38 H 82 V 50 H 62 C 62 55 60 62 54 66 C 46 72 34 72 26 64 C 18 56 18 42 26 34 C 34 26 46 26 54 30 L 62 20 C 50 12 32 12 20 22 C 6 34 6 54 20 66 C 32 78 52 78 64 70 C 72 64 76 54 76 44 V 38 H 50 Z"
          fill="#FFFFFF"
        />

        {/* Orange Opportunity Spark Indicator (#F7931E) */}
        <path
          d="M 68 22 L 88 22 L 88 42 Z"
          fill="#F7931E"
        />
        <circle cx="82" cy="18" r="6" fill="#F7931E" />
      </svg>
    </div>
  );

  if (variant === 'icon-only') {
    return (
      <div onClick={onClick} className={`inline-flex items-center cursor-pointer ${className}`}>
        {LogoIcon}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none cursor-pointer group ${className}`}
    >
      {LogoIcon}

      <div className="flex flex-col justify-center">
        {/* Main Title Wordmark */}
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-tighter ${titleSizeMap[size]} ${isLight ? 'text-white' : 'text-[#0B1F3A]'}`}>
            GRIT
          </span>
          <span className={`font-black tracking-tighter ${titleSizeMap[size]} text-[#1565F5]`}>
            NEWS
          </span>
        </div>

        {/* Official Slogan from Brand Manual */}
        {showSlogan && (
          <p className={`font-bold tracking-wider uppercase mt-0.5 ${sloganSizeMap[size]} ${isLight ? 'text-[#EAF3FF] opacity-90' : 'text-[#5C6B7A]'}`}>
            Informações que geram oportunidades.
          </p>
        )}
      </div>
    </div>
  );
};

