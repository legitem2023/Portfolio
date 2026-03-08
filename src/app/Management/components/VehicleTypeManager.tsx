// components/VehicleTypeManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';

// GraphQL Queries and Mutations
const GET_VEHICLES = gql`
  query GetVehicles {
    vehicles {
      id
      name
      maxCapacityKg
      maxVolumeM3
      description
      icon
      cost
      perKmRate
      rushTimeAdd
      createdAt
      updatedAt
    }
  }
`;

const CREATE_VEHICLE = gql`
  mutation CreateVehicle($input: CreateVehicleTypeInput!) {
    createVehicleType(input: $input) {
      success
      message
      vehicleType {
        id
        name
        maxCapacityKg
        maxVolumeM3
        description
        icon
        cost
        perKmRate
        rushTimeAdd
      }
      errors {
        field
        message
      }
    }
  }
`;

const UPDATE_VEHICLE = gql`
  mutation UpdateVehicle($id: String!, $input: UpdateVehicleTypeInput!) {
    updateVehicleType(id: $id, input: $input) {
      success
      message
      vehicleType {
        id
        name
        maxCapacityKg
        maxVolumeM3
        description
        icon
        cost
        perKmRate
        rushTimeAdd
      }
      errors {
        field
        message
      }
    }
  }
`;

const DELETE_VEHICLE = gql`
  mutation DeleteVehicle($id: String!) {
    deleteVehicleType(id: $id) {
      success
      message
      deletedId
      errors {
        field
        message
      }
    }
  }
`;

// Types
interface VehicleType {
  id: string;
  name: string;
  maxCapacityKg: number;
  maxVolumeM3: number;
  description?: string;
  icon: string;
  cost: number;
  perKmRate: number;
  rushTimeAdd: number;
  createdAt: string;
  updatedAt: string;
}

interface VehicleFormData {
  name: string;
  maxCapacityKg: number;
  maxVolumeM3: number;
  description: string;
  icon: string;
  cost: number;
  perKmRate: number;
  rushTimeAdd: number;
}

const initialFormData: VehicleFormData = {
  name: '',
  maxCapacityKg: 0,
  maxVolumeM3: 0,
  description: '',
  icon: '🚚',
  cost: 0,
  perKmRate: 0,
  rushTimeAdd: 0
};

export default function VehicleTypeManager() {
  const [vehicles, setVehicles] = useState<VehicleType[]>([]);
  const [formData, setFormData] = useState<VehicleFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Queries and Mutations
  const { loading, error, data, refetch } = useQuery(GET_VEHICLES);
  const [createVehicle] = useMutation(CREATE_VEHICLE);
  const [updateVehicle] = useMutation(UPDATE_VEHICLE);
  const [deleteVehicle] = useMutation(DELETE_VEHICLE);

  // Update local state when data is fetched
  useEffect(() => {
    if (data?.vehicles) {
      setVehicles(data.vehicles);
    }
  }, [data]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(false);
    setMessage(null);
  };

  // Handle form submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        // Update existing vehicle
        const { data } = await updateVehicle({
          variables: {
            id: editingId,
            input: formData
          }
        });

        if (data.updateVehicleType.success) {
          setMessage({ type: 'success', text: 'Vehicle updated successfully!' });
          refetch();
          resetForm();
        } else {
          setMessage({ 
            type: 'error', 
            text: data.updateVehicleType.errors?.map((e: any) => e.message).join(', ') 
          });
        }
      } else {
        // Create new vehicle
        const { data } = await createVehicle({
          variables: { input: formData }
        });

        if (data.createVehicleType.success) {
          setMessage({ type: 'success', text: 'Vehicle created successfully!' });
          refetch();
          resetForm();
        } else {
          setMessage({ 
            type: 'error', 
            text: data.createVehicleType.errors?.map((e: any) => e.message).join(', ') 
          });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Handle edit
  const handleEdit = (vehicle: VehicleType) => {
    setFormData({
      name: vehicle.name,
      maxCapacityKg: vehicle.maxCapacityKg,
      maxVolumeM3: vehicle.maxVolumeM3,
      description: vehicle.description || '',
      icon: vehicle.icon,
      cost: vehicle.cost,
      perKmRate: vehicle.perKmRate,
      rushTimeAdd: vehicle.rushTimeAdd
    });
    setEditingId(vehicle.id);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle type?')) return;

    try {
      const { data } = await deleteVehicle({
        variables: { id }
      });

      if (data.deleteVehicleType.success) {
        setMessage({ type: 'success', text: 'Vehicle deleted successfully!' });
        refetch();
      } else {
        setMessage({ 
          type: 'error', 
          text: data.deleteVehicleType.errors?.map((e: any) => e.message).join(', ') 
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (loading) return <div className="p-4">Loading vehicles...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Vehicle Type Manager</h1>

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
          <button 
            className="float-right font-bold"
            onClick={() => setMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Add New Button */}
      {!showForm && (
        <button
          className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => setShowForm(true)}
        >
          + Add New Vehicle Type
        </button>
      )}

      {/* Create/Update Form */}
      {showForm && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h2 className="text-xl font-semibold mb-3">
            {editingId ? 'Edit Vehicle Type' : 'Create New Vehicle Type'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Icon *</label>
                <select
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded"
                >
                  <option value="🚚">🚚 Truck</option>
                  <option value="🚗">🚗 Car</option>
                  <option value="🚐">🚐 Van</option>
                  <option value="🏍️">🏍️ Motorcycle</option>
                  <option value="🚛">🚛 Heavy Truck</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Max Capacity (kg) *</label>
                <input
                  type="number"
                  name="maxCapacityKg"
                  value={formData.maxCapacityKg}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.1"
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Max Volume (m³) *</label>
                <input
                  type="number"
                  name="maxVolumeM3"
                  value={formData.maxVolumeM3}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.1"
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Base Cost ($) *</label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Per Km Rate ($) *</label>
                <input
                  type="number"
                  name="perKmRate"
                  value={formData.perKmRate}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Rush Time Add ($) *</label>
                <input
                  type="number"
                  name="rushTimeAdd"
                  value={formData.rushTimeAdd}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="border rounded p-4 shadow hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                <span className="text-2xl mr-2">{vehicle.icon}</span>
                <h3 className="text-lg font-semibold">{vehicle.name}</h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(vehicle)}
                  className="text-blue-500 hover:text-blue-700"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(vehicle.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Capacity:</span> {vehicle.maxCapacityKg} kg</p>
              <p><span className="font-medium">Volume:</span> {vehicle.maxVolumeM3} m³</p>
              <p><span className="font-medium">Base Cost:</span> ${vehicle.cost.toFixed(2)}</p>
              <p><span className="font-medium">Per Km:</span> ${vehicle.perKmRate.toFixed(2)}</p>
              <p><span className="font-medium">Rush Add:</span> ${vehicle.rushTimeAdd.toFixed(2)}</p>
              {vehicle.description && (
                <p className="text-gray-600 italic">{vehicle.description}</p>
              )}
            </div>

            <div className="mt-2 text-xs text-gray-400">
              Created: {new Date(vehicle.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}

        {vehicles.length === 0 && !loading && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No vehicle types found. Create your first one!
          </div>
        )}
      </div>
    </div>
  );
}
