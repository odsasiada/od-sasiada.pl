---
name: od-sasiada-design
description: Use this skill to generate well-branded interfaces and assets for od-sąsiada.pl — a local, multi-tenant neighbour-to-neighbour marketplace (cash on delivery, PLN, warm Polish "Ty" voice) — either for production or throwaway prototypes/mocks. Contains essential design guidelines, colours, type, fonts, assets, shadcn/Tailwind tokens, per-tenant theming, and UI-kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc.), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

Key starting points:
- `styles.css` — link this one file to get all tokens, fonts and resets.
- `tokens/` — colours (incl. shadcn HSL roles, dark mode, per-tenant), type, spacing, radius, shadows, motion.
- `components/` — React primitives (Button, IconButton, Field, Select, Price, QuantityStepper, ProductCard, Badge/StatusBadge, Alert, ShopHeader).
- `ui_kits/shop/` — a full interactive recreation of the shop (catalog → cart → cash checkout → orders → login). The best reference for assembling real screens.
- `assets/logo/` — wordmark + mark (placeholder — replace with the real logo if available).

Non-negotiables when designing for this brand:
- Polish, warm, on **„Ty"**. Cream `#f7f6f2` page background, never sterile white. Leading green `#2f7a3f`; terracotta `#c75b39` only for the "Dodaj do koszyka / Kup" CTA.
- Prices are sacred: big, bold, tabular, `40,00 zł` (comma decimal, "zł" after the number).
- Every product shows a **prominent seller chip** (trust). Soft corners, gentle warm shadows, calm motion.
- Per-tenant theming overrides **only** the accent colour + logo via `[data-tenant]`; the skeleton stays od-sąsiada.pl.

If the user invokes this skill without other guidance, ask them what they want to build or design, ask a few questions, and act as an expert designer who outputs HTML artifacts **or** production code, depending on the need.
