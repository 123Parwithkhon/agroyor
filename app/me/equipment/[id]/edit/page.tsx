import { notFound } from 'next/navigation';
import { OrnateHeading } from '@/components/ornaments';
import EquipmentForm from '@/components/equipment/EquipmentForm';
import { requireUser } from '@/lib/auth-guards';
import { equipmentFormProps } from '@/lib/equipment-options';
import { getT, pageMetadata } from '@/lib/i18n-server';
import { getMyEquipmentById } from '@/lib/queries/equipment-manage';
import { updateEquipmentAction } from '../../actions';

export const generateMetadata = () => pageMetadata('page.editEquipment');

export default async function EditEquipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/me/equipment/${id}/edit`);
  const item = await getMyEquipmentById(id, user.id);
  if (!item) notFound();

  const { t } = await getT();
  const props = await equipmentFormProps();

  return (
    <div className="mx-auto w-full max-w-md">
      <OrnateHeading as="h1">{t('eq.edit')}</OrnateHeading>
      <div className="mt-6">
        <EquipmentForm
          action={updateEquipmentAction.bind(null, item.id)}
          {...props}
          initial={{
            type: item.type,
            title: item.title,
            description: item.description,
            district: item.district,
            price: item.price,
            priceUnit: item.price_unit,
            withOperator: item.with_operator,
            photos: item.photos,
            works: item.works,
            workWidthM: item.work_width_m,
            fuelLPerH: item.fuel_l_per_h,
            powerHp: item.power_hp,
            serviceRadiusKm: item.service_radius_km,
          }}
        />
      </div>
    </div>
  );
}
