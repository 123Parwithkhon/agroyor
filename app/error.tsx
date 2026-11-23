'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { GirihStar } from '@/components/ornaments';
import { DEFAULT_LANG, getDictionary, langFromCookieString, type Lang } from '@/lib/i18n';

const noopSubscribe = () => () => {};

/** Язык из cookie на клиенте; при серверном рендере — язык по умолчанию. */
function useClientLang(): Lang {
  return useSyncExternalStore(
    noopSubscribe,
    () => langFromCookieString(document.cookie),
    () => DEFAULT_LANG,
  );
}

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const t = getDictionary(useClientLang());

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex flex-col items-center py-10 text-center">
      <GirihStar className="size-12 text-anor-600" />
      <h1 className="mt-3 text-2xl font-bold text-lapis-900">{t('error.title')}</h1>
      <p className="mt-2 text-stone-600">{t('error.text')}</p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-firuza-700 px-5 font-semibold text-white hover:bg-firuza-800"
      >
        {t('error.retry')}
      </button>
    </section>
  );
}
