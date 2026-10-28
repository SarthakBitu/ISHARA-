import React from 'react';

interface ISLHandGraphicProps {
  type: string;
  size?: number;
  className?: string;
  animated?: boolean;
}

export const ISLHandGraphic: React.FC<ISLHandGraphicProps> = ({
  type,
  size = 120,
  className = '',
  animated = false,
}) => {
  const strokeColor = '#38BDF8'; // Sky blue
  const secondaryColor = '#06B6D4'; // Cyan
  const accentColor = '#818CF8'; // Indigo

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl bg-slate-900/80 border border-slate-800 p-3 shadow-inner ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full ${animated ? 'animate-pulse' : ''}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Joined Palms (Namaste) */}
        {type === 'joined-palms' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            {/* Left Hand */}
            <path
              d="M45 75V40C45 35 40 30 35 30C30 30 26 34 26 40V75"
              stroke={strokeColor}
              strokeWidth="3.5"
            />
            {/* Joined Center Palms */}
            <path
              d="M46 78V25C46 22 48 20 50 20C52 20 54 22 54 25V78"
              stroke={secondaryColor}
              strokeWidth="4"
            />
            {/* Right Hand */}
            <path
              d="M55 75V40C55 35 60 30 65 30C70 30 74 34 74 40V75"
              stroke={strokeColor}
              strokeWidth="3.5"
            />
            <path d="M30 78C30 84 38 88 50 88C62 88 70 84 70 78" stroke={accentColor} strokeWidth="3" />
            <circle cx="50" cy="14" r="3" fill={secondaryColor} />
          </g>
        )}

        {/* Emergency Help (Fist placed on flat palm pushing upward) */}
        {type === 'fist-on-palm' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            {/* Bottom Flat Palm */}
            <path d="M20 70H80C83 70 85 73 85 76C85 79 83 82 80 82H20C17 82 15 79 15 76C15 73 17 70 20 70Z" stroke={secondaryColor} strokeWidth="3.5" fill="rgba(6, 182, 212, 0.15)" />
            {/* Top Fist with Thumb Up */}
            <rect x="36" y="38" width="28" height="26" rx="6" stroke={strokeColor} strokeWidth="3.5" fill="rgba(56, 189, 248, 0.15)" />
            <path d="M42 38V22C42 19 46 17 48 17C50 17 54 19 54 22V38" stroke={strokeColor} strokeWidth="3.5" />
            {/* Upward arrows */}
            <path d="M50 12L50 4M50 4L45 8M50 4L55 8" stroke="#F43F5E" strokeWidth="2.5" />
          </g>
        )}

        {/* Flat Hand Moving Outward (Thank You) */}
        {type === 'flat-outward' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            {/* Hand flat */}
            <path d="M30 65V35C30 30 34 26 39 26C44 26 48 30 48 35V65" stroke={strokeColor} strokeWidth="3.5" />
            <path d="M48 65V30C48 25 52 22 57 22C62 22 66 25 66 30V65" stroke={secondaryColor} strokeWidth="3.5" />
            <path d="M22 60L22 45C22 41 25 38 29 38" stroke={strokeColor} strokeWidth="3" />
            {/* Motion arrow */}
            <path d="M72 45L88 45M88 45L82 39M88 45L82 51" stroke={accentColor} strokeWidth="2.5" />
          </g>
        )}

        {/* Water (W-shape at chin) */}
        {type === 'water-w' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            {/* 3 upright fingers W */}
            <path d="M35 75V30C35 26 38 24 41 24C44 24 47 26 47 30V65" stroke={strokeColor} strokeWidth="3.5" />
            <path d="M47 65V25C47 21 50 19 53 19C56 19 59 21 59 25V65" stroke={secondaryColor} strokeWidth="3.5" />
            <path d="M59 65V32C59 28 62 26 65 26C68 26 71 28 71 32V75" stroke={strokeColor} strokeWidth="3.5" />
            {/* Tucked thumb & pinky */}
            <path d="M35 65C30 65 25 68 25 74" stroke={strokeColor} strokeWidth="3" />
            {/* Water droplet */}
            <path d="M78 20C78 20 84 27 84 31C84 34 81.3 37 78 37C74.7 37 72 34 72 31C72 27 78 20 78 20Z" fill={secondaryColor} />
          </g>
        )}

        {/* Bunched Food / Hungry */}
        {type === 'food-bunched' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            {/* Clustered fingertips facing up/in */}
            <path d="M38 75V55C38 45 46 36 50 32C54 36 62 45 62 55V75" stroke={secondaryColor} strokeWidth="3.5" fill="rgba(6, 182, 212, 0.15)" />
            <path d="M50 32V52" stroke={strokeColor} strokeWidth="3" />
            <circle cx="50" cy="28" r="4" fill={accentColor} />
            <path d="M30 75H70" stroke={strokeColor} strokeWidth="3" />
          </g>
        )}

        {/* Pulse Tap (Doctor / Hospital) */}
        {type === 'pulse-tap' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            {/* Wrist */}
            <path d="M20 65H60V80H20V65Z" stroke={secondaryColor} strokeWidth="3.5" fill="rgba(6, 182, 212, 0.1)" />
            {/* Two tapping fingers */}
            <path d="M46 25V55" stroke={strokeColor} strokeWidth="3.5" />
            <path d="M54 28V55" stroke={strokeColor} strokeWidth="3.5" />
            {/* Pulse wave */}
            <path d="M70 72L74 72L77 64L80 80L83 72L88 72" stroke="#F43F5E" strokeWidth="2.5" />
          </g>
        )}

        {/* Stop (Open palm upright) */}
        {type === 'open-palm-stop' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <path d="M30 75V40C30 36 34 33 38 33C42 33 46 36 46 40V75" stroke={strokeColor} strokeWidth="3" />
            <path d="M46 75V25C46 21 50 18 54 18C58 18 62 21 62 25V75" stroke={secondaryColor} strokeWidth="3.5" />
            <path d="M62 75V35C62 31 66 28 70 28C74 28 78 31 78 35V75" stroke={strokeColor} strokeWidth="3" />
            <path d="M22 65C18 60 20 52 26 50L30 52" stroke={strokeColor} strokeWidth="3" />
            <path d="M26 78H78" stroke={strokeColor} strokeWidth="3.5" />
          </g>
        )}

        {/* Fist Nod (Yes) */}
        {type === 'fist-nod' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <rect x="30" y="35" width="40" height="35" rx="8" stroke={strokeColor} strokeWidth="3.5" fill="rgba(56, 189, 248, 0.15)" />
            <path d="M40 35V28C40 25 44 23 48 23C52 23 56 25 56 28V35" stroke={strokeColor} strokeWidth="3" />
            {/* Downward nod arrow */}
            <path d="M78 40V60M78 60L73 54M78 60L83 54" stroke={secondaryColor} strokeWidth="2.5" />
          </g>
        )}

        {/* Numbers & Alphabet Defaults */}
        {type.startsWith('num-') && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <rect x="25" y="55" width="50" height="30" rx="8" stroke={strokeColor} strokeWidth="3.5" fill="rgba(56, 189, 248, 0.15)" />
            {type === 'num-1' && (
              <path d="M50 55V20C50 17 54 15 56 15C58 15 62 17 62 20V55" stroke={secondaryColor} strokeWidth="4" />
            )}
            {type === 'num-2' && (
              <>
                <path d="M42 55V22C42 19 46 17 49 17C52 17 55 19 55 22V55" stroke={secondaryColor} strokeWidth="3.5" />
                <path d="M58 55V22C58 19 62 17 65 17C68 17 71 19 71 22V55" stroke={strokeColor} strokeWidth="3.5" />
              </>
            )}
            {type === 'num-3' && (
              <>
                <path d="M38 55V22" stroke={secondaryColor} strokeWidth="3.5" />
                <path d="M50 55V20" stroke={strokeColor} strokeWidth="3.5" />
                <path d="M62 55V22" stroke={accentColor} strokeWidth="3.5" />
              </>
            )}
          </g>
        )}

        {/* Authentic ISL Vowel A: Index points to tip of non-dominant thumb */}
        {type === 'isl-vowel-a' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            {/* Left non-dominant hand palm */}
            <path d="M20 70V50C20 45 24 40 30 40H45" stroke={secondaryColor} strokeWidth="3.5" />
            <circle cx="48" cy="40" r="4" fill="#F43F5E" />
            {/* Dominant index pointing at thumb tip */}
            <path d="M80 40H54M54 40L60 35M54 40L60 45" stroke={strokeColor} strokeWidth="3.5" />
          </g>
        )}

        {/* Tea Dip (Chai) */}
        {type === 'tea-dip' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            {/* Cup */}
            <path d="M30 55C30 72 40 78 50 78C60 78 70 72 70 55H30Z" stroke={secondaryColor} strokeWidth="3.5" fill="rgba(6, 182, 212, 0.15)" />
            <path d="M70 60C76 60 80 63 80 67C80 71 76 74 70 74" stroke={secondaryColor} strokeWidth="3" />
            {/* Pinch fingers dipping */}
            <path d="M46 25V42" stroke={strokeColor} strokeWidth="3.5" />
            <path d="M54 28V42" stroke={strokeColor} strokeWidth="3.5" />
            <circle cx="50" cy="46" r="3.5" fill="#F59E0B" />
          </g>
        )}

        {/* How Are You */}
        {type === 'how-are-you' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <path d="M25 60C25 45 35 40 45 40" stroke={strokeColor} strokeWidth="3.5" />
            <path d="M75 60C75 45 65 40 55 40" stroke={secondaryColor} strokeWidth="3.5" />
            <path d="M35 70L50 78L65 70" stroke={accentColor} strokeWidth="3" />
            <circle cx="50" cy="30" r="3.5" fill={secondaryColor} />
          </g>
        )}

        {/* Fallback general gesture */}
        {!['joined-palms', 'fist-on-palm', 'flat-outward', 'water-w', 'food-bunched', 'pulse-tap', 'open-palm-stop', 'fist-nod', 'isl-vowel-a'].includes(type) && !type.startsWith('num-') && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <path d="M30 75V40C30 35 35 30 40 30C45 30 50 35 50 40V75" stroke={strokeColor} strokeWidth="3.5" />
            <path d="M50 75V30C50 25 55 20 60 20C65 20 70 25 70 30V75" stroke={secondaryColor} strokeWidth="3.5" />
            <path d="M22 65C18 60 20 52 26 50L30 52" stroke={accentColor} strokeWidth="3" />
            <circle cx="50" cy="85" r="4" fill={strokeColor} />
          </g>
        )}
      </svg>
    </div>
  );
};
