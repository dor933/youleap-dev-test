# Decisions

Notes on how this was built, what I chose, what I rejected, and why.

The short version: the requirements themselves are straightforward, but the fixture data has sharp
edges — variants carry no structured link to options, one product's option matrix is incomplete, and
another's variant titles contain a token that belongs to no option. Most of the decisions below exist
to handle that data honestly rather than to work around it.

---

## Key decisions

### Data fetching and routing

**The product list is a Server Component driven by `searchParams`.**
The alternatives were a client component fetching in `useEffect` (what the starter did) or a client
data library. Server rendering won for three reasons. Search, filters, and page number become
shareable, back-button-correct URLs for free. The grid arrives in the initial HTML, so there is no
loading flash and no client waterfall. And most importantly it makes an entire class of bug
unreachable: with no client-issued product requests, there is no response ordering to get wrong.

**I evaluated TanStack Query and chose not to add it.**
It is the right tool when a client owns paginated data — `useInfiniteQuery`, `keepPreviousData`,
request cancellation and caching would all have applied. But every problem it solves here is already
solved by the App Router: the server does the fetching, the URL is the cache key, and React
transitions handle supersession. Adding roughly 13 kB and a provider to a 26-item catalogue to
duplicate framework behaviour is the kind of thing the brief's "over-engineering is not a plus"
warns about. If the catalogue were client-owned and interactive at scale, I would add it.

**Numbered pagination rather than infinite scroll or a "Load more" button.**
I built "Load more" first and replaced it. Infinite scroll was rejected outright: it breaks
deep-linking, makes the footer unreachable, loses scroll position on back-navigation, and is hostile
to keyboard and screen-reader users — for three pages of products that is all cost and no benefit.
Numbered pages pair naturally with URL-driven state, render as real `<Link>` elements so they can be
opened in a new tab and get prefetched, and let a reviewer link straight to page 3.

**Filtering happens on the server, never on the client.**
`q`, `collection`, and `tag` are forwarded to `GET /api/products`. Filtering the twelve products
already on screen would be wrong — it would search one page instead of the catalogue, and would
silently disagree with the pagination count.

**The storefront talks to its own REST API over HTTP instead of importing the fixture.**
A Server Component *could* import `mock-data/products.json` directly and skip a network hop. I kept
the HTTP boundary because the premise is a headless Medusa backend on a different origin, and the
brief says to fetch from `GET /api/products`. Reaching around the API would make the code structurally
wrong for the architecture it is modelling.

**The request origin is derived from headers rather than an environment variable.**
Server-side `fetch` needs an absolute URL. Using `NEXT_PUBLIC_SITE_URL` would mean a clean clone
needs setup before it runs, which conflicts with the submission checklist. Reading `host` and
`x-forwarded-proto` off the incoming request works locally and behind a proxy with zero configuration.

**I added one new endpoint, `GET /api/facets`, to populate the filter dropdowns.**
The alternative was hardcoding the values. I did not, because the `tag` enum in `openapi.json` is
missing six tags the products actually carry (see Surprises) — hardcoding it would silently remove
six working filters from the UI. Deriving facets from the catalogue keeps the filters correct even
when the spec drifts. The derivation lives in `collectFacets` so a test can compare it against both
the fixture and the spec; the route handler only returns that result. Adding API routes is
explicitly permitted by the brief.

**The UI page number is translated to `offset` in `catalogueSearchParams`, never sent as `page`.**
`GET /api/products` paginates with `offset` (a skip count) and ignores an unsupported `page`
parameter. Page 3 of a 12-item page size is `offset=24`. `parsePage` also rejects `0`, negatives, and
`abc` so they cannot become `NaN` and produce a nonsense slice. Those helpers exist so the conversion
is unit-tested rather than only checked by clicking pagination links.

