import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { getPayload } from 'payload'

import config from '@/payload.config'

/**
 * Production seed — idempotent, no data clearing.
 * Uses find-or-create pattern so it's safe to run multiple times.
 *
 * Run: `pnpm seed:production`
 * Requires: DATABASE_URL (Supabase), PAYLOAD_SECRET set in env.
 */
const seed = async () => {
  const payload = await getPayload({ config })

  // ── Find-or-create helper ───────────────────────────────────────────────────
  const findOrCreate = async <T extends { id: number | string }>(
    collection: string,
    where: Record<string, unknown>,
    data: Record<string, unknown>,
  ): Promise<T> => {
    const existing = await payload.find({
      collection: collection as never,
      limit: 1,
      where: where as never,
    })
    if (existing.docs.length > 0) {
      payload.logger.info(`Found existing ${collection} — skipping create.`)
      return existing.docs[0] as T
    }
    return payload.create({
      collection: collection as never,
      data: data as never,
    }) as Promise<T>
  }

  // ── Tenant ──────────────────────────────────────────────────────────────────
  payload.logger.info('Ensuring supplier tenant exists...')
  const tenant = await findOrCreate<{
    id: number
    name: string
    slug: string
  }>(
    'tenants',
    { slug: { equals: 'swieze-z-kaszub' } },
    {
      name: 'Świeże z Kaszub',
      settings: {
        contactPhone: '791 647 500',
        isActive: true,
        minOrderValue: 3000,
        priceNotice: 'Ceny mogą ulec zmianie. W razie pytań proszę o wiadomość SMS, a podeślę aktualny cennik.',
      },
      slug: 'swieze-z-kaszub',
    },
  )

  const tenantId = tenant.id

  // ── Categories (S4.5) ───────────────────────────────────────────────────────
  // Tenant-scoped; `slug` is auto-filled from `name` by the Categories beforeValidate hook.
  payload.logger.info('Ensuring categories exist...')
  const findOrCreateCategory = (name: string) =>
    findOrCreate<{ id: number }>(
      'categories',
      { name: { equals: name }, tenant: { equals: tenantId } },
      { name, tenant: tenantId },
    )

  const cat = {
    jaja: await findOrCreateCategory('Jaja'),
    kiszonki: await findOrCreateCategory('Kiszonki'),
    miody: await findOrCreateCategory('Miody'),
    owoce: await findOrCreateCategory('Owoce'),
    pszczele: await findOrCreateCategory('Produkty pszczele'),
    sezonowe: await findOrCreateCategory('Sezonowe'),
    warzywa: await findOrCreateCategory('Warzywa'),
  }

  // Idempotently set a product's categories. Existing prod products were seeded before S4.5
  // (no categories), so we always update the relation — re-setting the same ids is a no-op.
  const assignCategories = (productId: number, categoryIds: number[]) =>
    payload.update({ collection: 'products', data: { categories: categoryIds }, id: productId })

  // ── Simple product helper ───────────────────────────────────────────────────
  const simpleProduct = async (title: string, priceInPLN: number, categoryIds: number[], description?: string) => {
    const product = await findOrCreate<{ id: number }>(
      'products',
      { tenant: { equals: tenantId }, title: { equals: title } },
      {
        _status: 'published',
        description,
        priceInPLN,
        priceInPLNEnabled: true,
        tenant: tenantId,
        title,
      },
    )
    await assignCategories(product.id, categoryIds)
    return product
  }

  // ── Seasonal product helper (draft) ─────────────────────────────────────────
  const seasonalProduct = async (title: string, categoryIds: number[]) => {
    const product = await findOrCreate<{ id: number }>(
      'products',
      { tenant: { equals: tenantId }, title: { equals: title } },
      {
        _status: 'draft',
        description: 'Cena sezonowa — ustalana indywidualnie.',
        tenant: tenantId,
        title,
      },
    )
    await assignCategories(product.id, categoryIds)
    return product
  }

  // ── Variant type + options ──────────────────────────────────────────────────
  payload.logger.info('Ensuring variant type "Porcja" and options exist...')
  const porcja = await findOrCreate<{ id: number }>(
    'variantTypes',
    { name: { equals: 'porcja' }, tenant: { equals: tenantId } },
    { label: 'Porcja', name: 'porcja', tenant: tenantId },
  )

  const makeOption = (label: string, value: string) =>
    findOrCreate(
      'variantOptions',
      { tenant: { equals: tenantId }, value: { equals: value } },
      { label, tenant: tenantId, value, variantType: porcja.id },
    )

  const opt = {
    kg1: await makeOption('1 kg', '1-kg'),
    kg3: await makeOption('3 kg', '3-kg'),
    kg5: await makeOption('5 kg', '5-kg'),
    kg05: await makeOption('0,5 kg', '0-5-kg'),
    luzem: await makeOption('luzem (kg)', 'luzem-kg'),
    worek15: await makeOption('worek 15 kg', 'worek-15-kg'),
  }

  // ── Variant product helper ──────────────────────────────────────────────────
  const variantProduct = async (
    title: string,
    description: string,
    categoryIds: number[],
    variants: { optionId: number; priceInPLN: number; label: string }[],
  ) => {
    const product = await findOrCreate<{ id: number }>(
      'products',
      { tenant: { equals: tenantId }, title: { equals: title } },
      {
        _status: 'published',
        description,
        enableVariants: true,
        tenant: tenantId,
        title,
        variantTypes: [porcja.id],
      },
    )

    await assignCategories(product.id, categoryIds)

    // Create variants concurrently — each is independent.
    // Key find-or-create on the option too: without it, once ANY variant exists for a product,
    // every subsequent variant matches the first one and new/missing variants are never created
    // (breaks idempotency on re-run / partial-failure recovery).
    await Promise.all(
      variants.map((v) =>
        findOrCreate(
          'variants',
          { options: { in: [v.optionId] }, product: { equals: product.id }, tenant: { equals: tenantId } },
          {
            _status: 'published',
            options: [v.optionId],
            priceInPLN: v.priceInPLN,
            priceInPLNEnabled: true,
            product: product.id,
            tenant: tenantId,
            title: v.label,
          },
        ),
      ),
    )

    return product
  }

  // ── Simple products ─────────────────────────────────────────────────────────
  payload.logger.info('Creating simple products...')
  await simpleProduct('Jaja wiejskie', 130, [cat.jaja.id], '1,30 zł / sztuka')
  await simpleProduct('Jabłka', 500, [cat.owoce.id], '5,00 zł / kg')
  await simpleProduct('Gruszki konferencje', 750, [cat.owoce.id], '7,50 zł / kg')
  await simpleProduct('Rzodkiewka', 350, [cat.warzywa.id], '3,50 zł / pęczek')
  await simpleProduct('Sałata masłowa', 400, [cat.warzywa.id], '4,00 zł / sztuka')
  await simpleProduct('Szczypior', 250, [cat.warzywa.id], '2,50 zł / sztuka')
  await simpleProduct('Sok z kapusty kiszonej', 450, [cat.kiszonki.id], '4,50 zł / 0,5 L')

  // ── Honeys ──────────────────────────────────────────────────────────────────
  payload.logger.info('Creating honeys (1 L)...')
  await simpleProduct('Miód rzepakowy 1 L', 4000, [cat.miody.id])
  await simpleProduct('Miód wielokwiatowy 1 L', 4200, [cat.miody.id])
  await simpleProduct('Miód mniszkowy 1 L', 4300, [cat.miody.id])
  await simpleProduct('Miód gryczany 1 L', 4400, [cat.miody.id])
  await simpleProduct('Miód akacjowy 1 L', 4400, [cat.miody.id])
  await simpleProduct('Miód spadź liściasta 1 L', 4500, [cat.miody.id])
  await simpleProduct('Miód lipowy 1 L', 4500, [cat.miody.id])
  await simpleProduct('Miód faceliowy 1 L', 4800, [cat.miody.id])
  await simpleProduct('Miód nawłociowy 1 L', 5000, [cat.miody.id])

  // ── Bee products ────────────────────────────────────────────────────────────
  payload.logger.info('Creating bee products...')
  await simpleProduct('Pyłek pszczeli 300 g', 2800, [cat.pszczele.id])
  await simpleProduct('Pierzga 100 g', 4000, [cat.pszczele.id])
  await simpleProduct('Propolis 50 g', 3500, [cat.pszczele.id])

  // ── Seasonal products (drafts) ──────────────────────────────────────────────
  payload.logger.info('Creating seasonal products (drafts)...')
  await seasonalProduct('Pomidory malinowe', [cat.sezonowe.id])
  await seasonalProduct('Ogórki gruntowe', [cat.sezonowe.id])
  await seasonalProduct('Koper', [cat.sezonowe.id])
  await seasonalProduct('Natka pietruszki', [cat.sezonowe.id])

  // ── Products with variants ──────────────────────────────────────────────────
  payload.logger.info('Creating products with variants...')
  await variantProduct(
    'Ziemniaki',
    'Sprzedawane luzem na wagę lub w worku.',
    [cat.warzywa.id],
    [
      { label: 'luzem (kg)', optionId: Number(opt.luzem.id), priceInPLN: 180 },
      { label: 'worek 15 kg', optionId: Number(opt.worek15.id), priceInPLN: 2500 },
    ],
  )
  await variantProduct(
    'Kapusta kiszona',
    'Własnej roboty.',
    [cat.kiszonki.id],
    [
      { label: '1 kg', optionId: Number(opt.kg1.id), priceInPLN: 850 },
      { label: '5 kg', optionId: Number(opt.kg5.id), priceInPLN: 3200 },
    ],
  )
  await variantProduct(
    'Ogórki kiszone',
    'Własnej roboty.',
    [cat.kiszonki.id],
    [
      { label: '0,5 kg', optionId: Number(opt.kg05.id), priceInPLN: 1100 },
      { label: '3 kg', optionId: Number(opt.kg3.id), priceInPLN: 4800 },
    ],
  )

  // ── Hero images (S4.6) ──────────────────────────────────────────────────────
  // Free stock photos (loremflickr / Flickr CC) downloaded to seed-assets/products/ and listed
  // in seed-assets/products.json. Uploaded to the tenant's Media library (Vercel Blob on prod),
  // then attached as each product's heroImage. Idempotent: Media keyed by alt = product title;
  // gracefully skips when the manifest or a file is absent (so the seed still runs without assets).
  const mimeByExt: Record<string, string> = {
    '.gif': 'image/gif',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  }

  const manifestPath = path.resolve(process.cwd(), 'seed-assets', 'products.json')
  // Parse defensively: a present-but-malformed manifest should skip hero images, not abort the
  // whole seed (the "graceful skip" promise only held for an absent file before).
  let manifest: { title: string; file: string }[] | null = null
  if (existsSync(manifestPath)) {
    try {
      const parsed = JSON.parse(readFileSync(manifestPath, 'utf8'))
      if (Array.isArray(parsed)) {
        manifest = parsed
      } else {
        payload.logger.warn('seed-assets/products.json is not an array — skipping hero images.')
      }
    } catch (e) {
      payload.logger.warn(`seed-assets/products.json is malformed — skipping hero images. (${(e as Error).message})`)
    }
  } else {
    payload.logger.info('No seed-assets/products.json — skipping hero images.')
  }

  if (manifest) {
    payload.logger.info('Ensuring product hero images...')
    const allProducts = await payload.find({
      collection: 'products',
      depth: 0,
      pagination: false,
      where: { tenant: { equals: tenantId } },
    })
    const idByTitle = new Map(allProducts.docs.map((p) => [(p as { title: string }).title, (p as { id: number }).id]))

    let heroOk = 0
    for (const entry of manifest) {
      if (typeof entry?.title !== 'string' || typeof entry?.file !== 'string') {
        payload.logger.warn(`Skipping malformed manifest entry: ${JSON.stringify(entry)}`)
        continue
      }
      const productId = idByTitle.get(entry.title)
      const filePath = path.resolve(process.cwd(), 'seed-assets', 'products', entry.file)
      if (productId === undefined || !existsSync(filePath)) {
        continue
      }

      const existingMedia = await payload.find({
        collection: 'media',
        limit: 1,
        where: { alt: { equals: entry.title }, tenant: { equals: tenantId } },
      })
      let mediaId: number
      if (existingMedia.docs.length > 0) {
        mediaId = (existingMedia.docs[0] as { id: number }).id
      } else {
        const data = readFileSync(filePath)
        const mimetype = mimeByExt[path.extname(entry.file).toLowerCase()] ?? 'image/jpeg'
        const created = await payload.create({
          collection: 'media',
          data: { alt: entry.title, tenant: tenantId },
          file: { data, mimetype, name: entry.file, size: data.length },
        })
        mediaId = (created as { id: number }).id
      }

      await payload.update({ collection: 'products', data: { heroImage: mediaId }, id: productId })
      heroOk++
    }
    payload.logger.info(`Hero images ensured for ${heroOk}/${manifest.length} products.`)
  }

  // ── Delivery slot (S4.7) — recurring Friday window for the demo tenant ───────
  // weekday: 0=Sunday .. 6=Saturday (JS Date.getDay()); 5 = Friday.
  payload.logger.info('Ensuring delivery slot (Friday) exists...')
  await findOrCreate(
    'delivery-slots',
    { tenant: { equals: tenantId }, weekday: { equals: 5 }, windowStart: { equals: '09:00' } },
    {
      capacity: 30,
      cutoffDaysBefore: 1,
      cutoffTime: '18:00',
      tenant: tenantId,
      weekday: 5,
      windowEnd: '18:00',
      windowStart: '09:00',
    },
  )

  // ── Summary ─────────────────────────────────────────────────────────────────
  const productCount = await payload.count({ collection: 'products' })
  const variantCount = await payload.count({ collection: 'variants' })
  const categoryCount = await payload.count({ collection: 'categories' })
  const slotCount = await payload.count({ collection: 'delivery-slots' })
  const mediaCount = await payload.count({ collection: 'media' })
  payload.logger.info(
    `Production seed complete. Tenant: ${tenant.name}. Products: ${productCount.totalDocs}. Variants: ${variantCount.totalDocs}. Categories: ${categoryCount.totalDocs}. Delivery slots: ${slotCount.totalDocs}. Media: ${mediaCount.totalDocs}.`,
  )
}

try {
  await seed()
  writeFileSync('/tmp/seed-production-result.txt', 'SEED OK\n')
  process.exit(0)
} catch (err) {
  writeFileSync('/tmp/seed-production-result.txt', `SEED FAILED:\n${(err as Error)?.stack ?? String(err)}\n`)
  process.exit(1)
}
