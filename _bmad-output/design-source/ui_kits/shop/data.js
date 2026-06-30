/* od-sąsiada.pl · UI-kit sample data (from the repo seed — Świeże z Kaszub).
   Prices in grosze (4000 = 40,00 zł). */
window.SHOP_DATA = {
  tenant: {
    name: 'Świeże z Kaszub',
    slug: 'swieze-z-kaszub',
    contactPhone: '791 647 500',
    minOrderValue: 3000,
    priceNotice: 'Ceny mogą ulec zmianie. W razie pytań napisz SMS — podeślę aktualny cennik.',
  },
  categories: ['Wszystko', 'Miody', 'Warzywa', 'Kiszonki', 'Od pszczół'],
  products: [
    { id: 1, title: 'Miód rzepakowy', cat: 'Miody', price: 4000, unit: '1 L', desc: 'Jasny, łagodny, szybko się krystalizuje.' },
    { id: 2, title: 'Miód wielokwiatowy', cat: 'Miody', price: 4200, unit: '1 L', desc: 'Z łąk wokół gospodarstwa.' },
    { id: 3, title: 'Miód gryczany', cat: 'Miody', price: 4400, unit: '1 L', desc: 'Ciemny, mocny w smaku.' },
    { id: 4, title: 'Miód lipowy', cat: 'Miody', price: 4500, unit: '1 L', desc: 'Aromatyczny, na rozgrzewkę.' },
    { id: 5, title: 'Jaja wiejskie', cat: 'Warzywa', price: 130, unit: 'szt.', desc: 'Od kur z wybiegu.', lowStock: 6 },
    { id: 6, title: 'Jabłka', cat: 'Warzywa', price: 500, unit: 'kg', desc: 'Odmiana sezonowa.' },
    { id: 7, title: 'Gruszki konferencje', cat: 'Warzywa', price: 750, unit: 'kg', desc: 'Soczyste, prosto z sadu.' },
    { id: 8, title: 'Sałata masłowa', cat: 'Warzywa', price: 400, unit: 'szt.', desc: 'Zrywana rano.', lowStock: 3 },
    { id: 9, title: 'Ziemniaki', cat: 'Warzywa', desc: 'Luzem na wagę lub w worku.',
      variants: [{ value: 'luzem', label: 'luzem — 1,80 zł / kg', price: 180 }, { value: 'worek', label: 'worek 15 kg — 25,00 zł', price: 2500 }] },
    { id: 10, title: 'Kapusta kiszona', cat: 'Kiszonki', desc: 'Własnej roboty.',
      variants: [{ value: '1kg', label: '1 kg — 8,50 zł', price: 850 }, { value: '5kg', label: '5 kg — 32,00 zł', price: 3200 }] },
    { id: 11, title: 'Ogórki kiszone', cat: 'Kiszonki', desc: 'Własnej roboty, z koprem.',
      variants: [{ value: '0.5kg', label: '0,5 kg — 11,00 zł', price: 1100 }, { value: '3kg', label: '3 kg — 48,00 zł', price: 4800 }] },
    { id: 12, title: 'Sok z kapusty kiszonej', cat: 'Kiszonki', price: 450, unit: '0,5 L', desc: 'Na odporność.' },
    { id: 13, title: 'Pyłek pszczeli', cat: 'Od pszczół', price: 2800, unit: '300 g', desc: 'Suszony, sypki.' },
    { id: 14, title: 'Propolis', cat: 'Od pszczół', price: 3500, unit: '50 g', desc: 'Nalewka domowa.' },
    { id: 15, title: 'Pomidory malinowe', cat: 'Warzywa', seasonal: true, desc: 'Cena sezonowa — ustalana indywidualnie.' },
    { id: 16, title: 'Koper', cat: 'Warzywa', seasonal: true, desc: 'Cena sezonowa — z ogródka.' },
  ],
  orders: [
    { number: '2024-118', status: 'out_for_delivery', date: '24 czerwca 2025, 18:32', amount: 8600,
      items: [{ q: 2, name: 'Miód rzepakowy', price: 4000 }, { q: 4, name: 'Jaja wiejskie', price: 130 }] },
    { number: '2024-101', status: 'delivered', date: '13 czerwca 2025, 09:14', amount: 4500,
      items: [{ q: 1, name: 'Miód lipowy', price: 4500 }] },
  ],
}
