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

  return {
    users: data?.users || [],
    loading,
    error,
    refetch,
    isEmpty: !data?.users || data.users.length === 0,
  };
};
