import React from 'react';
import tenpetsLogoImg from '../../assets/images/tenpets_official_logo_1785288965710.jpg';

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
  const isDark = variant === 'dark';

  // Size mappings
  const imgSizeMap = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24'
  };

  const textSizeMap = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  // Official Logo Image from Assets
  const OfficialImage = (
    <img
      src={tenpetsLogoImg}
      alt="TenPets Logo Oficial"
      referrerPolicy="no-referrer"
      onError={(e) => {
        e.currentTarget.src = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300";
      }}
      className={`${imgSizeMap[size]} object-contain rounded-xl shadow-xs transition-transform duration-300 group-hover:scale-105 shrink-0 bg-white p-0.5 border border-[#587837]/30`}
    />
  );

  if (variant === 'icon-only') {
    return (
      <div onClick={onClick} className={`inline-flex items-center cursor-pointer ${className}`}>
        {OfficialImage}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all cursor-pointer ${
          isDark
            ? 'bg-emerald-950/90 border-emerald-700/60 text-emerald-100'
            : 'bg-white border-[#587837]/30 text-[#587837] hover:bg-[#F5F7F2]'
        } ${className}`}
      >
        {OfficialImage}
        <div className="flex flex-col">
          <span className="font-extrabold text-sm tracking-tight text-[#587837]">
            tenpets
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none cursor-pointer group ${className}`}
    >
      {OfficialImage}

      <div className="flex flex-col justify-center">
        <div
          className={`font-black tracking-tight flex items-center leading-none ${textSizeMap[size]}`}
          style={{ color: isDark ? '#A3CF75' : '#587837' }}
        >
          <span>tenpets</span>
        </div>

        {showSubtitle && (
          <span
            className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${
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