**Quick View reuses the product from the list response instead of calling `GET /api/products/:id`.**
Both endpoints serve the same fixture, so the list payload already contains images, description,
options and variants. Re-fetching would add 150–350 ms of artificial latency for identical data.
Against a real Medusa backend that returns trimmed list objects, I would fetch detail on open — the
modal is structured so that change would be local to one component.

### Variant resolution — the core problem

**Option selections are resolved to a variant by parsing `variant.title`.**
`ProductVariant` has no reference to `ProductOption`. The only join in the data is that
`variant.title` lists the selected option values in `product.options` order, separated by `" - "`
("Queen - Oatmeal"). I considered matching on `sku` instead, since `BD-Q-OAT` looks like a key, but
the abbreviations are not derivable from option values (`OAT`/`SLT`, `Q` for Queen, `1K` for 1kg,
`DK-GRY-01` for "Space Gray"), so SKU is displayed but never matched on.

**Matching compares only the leading title tokens.**
The obvious implementation — join the selected values and compare to the full title — fails on
`prod_14`, whose variants are titled `"EU 42 - Black"` while the product exposes only a Size option.
Comparing the first *n* tokens, where *n* is the number of options, tolerates trailing tokens that
map to nothing. Comparison is also case- and whitespace-insensitive.

**Selections are keyed by option id, not option title.**
Ids are guaranteed unique within a product; titles are not.

**`resolveVariant` returns a two-state discriminated union, not `ProductVariant | undefined`.**
`{ status: "resolved", variant } | { status: "unavailable" }` forces every caller to handle the
missing case explicitly instead of dereferencing `undefined`. I initially had a third `"incomplete"`
state for partial selections, and removed it: the modal always opens with a complete default
selection, so that branch was dead code.

**Unavailable combinations stay selectable and are explained, rather than disabled.**
`prod_20` has two options with two values each but only three variants — "King / Slate" does not
exist. Three approaches were viable: disable the invalid values, auto-correct the other option, or
allow the selection and explain. Disabling creates dead ends where two values each appear invalid
because of the other. Auto-correcting silently overrides a deliberate user action. Allowing the
selection and showing "This combination isn't available. Try a different option." keeps the user in
control and makes the state legible; the price area shows an em dash rather than a stale price.

**"Combination does not exist" and "exists but out of stock" are modelled as different states.**
Conflating them is the easy mistake. `prod_01` Navy Blue is a real variant with its own higher price
(₪319 against ₪299) and zero inventory: it shows its price, a clear "Out of stock" badge, and a
disabled Add to Cart. `prod_20` King/Slate is not a product at all and shows no price.

**The default selection seeds from the first in-stock variant.**
Defaulting to `variants[0]` would open some products directly on an out-of-stock variant, and
defaulting to nothing would open every product in the "unavailable" state. A test asserts that no
product in the catalogue opens unavailable, and that any product with stock opens on a stocked variant.

**I did not modify `mock-data/products.json`.**
Adding the missing `prod_20` variant would have made the symptom disappear in about thirty seconds.
Beyond being explicitly forbidden, it would be the wrong instinct: an incomplete variant matrix is
normal in real commerce, Medusa models it exactly this way, and a storefront never owns its
catalogue. Consuming imperfect upstream data defensively is the actual job.

### Money

**Amounts stay in integer minor units end to end and are only converted when formatted.**
Cart totals sum `unitAmount * quantity` as integers, so no floating-point error can accumulate across
lines. The API documents amounts in agorot, and `29900` becomes `₪299.00` exactly once, at the edge.

**Formatting uses `Intl.NumberFormat` with an explicit currency code, not a hardcoded symbol.**
The starter printed a bare number. `Price.currency_code` exists, so it is used; hardcoding `₪` would
break the moment a second currency appeared.

**The locale is `en-IL` rather than `he-IL`.**
`he-IL` emits directional control characters (`‏299.00 ‏₪`) which corrupt an LTR layout.
`en-IL` gives a clean `₪299.00` and still disambiguates foreign currencies as `US$99.00`.

