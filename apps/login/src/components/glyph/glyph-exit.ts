"use client";

/**
 * Lets login forms drive the stele: play the exit scramble before navigating away,
 * glitch it on an error, and inscribe the entered login name into its top rows.
 * The stele registers its handlers; with no stele mounted every call resolves at once.
 */
type Handlers = {
  exit: () => Promise<void>;
  glitch: () => void;
  inscribe: (text: string) => Promise<void>;
};

let handlers: Handlers | null = null;

export function registerGlyphHandlers(h: Handlers | null) {
  handlers = h;
}

/** Scramble the whole column away, before leaving the login. */
export async function playGlyphExit(): Promise<void> {
  try {
    await handlers?.exit();
  } catch {
    /* animation problems must never block sign-in */
  }
}

/** Short red stutter across most of the glyphs, for a wrong name or password. */
export function playGlyphGlitch(): void {
  try {
    handlers?.glitch();
  } catch {
    /* ignore */
  }
}

/** Scramble the given text into the stele's top rows, where it stays. */
export async function playGlyphInscribe(text: string): Promise<void> {
  try {
    await handlers?.inscribe(text);
  } catch {
    /* ignore */
  }
}

/** True when a server-action response is about to navigate. */
export function isRedirectResponse(res: unknown): boolean {
  return !!res && typeof res === "object" && "redirect" in res && !!(res as { redirect?: string }).redirect;
}

/** True when a server-action response carries an error message. */
export function isErrorResponse(res: unknown): boolean {
  return !!res && typeof res === "object" && "error" in res && !!(res as { error?: string }).error;
}
