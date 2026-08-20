import React from 'react';

interface GritBrandLogoProps {
  variant?: 'dark' | 'light' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const GritBrandLogo: React.FC<GritBrandLogoProps> = ({
  variant = 'dark',
  size = 'md',
  className = '',
  onClick
}) => {
  const light = variant === 'light';
  const iconOnly = variant === 'icon';
  const iconClass = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14' : 'w-11 h-11';
  const wordClass = size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-[30px]';
  const subClass = size === 'sm' ? 'text-[7px]' : size === 'lg' ? 'text-[10px]' : 'text-[8px]';

  const emblem = (
    <svg viewBox="0 0 100 100" className={`${iconClass} shrink-0`} aria-hidden="true">
      <path d="M50 3 89 25v50L50 97 11 75V25L50 3Z" fill={light ? '#FFFFFF' : '#071B2C'} />
      <path d="M50 15 78 31v38L50 85 22 69V31L50 15Z" fill={light ? '#071B2C' : '#FFFFFF'} />
      <path d="M31 64 61 34H45V25h31v31h-9V41L37 71 31 64Z" fill="#FF6A00" />
    </svg>
  );

  return (
    <button onClick={onClick} className={`inline-flex items-center gap-3 text-left group ${className}`} aria-label="GRIT Soluções e Negócios">
      {emblem}
      {!iconOnly && (
        <span className="leading-none">
          <span className={`${wordClass} block font-black tracking-[-0.055em] ${light ? 'text-white' : 'text-[#071B2C]'}`}>grit</span>
          <span className={`${subClass} block mt-1 font-extrabold tracking-[0.20em] ${light ? 'text-white/80' : 'text-[#526273]'}`}>SOLUÇÕES E NEGÓCIOS</span>
        </span>
      )}
    </button>
  );
};
