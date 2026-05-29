import { useQuery } from '@apollo/client';
import { USERS } from '../graphql/query';

interface Address {
  type: string;
  receiver: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  addresses: Address[];
  avatar: string;
  phone: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  role: string;
}

interface UsersData {
  users: User[];
}

export const useUsers = () => {
  const { loading, error, data, refetch } = useQuery<UsersData>(USERS);
 // Filter only users with role "RIDER"
  const riders = data?.users?.filter(user => user.role === 'RIDER') || [];
  return {
    users: riders || [],
    loading,
    error,
    refetch,
    isEmpty: !riders || riders.length === 0,
  };
};
