"use client";

/**
 * The Glyph stele: a slowly turning emblem above a 9×16 column of maze glyphs.
 * Columns scramble left to right (entry, a slow timed cycle, and the exit before
 * a redirect); scrambling glyphs dim and shift like a hologram; the pointer
 * leaves a scrambling wake. Drawn imperatively into one SVG for performance.
 * After "Glyph" (2011) by Leonhard Lass / Depart.
 */
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { RANDOM_POOL, glyphFor, makeText } from "./glyph-alphabet";
import { registerGlyphExit } from "./glyph-exit";
import styles from "./glyph-stele.module.css";

const NS = "http://www.w3.org/2000/svg";
const COLS = 9;
const ROWS = 16;
const S = 18;
const GAP = 5;
const PITCH_Y = 29;
const Y0 = 142;
const RITUAL = { perColumn: 1600, stagger: 420 };
const MEDIUM = { perColumn: 700, stagger: 160 };

type Cell = {
  r: number;
  c: number;
  g: SVGGElement;
  x: number;
  y: number;
  shown: string | null;
  target: string;
  start: number;
  end: number;
  next: number;
  heat: number;
  op: number;
  dx: number;
  flip: number;
};

function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>,
  parent?: Element,
): SVGElementTagNameMap[K] {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(n);
  return n;
}

export function drawGlyph(ch: string, parent: Element, x: number, y: number, s: number) {
  const g = el("g", { transform: `translate(${x} ${y}) scale(${s / 10})` }, parent);
  const shape = glyphFor(ch);
  if (shape.d) el("path", { class: "mz", d: shape.d }, g);
  for (const [sx, sy] of shape.squares) el("rect", { class: "solid", x: sx, y: sy, width: 1.8, height: 1.8, rx: 0.4 }, g);
  return g;
}

function drawEmblem(svg: SVGSVGElement): SVGGElement {
  const emblem = el("g", {}, svg);
  const chain = el("g", { class: "spin-b" }, emblem);
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const cx = (Math.cos(a) * 104).toFixed(2);
    const cy = (Math.sin(a) * 104).toFixed(2);
    el("ellipse", { class: "ln", cx, cy, rx: 3.2, ry: 1.9, transform: `rotate(${((a * 180) / Math.PI + 90).toFixed(2)} ${cx} ${cy})` }, chain);
  }
  el("circle", { class: "ln", r: 96 }, emblem);
  const ticks = el("g", { class: "spin-a" }, emblem);
  el("circle", { class: "ln", r: 88 }, ticks);
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    const r1 = i % 8 === 0 ? 62 : 70;
    el("line", { class: "ln", x1: Math.cos(a) * r1, y1: Math.sin(a) * r1, x2: Math.cos(a) * 84, y2: Math.sin(a) * 84 }, ticks);
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
    const cx = Math.cos(a) * 75;
    const cy = Math.sin(a) * 75;
    const pts = [0, 1, 2]
      .map((k) => {
        const b = a + Math.PI + (k * 2 * Math.PI) / 3;
        return `${(cx + Math.cos(b) * 4).toFixed(2)},${(cy + Math.sin(b) * 4).toFixed(2)}`;
      })
      .join(" ");
    el("polygon", { class: "tri", points: pts }, ticks);
  }
  el("circle", { class: "ln", r: 58 }, emblem);
  const core = el("g", { class: "core" }, emblem);
  el("circle", { class: "ln", r: 50, "stroke-dasharray": "2 4" }, core);
  el("circle", { class: "ring", r: 40 }, core);
  el("circle", { class: "ln", r: 30 }, core);
  el("circle", { r: 4, class: "solid" }, core);
  el("path", { class: "ln", d: "M -38 128 A 38 22 0 0 1 38 128" }, svg);
  el("path", { class: "ln", d: "M -14 118 L 0 126 L 14 118" }, svg);
  el("path", { class: "ln", d: "M -10 113 L 0 119 L 10 113" }, svg);
  return core;
}