**Prices are selected by currency code, not by taking `prices[0]`.**
`getVariantPrice` looks for the requested currency and falls back to the first entry.

**"Starting price" is the cheapest variant, not the first.**
The starter used `variants[0].prices[0]`. As it happens the first variant is the cheapest in all 26
products, so the bug is latent rather than visible — which is precisely why it needed fixing
deliberately instead of by observation. Cards show `From ₪299.00` when variants differ in price and a
plain `₪299.00` when they do not, which is more honest than a bare number.

### Modal and accessibility

**The modal is a native `<dialog>` opened with `showModal()`.**
The alternatives were a hand-rolled `div` with a focus trap, or a headless UI library. The platform
element provides the focus trap, Escape-to-close, `role="dialog"`, `aria-modal`, and background
inertness with no code and no dependency. The brief lists three close affordances, which signals that
modal quality is being assessed; getting them from the browser is more reliable than reimplementing
them.

**Every close path routes through `dialog.close()` rather than unmounting directly.**
This is the detail that makes focus restoration work. If the close button unmounted the dialog, focus
would fall to `<body>`; closing first lets the browser return focus to the Quick View button that
opened it, and the `close` event then drives the unmount.

**Body scroll lock is handled manually.**
It is the one thing `<dialog>` does not provide.

**The cart drawer reuses the same component through a `layout` prop.**
Rather than write a second dialog, `Modal` takes `layout="center" | "drawer"`. The drawer inherits
the focus trap, Escape handling, backdrop click and focus restoration already built and verified.

**The variant selector uses visually hidden radio inputs, not buttons with `aria-pressed`.**
Radio groups give arrow-key navigation, roving focus and correct screen-reader semantics natively.
Buttons would require reimplementing all of that. Input ids are namespaced with `useId()` so the same
product rendering in both a card and an open modal cannot collide.

**Price, stock and the unavailable message live in an `aria-live="polite"` region.**
Changing a variant is a visual-only update otherwise; the live region announces it.

### Cart

**State is React Context plus `useReducer`, not Zustand, Redux, or Jotai.**
The cart has one consumer tree, a handful of actions, and no cross-tab or async requirements. A
reducer in context covers it with no dependency, and — more usefully — the reducer is a pure function
that can be tested without React at all.

**Lines are keyed by variant id, never by product id.**
Adding Black headphones twice increments one line; adding Black and then White creates two lines.
Keying by product would silently merge distinct variants into one cart line, which is the classic
failure for this feature.

**Cart lines snapshot the variant rather than storing ids.**
Storing `{ productId, variantId, quantity }` would keep the cart normalised but would require
refetching the catalogue to render the drawer, and would break a persisted cart if a product
disappeared. Snapshotting title, thumbnail, price and inventory keeps the drawer renderable offline.
The tradeoff is staleness, noted below.

**Quantities clamp to the inventory captured at add time, and setting zero removes the line.**
This prevents a cart that cannot be fulfilled, and avoids zero-quantity ghost lines.

**The cart persists to `localStorage`, restored after mount rather than during render.**
Reading storage during render is the standard way to cause a hydration mismatch in Next, so state
starts empty — matching the server — and is hydrated in an effect. Checkout waits for that hydration
before it may say the cart is empty, so a refresh with a saved cart does not flash the empty state.
Persisted data is structurally validated on read and unrecognised lines are dropped, so a stale or
hand-edited cart degrades instead of crashing the drawer. Persistence is not required by the brief;
I included it because a cart that empties on refresh is a poor storefront experience, and it is about
fifteen lines.

### Checkout

**Validation uses `zod`, which was already a dependency.**
`zod` and `lucide-react` ship in `package.json` unused, which reads as an intentional hint. The schema
lives in `src/lib/checkout.ts`, separate from the component, which is what makes it unit-testable.
I considered `react-hook-form`; it would earn its place on a longer multi-step form, but for eight
fields it would be a dependency added to avoid roughly twenty lines of state.

