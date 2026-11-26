import Link from 'next/link';
import { EquipmentGlyph } from '@/components/EquipmentArt';
import { EquipmentCard } from '@/components/EquipmentCard';
import { HeroLandscape } from '@/components/landing/HeroLandscape';
import Icon, { type IconName } from '@/components/landing/Icon';
import { OrnateHeading } from '@/components/ornaments';
import SeasonCalendar, { type SeasonView } from '@/components/season/SeasonCalendar';
import { isSeasonalProduct, SEASON_INFO, SEASONS, seasonMonthsKey, seasonOf, seasonTasksKey, seasonTitleKey } from '@/lib/season';
import Delta from '@/components/prices/Delta';
import { getCurrentUser } from '@/lib/auth-guards';
import { DISTRICTS } from '@/lib/districts';
import { EQUIPMENT_TYPES, productUnitKey, typeKey, type EquipmentType } from '@/lib/equipment';
import { formatAmount, formatDate, todayInDushanbe } from '@/lib/format';
import { getT } from '@/lib/i18n-server';
import { pickName } from '@/lib/prices-rules';
import { searchEquipment } from '@/lib/queries/equipment-search';
import { getLandingStats } from '@/lib/queries/landing';
import {
  getLatestPriceDate,
  getPreviousPrices,
  getPricesByDate,
  listMarkets,
  listProducts,
} from '@/lib/queries/prices-manage';

// Кнопки: золотая — главное действие на тёмном фоне, контурная — второстепенное
const btnGold =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-zar-400 px-6 font-bold text-lapis-900 shadow-lg shadow-zar-500/20 transition hover:bg-zar-300';
const btnOutline =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/5 px-6 font-semibold text-white backdrop-blur-sm transition hover:bg-white/15';
const control = 'min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base';
const moreLink =
  'inline-flex min-h-11 items-center gap-1 font-semibold text-firuza-700 hover:text-firuza-800 hover:underline';

// Быстрые ссылки под формой поиска
const POPULAR: EquipmentType[] = ['tractor', 'harvester', 'drone'];

type Step = { icon: IconName; text: string };

