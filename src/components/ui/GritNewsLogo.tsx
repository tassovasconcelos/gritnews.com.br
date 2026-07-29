import React from 'react';

interface GritNewsLogoProps {
  variant?: 'default' | 'light' | 'icon-only' | 'stacked' | 'footer';
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const titleSizeMap = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  const sloganSizeMap = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm'
  };

  // Official Emblem Icon from Brand Manual 2026:
  // Pointy-top rounded Hexagon in Azul Marinho (#0D182A) with Laranja (#FF8A00) ↗ Arrow
  const LogoIcon = (
    <div className={`relative flex items-center justify-center ${iconSizeMap[size]} shrink-0 transition-transform duration-300 group-hover:scale-105`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        {/* Navy Blue Hexagon Badge Frame (#0D182A) */}
        <path
          d="M 50 4 C 55 4 85 21 87 25 C 89 29 89 71 87 75 C 85 79 55 96 50 96 C 45 96 15 79 13 75 C 11 71 11 29 13 25 C 15 21 45 4 50 4 Z"
          fill={isLight ? '#0D182A' : '#0D182A'}
          stroke={isLight ? '#146EF5' : 'none'}
          strokeWidth={isLight ? '3' : '0'}
        />

        {/* Orange Growth & Opportunity Arrow (#FF8A00) ↗ */}
        <path
          d="M 32 68 L 68 32 M 46 32 L 68 32 L 68 54"
          stroke="#FF8A00"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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

  if (variant === 'stacked') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex flex-col items-center text-center gap-1 select-none cursor-pointer group ${className}`}
      >
        {LogoIcon}
        <div className="flex items-center gap-1 leading-none mt-1">
          <span className={`font-black tracking-tighter ${titleSizeMap[size]} ${isLight ? 'text-white' : 'text-[#0D182A]'}`}>
            GRIT
          </span>
          <span className={`font-black tracking-tighter ${titleSizeMap[size]} text-[#146EF5]`}>
            NEWS
          </span>
        </div>
        {showSlogan && (
          <p className={`font-medium italic tracking-tight ${sloganSizeMap[size]} ${isLight ? 'text-[#F1F5F9]' : 'text-[#687280]'}`}>
            Informações que geram oportunidades
          </p>
        )}
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
        {/* Main Title Wordmark: GRIT NEWS */}
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-tight ${titleSizeMap[size]} ${isLight ? 'text-white' : 'text-[#0D182A]'}`}>
            GRIT
          </span>
          <span className={`font-black tracking-tight ${titleSizeMap[size]} text-[#146EF5]`}>
            NEWS
          </span>
        </div>

        {/* Official Slogan from Brand Manual 2026: Informações que geram oportunidades */}
        {showSlogan && (
          <p className={`font-medium italic mt-0.5 ${sloganSizeMap[size]} ${isLight ? 'text-[#F1F5F9]/90' : 'text-[#687280]'}`}>
            Informações que geram oportunidades
          </p>
        )}
      </div>
    </div>
  );
};