**Address fields stay typed text, not cascading country → city → street selects.**
I considered driving city and street from the chosen country, the way some Israeli forms do. There
is no library that actually does this end to end: country lists are easy, city dumps are large and
incomplete, and streets are not an npm package — they come from a geocoding API (Google Places,
Mapbox, Nominatim) that needs a key, billing, or an external service a clean clone cannot assume.
A `<select>` of streets is also the wrong control: a city can have thousands of streets, and a street
is not an address without a house number. Production storefronts use typed fields plus autocomplete
when they have a maps provider. For a fake checkout that must run from `pnpm install && pnpm dev`,
country as a select and city/address as text is the standard pattern, not a shortcut.

**Phone is validated as a plausible number, not as a country-prefixed E.164 identity.**
The regex accepts an optional `+` and 7–20 digits with spaces, dashes, or parentheses. It does not
parse calling codes and is not tied to the shipping-country select: someone shipping to Israel can
enter a US number, which is a real situation (expat, work phone, travel). Tying the phone to the
shipping country would reject that on purpose.

Prefix-aware validation is only honest if the field *requires* international format (`+972…`, `+1…`)
and is checked with something like `libphonenumber-js`. A homemade prefix list still would not know
national lengths. This checkout never sends an SMS, so a shape check is enough; pulling in phone
metadata for a fake form is the kind of extra the brief warned against.

**The form sets `noValidate` so the schema is the single source of truth.**
Native HTML validation would fire first and produce messages that disagree with zod's, splitting the
rules across two systems.

**Validation runs on submit, then re-validates on change.**
Validating on every keystroke from the start scolds users mid-typing; validating only on submit gives
no feedback while fixing errors. Switching modes after the first submit gets both.

**Only the first issue per field is shown.**
Stacking three messages under one input is noise.

**On a failed submit, focus moves to the first invalid control**, and an error summary with
`role="alert"` reports the count. Each invalid input carries `aria-invalid` and an `aria-describedby`
pointing at its message.

**Submission is a plain `onSubmit` handler, not a Server Action or `useActionState`.**
A Server Action would be idiomatic React 19, but the cart lives in client state, so the action would
either need the cart passed through it or would validate only half the order. The brief explicitly
says no real backend is needed. A plain handler keeps the flow obvious.

**The order reference is generated inside the submit handler, not during render.**
`Math.random()` during render would produce a hydration mismatch.

**The cart is snapshotted into the confirmation before being cleared**, so the success screen can show
what was ordered.

**A shipping draft is saved to `localStorage` so a refresh does not wipe the form.**
This uses the same post-mount restore as the cart, because `defaultValue` cannot be filled from
storage during SSR without a hydration mismatch. The draft is shipping fields only and is cleared on
a successful order. Payment instruments are not collected here; if they were, `localStorage` would
be the wrong place. Sensitive pages (payment, saved cards, identity) should use a strict server
session — httpOnly cookies, short TTL, CSRF, no draft of PAN/CVV in the browser. That is future
work for a real checkout, not this mock.

### Structure and tooling

**Pure logic lives in `src/lib`, UI in `src/components`, derived types in `src/types`.**
Everything in `lib` is framework-free and directly testable. The brief's note that adding "extended
types" is fine reads as an acknowledgement that the supplied types are deliberately insufficient;
`src/types/cart.ts` and the derived types in `lib/variants.ts` are that extension.

**Vitest is the only dependency I added.**
Node's built-in `node:test` would have avoided it, but running TypeScript through it needs either the
experimental type-stripping flag or a transform step, and the path alias would need manual wiring.
Vitest reads the alias from one config file and runs TypeScript natively. Tests import
`describe`/`it`/`expect` explicitly rather than enabling globals, so no ESLint configuration changes
were needed.

**Tests cover the pure modules only — no component or end-to-end tests.**
For a one-day task, the highest-value tests are on the logic that is easy to get subtly wrong and
invisible when it breaks: variant resolution, cart mutation, money, and validation. Component tests
would need a DOM environment and testing-library; a Playwright suite would be disproportionate.

