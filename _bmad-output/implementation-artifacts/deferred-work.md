# Deferred Work

## Deferred from: code review of S3.5 (2026-06-25)

- Slug na Categories nie ma unikalności — znane Q1 (S3.4: auto vs ręczny, unikalność per-tenant) [src/collections/Categories.ts]
- `console.warn` w payload.config.ts — developer convenience, brak strukturalnego logowania
- `categoriesField()` w `productsCollectionOverride` — należy do S3.4/S3.6, nie S3.5 — commit organization
- BLOB warning — zmiana konfiguracyjna poza zakresem S3.5
- Media mimeTypes (`['image/*']` → explicit) — security improvement, poza zakresem S3.5
