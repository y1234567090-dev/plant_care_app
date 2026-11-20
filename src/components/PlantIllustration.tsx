import React from 'react';

/**
 * Original botanical-style illustration of a split-leaf indoor plant in a
 * terracotta pot. Drawn with plain SVG shapes so it needs no image file.
 */

const CREAM = '#ead9bb';

// One heart-shaped leaf, base notch at (0,0), tip at the top.
const BLADE =
  'M0,-8 C-30,18 -80,-5 -82,-62 C-84,-108 -40,-132 0,-142 C40,-132 84,-108 82,-62 C80,-5 30,18 0,-8 Z';

const SLITS: [number, number, number, number][] = [
  [-86, -34, -34, -48],
  [-84, -70, -30, -76],
  [-72, -104, -26, -104],
];

const VEINS: [number, number, number, number][] = [
  [0, -30, -56, -22],
  [0, -58, -66, -58],
  [0, -86, -62, -90],
  [0, -112, -44, -118],
];

const Leaf: React.FC<{ transform: string; shade: 0 | 1 | 2 }> = ({ transform, shade }) => {
  const gradientId = `leaf-grad-${shade}`;
  return (
    <g transform={transform}>
      <path d={BLADE} fill={`url(#${gradientId})`} stroke="#2a5d38" strokeWidth="2" strokeLinejoin="round" />
      {/* veins, then slits cut over them */}
      <g stroke="#a9d39a" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" fill="none">
        {VEINS.map(([x1, y1, x2, y2], i) => (
          <React.Fragment key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} />
            <line x1={-x1} y1={y1} x2={-x2} y2={y2} />
          </React.Fragment>
        ))}
        <line x1="0" y1="-6" x2="0" y2="-136" strokeWidth="3" />
      </g>
      <g stroke={CREAM} strokeWidth="8" strokeLinecap="round" fill="none">
        {SLITS.map(([x1, y1, x2, y2], i) => (
          <React.Fragment key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} />
            <line x1={-x1} y1={y1} x2={-x2} y2={y2} />
          </React.Fragment>
        ))}
      </g>
    </g>
  );
};

export const PlantIllustration: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 800 520"
    className={className}
    role="img"
    aria-label="Illustration of a split-leaf indoor plant in a terracotta pot"
  >
    <defs>
      <linearGradient id="leaf-grad-0" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#6aa65c" />
        <stop offset="1" stopColor="#2f6b3f" />
      </linearGradient>
      <linearGradient id="leaf-grad-1" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7db36a" />
        <stop offset="1" stopColor="#3a7a47" />
      </linearGradient>
      <linearGradient id="leaf-grad-2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5b9a55" />
        <stop offset="1" stopColor="#25563a" />
      </linearGradient>
    </defs>

    <rect width="800" height="520" fill={CREAM} />
    <rect x="14" y="14" width="772" height="492" rx="6" fill="none" stroke="#d3bf96" strokeWidth="2" />

    {/* stems */}
    <g fill="none" stroke="#4b7a46" strokeWidth="6" strokeLinecap="round">
      <path d="M400,440 C395,380 300,330 262,262" />
      <path d="M400,440 C402,372 405,306 424,238" />
      <path d="M400,440 C410,380 520,330 586,266" />
      <path d="M400,440 C385,410 350,385 332,350" />
      <path d="M400,440 C420,415 470,395 514,356" />
    </g>

    <Leaf transform="translate(262,262) rotate(-30) scale(1.15)" shade={0} />
    <Leaf transform="translate(586,266) rotate(32) scale(1.1)" shade={1} />
    <Leaf transform="translate(332,350) rotate(-64) scale(0.78)" shade={2} />
    <Leaf transform="translate(514,356) rotate(60) scale(0.82)" shade={0} />
    <Leaf transform="translate(424,238) rotate(6) scale(1.3)" shade={1} />

    {/* pot */}
    <rect x="326" y="428" width="148" height="24" rx="7" fill="#b9694b" />
    <path d="M338,452 L462,452 L450,512 Q400,522 350,512 Z" fill="#c8795a" />
    <path d="M338,452 L462,452 L460,462 L340,462 Z" fill="#a95d42" opacity="0.5" />
  </svg>
);