/** Шаги «как это работает»: номера на вертикальной пунктирной линии. */
function Steps({ steps, tone }: { steps: Step[]; tone: 'firuza' | 'zar' }) {
  const dot = tone === 'firuza' ? 'bg-firuza-700 text-white' : 'bg-zar-400 text-lapis-900';
  return (
    <ol className="ms-5 space-y-6 border-s-2 border-dashed border-sand-300">
      {steps.map((s, i) => (
        <li key={s.text} className="relative ps-9">
          <span
            className={`absolute -start-[21px] top-0 flex size-10 items-center justify-center rounded-full font-bold ring-4 ring-white ${dot}`}
          >
            {i + 1}
          </span>
          <span className="flex items-start gap-2 pt-2">
            <Icon name={s.icon} className="mt-0.5 size-5 shrink-0 text-stone-500" />
            <span>{s.text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Заголовок раздела с подзаголовком и ссылкой «смотреть всё» справа. */
function SectionHead({ title, text, more }: { title: string; text?: string; more?: { href: string; label: string } }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
      <div>
        <OrnateHeading>{title}</OrnateHeading>
        {text && <p className="mt-1 text-stone-600">{text}</p>}
      </div>
      {more && (
        <Link href={more.href} className={moreLink}>
          {more.label}
          <Icon name="arrow" className="size-4" />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const { t, lang } = await getT();
  const user = await getCurrentUser();

  const latestDate = await getLatestPriceDate(todayInDushanbe());
  const [stats, catalog, markets, products, prices, previous] = await Promise.all([
    getLandingStats(),
    searchEquipment({ operator: false, sort: 'new', page: 1 }),
    listMarkets(true),
    listProducts(true),
    latestDate ? getPricesByDate(latestDate) : Promise.resolve([]),
    latestDate ? getPreviousPrices(latestDate) : Promise.resolve([]),
  ]);

  const cell = new Map(prices.map((p) => [`${p.market_id}|${p.product_id}`, p.price]));
  const before = new Map(previous.map((p) => [`${p.market_id}|${p.product_id}`, p.price]));
  const deltaLabels = { up: t('prc.up'), down: t('prc.down'), same: t('prc.same') };
  // На главной — только продукты, у которых есть цена за последний день
  const shownProducts = products
    .filter((p) => markets.some((m) => cell.has(`${m.id}|${p.id}`)))
    .slice(0, 6);
  const latest = catalog.items.slice(0, 6);

  const ownerHref = user ? '/me/equipment/new' : '/register';
  const ownerLabel = user ? t('land.ctaOwner') : t('land.joinBtn');

  const farmerSteps: Step[] = [
    { icon: 'search', text: t('land.f1') },
    { icon: 'calendar', text: t('land.f2') },
    { icon: 'phone', text: t('land.f3') },
  ];
  const ownerSteps: Step[] = [
    { icon: 'plus', text: t('land.o1') },
    { icon: 'user', text: t('land.o2') },
    { icon: 'phone', text: t('land.o3') },
  ];
  const why: { icon: IconName; title: string; text: string }[] = [
    { icon: 'globe', title: t('land.why1t'), text: t('land.why1') },
    { icon: 'phoneDevice', title: t('land.why2t'), text: t('land.why2') },
    { icon: 'shield', title: t('land.why3t'), text: t('land.why3') },
    { icon: 'calendar', title: t('land.why4t'), text: t('land.why4') },
  ];
  // Агро-календарь: шесть периодов, сезонные продукты — из активных продуктов рынка
  const seasons: SeasonView[] = SEASONS.map((s) => ({
    id: s,
    title: t(seasonTitleKey(s)),
    months: t(seasonMonthsKey(s)),
    tasks: t(seasonTasksKey(s)),
    types: SEASON_INFO[s].types.map((k) => ({ key: k, label: t(typeKey(k)) })),
    products: products.filter((p) => isSeasonalProduct(s, p.name_en ?? '')).map((p) => ({ id: p.id, name: pickName(p, lang) })),
  }));
  const tools: { href: string; icon: IconName; title: string; text: string; accent: string }[] = [
    { href: '/equipment/match', icon: 'sparkles', title: t('tools.match'), text: t('tools.matchText'), accent: 'border-zar-500' },
    { href: '/requests', icon: 'megaphone', title: t('tools.demand'), text: t('tools.demandText'), accent: 'border-anor-600' },
    { href: '/trips', icon: 'truck', title: t('tools.trips'), text: t('tools.tripsText'), accent: 'border-firuza-600' },
    { href: '/analytics', icon: 'bars', title: t('tools.analytics'), text: t('tools.analyticsText'), accent: 'border-lapis-700' },
  ];

  const statItems = [
    { value: stats.equipment, label: t('land.statEquipment') },
    { value: stats.markets, label: t('land.statMarkets') },
    { value: stats.products, label: t('land.statProducts') },
  ];

  return (
    <>
      {/* 1. Герой: небо на рассвете, горы и поля; слева текст, справа поиск */}
      <section className="full-bleed hero-sky on-dark relative -mt-6 overflow-hidden text-white">
        <HeroLandscape id="hero" className="pointer-events-none absolute inset-0 size-full" />
        {/* Затемнение слева и сверху — белый текст читается поверх гор */}
        <div aria-hidden="true" className="hero-scrim pointer-events-none absolute inset-0" />

        <div className="relative mx-auto grid w-full max-w-5xl grid-cols-1 gap-10 px-4 pb-48 pt-12 sm:pb-64 sm:pt-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center lg:gap-14 lg:pb-72">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zar-300">{t('land.eyebrow')}</p>
            <h1 className="mt-4 text-[2rem] font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              {t('land.heroTitle')}
              <span className="text-gold mt-2 block">{t('land.heroAccent')}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-lapis-100/90">{t('land.heroText')}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/equipment" className={btnGold}>
                <Icon name="search" className="size-5" />
                {t('land.ctaFind')}
              </Link>
              <Link href="/prices" className={btnOutline}>
                <Icon name="chart" className="size-5" />
                {t('land.ctaPrices')}
              </Link>
            </div>
            {latestDate && (
              // «Живые» данные: пульсирующая точка рядом с датой последних цен
              <p className="mt-6 inline-flex items-center gap-2 text-sm text-lapis-100/80">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full rounded-full bg-firuza-100 opacity-70 motion-safe:animate-ping" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-firuza-100" />
                </span>
                {t('land.pricesAsOf')} {formatDate(latestDate, lang)}
              </p>
            )}
          </div>

          {/* Обычная GET-форма каталога: работает без JavaScript */}
          <form
            action="/equipment"
            role="search"
            className="on-light rise rise-2 rounded-3xl bg-white/95 p-6 text-stone-900 shadow-2xl shadow-black/40 ring-1 ring-white/40 backdrop-blur sm:p-7"
          >
            <h2 className="text-xl font-bold text-lapis-900">{t('land.searchTitle')}</h2>
            <div className="mt-5 grid gap-3">
              <select name="type" defaultValue="" aria-label={t('eq.kind')} className={control}>
                <option value="">{t('land.anyType')}</option>
                {EQUIPMENT_TYPES.map((k) => (
                  <option key={k} value={k}>{t(typeKey(k))}</option>
                ))}
              </select>
              <select name="district" defaultValue="" aria-label={t('auth.district')} className={control}>
                <option value="">{t('land.anyDistrict')}</option>
                {DISTRICTS.map((d) => (
                  <option key={d.code} value={d.code}>{d[lang]}</option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-firuza-700 px-4 font-bold text-white transition hover:bg-firuza-800"
              >
                {t('land.searchBtn')}
                <Icon name="arrow" className="size-5" />
              </button>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-sand-200 pt-4 text-sm">
              <span className="text-stone-500">{t('land.popular')}</span>
              {POPULAR.map((k) => (
                <Link
                  key={k}
                  href={`/equipment?type=${k}`}
                  className="inline-flex min-h-9 items-center rounded-full bg-sand-100 px-3 font-medium text-lapis-800 transition hover:bg-lapis-900 hover:text-white"
                >
                  {t(typeKey(k))}
                </Link>
              ))}
            </div>
          </form>
        </div>
      </section>

      {/* 2. Цифры — карточка, наезжающая на поля */}
      <section className="rise rise-3 relative z-10 -mt-12 sm:-mt-16">
        <dl className="grid grid-cols-3 divide-x divide-sand-200 rounded-2xl bg-white py-5 shadow-xl shadow-lapis-900/10 ring-1 ring-sand-200 sm:py-7">
          {statItems.map((s) => (
            <div key={s.label} className="flex flex-col-reverse items-center gap-1 px-2 text-center">
              <dt className="text-xs leading-snug text-stone-600 sm:text-sm">{s.label}</dt>
              <dd className="text-3xl font-extrabold tabular-nums text-lapis-900 sm:text-5xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="space-y-16 pt-16 sm:space-y-24 sm:pt-20">
        {/* Агро-календарь сезона: что делать сейчас, какая техника и какие товары в сезоне */}
        <section>
          <SectionHead title={t('season.title')} text={t('season.text')} />
          <div className="mt-6">
            <SeasonCalendar
              seasons={seasons}
              current={seasonOf(todayInDushanbe())}
              labels={{
                now: t('season.now'), equipment: t('season.equipment'), products: t('season.products'),
                openPrices: t('season.openPrices'), match: t('match.cta'),
              }}
            />
          </div>
        </section>

        {/* Умные инструменты: подбор комплекса, клич, рейс на рынок, аналитика региона */}
        <section>
          <SectionHead title={t('tools.title')} text={t('tools.text')} />
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((x) => (
              <li key={x.href} className="grid">
                <Link
                  href={x.href}
                  className={`group flex flex-col gap-2 rounded-2xl border-t-4 bg-white p-5 shadow-sm ring-1 ring-sand-200 transition hover:-translate-y-0.5 hover:shadow-lg ${x.accent}`}
                >
                  <Icon name={x.icon} className="size-9 text-lapis-800" />
                  <span className="text-lg font-bold text-lapis-900 group-hover:underline">{x.title}</span>
                  <span className="text-sm leading-relaxed text-stone-600">{x.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 3. Виды техники — спокойные белые карточки с контурными иконками */}
        <section>
          <SectionHead title={t('land.typesTitle')} text={t('land.typesText')} />
          <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
            {EQUIPMENT_TYPES.map((k) => (
              <li key={k}>
                <Link
                  href={`/equipment?type=${k}`}
                  className="group flex h-full flex-col items-center gap-2 rounded-2xl bg-white px-1 py-4 text-center ring-1 ring-sand-200 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-firuza-600"
                >
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-sand-50 text-lapis-800 transition group-hover:bg-lapis-900 group-hover:text-zar-300">
                    <EquipmentGlyph type={k} className="size-9" />
                  </span>
                  <span className="text-xs font-semibold leading-tight text-lapis-900 hyphens-auto sm:text-sm">
                    {t(typeKey(k))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 4. Как это работает: фермер и владелец */}
        <section>
          <SectionHead title={t('land.howTitle')} />
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl border-t-4 border-firuza-600 bg-white p-6 shadow-sm ring-1 ring-sand-200">
              <h3 className="mb-6 text-lg font-bold text-lapis-900">{t('land.farmerTitle')}</h3>
              <Steps steps={farmerSteps} tone="firuza" />
              <Link href="/equipment" className={`${moreLink} mt-6`}>
                {t('land.ctaFind')}
                <Icon name="arrow" className="size-4" />
              </Link>
            </div>
            <div className="flex flex-col rounded-2xl border-t-4 border-zar-500 bg-white p-6 shadow-sm ring-1 ring-sand-200">
              <h3 className="mb-6 text-lg font-bold text-lapis-900">{t('land.ownerTitle')}</h3>
              <Steps steps={ownerSteps} tone="zar" />
              <Link href={ownerHref} className={`${moreLink} mt-6`}>
                {ownerLabel}
                <Icon name="arrow" className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* 5. Цены на рынках за последний день */}
        <section>
          <SectionHead title={t('land.pricesTitle')} more={{ href: '/prices', label: t('land.pricesAll') }} />
          {latestDate && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-firuza-50 px-3 py-1 text-sm font-medium text-firuza-800">
              <Icon name="calendar" className="size-4" />
              {t('land.pricesAsOf')} {formatDate(latestDate, lang)}
            </p>
          )}
          {shownProducts.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-white p-5 text-center text-stone-600 ring-1 ring-sand-200">
              {t('prc.noData')}
            </p>
          ) : (
            // relative — чтобы скрытые подписи Delta (sr-only, absolute) не вылезали за контейнер
            <div className="relative mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-sand-200">
              <table className="w-full min-w-[20rem] text-left text-sm sm:text-base">
                <thead className="bg-lapis-900 text-white">
                  <tr>
                    <th scope="col" className="p-3 font-semibold">{t('prc.product')}</th>
                    {markets.map((m) => (
                      <th key={m.id} scope="col" className="p-3 text-right font-semibold">{pickName(m, lang)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shownProducts.map((p) => (
                    <tr key={p.id} className="border-t border-sand-200 even:bg-sand-50">
                      <th scope="row" className="p-3 font-medium">
                        <Link
                          href={`/prices/${p.id}`}
                          className="text-lapis-900 underline decoration-sand-300 underline-offset-4 hover:decoration-firuza-600"
                        >
                          {pickName(p, lang)}
                        </Link>
                        <span className="block text-xs font-normal text-stone-500">/ {t(productUnitKey(p.unit))}</span>
                      </th>
                      {markets.map((m) => {
                        const k = `${m.id}|${p.id}`;
                        const v = cell.get(k);
                        const old = before.get(k);
                        return (
                          <td key={m.id} className="p-3 text-right align-top font-semibold tabular-nums">
                            {v === undefined ? (
                              <span className="text-stone-400">—</span>
                            ) : (
                              <>
                                {formatAmount(v, lang)}
                                <Delta delta={old === undefined ? null : v - old} labels={deltaLabels} lang={lang} />
                              </>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 6. Свежие объявления */}
        {latest.length > 0 && (
          <section>
            <SectionHead title={t('land.latestTitle')} more={{ href: '/equipment', label: t('land.latestAll') }} />
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((it) => (
                <li key={it.id} className="grid">
                  <EquipmentCard item={it} lang={lang} t={t} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 7. Почему AgroYor — заголовок слева, четыре пункта справа */}
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12">
          <div>
            <OrnateHeading>{t('land.whyTitle')}</OrnateHeading>
            <p className="mt-3 text-stone-600">{t('app.tagline')}</p>
          </div>
          <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
            {why.map((w) => (
              <li key={w.title} className="flex gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-lapis-900 text-zar-300">
                  <Icon name={w.icon} />
                </span>
                <div>
                  <p className="font-bold text-lapis-900">{w.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">{w.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 8. Призыв для владельцев техники: тот же рассвет, что и наверху */}
        <section className="hero-sky on-dark relative overflow-hidden rounded-3xl px-6 pb-40 pt-12 text-center text-white shadow-xl sm:px-12 sm:pb-52">
          <HeroLandscape id="join" compact className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full sm:h-44" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t('land.joinTitle')}</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-lapis-100/90">{t('land.joinText')}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={ownerHref} className={btnGold}>
                <Icon name="plus" className="size-5" />
                {ownerLabel}
              </Link>
              <Link href="/equipment" className={btnOutline}>
                {t('land.ctaFind')}
              </Link>
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-zar-300">{t('land.expo')}</p>
          </div>
        </section>
      </div>
    </>
  );
}
