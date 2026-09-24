import React, { useId, useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { describeDrink, mixColors, seededRandom } from '../lib/drinkLook';

// Glass shapes in a 100-wide coordinate space, centred on x=50.
//   outline: the glass body   liquid: the fill region inside it
//   box: liquid bounding box  rim: where rim garnishes sit
//   stem: [top, bottom] y of a stem (stemmed glasses only)
const GLASSES = {
  coupe: {
    outline: 'M18 34 Q18 62 50 64 Q82 62 82 34',
    liquid: 'M20 40 Q21 60 50 62 Q79 60 80 40 Z',
    box: { x1: 20, x2: 80, y1: 40, y2: 62 },
    rim: { y: 34, left: 18, right: 82 },
    stem: [64, 100],
    baseRx: 16,
  },
  martini: {
    outline: 'M14 26 L50 64 L86 26',
    liquid: 'M21 33 L50 62 L79 33 Z',
    box: { x1: 21, x2: 79, y1: 33, y2: 62 },
    rim: { y: 26, left: 14, right: 86 },
    stem: [64, 100],
    baseRx: 16,
  },
  flute: {
    outline: 'M38 12 L37 66 Q37 78 50 79 Q63 78 63 66 L62 12',
    liquid: 'M39.5 24 L39 66 Q39 76 50 77 Q61 76 61 66 L60.5 24 Z',
    box: { x1: 39, x2: 61, y1: 24, y2: 77 },
    rim: { y: 12, left: 38, right: 62 },
    stem: [79, 103],
    baseRx: 13,
  },
  wine: {
    outline: 'M29 16 Q22 50 34 62 Q42 69 50 69 Q58 69 66 62 Q78 50 71 16',
    liquid: 'M26.5 38 Q25 52 35 61 Q42 67 50 67 Q58 67 65 61 Q75 52 73.5 38 Z',
    box: { x1: 26, x2: 74, y1: 38, y2: 67 },
    rim: { y: 16, left: 29, right: 71 },
    stem: [69, 103],
    baseRx: 17,
  },
  rocks: {
    outline: 'M22 48 L25 104 Q25 107 28 107 L72 107 Q75 107 75 104 L78 48',
    liquid: 'M23.5 60 L26.5 101 L73.5 101 L76.5 60 Z',
    box: { x1: 24, x2: 76, y1: 60, y2: 101 },
    rim: { y: 48, left: 22, right: 78 },
  },
  highball: {
    outline: 'M31 14 L33 104 Q33 107 36 107 L64 107 Q67 107 67 104 L69 14',
    liquid: 'M32.5 28 L34.5 101 L65.5 101 L67.5 28 Z',
    box: { x1: 33, x2: 67, y1: 28, y2: 101 },
    rim: { y: 14, left: 31, right: 69 },
  },
  hurricane: {
    outline: 'M33 12 Q28 36 38 52 Q44 60 40 72 Q36 86 42 96 L58 96 Q64 86 60 72 Q56 60 62 52 Q72 36 67 12',
    liquid: 'M32 26 Q30 38 39.5 51 Q46 60 41.5 72 Q37.5 85 43 94 L57 94 Q62.5 85 58.5 72 Q54 60 60.5 51 Q70 38 68 26 Z',
    box: { x1: 32, x2: 68, y1: 26, y2: 94 },
    rim: { y: 12, left: 33, right: 67 },
    stem: [96, 103],
    baseRx: 14,
  },
};

const BACKDROP = '#16161a';
const GLASS_STROKE = 'rgba(255,255,255,0.75)';

const CITRUS = {
  lemonWheel: { peel: '#f2d33c', flesh: '#fbe98a' },
  limeWheel: { peel: '#6fae2c', flesh: '#c4e27a' },
};

function Wheel({ x, y, colors }) {
  const spokes = [0, 60, 120].map((deg) => {
    const r = (deg * Math.PI) / 180;
    return { dx: Math.cos(r) * 6.5, dy: Math.sin(r) * 6.5 };
  });
  return (
    <G>
      <Circle cx={x} cy={y} r={9} fill={colors.peel} />
      <Circle cx={x} cy={y} r={7.4} fill={colors.flesh} />
      {spokes.map(({ dx, dy }, i) => (
        <Line key={i} x1={x - dx} y1={y - dy} x2={x + dx} y2={y + dy} stroke={colors.peel} strokeWidth={0.7} opacity={0.7} />
      ))}
    </G>
  );
}

function Garnish({ kind, glass }) {
  const { rim, box } = glass;
  const centre = (box.x1 + box.x2) / 2;
  switch (kind) {
    case 'lemonWheel':
    case 'limeWheel':
      return <Wheel x={rim.right - 3} y={rim.y} colors={CITRUS[kind]} />;
    case 'orangePeel':
    case 'lemonTwist': {
      const color = kind === 'orangePeel' ? '#ef8a1f' : '#f0cf36';
      const x = rim.right - 4;
      const y = rim.y;
      return (
        <Path
          d={`M${x - 8} ${y - 3} Q${x - 1} ${y - 10} ${x + 3} ${y - 1} T${x + 6} ${y + 12}`}
          stroke={color}
          strokeWidth={2.8}
          strokeLinecap="round"
          fill="none"
        />
      );
    }
    case 'mint': {
      const x = rim.left + 5;
      const y = rim.y - 1;
      return (
        <G>
          <Path d={`M${x} ${y} Q${x - 10} ${y - 6} ${x - 12} ${y - 16} Q${x - 2} ${y - 12} ${x} ${y} Z`} fill="#3f9d4b" />
          <Path d={`M${x} ${y} Q${x + 2} ${y - 11} ${x + 9} ${y - 18} Q${x + 10} ${y - 7} ${x} ${y} Z`} fill="#56b85f" />
        </G>
      );
    }
    case 'cherry': {
      const x = centre + 5;
      const y = box.y1 + 5;
      return (
        <G>
          <Path d={`M${x} ${y - 3} Q${x + 3} ${y - 14} ${x + 12} ${y - 20}`} stroke="#6b3d1f" strokeWidth={1.2} fill="none" />
          <Circle cx={x} cy={y} r={4.5} fill="#c1121f" />
          <Circle cx={x - 1.5} cy={y - 1.5} r={1.2} fill="#ffffff" opacity={0.6} />
        </G>
      );
    }
    case 'lychee': {
      const x = centre - 5;
      const y = box.y1 + 6;
      return (
        <G>
          <Circle cx={x} cy={y} r={5} fill="#f7f1e6" opacity={0.95} />
          <Circle cx={x} cy={y} r={5} fill="none" stroke="#dccdb0" strokeWidth={0.8} strokeDasharray="1.2 1.2" />
        </G>
      );
    }
    default:
      return null;
  }
}

/**
 * Illustration of a finished drink, drawn from the whole recipe: the glass
 * from the glassware text, a liquid color blended from every spec line by
 * volume, bubbles if anything is sparkling, ice if it's served over ice, and
 * the garnishes the recipe calls for.
 */
export default function DrinkArt({ recipe, height, style }) {
  // Fill the parent's width: measure it, then draw at that exact size.
  const [width, setWidth] = useState(0);
  return (
    <View style={[{ height }, style]} onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}>
      {width > 0 && <DrinkSvg recipe={recipe} width={width} height={height} />}
    </View>
  );
}

