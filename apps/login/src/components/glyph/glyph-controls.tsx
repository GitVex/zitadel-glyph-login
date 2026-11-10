"use client";

/**
 * The mockup's "plinth" controls: underline fields with a glyph word beside the
 * label, the square outlined Enter button, quiet text links and the status line.
 */
import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import { toGlyphText } from "./glyph-alphabet";
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
};

export const GlyphField = forwardRef<HTMLInputElement, FieldProps>(function GlyphField(
  { id, label, suffix, ...input },
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
  return (
    <p className={ui.credit}>
      Login after <em>Glyph</em> (2011), a projection sculpture by{" "}
      <a href="https://nodeforum.org/people/leonhard-lass/" target="_blank" rel="noopener noreferrer">
        Leonhard Lass
      </a>{" "}
      / Depart.{" "}
      <a href="https://www.depart.at/portfolio/glyph/" target="_blank" rel="noopener noreferrer">
        depart.at/portfolio/glyph
      </a>
    </p>
  );
}
