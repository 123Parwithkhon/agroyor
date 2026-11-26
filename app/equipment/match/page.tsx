import Link from 'next/link';
import { EquipmentArt } from '@/components/EquipmentArt';
import { PinIcon } from '@/components/icons';
import { OrnateHeading } from '@/components/ornaments';
import { getCurrentUser } from '@/lib/auth-guards';
import { DISTRICTS, districtName, type DistrictCode } from '@/lib/districts';
import { priceUnitKey, typeKey, type EquipmentType } from '@/lib/equipment';
import { fill } from '@/lib/fill';
import { formatMoney } from '@/lib/format';
import { districtDistanceKm, DEFAULT_RADIUS_KM } from '@/lib/geo';
import type { Lang, T } from '@/lib/i18n';
import { getT, pageMetadata } from '@/lib/i18n-server';
import {
  buildPackage,
  CROPS,
  cropKey,
  isCrop,
  isStage,
  packageTotals,
  parseHectares,
  slotsFor,
  STAGES,
  stageKey,
  trailerTrips,
  type Candidate,
  type Pick,
} from '@/lib/matcher';
import { durationText, num } from '@/lib/duration';
import { listForMatching } from '@/lib/queries/equipment-search';
import { getUserDistrict } from '@/lib/queries/user';
import { workKey } from '@/lib/works';
import { STATIC_AREAS, STATIC_DEMO } from '@/lib/static-demo';
import Icon, { type IconName } from '@/components/landing/Icon';

export const generateMetadata = () => pageMetadata('match.title');

type SP = { crop?: string; stage?: string; area?: string; district?: string };

const CROP_ICON: Record<(typeof CROPS)[number], IconName> = { onion: 'onion', potato: 'potato', cotton: 'cotton', orchard: 'apple' };
const STAGE_ICON: Record<(typeof STAGES)[number], IconName> = { prep: 'tractor', sowing: 'sprout', protection: 'shield', harvest: 'basket' };

