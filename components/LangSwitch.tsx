import { setLang } from '@/app/actions/lang';
import { LANG_NAMES, LANGS, type Lang, type T } from '@/lib/i18n';

/** Переключатель языка (на тёмной шапке): обычная форма, работает и без JavaScript. */
export function LangSwitch({ lang, t }: { lang: Lang; t: T }) {
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
