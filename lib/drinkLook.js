// drinkLook.js — reads a whole recipe (every spec line, the method, and the
// glassware text) and works out what the finished drink looks like: the glass,
// the blended liquid color, bubbles, ice, and garnishes. DrinkArt renders it.
//
// Pure JS with no React imports, so it can be tested with plain `node`.

// How each ingredient affects the color. `strength` is tint power per ounce:
// a spirit like vodka is clear (0), while a little blue curaçao or bitters
// dyes the whole drink. Order matters — the first match wins, so more specific
// patterns (lemon-lime soda, orange bitters) come before general ones.
const INGREDIENT_LOOKS = [
  { match: /cura[cç]ao/i, color: '#1d8fe0', strength: 5 },
  { match: /bitters/i, color: '#a3441a', strength: 12 },
  { match: /cranberry/i, color: '#c8274f', strength: 2.2 },
  { match: /grapefruit/i, color: '#f4a39a', strength: 1 },
  { match: /lychee/i, color: '#f1e9d6', strength: 0.5 },
  { match: /st-?germain|elderflower/i, color: '#f0dc8a', strength: 0.9 },
  { match: /lemon-lime soda|sprite|7.?up/i, color: '#eef6f0', strength: 0, sparkling: true },
  { match: /club soda|soda water|seltzer|tonic/i, color: '#eef4f6', strength: 0, sparkling: true },
  { match: /sparkling|prosecco|champagne|mionetto/i, color: '#f2e2a6', strength: 0.6, sparkling: true },
  { match: /lemonade/i, color: '#f6eb9c', strength: 0.35 },
  { match: /lime juice/i, color: '#d6e6a0', strength: 0.5 },
  { match: /lemon juice/i, color: '#f3eeb0', strength: 0.5 },
  { match: /cointreau|triple sec/i, color: '#f4f1e6', strength: 0.1 },
  { match: /syrup/i, color: '#f7f2e0', strength: 0.1 },
  { match: /vodka|gin|white rum|tito/i, color: '#eef2f4', strength: 0 },
];

// Fallback when a recipe only lists cabinet bottle ids with no readable spec.
const BOTTLE_SPEC_FALLBACK = {
  mionetto: '3 oz Mionetto Sparkling',
  titos: "1.5 oz Tito's Vodka",
  blue_curacao: '0.75 oz Blue Curaçao',
  st_germain: '0.75 oz St-Germain',
  cointreau: '0.5 oz Cointreau',
  orange_bitters: '2 dashes Orange Bitters',
  lychee_juice: '1.5 oz Lychee Juice',
};

const CLEAR_LIQUID = '#e6edf1';
const TOP_UP_OZ = 2;
const OZ_PER_DASH = 0.03;

// Glass keywords, matched against the glassware text. When several appear
// ("Chilled martini or coupe glass"), the one mentioned first wins.
const GLASS_KEYWORDS = [
  { glass: 'hurricane', match: /hurricane/i },
  { glass: 'flute', match: /flute/i },
  { glass: 'martini', match: /martini/i },
  { glass: 'coupe', match: /coupe/i },
  { glass: 'wine', match: /wine glass/i },
  { glass: 'rocks', match: /rocks|old fashioned|lowball/i },
  { glass: 'highball', match: /highball|collins|tall glass/i },
];

const GARNISHES = [
  { garnish: 'limeWheel', match: /lime (wheel|wedge|slice)/i },
  { garnish: 'lemonWheel', match: /lemon (wheel|wedge|slice)/i },
  { garnish: 'orangePeel', match: /orange (peel|twist)/i },
  { garnish: 'lemonTwist', match: /lemon (peel|twist)/i },
  { garnish: 'mint', match: /mint/i },
  { garnish: 'cherry', match: /cherry/i },
  { garnish: 'lychee', match: /lychee/i },
];

// Ice in the finished glass. Checked clause by clause, skipping shaking steps,
// so "shake with ice, then strain into a coupe" doesn't count.
const ICE_IN_GLASS = /(over|with|filled with) (fresh |crushed |cracked )?(ice|cubes)|crushed ice|cracked ice/i;
const SHAKING = /shake|shaker|mixing glass/i;

function servedOverIce(...texts) {
  return texts.some((text) =>
    text.split(/[.;]|,? then /i).some((clause) => !SHAKING.test(clause) && ICE_IN_GLASS.test(clause))
  );
}

export function parseAmount(line) {
  if (/^\s*top (with|off)/i.test(line)) return TOP_UP_OZ;
  const dash = line.match(/(\d+(?:\.\d+)?)\s*dash/i);
  if (dash) return parseFloat(dash[1]) * OZ_PER_DASH;
  const oz = line.match(/(\d+(?:\.\d+)?)\s*oz/i);
  if (oz) return parseFloat(oz[1]);
  return 0;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(rgb) {
  return '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
}

export function mixColors(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(ca.map((v, i) => v + (cb[i] - v) * t));
}

function pickGlass(glassware) {
  let best = null;
  for (const { glass, match } of GLASS_KEYWORDS) {
    const m = glassware.match(match);
    if (m && (best === null || m.index < best.index)) best = { glass, index: m.index };
  }
  return best ? best.glass : 'rocks';
}

export function describeDrink(recipe) {
  const specLines = recipe.spec && recipe.spec.length
    ? recipe.spec
    : (recipe.ingredients || []).map((id) => BOTTLE_SPEC_FALLBACK[id]).filter(Boolean);

  let totalOz = 0;
  let tintOz = 0;
  const tint = [0, 0, 0];
  let sparkling = false;

  for (const line of specLines) {
    const look = INGREDIENT_LOOKS.find((l) => l.match.test(line));
    if (!look) continue;
    const oz = parseAmount(line);
    totalOz += oz;
    if (look.sparkling) sparkling = true;
    const weight = oz * look.strength;
    if (weight > 0) {
      hexToRgb(look.color).forEach((c, i) => { tint[i] += c * weight; });
      tintOz += weight;
    }
  }

  // How strongly the colored ingredients show through the clear ones.
  const coverage = totalOz > 0 ? Math.min(1, (tintOz / totalOz) * 1.3) : 0;
  const tintColor = tintOz > 0 ? rgbToHex(tint.map((c) => c / tintOz)) : CLEAR_LIQUID;
  const liquidColor = mixColors(CLEAR_LIQUID, tintColor, coverage);

  const glassware = recipe.glassware || '';
  const method = recipe.method || '';
  const garnishes = GARNISHES.filter(({ match }) => match.test(glassware)).map((g) => g.garnish);

  return {
    glass: pickGlass(glassware),
    liquidColor,
    liquidOpacity: 0.45 + 0.45 * coverage,
    sparkling,
    ice: servedOverIce(method, glassware),
    garnishes: garnishes.slice(0, 2),
  };
}

// Small deterministic PRNG so each recipe's bubbles/ice sit in the same place
// on every render but differ between recipes.
export function seededRandom(seedText) {
  let h = 2166136261;
  for (const ch of String(seedText)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
