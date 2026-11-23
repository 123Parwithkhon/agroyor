import { OrnateHeading } from '@/components/ornaments';
import CatalogForm from '@/components/admin/CatalogForm';
import { requireRole } from '@/lib/auth-guards';
import { PRODUCT_UNITS, productUnitKey } from '@/lib/equipment';
import { getT, pageMetadata } from '@/lib/i18n-server';
import { listMarkets, listProducts } from '@/lib/queries/prices-manage';
import { saveMarketAction, saveProductAction } from './actions';

export const generateMetadata = () => pageMetadata('admin.prices');

export default async function AdminPricesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  await requireRole('admin', '/admin/prices');
  const sp = await searchParams;
  const { t } = await getT();
  const [markets, products] = await Promise.all([listMarkets(false), listProducts(false)]);

  const labels = {
    nameTj: t('admin.nameTj'),
    nameRu: t('admin.nameRu'),
    nameEn: t('admin.nameEn'),
    unit: t('admin.unit'),
    sortOrder: t('admin.sortOrder'),
    active: t('admin.activeLabel'),
  };
  const units = PRODUCT_UNITS.map((u) => ({ value: u, label: t(productUnitKey(u)) }));

  return (
    <div className="mx-auto w-full max-w-3xl py-4">
      <OrnateHeading as="h1">{t('admin.prices')}</OrnateHeading>

      {sp.error && (
        <p role="alert" className="mt-4 rounded-lg bg-anor-50 p-3 text-sm text-anor-700">{t('admin.formError')}</p>
      )}
      {sp.saved && (
        <p role="status" className="mt-4 rounded-lg bg-firuza-50 p-3 text-sm">{t('admin.savedOk')}</p>
      )}

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold">{t('admin.markets')}</h2>
        {markets.map((m) => (
          <CatalogForm
            key={m.id}
            action={saveMarketAction}
            prefix="m"
            initial={m}
            labels={{ ...labels, submit: t('admin.saveItem') }}
          />
        ))}
        <CatalogForm action={saveMarketAction} prefix="m" labels={{ ...labels, submit: t('admin.addItem') }} />
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">{t('admin.products')}</h2>
        {products.map((p) => (
          <CatalogForm
            key={p.id}
            action={saveProductAction}
            prefix="p"
            units={units}
            initial={p}
            labels={{ ...labels, submit: t('admin.saveItem') }}
          />
        ))}
        <CatalogForm
          action={saveProductAction}
          prefix="p"
          units={units}
          labels={{ ...labels, submit: t('admin.addItem') }}
        />
      </section>
    </div>
  );
}
