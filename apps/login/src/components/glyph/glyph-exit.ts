"use client";

/**
 * Lets login forms play the stele's exit scramble before they navigate away.
 * The stele registers its animation; forms await `playGlyphExit()` just before
 * following a server-action redirect. With no stele mounted it resolves at once.
 */
type ExitFn = () => Promise<void>;

let exitFn: ExitFn | null = null;

export function registerGlyphExit(fn: ExitFn | null) {
  exitFn = fn;
}

export async function playGlyphExit(): Promise<void> {
  if (!exitFn) return;
  try {
    await exitFn();
  } catch {
    /* animation problems must never block sign-in */
  }
}

/** True when a server-action response is about to navigate. */
export function isRedirectResponse(res: unknown): boolean {
  return !!res && typeof res === "object" && "redirect" in res && !!(res as { redirect?: string }).redirect;
}
