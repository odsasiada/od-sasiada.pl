import { writeFileSync } from 'node:fs'

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

  // ── Simple product helper ───────────────────────────────────────────────────
  const simpleProduct = (title: string, priceInPLN: number, description?: string) =>
    findOrCreate(
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

  // ── Seasonal product helper (draft) ─────────────────────────────────────────
  const seasonalProduct = (title: string) =>
    findOrCreate(
      'products',
      { tenant: { equals: tenantId }, title: { equals: title } },
      {
        _status: 'draft',
        description: 'Cena sezonowa — ustalana indywidualnie.',
        tenant: tenantId,
        title,
      },
    )

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
    variants: { optionId: number; priceInPLN: number; label: string }[],
  ) => {
    const product = await findOrCreate(
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

    // Create variants concurrently — each is independent.
    await Promise.all(
      variants.map((v) =>
        findOrCreate(
          'variants',
          { product: { equals: (product as { id: number }).id }, tenant: { equals: tenantId } },
          {
            _status: 'published',
            options: [v.optionId],
            priceInPLN: v.priceInPLN,
            priceInPLNEnabled: true,
            product: (product as { id: number }).id,
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
  await simpleProduct('Jaja wiejskie', 130, '1,30 zł / sztuka')
  await simpleProduct('Jabłka', 500, '5,00 zł / kg')
  await simpleProduct('Gruszki konferencje', 750, '7,50 zł / kg')
  await simpleProduct('Rzodkiewka', 350, '3,50 zł / pęczek')
  await simpleProduct('Sałata masłowa', 400, '4,00 zł / sztuka')
  await simpleProduct('Szczypior', 250, '2,50 zł / sztuka')
  await simpleProduct('Sok z kapusty kiszonej', 450, '4,50 zł / 0,5 L')

  // ── Honeys ──────────────────────────────────────────────────────────────────
  payload.logger.info('Creating honeys (1 L)...')
  await simpleProduct('Miód rzepakowy 1 L', 4000)
  await simpleProduct('Miód wielokwiatowy 1 L', 4200)
  await simpleProduct('Miód mniszkowy 1 L', 4300)
  await simpleProduct('Miód gryczany 1 L', 4400)
  await simpleProduct('Miód akacjowy 1 L', 4400)
  await simpleProduct('Miód spadź liściasta 1 L', 4500)
  await simpleProduct('Miód lipowy 1 L', 4500)
  await simpleProduct('Miód faceliowy 1 L', 4800)
  await simpleProduct('Miód nawłociowy 1 L', 5000)

  // ── Bee products ────────────────────────────────────────────────────────────
  payload.logger.info('Creating bee products...')
  await simpleProduct('Pyłek pszczeli 300 g', 2800)
  await simpleProduct('Pierzga 100 g', 4000)
  await simpleProduct('Propolis 50 g', 3500)

  // ── Seasonal products (drafts) ──────────────────────────────────────────────
  payload.logger.info('Creating seasonal products (drafts)...')
  await seasonalProduct('Pomidory malinowe')
  await seasonalProduct('Ogórki gruntowe')
  await seasonalProduct('Koper')
  await seasonalProduct('Natka pietruszki')

  // ── Products with variants ──────────────────────────────────────────────────
  payload.logger.info('Creating products with variants...')
  await variantProduct('Ziemniaki', 'Sprzedawane luzem na wagę lub w worku.', [
    { label: 'luzem (kg)', optionId: Number(opt.luzem.id), priceInPLN: 180 },
    { label: 'worek 15 kg', optionId: Number(opt.worek15.id), priceInPLN: 2500 },
  ])
  await variantProduct('Kapusta kiszona', 'Własnej roboty.', [
    { label: '1 kg', optionId: Number(opt.kg1.id), priceInPLN: 850 },
    { label: '5 kg', optionId: Number(opt.kg5.id), priceInPLN: 3200 },
  ])
  await variantProduct('Ogórki kiszone', 'Własnej roboty.', [
    { label: '0,5 kg', optionId: Number(opt.kg05.id), priceInPLN: 1100 },
    { label: '3 kg', optionId: Number(opt.kg3.id), priceInPLN: 4800 },
  ])

  // ── Summary ─────────────────────────────────────────────────────────────────
  const productCount = await payload.count({ collection: 'products' })
  const variantCount = await payload.count({ collection: 'variants' })
  payload.logger.info(
    `Production seed complete. Tenant: ${tenant.name}. Products: ${productCount.totalDocs}. Variants: ${variantCount.totalDocs}.`,
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
