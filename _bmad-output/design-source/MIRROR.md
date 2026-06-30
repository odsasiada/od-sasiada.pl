# Design System Mirror — Od Sąsiada

**GENERATED MIRROR — read-only. Do not edit here.**
Edit the upstream Claude Design project, then re-sync this folder.

## Provenance

- **Source:** Claude Design project "Od Sąsiada - Design System"
- **projectId:** `16cae966-37d5-473c-bc27-4b0e562f4a22`
- **Type:** `PROJECT_TYPE_DESIGN_SYSTEM`
- **Mirrored:** 2026-06-26
- **Tool:** `DesignSync` (claude_design MCP) — `get_file` per path, written 1:1 to disk
- **File count:** 76 files

## Purpose

A 1:1, read-only mirror of the upstream design system, kept locally so we can:
- reference tokens/components without round-tripping to the remote project,
- version the design alongside code in git (this folder is **not** gitignored),
- diff future re-syncs against a known-good snapshot.

It lives outside `src/` so Next.js/Turbopack never compile its foreign `.jsx`,
and is excluded from Biome via the `!**/_bmad-output` entry in `biome.json`.
**Do not** import from this folder in app code — porting tokens/components into
`src/` is a separate, deliberate task (see plan `glistening-singing-dove.md`).

## Layout

| Path | Contents |
|------|----------|
| `tokens/` | CSS custom-property layers: `palette`, `semantic` (shadcn HSL channels + brand aliases + `.dark` + `[data-tenant]`), `typography`, `spacing`, `radius`, `elevation`, `motion`, `base`, `fonts` |
| `styles.css` | Token import manifest |
| `components/` | Reference `.jsx` + `.d.ts` + `.prompt.md` + `*.card.html` specimens (buttons, commerce, feedback, forms, layout) |
| `templates/shop-page/` | `ShopPage.dc.html` + `ds-base.js`, `support.js`, `.thumbnail` (webp) |
| `ui_kits/shop/` | Full screen kit: Catalog / Cart / Account / Orders |
| `guidelines/` | `*.card.html` specimen cards (colors, type, spacing, radius, elevation, brand) |
| `assets/logo/` | SVG mark + wordmarks |
| root | `readme.md`, `SKILL.md`, `_ds_bundle.js`, `_ds_manifest.json`, `_adherence.oxlintrc.json` |

## Known elisions (NOT 1:1)

Two machine-generated files had large embedded token arrays elided to keep the
mirror readable; the authoritative token *values* live in `tokens/*.css`:

- `_ds_manifest.json` — `tokens[]` array replaced with a `_mirrorNote`.
  (Also note: upstream captured motion durations as `0ms` under
  `prefers-reduced-motion`; real defaults 120/180/260/400ms are in `tokens/motion.css`.)
- `_adherence.oxlintrc.json` — `tokens[]` / `tokenKinds` elided with a note.

Binary `.thumbnail` was base64-decoded to a real webp on disk.
