import { OrnateHeading } from '@/components/ornaments';
import EquipmentForm from '@/components/equipment/EquipmentForm';
import { requireUser } from '@/lib/auth-guards';
import { equipmentFormProps } from '@/lib/equipment-options';
import { getT, pageMetadata } from '@/lib/i18n-server';
import { createEquipmentAction } from '../actions';

export const generateMetadata = () => pageMetadata('page.newEquipment');

export default async function NewEquipmentPage() {
  await requireUser('/me/equipment/new');
  const { t } = await getT();
  const props = await equipmentFormProps();

  return (
    <div className="mx-auto w-full max-w-md">
      <OrnateHeading as="h1">{t('eq.add')}</OrnateHeading>
      <div className="mt-6">
        <EquipmentForm action={createEquipmentAction} {...props} />
      </div>
    </div>
  );
}
