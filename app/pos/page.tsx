import { getPosData } from '@/app/actions/pos';
import { getStoreSettings } from '@/app/actions/settings';
import PosClient from '@/src/components/PosClient';

export default async function PosPage() {
  const { products, customers } = await getPosData();
  const settings = await getStoreSettings(); // Prisma se storeSetting fetch karein

  return (
    <div>
      <PosClient products={products} customers={customers} settings={settings} />
    </div>
  );
}