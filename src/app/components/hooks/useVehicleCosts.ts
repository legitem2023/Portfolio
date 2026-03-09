// hooks/useVehicleCosts.ts
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_VEHICLES = gql`
  query GetVehicles {
    vehicles {
      id
      name
      cost
      perKmRate
    }
  }
`;

interface VehicleCost {
  id: string;
  name: string;
  cost: number;
  perKmRate: number;
}

export const useVehicleCosts = () => {
  const { loading, error, data } = useQuery(GET_VEHICLES);

  const vehicles = data?.vehicles || [];

  // Get cost and perKmRate for a specific vehicle by ID
  const getVehicleCosts = (vehicleId: string): VehicleCost | null => {
    const vehicle = vehicles.find((v: any) => v.id === vehicleId);
    return vehicle || null;
  };

  // Get all vehicles with their costs
  const getAllVehicleCosts = (): VehicleCost[] => {
    return vehicles;
  };

  return {
    loading,
    error,
    vehicles,
    getVehicleCosts,
    getAllVehicleCosts
  };
};
