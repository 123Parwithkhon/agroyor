// Демо-данные для локальной разработки и показа (npm run db:seed -- --demo).
// В продакшен не попадают: сид с --demo работает только с локальной PGlite.

/** Пользователи (пароль у всех demo1234). Телефоны +99290000000N. */
export const DEMO_USERS = [
  { n: 1, name: 'Раҳимҷон Каримов', district: 'b-gafurov', roles: ['user'] },
  { n: 2, name: 'Фарҳод Назаров', district: 'istaravshan', roles: ['user'] },
  { n: 3, name: 'Малика Саидова', district: 'khujand', roles: ['user', 'reporter'] },
  { n: 4, name: 'Ҷамшед Раҳимов', district: 'isfara', roles: ['user'] },
  { n: 5, name: 'Зарина Ҳасанова', district: 'konibodom', roles: ['user'] },
  { n: 6, name: 'Баҳтиёр Юсупов', district: 'spitamen', roles: ['user'] },
  { n: 7, name: 'Шоҳрух Аминов', district: 'j-rasulov', roles: ['user'] },
  { n: 8, name: 'Дилноза Қодирова', district: 'zafarobod', roles: ['user'] },
  { n: 9, name: 'Абдуллоҳ Шарипов', district: 'panjakent', roles: ['user'] },
];

/**
 * Объявления: owner — номер пользователя (n). key — для ссылок из броней ниже.
 * Названия — как пишут сами владельцы (марка/модель), описания — по-таджикски.
 */
export const DEMO_EQUIPMENT = [
  { key: 'mtz82', owner: 1, type: 'tractor', title: 'Трактор МТЗ-82', district: 'b-gafurov', price: 350, unit: 'hectare', op: true,
    description: 'Трактори МТЗ-82 бо плуг ва борона. Шудгор ва тайёр кардани замин барои кишт.\nМеханизатори ботаҷриба, 15 сол кор.' },
  { key: 'kps4', owner: 1, type: 'cultivator', title: 'Культиватор КПС-4', district: 'b-gafurov', price: 200, unit: 'day', op: false,
    description: 'Барои нарм кардани хок ва нест кардани алафҳои бегона. Ба трактори МТЗ мувофиқ аст.' },
  { key: 'neva', owner: 2, type: 'motoblock', title: 'Мотоблок Нева', district: 'istaravshan', price: 40, unit: 'hour', op: false,
    description: 'Барои замини хурд, боғ ва полиз. Бо фреза ва плуги хурд. Сӯзишворӣ аз иҷорагир.' },
  { key: 'sz36', owner: 2, type: 'seeder', title: 'Сеялка СЗ-3.6', district: 'istaravshan', price: 250, unit: 'hectare', op: true,
    description: 'Тухмипошии гандум ва ҷав. Ҳамроҳ бо трактор ва механизатор.' },
  { key: 'op2000', owner: 2, type: 'sprayer', title: 'Опрыскиватель ОП-2000', district: 'istaravshan', price: 300, unit: 'day', op: true,
    description: 'Обпошӣ ва дорупошии боғ ва киштзор. Зарфи 2000 литр, бар 18 метр.' },
  { key: 'pts4', owner: 1, type: 'trailer', title: 'Прицеп 2ПТС-4', district: 'b-gafurov', price: 150, unit: 'day', op: false,
    description: 'Барои кашонидани ҳосил, пору ва бор. То 4 тонна.' },
  { key: 'niva', owner: 4, type: 'harvester', title: 'Комбайн Нива СК-5', district: 'isfara', price: 900, unit: 'hectare', op: true,
    description: 'Ҷамъоварии гандум ва ҷав. Механизатор ва сӯзишворӣ дар нарх дохил аст.' },
  { key: 'mtz1221', owner: 4, type: 'tractor', title: 'Трактор Беларус 1221', district: 'isfara', price: 450, unit: 'hectare', op: true,
    description: 'Трактори пурқувват барои шудгори чуқур ва заминҳои калон.' },
  { key: 't40', owner: 5, type: 'drone', title: 'Дрон DJI Agras T40', district: 'konibodom', price: 120, unit: 'hectare', op: true,
    description: 'Дорупошӣ бо дрон: тез, баробар ва бе зарар ба киштзор. То 40 гектар дар як рӯз.' },
  { key: 'zubr', owner: 5, type: 'motoblock', title: 'Мотоблок Зубр JR-Q12', district: 'konibodom', price: 35, unit: 'hour', op: false,
    description: 'Мотоблоки сабук бо фреза. Барои полиз ва гармхона.' },
  { key: 'umz6', owner: 6, type: 'tractor', title: 'Трактор ЮМЗ-6', district: 'spitamen', price: 300, unit: 'hectare', op: true,
    description: 'Шудгор, кишт ва кашонидани бор. Трактор дар ҳолати хуб.' },
  { key: 'pump', owner: 6, type: 'other', title: 'Насоси обёрӣ (дизелӣ)', district: 'spitamen', price: 80, unit: 'day', op: false,
    description: 'Насоси дизелӣ барои обёрии замин аз ҷӯй ва чоҳ. Шлангҳо 50 метр.' },
  { key: 'pts2', owner: 9, type: 'trailer', title: 'Прицеп 1ПТС-2', district: 'panjakent', price: 100, unit: 'day', op: false,
    description: 'Ядаки хурд барои мева ва сабзавот.' },
  { key: 'backpack', owner: 9, type: 'sprayer', title: 'Опрыскиватель ранцевый', district: 'panjakent', price: 25, unit: 'day', op: false,
    description: 'Дорупошаки дастӣ барои боғ ва токзор. 16 литр.' },
];

