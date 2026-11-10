"use client";

/**
 * The mockup's "plinth" controls: underline fields with a glyph word beside the
 * label, the square outlined Enter button, quiet text links and the status line.
 */
import { forwardRef, InputHTMLAttributes, ReactNode, useEffect, useRef, useState } from "react";
import { RANDOM_POOL, toGlyphText } from "./glyph-alphabet";
import { GlyphWord } from "./glyph-stele";
import ui from "./glyph-ui.module.css";

/** Page frame for a Glyph step: title in the spaced heading style, then the content. */
export function GlyphPlinth({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <section className={`${ui.tokens} ${ui.plinth}`}>
      {title && <h1 className={ui.title}>{title}</h1>}
      {children}
    </section>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  suffix?: string;
  /** when set, the value is echoed in glyph letters under the field */
  echo?: string;
};

const ECHO_MAX = 24;

/**
 * Glyph echo of what is being typed: changed letters scramble briefly, then settle.
 * Decorative only (the input itself carries the value for assistive tech).
 */
export function GlyphEcho({ text }: { text: string }) {
  const target = toGlyphText(text, ECHO_MAX);
  const [shown, setShown] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    const before = prev.current;
    prev.current = target;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(target);
      return;
    }
    let ticks = 0;
    const id = window.setInterval(() => {
      ticks += 1;
      const settle = ticks > 6;
      setShown(
        target
          .split("")
          .map((ch, i) => (settle || ch === before[i] ? ch : RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)]))
          .join(""),
      );
      if (settle) window.clearInterval(id);
    }, 45);
    return () => window.clearInterval(id);
  }, [target]);

  return (
    <div className={ui.echo} aria-hidden="true">
      {shown && <GlyphWord word={shown} height={13} />}
    </div>
  );
}

export const GlyphField = forwardRef<HTMLInputElement, FieldProps>(function GlyphField(
  { id, label, suffix, echo, ...input },
  ref,
) {
  return (
    <div className={ui.field}>
      <label htmlFor={id} className={ui.label}>
        <span>{label}</span>
        <GlyphWord word={toGlyphText(label)} height={9} />
      </label>
      <div className={ui.inputRow}>
        <input id={id} ref={ref} className={ui.input} {...input} />
        {suffix && <span className={ui.suffix}>@{suffix}</span>}
      </div>
      {echo !== undefined && <GlyphEcho text={echo} />}
    </div>
  );
});

type ButtonProps = {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
  "data-testid"?: string;
};

export function GlyphButton({ label, loading, disabled, type = "submit", onClick, ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={ui.button}
      disabled={disabled}
      onClick={onClick}
      data-testid={rest["data-testid"]}
      data-glyph-scroll-target
    >
      {loading && <span className={ui.spinner} aria-hidden="true" />}
      <span>{label}</span>
      <GlyphWord word={toGlyphText(label)} height={10} />
    </button>
  );
}

export function GlyphLink({
  children,
  onClick,
  disabled,
  ...rest
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  "data-testid"?: string;
}) {
  return (
    <button type="button" className={ui.link} onClick={onClick} disabled={disabled} data-testid={rest["data-testid"]}>
      {children}
    </button>
  );
}

export function GlyphStatus({ error, info }: { error?: string; info?: string }) {
  if (error) {
    return (
      <p className={ui.statusError} role="alert" data-testid="error">
        {error}
      </p>
    );
  }
  return (
    <p className={ui.status} role="status" aria-live="polite">
      {info}
    </p>
  );
}

/** Thin rule with a small glyph mark, between single sign-on and the name field. */
export function GlyphDivider() {
  return (
    <div className={ui.divider} aria-hidden="true">
      <GlyphWord word="-" height={8} />
    </div>
  );
}

export function GlyphCredit() {
  // phones show the short form: "GLYPH by Leonhard Lass / Depart" (both links kept)
  return (
    <p className={ui.credit}>
      <span className={ui.creditLong}>Login after </span>
      <a href="https://www.depart.at/portfolio/glyph/" target="_blank" rel="noopener noreferrer">
        <em>Glyph</em>
      </a>
      <span className={ui.creditLong}> (2011), a projection sculpture</span> by{" "}
      <a href="https://nodeforum.org/people/leonhard-lass/" target="_blank" rel="noopener noreferrer">
        Leonhard Lass
      </a>{" "}
      / Depart
    </p>
  );
}
