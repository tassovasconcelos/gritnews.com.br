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

  // SVG emblem icon for GRIT NEWS according to Brand Manual:
  // Palette: Azul Marinho #0B1F3A, Azul #1565F5, Laranja #F7931E, Branco #FFFFFF
  const LogoIcon = (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${iconSizeMap[size]} shrink-0 drop-shadow-xs transition-transform duration-300 group-hover:scale-105`}
    >
      {/* Background Container Badge */}
      <rect width="100" height="100" rx="24" fill="#0B1F3A" />
      
      {/* Dynamic Geometric "G" Mark with Growth Accent */}
      {/* Main Outer Arc of G */}
      <path
        d="M68 30 C60 21 40 21 30 32 C20 43 20 59 30 70 C40 81 60 81 72 70 C76 66 78 60 78 52 H48 V40 H88 V54 C88 68 82 78 74 86 C58 100 28 98 12 80 C-4 61 -2 33 16 16 C34 -1 66 0 84 18 L68 30 Z"
        fill="#1565F5"
        className="hidden" /* Hidden in favor of precision vector below */
      />
      
      {/* Precise Stylized "G" + Spark Arrow */}
      {/* Outer Circle Arch in Brand Blue */}
      <path
        d="M68 28 C58 20 42 20 32 30 C22 40 22 58 32 68 C42 78 58 78 68 70 C72 66 74 61 74 54 H48 V42 H86 V56 C86 68 80 78 70 86 C52 98 26 94 12 78 C-2 62 -2 36 12 20 C28 4 56 4 72 18 L68 28 Z"
        fill="url(#grit-blue-grad)"
      />

      {/* Internal Forward Spark / Opportunity Arrow in Brand Orange #F7931E */}
      <path
        d="M52 42 L72 42 L84 50 L72 58 L52 58 L62 50 Z"
        fill="#F7931E"
      />

      {/* Modern Accent Dot */}
      <circle cx="78" cy="24" r="7" fill="#F7931E" />

      <defs>
        <linearGradient id="grit-blue-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1565F5" />
          <stop offset="1" stopColor="#0B1F3A" />
        </linearGradient>
      </defs>
    </svg>
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

      <div className="flex flex-col">
        {/* Main Title Wordmark */}
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-tighter ${titleSizeMap[size]} ${isLight ? 'text-white' : 'text-[#0B1F3A]'}`}>
            GRIT
          </span>
          <span className={`font-black tracking-tighter ${titleSizeMap[size]} text-[#1565F5]`}>
            NEWS
          </span>
        </div>

        {/* Official Slogan from Brand Manual: Informações que geram oportunidades. */}
        {showSlogan && (
          <p className={`font-bold tracking-wider uppercase -mt-0.5 ${sloganSizeMap[size]} ${isLight ? 'text-[#EAF3FF] opacity-90' : 'text-[#5C6B7A]'}`}>
            Informações que geram oportunidades.
          </p>
        )}
      </div>
    </div>
  );
};