/**
 * Брони относительно сегодняшнего дня (from/to — смещение в днях).
 * У завершённых (done) — отзывы обеих сторон.
 */
export const DEMO_BOOKINGS = [
  { eq: 'mtz82', renter: 7, from: -40, to: -38, status: 'done', note: 'Шудгори 3 гектар',
    reviews: [
      { by: 'renter', rating: 5, text: 'Шудгор хеле хуб шуд, механизатор ботаҷриба ва сари вақт омад.' },
      { by: 'owner', rating: 5, text: 'Мизоҷи хуб, пулро сари вақт дод.' },
    ] },
  { eq: 't40', renter: 8, from: -25, to: -25, status: 'done', note: 'Дорупошии пахта',
    reviews: [
      { by: 'renter', rating: 5, text: 'Дрон хеле тез кор кард! 12 гектарро дар ним рӯз пошид.' },
    ] },
  { eq: 'niva', renter: 5, from: -60, to: -58, status: 'done', note: 'Ҷамъоварии гандум',
    reviews: [
      { by: 'renter', rating: 4, text: 'Комбайн хуб, вале як рӯз дертар омад.' },
      { by: 'owner', rating: 5, text: 'Ҳама чиз хуб гузашт.' },
    ] },
  { eq: 'neva', renter: 8, from: -15, to: -14, status: 'done', note: '',
    reviews: [
      { by: 'renter', rating: 5, text: 'Барои полизи хурд беҳтарин. Тавсия медиҳам.' },
    ] },
  { eq: 'umz6', renter: 7, from: -20, to: -19, status: 'done', note: '',
    reviews: [
      { by: 'renter', rating: 4, text: 'Трактор кӯҳна, вале бе мушкил кор кард.' },
    ] },
  { eq: 'mtz82', renter: 8, from: 3, to: 5, status: 'confirmed', note: 'Шудгори баҳорӣ' },
  { eq: 't40', renter: 7, from: 7, to: 7, status: 'confirmed', note: '' },
  { eq: 'sz36', renter: 5, from: 10, to: 12, status: 'confirmed', note: 'Кишти гандум' },
  { eq: 'mtz82', renter: 5, from: 8, to: 9, status: 'pending', note: 'Агар имкон бошад, субҳи барвақт' },
  { eq: 'mtz1221', renter: 7, from: 2, to: 3, status: 'pending', note: '' },
  { eq: 'op2000', renter: 9, from: -5, to: -5, status: 'rejected', note: '' },
];

/** Базовые цены (сомони за единицу) и разница рынков: Хуҷанд дороже, Исфара дешевле. */
export const MARKET_FACTORS = [1.06, 1.0, 0.96];

/**
 * Виды работ и характеристики демо-техники (ключ — key объявления).
 * works не указан — берётся по виду техники; radius — радиус выезда, км (точка на карте).
 */
export const DEMO_SPECS = {
  mtz82: { power: 80, width: 2.1, fuel: 9, radius: 25 },
  kps4: { width: 4, radius: 20 },
  neva: { power: 7, width: 0.9, fuel: 1.5, radius: 10 },
  sz36: { width: 3.6, radius: 30 },
  op2000: { width: 18, radius: 30 },
  pts4: { radius: 40 },
  niva: { power: 150, width: 5, fuel: 18, radius: 50 },
  mtz1221: { power: 130, width: 3.5, fuel: 16, radius: 40 },
  t40: { width: 11, radius: 30 },
  zubr: { power: 9, width: 1, fuel: 1.8, radius: 10 },
  umz6: { power: 60, width: 2, fuel: 8, radius: 25 },
  pump: { works: ['irrigation'], power: 15, fuel: 3, radius: 15 },
  pts2: { radius: 30 },
  backpack: { works: ['spraying'], radius: 5 },
};

/**
 * Демо «совместных заказов» (складчина): организатор бронирует со своей площадью и целью,
 * соседи присоединяются. Дрон: 1,5 + 1 + 0,5 = 3 из 5 га в Бободжон Гафурове — осталось 2 га.
 */
export const DEMO_GROUPS = [
  { eq: 't40', organizer: 1, from: 6, to: 6, qty: 1.5, target: 5, status: 'pending',
    note: 'Дорупошии боғҳо — ҳамсояҳо, ҳамроҳ шавед!', joins: [{ user: 7, area: 1 }, { user: 9, area: 0.5 }] },
  { eq: 'niva', organizer: 6, from: 12, to: 13, qty: 2, target: 6, status: 'confirmed',
    note: 'Ҷамъоварии гандум', joins: [{ user: 2, area: 1.5 }] },
];

/** Демо-фото (Wikimedia Commons, авторство — lib/photo-credits.ts и public/demo-photos/CREDITS.md). */
export const DEMO_PHOTOS = {
  mtz82: '/demo-photos/mtz82.jpg',
  mtz1221: '/demo-photos/mtz1221.jpg',
  umz6: '/demo-photos/umz6.jpg',
  niva: '/demo-photos/niva.jpg',
  t40: '/demo-photos/t40.jpg',
};
