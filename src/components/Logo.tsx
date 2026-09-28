import React from 'react';

interface LogoIconProps {
  className?: string;
  size?: number;
}

export const LogoIcon: React.FC<LogoIconProps> = ({ className = "w-8 h-8", size }) => {
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      style={style}
    >
      <defs>
        {/* Soft outer glow halo */}
        <filter id="izy-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Gradient for main orbital ring */}
        <linearGradient id="izy-ring-grad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="25%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="75%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* Faint ambient halo ring gradient */}
        <linearGradient id="izy-halo-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#EC4899" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Ambient background aura */}
      <circle cx="50" cy="50" r="44" stroke="url(#izy-halo-grad)" strokeWidth="6" fill="none" opacity="0.8" />

      {/* Main Gradient Orbital Ring */}
      <circle
        cx="50"
        cy="50"
        r="36"
        stroke="url(#izy-ring-grad)"
        strokeWidth="5"
        fill="none"
        filter="url(#izy-glow)"
      />

      {/* Inner Central Dark Disc */}
      <circle cx="50" cy="50" r="24" fill="#0B0F17" stroke="#1E293B" strokeWidth="1.5" />

      {/* Center 'o' Ring */}
      <circle cx="50" cy="50" r="4.5" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Satellite Node Dots at 12, 3, 6, and 9 o'clock */}
      {/* Top Node (Cyan) */}
      <circle cx="50" cy="14" r="4.5" fill="#00E5FF" />
      <circle cx="50" cy="14" r="2" fill="#FFFFFF" opacity="0.6" />

      {/* Right Node (Pink) */}
      <circle cx="86" cy="50" r="4.5" fill="#EC4899" />
      <circle cx="86" cy="50" r="2" fill="#FFFFFF" opacity="0.6" />

      {/* Bottom Node (Orange) */}
      <circle cx="50" cy="86" r="4.5" fill="#F59E0B" />
      <circle cx="50" cy="86" r="2" fill="#FFFFFF" opacity="0.6" />

      {/* Left Node (Purple/Indigo) */}
      <circle cx="14" cy="50" r="4.5" fill="#6366F1" />
      <circle cx="14" cy="50" r="2" fill="#FFFFFF" opacity="0.6" />
    </svg>
  );
};

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
  isDarkTheme?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  isDarkTheme = true
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12'
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl sm:text-3xl'
  };

  const subtitleSizes = {
    sm: 'text-[8px] tracking-[0.18em]',
    md: 'text-[9.5px] tracking-[0.2em]',
    lg: 'text-[11px] tracking-[0.22em]'
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <LogoIcon className={iconSizes[size]} />
      
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-1.5">
          <span className={`font-bold tracking-tight font-['Geist'] ${titleSizes[size]} ${isDarkTheme ? 'text-white' : 'text-[#0B0F17]'}`}>
            izycolors
          </span>
        </div>
        
        {showSubtitle && (
          <span className={`font-medium uppercase text-[#64748B] font-mono mt-1 ${subtitleSizes[size]}`}>
            SMART PROCEDURAL HARMONIES
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
