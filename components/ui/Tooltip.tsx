import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, side = 'bottom', align = 'center' }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Alignment logic
  let positionClass = 'left-1/2 -translate-x-1/2'; // Default center
  if (align === 'start') positionClass = 'left-0 translate-x-0';
  if (align === 'end') positionClass = 'right-0 translate-x-0';

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div 
            className={`
                absolute z-50 px-3 py-1.5 text-[11px] font-medium tracking-wide rounded-sm shadow-xl whitespace-nowrap
                transition-all duration-200 pointer-events-none transform translate-y-0
                ${side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'}
                ${positionClass}
            `}
            style={{
                // Always dark background for tooltips for high contrast "Dev Tool" look
                backgroundColor: '#18181b', 
                color: '#f4f4f5',
                border: '1px solid #27272a',
                animation: 'tooltipFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
        >
            {content}
        </div>
      )}
      <style>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