**The orphaned `/product/[id]` starter route was deleted rather than filled in.**
It rendered a placeholder heading, nothing linked to it, and a product detail page is not in the
requirements. Shipping a route that renders `Product prod_01` looks unfinished; building a full PDP
would be scope creep.

**The starter `ProductCard` was replaced rather than patched**, since four of its five problems were
structural (untyped props, an unwired handler, a wrong price rule, and a raw `<img>`).

**`clean-code.md` is the coding-standard source of truth; `AGENTS.md` and `CLAUDE.md` only point at it.**
A later developer will likely open this folder in Codex or Claude Code. Those tools auto-load
`AGENTS.md` / `CLAUDE.md`. Duplicating the rules in each file would drift. The thin pointers keep the
standard in one place (`clean-code.md`) while still being picked up at session start. Architecture
and product decisions stay in `DECISIONS.md`, not in the agent files.

---

## Tradeoffs — what I would do differently with more time

- **Cart inventory is a snapshot.** A line keeps the stock figure captured when it was added. In a
  real storefront I would revalidate against the API when the drawer opens and at checkout, and flag
  lines that are no longer purchasable.
- **`getCartTotal` assumes one currency.** It takes the currency from the first line, which is safe
  for this single-currency catalogue but would need grouping by currency otherwise.
- **No committed component or end-to-end suite.** The modal, cart, and checkout flows were walked
  in the browser before submission. Putting Playwright into `pnpm test` would be the first addition
  with more time.
- **No real screen-reader pass.** The semantics are correct by construction — native `<dialog>`, real
  radio groups, live regions, labelled controls — but I did not test with NVDA or VoiceOver.
- **No RTL or i18n support**, despite the catalogue being priced in shekels. The locale is a single
  constant, so it is a starting point rather than a solution.
- **Filters are single-select with no result counts.** Multi-select tags and facet counts would need
  API support the current endpoint does not offer.
- **The image gallery is minimal** — click-to-switch thumbnails, no keyboard arrow navigation, no
  zoom, no swipe on touch.
- **No animation.** Transitions on the modal and drawer would need a `prefers-reduced-motion` path,
  and I would rather ship none than ship an inaccessible one.
- **No toast system.** "Added to cart" is a live region inside the modal, which is sufficient but less
  visible than a global notification.
- **No address autocomplete or country-specific postal rules.** The next honest upgrade is a geocoder
  (not cascading selects), plus tighter postal validation per country — Israeli 7-digit codes, US ZIP
  5/5+4 — once a real shipping backend exists.
- **No E.164 phone parsing.** Phone stays a shape check, independent of shipping country. Requiring
  `+` and validating with `libphonenumber-js` is the right next step if the number is ever used to
  actually reach the customer.
- **No real payment step, and no strict session.** A production checkout would not keep payment or
  identity state in `localStorage`. Sensitive pages (payment, saved cards, account) would use a
  server session: httpOnly cookies, short TTL, CSRF. That is out of scope for this mock.
- **Error handling is per-route.** `/products` has an error boundary with retry; there is no global
  boundary and no retry-with-backoff on fetch failures.

---

## Verification

**Automated — all green:**

| Command | Result |
| --- | --- |
| `pnpm test` | 70 tests across 6 files |
| `pnpm typecheck` | clean |
| `pnpm lint` | clean |
| `pnpm build` | succeeds |

Worth noting that `pnpm lint` **fails on a fresh clone** of the starter — one error and four warnings
in `ProductCard.tsx` and `products/page.tsx`. It is clean now.

**The strongest test is a property, not an example.** `variants.test.ts` round-trips *every* variant in
the fixture — all 59 across 26 products — deriving a selection from each variant's own title,
resolving it back, and asserting it lands on exactly that variant. Any regression in title parsing
fails it catalogue-wide rather than for one hand-picked case.