// «Мастер в 3 клика»: культура → этап → площадь. Обычная GET-форма (работает без JavaScript),
// результат — готовый комплекс из каталога с ценой и сравнением «машиной / вручную».
export default async function MatchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { lang, t } = await getT();
  const user = await getCurrentUser();
  const userDistrict = user ? await getUserDistrict(user.id) : null;

  const crop = isCrop(sp.crop) ? sp.crop : null;
  const stage = isStage(sp.stage) ? sp.stage : null;
  const area = parseHectares(sp.area);
  const district = DISTRICTS.some((d) => d.code === sp.district)
    ? (sp.district as DistrictCode)
    : ((userDistrict as DistrictCode | null) ?? 'khujand');
  const submitted = sp.crop !== undefined || sp.stage !== undefined || sp.area !== undefined;
  const ready = crop !== null && stage !== null && area !== null;

  let picks: Pick[] = [];
  if (ready) {
    const types = [...new Set(slotsFor(crop, stage).flatMap((s) => s.types))];
    const items = await listForMatching(types);
    const candidates: Candidate[] = items.map((it) => ({
      ...it,
      distanceKm: districtDistanceKm(it.district, district) ?? 999,
      radiusKm: it.service_radius_km ?? DEFAULT_RADIUS_KM,
    }));
    picks = buildPackage(crop, stage, area, candidates);
  }
  const totals = packageTotals(picks);
  const main = picks.find((p) => p.item && p.cost);

  const tile =
    'flex min-h-14 cursor-pointer items-center gap-2 rounded-xl border-2 border-sand-200 bg-white px-3 font-semibold text-lapis-900 transition hover:border-firuza-600 has-[:checked]:border-firuza-700 has-[:checked]:bg-firuza-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-anor-600';
  const legend = 'mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-stone-600';
  const step = 'flex size-6 items-center justify-center rounded-full bg-lapis-900 text-xs text-zar-300';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/equipment" className="text-sm font-medium text-firuza-700 hover:underline">← {t('page.equipment')}</Link>
        <OrnateHeading as="h1">{t('match.title')}</OrnateHeading>
        <p className="mt-2 max-w-2xl text-stone-700">{t('match.intro')}</p>
      </div>

      <form className="grid gap-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sand-200 sm:p-6" action="/equipment/match">
        <fieldset>
          <legend className={legend}><span className={step}>1</span>{t('match.crop')}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CROPS.map((c) => (
              <label key={c} className={tile}>
                <input type="radio" name="crop" value={c} defaultChecked={crop === c} required className="sr-only" />
                <Icon name={CROP_ICON[c]} className="size-7 text-firuza-700" />
                {t(cropKey(c))}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className={legend}><span className={step}>2</span>{t('match.stage')}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STAGES.map((s) => (
              <label key={s} className={tile}>
                <input type="radio" name="stage" value={s} defaultChecked={stage === s} required className="sr-only" />
                <Icon name={STAGE_ICON[s]} className="size-7 text-firuza-700" />
                {t(stageKey(s))}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className={`${legend} sm:col-span-2`}><span className={step}>3</span>{t('match.field')}</legend>
          <label className="grid gap-1 text-sm font-medium">
            {t('match.area')}
            {STATIC_DEMO ? (
              // Демо-версия: все ответы сохранены заранее, поэтому площадь — из готового списка
              <select name="area" defaultValue={sp.area ?? '2'} className="min-h-12 rounded-xl border border-stone-300 bg-white px-3 text-lg font-semibold">
                {STATIC_AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            ) : (
              <input
                name="area"
                inputMode="decimal"
                required
                defaultValue={sp.area ?? '2'}
                className="min-h-12 rounded-xl border border-stone-300 bg-white px-3 text-lg font-semibold"
                aria-invalid={submitted && area === null ? true : undefined}
              />
            )}
          </label>
          <label className="grid gap-1 text-sm font-medium">
            {t('auth.district')}
            <select name="district" defaultValue={district} className="min-h-12 rounded-xl border border-stone-300 bg-white px-3 text-base">
              {DISTRICTS.map((d) => (
                <option key={d.code} value={d.code}>{d[lang]}</option>
              ))}
            </select>
          </label>
          {submitted && area === null && (
            <p role="alert" className="text-sm text-anor-700 sm:col-span-2">{t('match.areaError')}</p>
          )}
        </fieldset>
        <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-zar-400 px-6 text-lg font-bold text-lapis-900 shadow hover:bg-zar-300">
          <Icon name="sparkles" className="inline-block size-[1.1em] shrink-0 align-[-0.15em] me-1.5" />{t('match.submit')}
        </button>
      </form>

      {ready && (
        <section aria-live="polite" className="flex flex-col gap-4">
          <OrnateHeading>{t('match.result')}</OrnateHeading>

          {main?.item && main.cost ? (
            <p className="rounded-2xl bg-lapis-900 p-5 text-lg leading-relaxed text-white on-dark">
              {fill(t('match.headline'), {
                area: num(area, lang),
                crop: t(cropKey(crop)).toLowerCase(),
                stage: t(stageKey(stage)).toLowerCase(),
                district: districtName(district, lang),
              })}{' '}
              <b className="text-zar-300">{main.item.title}</b>{' '}
              ({costText(main, lang, t)}
              {main.manualDays !== null &&
                `, ${fill(t('match.vsManual'), {
                  machine: durationText(main.hours, t),
                  manual: `${num(main.manualDays, lang)} ${t('dur.days')}`,
                })}`}
              ).
            </p>
          ) : null}

          <ol className="grid gap-3">
            {picks.map((p, i) => (
              <li key={`${p.slot.work}-${i}`} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sand-200">
                <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
                  {i + 1}. {t(workKey(p.slot.work))}
                </p>
                {p.item && p.cost ? (
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                    {p.item.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.item.photo} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover" loading="lazy" />
                    ) : (
                      <EquipmentArt type={p.item.type} className="h-20 w-28 shrink-0 rounded-lg" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-lapis-900">{p.item.title}</p>
                      <p className="text-sm text-stone-600">
                        {t(typeKey(p.item.type))} ·{' '}
                        <span className="inline-flex items-center gap-1">
                          <PinIcon className="size-4 text-anor-600" />
                          {districtName(p.item.district, lang)}
                          {p.item.distanceKm > 0 && ` (${fill(t('match.km'), { km: Math.round(p.item.distanceKm) })})`}
                        </span>
                      </p>
                      <p className="mt-1 text-sm">
                        <b className="text-firuza-800">{costText(p, lang, t)}</b>
                        {' · '}
                        {p.slot.work === 'transport' && crop
                          ? fill(t('match.trips'), { trips: trailerTrips(area, crop), time: durationText(p.hours, t) })
                          : fill(t('match.machineTime'), { time: durationText(p.hours, t) })}
                        {p.manualDays !== null && (
                          <span className="text-stone-600"> · {fill(t('match.manualTime'), { days: num(p.manualDays, lang) })}</span>
                        )}
                      </p>
                      {p.item.distanceKm > p.item.radiusKm && (
                        <p className="mt-1 text-xs text-anor-700">{t('match.farAway')}</p>
                      )}
                    </div>
                    <Link href={`/equipment/${p.item.id}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-firuza-700 px-4 font-semibold text-white hover:bg-firuza-800">
                      {t('match.book')}
                    </Link>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-anor-50 p-3">
                    <p className="text-sm text-anor-700">
                      {fill(t('match.none'), { type: p.slot.types.map((x: EquipmentType) => t(typeKey(x))).join(' / ') })}
                    </p>
                    <Link
                      href={`/requests/new?type=${p.slot.types[0]}&district=${district}&area=${area}`}
                      className="inline-flex min-h-11 items-center rounded-xl bg-anor-600 px-4 font-semibold text-white"
                    >
                      <Icon name="megaphone" className="inline-block size-[1.1em] shrink-0 align-[-0.15em] me-1.5" />{t('demand.cta')}
                    </Link>
                  </div>
                )}
                {p.alternatives.length > 0 && (
                  <details className="mt-2 text-sm">
                    <summary className="cursor-pointer font-medium text-firuza-700">{t('match.more')} ({p.alternatives.length})</summary>
                    <ul className="mt-2 grid gap-1">
                      {p.alternatives.map((a) => (
                        <li key={a.id}>
                          <Link href={`/equipment/${a.id}`} className="underline underline-offset-2">{a.title}</Link>
                          {' — '}
                          {formatMoney(a.price, lang)} / {t(priceUnitKey(a.price_unit))}, {districtName(a.district, lang)}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            ))}
          </ol>

          {totals.missing < picks.length && (
            <div className="grid gap-3 rounded-2xl bg-firuza-50 p-5 ring-1 ring-firuza-100 sm:grid-cols-3">
              <div>
                <p className="text-sm text-stone-600">{t('match.total')}</p>
                <p className="text-2xl font-extrabold text-lapis-900">{formatMoney(totals.cost, lang)}</p>
              </div>
              <div>
                <p className="text-sm text-stone-600">{t('match.totalMachine')}</p>
                <p className="text-2xl font-extrabold text-firuza-800">{durationText(totals.hours, t)}</p>
              </div>
              {totals.manualDays > 0 && (
                <div>
                  <p className="text-sm text-stone-600">{t('match.totalManual')}</p>
                  <p className="text-2xl font-extrabold text-anor-700">{num(totals.manualDays, lang)} {t('dur.days')}</p>
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-stone-500">{t('match.note')}</p>
        </section>
      )}
    </div>
  );
}

/** «120 с./га × 2 га = 240 с.» */
function costText(p: Pick, lang: Lang, t: T): string {
  if (!p.item || !p.cost) return '';
  const unit = t(priceUnitKey(p.cost.unit));
  const qty = num(p.cost.qty, lang);
  return `${formatMoney(p.item.price, lang)}/${unit} × ${qty} = ${formatMoney(p.cost.total, lang)}`;
}
