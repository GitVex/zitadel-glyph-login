/**
 * Glyph stele alphabet, after "Glyph" (2011) by Leonhard Lass / Depart.
 *
 * Every letter lives on a 10×10 cell: a rounded outer contour with one gap or
 * open side, an inner spiral, hook or meander, and on some letters a small solid
 * square ["sq", x, y]. Strokes are flat x,y point lists; a stroke that ends where
 * it starts is drawn closed.
 */
type Stroke = number[];
type Square = ["sq", number, number];

const G: Record<string, Array<Stroke | Square>> = {
  A: [[3.3, 10, 0, 10, 0, 0, 10, 0, 10, 10, 6.7, 10, 6.7, 3.3, 3.3, 3.3, 3.3, 6.7]],
  B: [[10, 4, 10, 0, 0, 0, 0, 10, 10, 10, 10, 6.7, 3.3, 6.7], [3.3, 3.3, 6.7, 3.3], ["sq", 7.4, 2.4]],
  C: [[10, 0, 0, 0, 0, 10, 10, 10, 10, 3.3, 3.3, 3.3, 3.3, 6.7, 6.7, 6.7]],
  D: [[0, 6, 0, 0, 10, 0, 10, 10, 3.3, 10, 3.3, 3.3, 6.7, 3.3, 6.7, 6.7], ["sq", 0, 8.2]],
  E: [[10, 3.3, 10, 0, 0, 0, 0, 10, 10, 10, 10, 6.7], [3.3, 3.3, 3.3, 6.7, 6.7, 6.7]],
  F: [[0, 10, 0, 0, 10, 0], [3.3, 10, 3.3, 3.3, 6.7, 3.3, 6.7, 6.7, 10, 6.7, 10, 10]],
  G: [[6.7, 0, 0, 0, 0, 10, 10, 10, 10, 3.3, 3.3, 3.3, 3.3, 6.7], ["sq", 8.2, 0]],
  H: [[0, 0, 0, 10, 3.3, 10], [10, 10, 10, 0, 3.3, 0, 3.3, 6.7, 6.7, 6.7]],
  I: [[0, 3.3, 0, 0, 10, 0, 10, 10, 0, 10, 0, 6.7], [3.3, 3.3, 6.7, 3.3, 6.7, 6.7]],
  J: [[0, 0, 10, 0, 10, 10, 0, 10, 0, 3.3, 6.7, 3.3, 6.7, 6.7, 3.3, 6.7]],
  K: [[0, 0, 0, 10, 3.3, 10], [10, 0, 3.3, 0, 3.3, 6.7], [6.7, 3.3, 10, 3.3, 10, 10, 6.7, 10, 6.7, 6.7]],
  L: [[0, 0, 0, 10, 10, 10, 10, 6.7], [3.3, 0, 10, 0, 10, 3.3], [3.3, 3.3, 3.3, 6.7, 6.7, 6.7]],
  M: [[0, 10, 0, 0, 10, 0, 10, 10], [3.3, 3.3, 6.7, 3.3, 6.7, 10], ["sq", 2.4, 7.6]],
  N: [[0, 10, 0, 0, 10, 0, 10, 6.7], [3.3, 3.3, 3.3, 10, 10, 10], [6.7, 3.3, 6.7, 6.7]],
  O: [[0, 0, 10, 0, 10, 10, 0, 10, 0, 0], ["sq", 4.1, 4.1]],
  P: [[3.3, 10, 0, 10, 0, 0, 10, 0, 10, 6.7, 3.3, 6.7, 3.3, 3.3], ["sq", 8.2, 8.2]],
  Q: [[10, 6.7, 10, 0, 0, 0, 0, 10, 6.7, 10], [3.3, 3.3, 6.7, 3.3], [5, 3.3, 5, 7]],
  R: [[0, 10, 0, 0, 10, 0, 10, 3.3], [3.3, 3.3, 3.3, 6.7, 10, 6.7], [6.7, 10, 10, 10]],
  S: [[6.7, 0, 0, 0, 0, 3.3], [10, 0, 10, 10, 0, 10, 0, 6.7, 6.7, 6.7, 6.7, 3.3, 3.3, 3.3]],
  T: [[0, 3.3, 0, 0, 10, 0, 10, 3.3], [3.3, 10, 3.3, 3.3, 6.7, 3.3, 6.7, 10], ["sq", 0, 8.2]],
  U: [[0, 0, 0, 10, 10, 10, 10, 0, 6.7, 0, 6.7, 6.7, 3.3, 6.7, 3.3, 3.3]],
  V: [[0, 0, 0, 10, 6.7, 10], [10, 10, 10, 0, 3.3, 0, 3.3, 6.7], ["sq", 5.8, 4.1]],
  W: [[3.3, 0, 0, 0, 0, 10, 10, 10, 10, 0], [6.7, 0, 6.7, 6.7, 3.3, 6.7, 3.3, 3.3]],
  X: [[0, 10, 0, 0, 6.7, 0, 6.7, 3.3, 3.3, 3.3], [10, 0, 10, 10, 3.3, 10, 3.3, 6.7, 6.7, 6.7]],
  Y: [[0, 0, 0, 10, 10, 10], [3.3, 0, 10, 0, 10, 6.7, 3.3, 6.7], ["sq", 4.1, 2.4]],
  Z: [[0, 0, 10, 0, 10, 6.7], [0, 3.3, 0, 10, 10, 10], [6.7, 3.3, 3.3, 3.3, 3.3, 6.7]],
  "-": [[1.5, 5, 6, 5], ["sq", 7.4, 4.1]],
  " ": [],
};

