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
  const iconOnly = variant === 'icon';
  const src = iconOnly
    ? '/brand/grit/logos/grit-simbolo-color.svg'
    : variant === 'light'
      ? '/brand/grit/logos/grit-logo-horizontal-negativo.svg'
      : '/brand/grit/logos/grit-logo-horizontal-color.svg';
  const dimensions = iconOnly
    ? size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-14 w-14' : 'h-11 w-11'
    : size === 'sm' ? 'h-8 w-auto min-w-[120px]' : size === 'lg' ? 'h-16 w-auto min-w-[240px]' : 'h-12 w-auto min-w-[180px]';

  return (
    <button onClick={onClick} className={`inline-flex items-center text-left ${className}`} aria-label="GRIT Soluções e Negócios">
      <img src={src} alt="GRIT Soluções e Negócios" className={`${dimensions} block object-contain object-left`} />
    </button>
  );
};
