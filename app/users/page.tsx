import { getUsersData } from '@/app/actions/users';
import UsersClient from './UsersClient';

export default async function UsersPage() {
  const { users } = await getUsersData();

  return <UsersClient initialUsers={users} />;
}