/** polyline -> path with rounded corners */
export function roundedPath(flat: number[], r = 1.3): string {
  let p: Array<[number, number]> = [];
  for (let i = 0; i < flat.length; i += 2) p.push([flat[i], flat[i + 1]]);
  const closed = p.length > 2 && p[0][0] === p[p.length - 1][0] && p[0][1] === p[p.length - 1][1];
  if (closed) {
    p.pop();
    const m: [number, number] = [(p[0][0] + p[1][0]) / 2, (p[0][1] + p[1][1]) / 2];
    p = [m, ...p.slice(1), p[0], m];
  }
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 1; i < p.length - 1; i++) {
    const [a, b, c] = [p[i - 1], p[i], p[i + 1]];
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const b1 = [b[0] - ((b[0] - a[0]) / l1) * rr, b[1] - ((b[1] - a[1]) / l1) * rr];
    const b2 = [b[0] + ((c[0] - b[0]) / l2) * rr, b[1] + ((c[1] - b[1]) / l2) * rr];
    d += ` L${b1[0].toFixed(2)} ${b1[1].toFixed(2)} Q${b[0]} ${b[1]} ${b2[0].toFixed(2)} ${b2[1].toFixed(2)}`;
  }
  const e = p[p.length - 1];
  return d + ` L${e[0]} ${e[1]}` + (closed ? "Z" : "");
}

export type GlyphShape = { d: string; squares: Array<[number, number]> };

export const GLYPHS: Record<string, GlyphShape> = Object.fromEntries(
  Object.entries(G).map(([k, parts]) => [
    k,
    {
      d: parts
        .filter((s): s is Stroke => typeof s[0] === "number")
        .map((s) => roundedPath(s))
        .join(" "),
      squares: parts.filter((s): s is Square => s[0] === "sq").map((s) => [s[1], s[2]] as [number, number]),
    },
  ]),
);

export const glyphFor = (ch: string): GlyphShape => GLYPHS[ch.toUpperCase()] ?? GLYPHS["-"];

export const RANDOM_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/* A small rule set recombines fragments into ever-new sentences. */
const NOUN = [
  "THE GATE", "A SEPARATION", "A UNION", "A DIVIDE", "A JOINT", "THE STONE", "THE FOLD",
  "AN UNBROKEN GAP", "THE MONASTERY", "THE CYCLE", "NOTHING", "THE EYE", "THE ROCKS",
];
const VERB = ["IS", "LOCKS", "OPENS", "HOLDS", "FOLDS", "BECOMES", "GUARDS", "RETURNS TO"];
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

function sentence(): string {
  const roll = Math.random();
  if (roll < 0.34) return `${pick(NOUN)} THAT IS ${pick(NOUN)} THAT IS ${pick(NOUN)}`;
  if (roll < 0.6) return `${pick(NOUN)} ${pick(VERB)} ${pick(NOUN)}`;
  if (roll < 0.8) return `NOTHING IS EVER SO ${pick(["STILL", "WHOLE", "CLOSED", "OPEN", "SILENT"])}`;
  return `ALL ${pick(["LOCKS", "GATES", "FOLDS", "STONES"])} ${pick(["TURN", "ROTATE", "RETURN", "DISSOLVE"])}`;
}

export function makeText(length: number): string {
  let t = "";
  while (t.length < length) t += (t ? "--" : "") + sentence();
  return t.replace(/ /g, "-").slice(0, length);
}

/**
 * Turn any (translated) label into text the glyph alphabet can draw:
 * uppercase, German umlauts folded, everything else outside A–Z becomes a dash.
 */
export function toGlyphText(label: string, max = 12): string {
  return label
    .toUpperCase()
    .replace(/Ä/g, "A")
    .replace(/Ö/g, "O")
    .replace(/Ü/g, "U")
    .replace(/ß/g, "SS")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Z]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);
}