The same idea covers the traps that examples would miss if the fixture grew:

- A missing combination is a valid result, not a test failure. `prod_20` King/Slate is pinned
  explicitly as `unavailable`. I did not sweep every option cartesian and assert "exactly one
  hole in the fixture": that would fail the suite if another real gap appeared, even though the
  resolver was doing the right thing. The round-trip test already covers every variant that *does*
  exist; the King/Slate case covers the one that does not.
- Out-of-stock is not missing. `prod_01` Navy Blue, `prod_03` 750ml Black, and `prod_08` Vanilla 2kg
  must resolve, keep their own prices (₪319 / ₪229 / ₪329), and report `inventory_quantity: 0`.
  Treating them as unavailable would hide the price the Quick View is required to show.
- `prod_14` must resolve from Size alone. Joining the selection into a title and comparing it to
  `"EU 42 - Black"` is the implementation that looks obvious and is wrong; a test asserts the real
  title still contains the stray `Black` token.
- `getStartingPrice` equals the true minimum on all 26 products. That sweep would still pass if we
  used `variants[0]`, because the first variant happens to be cheapest today — so a second test
  mutates a product so the cheaper variant is not first. Both are required.
- `catalogueSearchParams` sends `offset=24` for page 3 and never sends `page`. The README example
  and OpenAPI both omit `page`; a client that forwarded the UI query string would silently always
  show the first twelve products.
- `parsePage("abc")` and `parsePage("0")` fall back to 1, so a garbage URL cannot produce a `NaN`
  offset.
- `collectFacets` includes every tag the products carry, including the six the OpenAPI enum dropped
  (`decor`, `equipment`, `footwear`, `leather`, `photography`, `wellness`). Building the dropdown
  from the spec would make `?tag=footwear` unreachable from the UI.
- Collection options expose `handle` (`audio`), not the display title (`Audio`). The API match is
  exact and case-sensitive.
- Money formatting uses minor units (`29900` → `₪299.00`, not `₪29,900.00`) and `en-IL` so the
  string contains no RTL marks. `he-IL` would look correct in a log and break the LTR layout.

The specific traps are also pinned individually: `prod_20` King/Slate must report unavailable;
`prod_14` `EU 43` must still resolve to `RS-43-BLK`; a partial selection must not resolve; and no
product may default to an unavailable or out-of-stock variant.

**Exhaustive sweeps over the real data** used to include a cartesian count of missing combinations.
That sweep is gone: an incomplete option matrix is legitimate commerce data, so "unavailable"
must not fail the suite. What remains in Vitest is the round-trip of every existing variant, the
starting-price minimum across all 26 products, and the cart reducer cases for inventory clamping
and out-of-stock rejection.

**Rendered-HTML assertions.** Because the list is server-rendered, I asserted directly against the
markup: page 1 shows `Showing 1–12 of 26` with links to pages 2 and 3 and no Linen Bedding Set; page 3
shows `Showing 25–26 of 26` and contains the 26th product; `q=linen` narrows to one result;
`collection=office` includes the docking station and excludes the yoga mat; combined filters survive
in the pagination hrefs; `?page=99` says the page does not exist and Previous returns to the last
real page rather than to page 98; and `?page=abc` falls back to page 1 instead of producing a `NaN`
offset.

I also confirmed the `next/image` optimizer returns real optimized bytes, since `pnpm install` skips
`sharp`'s build script by default.

**Browser checks.** These paths are not in `pnpm test` — Vitest covers `src/lib` only. They were
walked in the browser before submission, because that is where a wrong join, a broken focus trap,
or a cart that dies on refresh actually shows up:

- `prod_20` — opens on Queen/Oatmeal at ₪599.00 "In stock"; King switches to ₪699.00 with "Only 4
  left"; adding Slate produces the unavailable message and no price; returning to Queen recovers.
