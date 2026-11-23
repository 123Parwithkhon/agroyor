import 'server-only';
import { getT } from '@/lib/i18n-server';
import { authMessages } from '@/lib/auth-messages';
import { DISTRICTS } from '@/lib/districts';
import { EQUIPMENT_TYPES, PRICE_UNITS, priceUnitKey, typeKey } from '@/lib/equipment';

// Подписи и списки для формы объявления на языке пользователя
export async function equipmentFormProps() {
  const { lang, t } = await getT();
  return {
    msgs: await authMessages(),
    types: EQUIPMENT_TYPES.map((k) => ({ value: k, label: t(typeKey(k)) })),
    units: PRICE_UNITS.map((u) => ({ value: u, label: t(priceUnitKey(u)) })),
    districts: DISTRICTS.map((d) => ({ value: d.code, label: d[lang] })),
    labels: {
      type: t('eq.kind'),
      title: t('eq.title'),
      description: t('eq.description'),
      district: t('auth.district'),
      price: t('eq.price'),
      priceUnit: t('eq.priceUnit'),
      withOperator: t('eq.withOperator'),
      photos: t('eq.photos'),
      photosAdd: t('eq.photosAdd'),
      photoRemove: t('eq.photoRemove'),
      photoUploading: t('eq.photoUploading'),
      save: t('eq.save'),
    },
  };
}
