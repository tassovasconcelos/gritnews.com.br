import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'orange' | 'green' | 'navy' | 'gray' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  style
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full whitespace-nowrap transition-colors';
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  const variantClasses = {
    primary: 'bg-[#EAF3FF] text-[#145EDB] border border-[#145EDB]/20',
    orange: 'bg-[#FF8500]/10 text-[#FF8500] border border-[#FF8500]/30 font-semibold',
    green: 'bg-[#22A06B]/10 text-[#22A06B] border border-[#22A06B]/30',
    navy: 'bg-[#0B2343] text-white',
    gray: 'bg-gray-100 text-[#5C6B7A] border border-gray-200',
    outline: 'border border-[#E2E8F0] text-[#10233F] bg-white'
  };

  return (
    <span
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
};
