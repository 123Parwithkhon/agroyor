import { OrnateHeading } from '@/components/ornaments';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-guards';
import { getT, pageMetadata } from '@/lib/i18n-server';
import { formatPhone } from '@/lib/phone';
import ResetPassword from '@/components/admin/ResetPassword';
import { resetPasswordAction, toggleBlockAction, toggleRoleAction } from './actions';

type UserRow = { id: string; name: string; phone: string; roles: string[]; blocked: boolean };

export const generateMetadata = () => pageMetadata('page.admin');

// Экранируем символы шаблона LIKE
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const me = await requireRole('admin', '/admin');
  const { q = '' } = await searchParams;
  const { t } = await getT();

  const term = q.trim().slice(0, 60);
  const nameLike = `%${escapeLike(term)}%`;
  const phoneLike = `%${escapeLike(term.replace(/[\s()-]/g, ''))}%`;

  const sql = db();
  const rows = await sql<UserRow[]>`
    SELECT id::text AS id, name, phone, roles, blocked FROM users
    WHERE ${term === '' ? sql`true` : sql`(name ILIKE ${nameLike} OR phone ILIKE ${phoneLike})`}
    ORDER BY created_at DESC
    LIMIT 100
  `;

  const btn = 'min-h-11 rounded-lg border border-stone-300 px-3 text-sm font-medium';
  const resetLabels = {
    button: t('admin.resetPassword'),
    confirm: t('admin.resetConfirm'),
    result: t('admin.tempPassword'),
    hint: t('admin.tempHint'),
    error: t('err.generic'),
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <OrnateHeading>{t('admin.users')}</OrnateHeading>

      <form className="mt-6 flex gap-2" role="search">
        <input
          name="q"
          defaultValue={term}
          placeholder={t('admin.searchPlaceholder')}
          aria-label={t('admin.search')}
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 text-base"
        />
        <button type="submit" className="min-h-11 rounded-lg bg-firuza-700 px-4 font-semibold text-white">
          {t('admin.search')}
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="mt-6">{t('admin.noUsers')}</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((u) => {
            const isMe = u.id === me.id;
            return (
              <li key={u.id} className="rounded-lg border border-stone-200 bg-white p-4">
                <p className="font-semibold">
                  {u.name} {isMe && <span className="text-sm font-normal">({t('admin.you')})</span>}
                  {u.blocked && (
                    <span className="ml-2 rounded bg-anor-50 px-2 py-0.5 text-xs text-anor-700">
                      {t('admin.blockedLabel')}
                    </span>
                  )}
                </p>
                <p className="text-sm text-stone-600">{formatPhone(u.phone)}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {!isMe && (
                    <ResetPassword action={resetPasswordAction.bind(null, u.id)} labels={resetLabels} />
                  )}
                  {(['reporter', 'admin'] as const).map((role) => {
                    const has = u.roles.includes(role);
                    const label = role === 'reporter' ? t('admin.roleReporter') : t('admin.roleAdmin');
                    const disabled = isMe && role === 'admin';
                    return (
                      <form key={role} action={toggleRoleAction}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="role" value={role} />
                        <button type="submit" disabled={disabled} className={`${btn} disabled:opacity-40`}>
                          {label}: {has ? t('admin.take') : t('admin.give')}
                        </button>
                      </form>
                    );
                  })}
                  <form action={toggleBlockAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button type="submit" disabled={isMe} className={`${btn} disabled:opacity-40`}>
                      {u.blocked ? t('admin.unblock') : t('admin.block')}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}