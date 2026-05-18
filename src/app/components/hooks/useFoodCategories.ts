// hooks/useFoodCategories.ts
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_FOOD_CATEGORIES = gql`
  query GetFoodCategories($accountId: ID!) {
    foodCategories(accountId: $accountId) {
      id
      name
      accountId
      items {
        id
        name
        categoryId
        accountId
      }
    }
  }
`;

interface FoodItem {
  id: string;
  name: string;
  categoryId: string;
  accountId: string;
}

interface FoodCategory {
  id: string;
  name: string;
  accountId: string;
  items: FoodItem[];
}

export const useFoodCategories = (accountId: string) => {
  const { loading, error, data } = useQuery(GET_FOOD_CATEGORIES, {
    variables: { accountId }
  });

  const foodCategories = data?.foodCategories || [];

  return {
    loading,
    error,
    foodCategories
  };
};
