# Clean code

Working rules for this repo. They follow current Next.js App Router, React 19, TypeScript, and Tailwind CSS 4 practice. Prefer the smallest change that keeps the rule.

---

## Next.js 16

- **Default to Server Components.** Add `"use client"` only where the module uses state, effects, events, or browser APIs.
- **Keep client islands small.** A client parent cannot import a Server Component, but it _can_ render `children` that were created on the server. Pass server-rendered UI in as children instead of fetching it inside the client tree.
- **Type `metadata` with `Metadata`.** Export `export const metadata: Metadata = { … }` from `next`.
- **Wire `next/font` through Tailwind `@theme`.** Do not name the font CSS variable `--font-sans` — that collides with Tailwind’s own token. Use `--font-inter` on the font, then `--font-sans: var(--font-inter)` in CSS.
- **Mark first-screen images with `priority`.** That is the LCP image. Always pass a real `sizes` attribute when using `fill`.
- **Do not fetch your own Route Handlers from a Server Component unless the HTTP boundary is the point** (this storefront models a headless API). When you do, use an absolute URL and `cache: "no-store"` for request-specific catalogue queries.
- **Error UI must not print `error.message`.** Log it, show a generic line. Type the prop as `Error & { digest?: string }`. Provide `not-found.tsx` and a root `error.tsx`.
- **`useSearchParams()` belongs behind `<Suspense>`.**
- **Avoid barrel files** (`index.ts` that re-export everything). They break tree-shaking and tracing.

---

## React 19

- **No `forwardRef`.** Pass `ref` as a normal prop. Prefer `ComponentProps<"tag">` over `FooHTMLAttributes`.
- **`use client` is a bundle boundary, not a component type.** Everything it imports becomes client code. Push that boundary down to the button, not the page.
- **Lists need stable `key`s** (ids, not array indexes, unless the list is static placeholders).
- **Interactive elements need `type` on buttons** (`type="button"` unless submit).
- **Do not read `localStorage` during render.** Restore in an effect so the server HTML matches the first client render.

---

## TypeScript

- **`strict` stays on.** Do not add `any`. Use `unknown` and narrow.
- **Type-only imports use `import type`.**
- **Public component props get a named type**, not inline objects repeated across files.
- **Parse unknown input at the boundary** (forms, `localStorage`, `fetch` JSON). The UI should not see unvalidated data.
- **Prefer discriminated unions** (`{ status: "resolved", variant } | { status: "unavailable" }`) over `T | undefined` when the missing case has its own UI.

---

## Tailwind CSS 4

- **Utilities in the markup.** Do not add a CSS class for a one-off layout.
- **One `className` string, later utilities win.** If a wrapper must override padding (`pr-12` over `px-3`), put the override _after_ the caller’s classes, or do not pass conflicting padding in.
- **Theme tokens live in `@theme`.** Fonts, in particular, must be connected there or `font-sans` will ignore `next/font`.
- **Prefer `dvh` over `vh` / `min-h-screen`** for full-viewport layouts (mobile browser chrome).
- **Visible focus:** `focus-visible:outline-2 focus-visible:outline-offset-2` on controls we style ourselves.
- **Do not fight native chrome with padding.** Hide it (`appearance-none`) and draw a replacement we can position.