export function GlyphStele() {
  const svgRef = useRef<SVGSVGElement>(null);
  const reenterRef = useRef<(() => void) | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const core = drawEmblem(svg);
    const x0 = -(COLS * (S + GAP) - GAP) / 2;
    const column = el("g", {}, svg);
    const cells: Cell[] = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        cells.push({
          r, c, g: el("g", { class: "cell" }, column),
          x: x0 + c * (S + GAP), y: Y0 + r * PITCH_Y,
          shown: null, target: " ", start: 0, end: 0, next: 0, heat: 0, op: 1, dx: 0, flip: 1,
        });

    const randGlyph = () => RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)];
    const BLANK = " ".repeat(COLS * ROWS);
    const wait = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

    const show = (cell: Cell, ch: string) => {
      if (cell.shown === ch) return;
      while (cell.g.firstChild) cell.g.removeChild(cell.g.firstChild);
      drawGlyph(ch, cell.g, cell.x, cell.y, S);
      cell.shown = ch;
    };
    const holo = (cell: Cell, op: number, dx: number) => {
      if (reduce) { op = 1; dx = 0; }
      op = Math.round(op * 100) / 100;
      dx = Math.round(dx * 10) / 10;
      if (op === cell.op && dx === cell.dx) return;
      const settled = op === 1 && dx === 0;
      cell.g.classList.toggle("settling", settled);
      cell.g.classList.toggle("holo", !settled);
      cell.g.style.opacity = String(op);
      cell.g.style.transform = dx ? `translateX(${dx}px)` : "";
      cell.op = op;
      cell.dx = dx;
    };
    const flicker = (cell: Cell, dim: number, shift: number) => {
      show(cell, randGlyph());
      cell.flip = -cell.flip;
      holo(cell, dim, cell.flip * shift * (0.6 + Math.random() * 0.4));
    };

    let running = false;
    let last = 0;
    let raf = 0;
    let disposed = false;
    const frame = (t: number) => {
      if (disposed) return;
      const dt = Math.min(64, t - last);
      last = t;
      let active = false;
      for (const cell of cells) {
        if (t < cell.end) {
          active = true;
          if (t < cell.start) { if (cell.shown !== " ") holo(cell, 0.7, 0); continue; }
          if (t >= cell.next) {
            let dim = 0.22 + Math.random() * 0.33;
            if (cell.target === " ") dim *= 1 - (t - cell.start) / (cell.end - cell.start);
            flicker(cell, dim, 1.5);
            cell.next = t + 60 + Math.random() * 30;
          }
          continue;
        }
        if (cell.heat > 0) {
          cell.heat = Math.max(0, cell.heat - dt / 2000);
          if (cell.heat > 0.06 && cell.target !== " ") {
            active = true;
            if (t >= cell.next) { flicker(cell, 1 - 0.65 * cell.heat, 1.5 * cell.heat); cell.next = t + 55 + (1 - cell.heat) * 280; }
            continue;
          }
          cell.heat = 0;
        }
        show(cell, cell.target);
        holo(cell, 1, 0);
      }
      if (active) raf = requestAnimationFrame(frame);
      else running = false;
    };
    const kick = () => {
      if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    };

    const scramble = (text: string, speed: { perColumn: number; stagger: number }) => {
      if (reduce) {
        cells.forEach((cell) => { cell.target = text[cell.r * COLS + cell.c]; cell.heat = 0; show(cell, cell.target); });
        return Promise.resolve();
      }
      const now = performance.now();
      for (const cell of cells) {
        cell.target = text[cell.r * COLS + cell.c];
        cell.start = now + cell.c * speed.stagger + Math.random() * 80;
        cell.end = cell.start + speed.perColumn * (0.35 + (0.65 * cell.r) / (ROWS - 1));
        cell.next = cell.start;
      }
      kick();
      return wait((COLS - 1) * speed.stagger + speed.perColumn + 120);
    };

    let state: "gate" | "exit" = "gate";
    let busy = true;
    cells.forEach((cell) => show(cell, " "));
    scramble(makeText(COLS * ROWS), MEDIUM).then(() => { busy = false; });

    const timer = reduce
      ? 0
      : window.setInterval(async () => {
          if (state !== "gate" || busy || document.hidden) return;
          busy = true;
          await scramble(makeText(COLS * ROWS), RITUAL);
          busy = false;
        }, 12000);

    const R = 2.2;
    const onMove = (e: PointerEvent) => {
      if (reduce || state !== "gate") return;
      const m = svg.getScreenCTM();
      if (!m) return;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      let hit = false;
      for (const cell of cells) {
        const d = Math.hypot(p.x - (cell.x + S / 2), p.y - (cell.y + S / 2)) / (S + GAP);
        if (d < R) { cell.heat = Math.min(1, cell.heat + 0.5 * (1 - d / R) ** 2); hit = true; }
      }
      if (hit) kick();
    };
    svg.addEventListener("pointermove", onMove);

    let fallback = 0;
    reenterRef.current = () => {
      if (state !== "exit") return;
      window.clearTimeout(fallback);
      state = "gate";
      busy = true;
      scramble(makeText(COLS * ROWS), MEDIUM).then(() => { busy = false; });
    };

    registerGlyphExit(async () => {
      state = "exit";
      // if the redirect stays inside the login (next step), come back after a moment
      fallback = window.setTimeout(() => reenterRef.current?.(), 4500);
      core.classList.remove("pulse");
      void core.getBBox();
      core.classList.add("pulse");
      cells.forEach((cell) => { cell.heat = 0; });
      await scramble(BLANK, MEDIUM);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      if (timer) window.clearInterval(timer);
      svg.removeEventListener("pointermove", onMove);
      window.clearTimeout(fallback);
      registerGlyphExit(null);
      reenterRef.current = null;
    };
  }, []);

  // the layout stays mounted between login steps: scramble back in on each new step
  useEffect(() => {
    reenterRef.current?.();
  }, [pathname]);

  return (
    <div className={styles.stele}>
      <svg
        ref={svgRef}
        className={styles.motif}
        viewBox="-120 -118 240 718"
        role="img"
        aria-label="A circular emblem above a column of maze glyphs, after Glyph by Leonhard Lass"
      />
    </div>
  );
}

/** A short word set in the glyph alphabet, for labels and buttons. */
export function GlyphWord({ word, height = 10 }: { word: string; height?: number }) {
  const s = 10;
  const gap = 3;
  const w = word.length * (s + gap) - gap + 2;
  return (
    <svg viewBox={`-1 -1 ${w} ${s + 2}`} height={height} aria-hidden="true" className={styles.word}>
      {[...word].map((ch, i) => {
        const shape = glyphFor(ch);
        return (
          <g key={i} transform={`translate(${i * (s + gap)} 0)`}>
            {shape.d && <path className="mz" d={shape.d} />}
            {shape.squares.map(([x, y], j) => (
              <rect key={j} className="solid" x={x} y={y} width={1.8} height={1.8} rx={0.4} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
