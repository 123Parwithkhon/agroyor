import Link from 'next/link';
import { OrnateHeading } from '@/components/ornaments';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-guards';
import { getT, pageMetadata } from '@/lib/i18n-server';
import { toggleHiddenAction } from './actions';

export const generateMetadata = () => pageMetadata('admin.equipment');

type Row ={ id: string; title: string; owner_name: string; hidden_by_admin: boolean };

export default async function AdminEquipmentPage() {
  await requireRole('admin', '/admin/equipment');
  const { t } = await getT();
  const rows = await db()<Row[]>`
    SELECT e.id::text AS id, e.title, u.name AS owner_name, e.hidden_by_admin
    FROM equipment e JOIN users u ON u.id = e.owner_id
    ORDER BY e.created_at DESC LIMIT 100
  `;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <OrnateHeading>{t('admin.equipment')}</OrnateHeading>
      <ul className="mt-6 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded-lg border border-stone-200 bg-white p-4">
            <Link href={`/equipment/${r.id}`} className="font-semibold underline">{r.title}</Link>
            <p className="text-sm text-stone-600">
              {r.owner_name}
              {r.hidden_by_admin && (
                <span className="ml-2 rounded bg-anor-50 px-2 py-0.5 text-xs text-anor-700">
                  {t('admin.hiddenLabel')}
                </span>
              )}
            </p>
            <form action={toggleHiddenAction} className="mt-3">
              <input type="hidden" name="id" value={r.id} />
              <button type="submit" className="min-h-11 rounded-lg border border-stone-300 px-3 text-sm font-medium">
                {r.hidden_by_admin ? t('admin.show') : t('admin.hide')}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}