function DrinkSvg({ recipe, width, height }) {
  const look = useMemo(() => describeDrink(recipe), [recipe]);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const glass = GLASSES[look.glass];
  const { box } = glass;

  const { bubbles, cubes } = useMemo(() => {
    const rand = seededRandom(recipe.id + recipe.name);
    const w = box.x2 - box.x1;
    const h = box.y2 - box.y1;
    const bubbleList = look.sparkling
      ? Array.from({ length: 14 }, () => ({
          cx: box.x1 + 3 + rand() * (w - 6),
          cy: box.y1 + 3 + rand() * (h - 5),
          r: 0.6 + rand() * 1.1,
        }))
      : [];
    const size = Math.min(14, w * 0.32);
    const count = h > 45 ? 4 : 3;
    const cubeList = look.ice
      ? Array.from({ length: count }, (_, i) => ({
          // Two columns of cubes, jittered within each half of the glass.
          x: box.x1 + 3 + (i % 2) * (w / 2 - 2) + rand() * Math.max(0, w / 2 - size - 4),
          y: box.y1 + 1 + Math.floor(i / 2) * size * 0.9 + rand() * 3,
          size,
          angle: -20 + rand() * 40,
        }))
      : [];
    return { bubbles: bubbleList, cubes: cubeList };
  }, [recipe, look, box]);

  // Fit the glass area (y -6..112, with headroom for rim garnishes) into
  // whatever aspect ratio the caller asks for.
  const vbY = -6;
  const vbH = 118;
  const vbW = Math.max(100, (vbH * width) / height);
  const vbX = 50 - vbW / 2;

  const ids = { bg: `bg${uid}`, liq: `liq${uid}`, clip: `clip${uid}`, glow: `glow${uid}` };

  return (
    <Svg width={width} height={height} viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}>
      <Defs>
        <LinearGradient id={ids.bg} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={mixColors(BACKDROP, look.liquidColor, 0.22)} />
          <Stop offset="1" stopColor={BACKDROP} />
        </LinearGradient>
        <RadialGradient id={ids.glow} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={look.liquidColor} stopOpacity="0.28" />
          <Stop offset="1" stopColor={look.liquidColor} stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id={ids.liq} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={mixColors(look.liquidColor, '#ffffff', 0.25)} stopOpacity={look.liquidOpacity} />
          <Stop offset="1" stopColor={mixColors(look.liquidColor, '#000000', 0.18)} stopOpacity={Math.min(1, look.liquidOpacity + 0.1)} />
        </LinearGradient>
        <ClipPath id={ids.clip}>
          <Path d={glass.liquid} />
        </ClipPath>
      </Defs>

      <Rect x={vbX} y={vbY} width={vbW} height={vbH} fill={`url(#${ids.bg})`} />
      <Circle cx={50} cy={62} r={50} fill={`url(#${ids.glow})`} />
      <Ellipse cx={50} cy={108} rx={26} ry={3} fill="#000000" opacity={0.35} />

      {/* Glass body */}
      <Path d={glass.outline} fill="#ffffff" fillOpacity={0.05} stroke="none" />

      {/* Liquid, with ice and bubbles clipped to it */}
      <Path d={glass.liquid} fill={`url(#${ids.liq})`} />
      <G clipPath={`url(#${ids.clip})`}>
        {cubes.map((c, i) => (
          <Rect
            key={`ice${i}`}
            x={c.x}
            y={c.y}
            width={c.size}
            height={c.size}
            rx={2}
            fill="#ffffff"
            fillOpacity={0.22}
            stroke="#ffffff"
            strokeOpacity={0.55}
            strokeWidth={0.8}
            transform={`rotate(${c.angle} ${c.x + c.size / 2} ${c.y + c.size / 2})`}
          />
        ))}
        {bubbles.map((b, i) => (
          <Circle key={`b${i}`} cx={b.cx} cy={b.cy} r={b.r} fill="#ffffff" fillOpacity={0.25} stroke="#ffffff" strokeOpacity={0.7} strokeWidth={0.4} />
        ))}
        <Line x1={box.x1} y1={box.y1 + 0.6} x2={box.x2} y2={box.y1 + 0.6} stroke="#ffffff" strokeOpacity={0.45} strokeWidth={1.2} />
      </G>

      {/* In-drink garnishes sit under the glass outline; rim ones on top */}
      {look.garnishes.filter((g) => g === 'cherry' || g === 'lychee').map((g) => (
        <Garnish key={g} kind={g} glass={glass} />
      ))}

      <Path d={glass.outline} fill="none" stroke={GLASS_STROKE} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      <Line x1={glass.rim.left + 5} y1={glass.rim.y + 6} x2={glass.rim.left + 6} y2={glass.rim.y + 16} stroke="#ffffff" strokeOpacity={0.35} strokeWidth={1.5} strokeLinecap="round" />
      {glass.stem && (
        <G>
          <Line x1={50} y1={glass.stem[0]} x2={50} y2={glass.stem[1]} stroke={GLASS_STROKE} strokeWidth={1.6} />
          <Ellipse cx={50} cy={glass.stem[1] + 1} rx={glass.baseRx} ry={2.5} fill="#ffffff" fillOpacity={0.08} stroke={GLASS_STROKE} strokeWidth={1.4} />
        </G>
      )}

      {look.garnishes.filter((g) => g !== 'cherry' && g !== 'lychee').map((g) => (
        <Garnish key={g} kind={g} glass={glass} />
      ))}
    </Svg>
  );
}
