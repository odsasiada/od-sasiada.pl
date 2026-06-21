import { writeFileSync } from 'node:fs'

import { getPayload } from 'payload'

import config from '@/payload.config'

/**
 * Seeds a sample shop based on a real price list from the first supplier (Kashubia).
 * Prices in grosze (130 = 1.30 PLN). Run: `pnpm seed`.
 */
const seed = async () => {
  const payload = await getPayload({ config })

  payload.logger.info('Clearing previous seed data...')
  // Order: children → parent; deleting tenant cascades tenant-scoped data anyway.
  for (const collection of ['variants', 'variantOptions', 'variantTypes', 'products', 'tenants'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } } })
  }

  payload.logger.info('Creating supplier (tenant)...')
  const tenant = await payload.create({
    collection: 'tenants',
    data: {
      name: 'Świeże z Kaszub',
      settings: {
        contactPhone: '791 647 500',
        isActive: true,
        minOrderValue: 3000,
        priceNotice: 'Ceny mogą ulec zmianie. W razie pytań proszę o wiadomość SMS, a podeślę aktualny cennik.',
      },
      slug: 'swieze-z-kaszub',
    },
  })

  const tenantId = tenant.id

  // ── Produkt prosty (jedna cena) ─────────────────────────────────────────────
  const simpleProduct = (title: string, priceInPLN: number, description?: string) =>
    payload.create({
      collection: 'products',
      data: {
        _status: 'published',
        description,
        priceInPLN,
        priceInPLNEnabled: true,
        tenant: tenantId,
        title,
      },
    })

  // ── Produkt sezonowy bez ceny (szkic) ───────────────────────────────────────
  const seasonalProduct = (title: string) =>
    payload.create({
      collection: 'products',
      data: {
        _status: 'draft',
        description: 'Cena sezonowa — ustalana indywidualnie.',
        tenant: tenantId,
        title,
      },
    })

  payload.logger.info('Creating variant type "Porcja" and options...')
  const porcja = await payload.create({
    collection: 'variantTypes',
    data: { label: 'Porcja', name: 'porcja', tenant: tenantId },
  })

  const makeOption = (label: string, value: string) =>
    payload.create({
      collection: 'variantOptions',
      data: { label, tenant: tenantId, value, variantType: porcja.id },
    })

  const opt = {
    kg1: await makeOption('1 kg', '1-kg'),
    kg3: await makeOption('3 kg', '3-kg'),
    kg5: await makeOption('5 kg', '5-kg'),
    kg05: await makeOption('0,5 kg', '0-5-kg'),
    luzem: await makeOption('luzem (kg)', 'luzem-kg'),
    worek15: await makeOption('worek 15 kg', 'worek-15-kg'),
  }

  // ── Produkt z wariantami ────────────────────────────────────────────────────
  const variantProduct = async (
    title: string,
    description: string,
    variants: { optionId: number; priceInPLN: number; label: string }[],
  ) => {
    const product = await payload.create({
      collection: 'products',
      data: {
        _status: 'published',
        description,
        enableVariants: true,
        tenant: tenantId,
        title,
        variantTypes: [porcja.id],
      },
    })

    // Variants of a product are independent of each other → create them concurrently.
    await Promise.all(
      variants.map((v) =>
        payload.create({
          collection: 'variants',
          data: {
            _status: 'published',
            options: [v.optionId],
            priceInPLN: v.priceInPLN,
            priceInPLNEnabled: true,
            product: product.id,
            tenant: tenantId,
            title: v.label,
          },
        }),
      ),
    )

    return product
  }

  payload.logger.info('Creating simple products...')
  await simpleProduct('Jaja wiejskie', 130, '1,30 zł / sztuka')
  await simpleProduct('Jabłka', 500, '5,00 zł / kg')
  await simpleProduct('Gruszki konferencje', 750, '7,50 zł / kg')
  await simpleProduct('Rzodkiewka', 350, '3,50 zł / pęczek')
  await simpleProduct('Sałata masłowa', 400, '4,00 zł / sztuka')
  await simpleProduct('Szczypior', 250, '2,50 zł / sztuka')
  await simpleProduct('Sok z kapusty kiszonej', 450, '4,50 zł / 0,5 L')

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

  payload.logger.info('Creating bee products...')
  await simpleProduct('Pyłek pszczeli 300 g', 2800)
  await simpleProduct('Pierzga 100 g', 4000)
  await simpleProduct('Propolis 50 g', 3500)

  payload.logger.info('Creating seasonal products (drafts)...')
  await seasonalProduct('Pomidory malinowe')
  await seasonalProduct('Ogórki gruntowe')
  await seasonalProduct('Koper')
  await seasonalProduct('Natka pietruszki')

  payload.logger.info('Creating products with variants...')
  await variantProduct('Ziemniaki', 'Sprzedawane luzem na wagę lub w worku.', [
    { label: 'luzem (kg)', optionId: opt.luzem.id, priceInPLN: 180 },
    { label: 'worek 15 kg', optionId: opt.worek15.id, priceInPLN: 2500 },
  ])
  await variantProduct('Kapusta kiszona', 'Własnej roboty.', [
    { label: '1 kg', optionId: opt.kg1.id, priceInPLN: 850 },
    { label: '5 kg', optionId: opt.kg5.id, priceInPLN: 3200 },
  ])
  await variantProduct('Ogórki kiszone', 'Własnej roboty.', [
    { label: '0,5 kg', optionId: opt.kg05.id, priceInPLN: 1100 },
    { label: '3 kg', optionId: opt.kg3.id, priceInPLN: 4800 },
  ])

  const productCount = await payload.count({ collection: 'products' })
  payload.logger.info(`Done. Supplier: ${tenant.name}. Products: ${productCount.totalDocs}.`)
}

try {
  await seed()
  writeFileSync('/tmp/seed-result.txt', 'SEED OK\n')
  process.exit(0)
} catch (err) {
  writeFileSync('/tmp/seed-result.txt', `SEED FAILED:\n${(err as Error)?.stack ?? String(err)}\n`)
  process.exit(1)
}
