import React from 'react';

interface TeamKit {
  angle: number;
  textColour: number;
  teamColour1: number;
  teamColour2?: number | null;
  teamColour3?: number | null;
}

interface KitVisualizerProps {
  kit: TeamKit;
  size?: number;
  showText?: boolean;
}

export const KitVisualizer: React.FC<KitVisualizerProps> = ({ 
  kit, 
  size = 60, 
  showText = false 
}) => {
  const getKitType = (): 'solid' | 'striped-2' | 'striped-3' => {
    if (kit.teamColour2 === null || kit.teamColour2 === undefined) return 'solid';
    if (kit.teamColour3 === null || kit.teamColour3 === undefined) return 'striped-2';
    return 'striped-3';
  };

  const hexColor = (color: number): string => {
    if (color === null || color === undefined) return '#FFFFFF';
    return `#${Math.abs(color).toString(16).padStart(6, '0')}`;
  };

  const generateBackground = (): string => {
    const type = getKitType();
    const color1 = hexColor(kit.teamColour1);
    
    switch (type) {
      case 'solid':
        // 1 color: solid circle
        return color1;
      
      case 'striped-2': {
        // 2 colors: half and half
        const color2 = hexColor(kit.teamColour2!);
        const angle = kit.angle || 0;
        return `conic-gradient(from ${angle}deg, ${color1} 0deg, ${color1} 180deg, ${color2} 180deg, ${color2} 360deg)`;
      }
      
      case 'striped-3': {
        // 3 colors: three equal stripes
        const color2 = hexColor(kit.teamColour2!);
        const color3 = hexColor(kit.teamColour3!);
        return `repeating-linear-gradient(
          ${kit.angle}deg,
          ${color1} 0%,
          ${color1} 33.33%,
          ${color2} 33.33%,
          ${color2} 66.66%,
          ${color3} 66.66%,
          ${color3} 100%
        )`;
      }
    }
  };

  const textColor = hexColor(kit.textColour);

  return (
    <div className="flex flex-col items-center">
      <div
        className="rounded-full border-2 border-gray-300 shadow-sm relative flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: generateBackground(),
        }}
      >
        <span 
          className="font-bold"
          style={{ 
            color: textColor,
            fontSize: `${size * 0.6}px`,
            lineHeight: 1
          }}
        >
          10
        </span>
      </div>
      {showText && (
        <div 
          className="text-xs mt-1 font-bold"
          style={{ color: textColor }}
        >
          ABC
        </div>
      )}
    </div>
  );
};