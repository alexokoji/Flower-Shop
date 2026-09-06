/**
 * Vector artwork for the Veloxa marketing pages.
 *
 * These replace stock photography deliberately. Keyword stock services could not
 * be steered towards freight imagery — requests for cargo returned a cat statue
 * and a black-and-white archival photo on a red field — and a mismatched picture
 * on a logistics homepage reads worse than none at all.
 *
 * Drawn instead against the site's own tokens (navy ground, signal blue,
 * velocity cyan), so the result is on-brand by construction, weighs a couple of
 * kilobytes, needs no remote host, and cannot fail to load. Swap in photography
 * when you have art direction for it.
 */

/** Hero: a route network — hubs, great-circle arcs, and cargo in motion. */
export function NetworkArt({ className = "" }: { className?: string }) {
  const hubs = [
    { x: 120, y: 300, r: 7, label: true },
    { x: 300, y: 170, r: 5 },
    { x: 470, y: 250, r: 9, label: true },
    { x: 610, y: 140, r: 5 },
    { x: 700, y: 330, r: 6 },
    { x: 250, y: 430, r: 5 },
    { x: 560, y: 450, r: 6 },
  ];

  const arcs = [
    "M120,300 Q210,180 300,170",
    "M300,170 Q390,180 470,250",
    "M470,250 Q540,170 610,140",
    "M470,250 Q600,260 700,330",
    "M120,300 Q180,390 250,430",
    "M250,430 Q400,490 560,450",
    "M560,450 Q650,410 700,330",
  ];

  return (
    <svg viewBox="0 0 800 560" className={className} role="img" aria-label="Veloxa route network">
      <defs>
        <linearGradient id="vx-arc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id="vx-glow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="vx-grid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* meridian grid */}
      <g stroke="url(#vx-grid)" strokeWidth="1" fill="none">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <ellipse key={`e${i}`} cx="400" cy="290" rx={40 + i * 52} ry={26 + i * 34} />
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={`l${i}`} x1={80 + i * 128} y1="60" x2={80 + i * 128} y2="520" />
        ))}
      </g>

      {/* lanes */}
      <g fill="none" stroke="url(#vx-arc)" strokeWidth="2" strokeLinecap="round">
        {arcs.map((d, i) => (
          <path key={d} d={d} opacity={0.55 + (i % 3) * 0.15} />
        ))}
      </g>

      {/* a parcel travelling one lane */}
      <g>
        <circle r="4" fill="#22D3EE">
          <animateMotion dur="6s" repeatCount="indefinite" path="M120,300 Q210,180 300,170" />
        </circle>
        <circle r="12" fill="url(#vx-glow)">
          <animateMotion dur="6s" repeatCount="indefinite" path="M120,300 Q210,180 300,170" />
        </circle>
        <circle r="3.5" fill="#22D3EE" opacity="0.85">
          <animateMotion dur="8s" begin="1.5s" repeatCount="indefinite" path="M470,250 Q600,260 700,330" />
        </circle>
      </g>

      {/* hubs */}
      <g>
        {hubs.map((h, i) => (
          <g key={`${h.x}-${h.y}`}>
            {h.label && <circle cx={h.x} cy={h.y} r={h.r + 14} fill="url(#vx-glow)" />}
            <circle cx={h.x} cy={h.y} r={h.r} fill="#0B1220" stroke="#2563EB" strokeWidth="2" />
            <circle cx={h.x} cy={h.y} r={h.r / 2.4} fill="#22D3EE">
              <animate
                attributeName="opacity"
                values="1;0.35;1"
                dur={`${2.4 + i * 0.35}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Service tiles                                                              */
/* -------------------------------------------------------------------------- */

function TileFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 400 300" className="size-full" role="img" aria-label={label}>
      <defs>
        <linearGradient id={`bg-${label}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#131C30" />
          <stop offset="100%" stopColor="#0B1220" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#bg-${label})`} />
      <g stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={i} x1="0" y1={i * 60} x2="400" y2={i * 60} />
        ))}
      </g>
      {children}
    </svg>
  );
}

/** Air: an ascending flight path over a horizon. */
export function AirArt() {
  return (
    <TileFrame label="Air freight">
      <path d="M0,235 H400" stroke="#2B3A5C" strokeWidth="1.5" />
      <path
        d="M40,220 Q170,205 250,140 T380,60"
        fill="none"
        stroke="#22D3EE"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="6 8"
      />
      <g transform="translate(300 96) rotate(-28)">
        <path d="M0,0 L46,13 L0,26 L11,13 Z" fill="#22D3EE" />
      </g>
      <circle cx="40" cy="220" r="6" fill="#0B1220" stroke="#2563EB" strokeWidth="2" />
    </TileFrame>
  );
}

/** Sea: stacked containers on a waterline. */
export function SeaArt() {
  const boxes = [
    { x: 96, y: 176, w: 62, h: 30, c: "#2563EB" },
    { x: 166, y: 176, w: 62, h: 30, c: "#1D4FD7" },
    { x: 236, y: 176, w: 62, h: 30, c: "#22D3EE" },
    { x: 131, y: 140, w: 62, h: 30, c: "#1D4FD7" },
    { x: 201, y: 140, w: 62, h: 30, c: "#2563EB" },
    { x: 166, y: 104, w: 62, h: 30, c: "#22D3EE" },
  ];
  return (
    <TileFrame label="Sea freight">
      {boxes.map((b) => (
        <rect
          key={`${b.x}-${b.y}`}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          rx="4"
          fill={b.c}
          fillOpacity="0.85"
        />
      ))}
      <path d="M76,206 H322 L300,240 H98 Z" fill="#131C30" stroke="#2B3A5C" strokeWidth="2" />
      <g stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" opacity="0.6">
        <path d="M40,262 q22,-10 44,0 t44,0 t44,0 t44,0 t44,0 t44,0" fill="none" />
        <path d="M40,282 q22,-10 44,0 t44,0 t44,0 t44,0 t44,0 t44,0" fill="none" opacity="0.5" />
      </g>
    </TileFrame>
  );
}

/** Road: a van on a dashed lane with motion lines. */
export function RoadArt() {
  return (
    <TileFrame label="Road haulage">
      <path d="M0,215 H400" stroke="#2B3A5C" strokeWidth="2" />
      <path d="M0,236 H400" stroke="#22D3EE" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="18 16" />
      <g transform="translate(120 140)">
        <rect x="0" y="20" width="104" height="52" rx="7" fill="#2563EB" />
        <path d="M104,34 h34 l22,26 v12 h-56 z" fill="#1D4FD7" />
        <rect x="112" y="40" width="24" height="17" rx="3" fill="#0B1220" fillOpacity="0.65" />
        <circle cx="30" cy="76" r="12" fill="#0B1220" stroke="#22D3EE" strokeWidth="2.5" />
        <circle cx="132" cy="76" r="12" fill="#0B1220" stroke="#22D3EE" strokeWidth="2.5" />
      </g>
      <g stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" opacity="0.55">
        <line x1="40" y1="168" x2="96" y2="168" />
        <line x1="24" y1="186" x2="96" y2="186" />
        <line x1="52" y1="204" x2="96" y2="204" />
      </g>
    </TileFrame>
  );
}
