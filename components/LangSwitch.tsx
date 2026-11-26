import { setLang } from '@/app/actions/lang';
import { LANG_NAMES, LANGS, type Lang, type T } from '@/lib/i18n';
import { BASE_PATH, STATIC_DEMO } from '@/lib/static-demo';

/** Переключатель языка (на тёмной шапке): обычная форма, работает и без JavaScript. */
export function LangSwitch({ lang, t }: { lang: Lang; t: T }) {
  // Демо-версия (GitHub Pages): язык — в пути, поэтому вместо формы ссылки.
  // Точный адрес текущей страницы подставляют scripts/export-static.mjs и скрипт демо-режима.
  if (STATIC_DEMO) {
    return (
      <nav className="flex rounded-lg border border-white/25 p-0.5" aria-label={t('lang.switch')}>
        {LANGS.map((value) => {
          const active = value === lang;
          const name = LANG_NAMES[value];
          return (
            <a
              key={value}
              href={`${BASE_PATH}/${value === 'tj' ? '' : `${value}/`}`}
              data-lang={value}
              title={name.full}
              aria-label={name.full}
              aria-current={active ? 'true' : undefined}
              className={`flex min-h-11 min-w-11 items-center justify-center rounded-md px-1.5 text-sm font-semibold ${
                active ? 'bg-zar-400 text-lapis-900' : 'text-white hover:bg-white/10'
              }`}
            >
              {name.short}
            </a>
          );
        })}
      </nav>
    );
  }
  return (
    <form action={setLang} className="flex rounded-lg border border-white/25 p-0.5" aria-label={t('lang.switch')}>
      {LANGS.map((value) => {
        const active = value === lang;
        const name = LANG_NAMES[value];
        return (
          <button
            key={value}
            type="submit"
            name="lang"
            value={value}
            title={name.full}
            aria-label={name.full}
            aria-pressed={active}
            className={`min-h-11 min-w-11 rounded-md px-1.5 text-sm font-semibold ${
              active ? 'bg-zar-400 text-lapis-900' : 'text-white hover:bg-white/10'
            }`}
          >
            {name.short}
          </button>
        );
      })}
    </form>
  );
}