- `prod_01` — card reads `From ₪299.00`; Navy Blue shows ₪319.00, "Out of stock", and a disabled
  Add to Cart.
- Modal closes via Escape, backdrop click, and the close button, with focus returning to the Quick
  View button each time.
- Cart — adding the same variant twice increments one line; two variants of one product stay
  separate; remove and quantity controls work; the cart survives a page refresh.
- Checkout — submitting empty shows inline messages and moves focus to the first invalid field;
  fixing fields clears them live; a valid submit shows the confirmation and empties the cart.

---

## Surprises

**`openapi.json` has drifted from the data, in two ways that matter.** It states the API "Serves 12
products" when there are 26 — a naive implementation would show twelve and look complete. And its
`tag` enum lists 16 tags while the products carry 22; `decor`, `equipment`, `footwear`, `leather`,
`photography`, and `wellness` are missing from the spec entirely. Building filters from the spec would
have silently dropped six of them. This is why the `/api/facets` endpoint exists. The spec is still
useful — it is the only place that documents amounts as agorot and `inventory_quantity: 0` as out of
stock — but it is not authoritative.

**Variants have no structured link to their options.** I expected something like
`variant.options: [{ option_id, value }]`, as Medusa itself provides. Instead the only join is a
delimited string in `variant.title`. Discovering the rule required reading the fixture rather than the
docs, and it is the single decision everything else in the modal depends on.

**`prod_20` has four option combinations and three variants.** Once I found it I swept the entire
catalogue expecting more; there is exactly one. That specificity is what convinced me it was
deliberate rather than an oversight, and it is why the selector models unavailability as a first-class
state instead of assuming a complete matrix.

**`prod_14`'s variant titles carry a token that maps to no option** — `"EU 42 - Black"` against a
Size-only product. This breaks the natural "join the selected values and compare" implementation, and
only that one product exposes it.

**The starter code ships with a lint error.** `pnpm lint` fails on a clean clone before writing any
code, because `ProductCard` declares an `onQuickView` prop it never uses. Combined with the dead
`onClick={() => {}}` and the `variants[0].prices[0]` price rule, the starter card reads as
deliberately seeded.

**The starting-price bug is invisible in this dataset.** `variants[0]` happens to be the cheapest
variant in all 26 products, so fixing it changes nothing on screen today and everything the moment the
catalogue changes.

**Collections are noisy.** The Mechanical Keyboard, the Travel Tripod and the 4K Action Camera all sit
in the `audio` collection. I left it alone — it is the backend's data — but it is a good reminder not
to derive UI logic from collection membership.

**`zod` and `lucide-react` are dependencies but unused in the starter**, which I read as a steer
toward validation and icons rather than pulling in alternatives.

**`pnpm install` skips `sharp`'s build script** by default, which is what `next/image` uses for
optimization. It turned out not to break anything, but I verified the optimizer explicitly rather than
assuming.

**The Tailwind version that compiles the CSS is not the one `package.json` advertises.**
`tailwindcss` is declared as `^4.2.2` and resolves to 4.2.4, matching the stated stack. But
`@tailwindcss/postcss` is pinned to exactly `4.1.18` and hard-pins `tailwindcss 4.1.18` as its own
dependency — and since `postcss.config.mjs` runs everything through that plugin, **4.1.18 is what
actually builds the stylesheet**. Both copies sit in the pnpm store; the 4.2.4 one only serves editor
tooling. The two pins cannot be satisfied by a single copy, so the skew is unavoidable without
changing the given versions.

I left the versions alone, because everything compiles correctly and a version bump nobody needs is
risk without reward on a submission. Instead I verified against the build output rather than the
manifest: the production CSS contains the `::backdrop` rules for the modal and drawer, the
`peer-checked` variants for the variant selector, `dvh` units for the full-height drawer, and the
`outline` utilities. This is also a small lesson in checking the right artifact — my first check of
the `backdrop:` variant read the 4.2.4 copy, which is not the one doing the work.
