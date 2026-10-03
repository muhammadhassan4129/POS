import { getSalesData } from '@/app/actions/sales';
import SalesClient from '../../src/components/SalesClient';

export default async function SalesPage() {
  const { sales } = await getSalesData();

  return <SalesClient sales={sales} />;
}