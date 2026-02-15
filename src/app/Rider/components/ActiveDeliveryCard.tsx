"use client";
import { 
  Package, 
  MapPin, 
  Building, 
  User, 
  Shield, 
  Clock, 
  Navigation,
  Grab,
  CheckCircle,
  AlertCircle,
  Truck,
  Home,
  XCircle
} from "lucide-react";
import { Delivery } from '../lib/types';
import { formatPeso } from '../lib/utils';
import { useMutation } from '@apollo/client';
import { UPDATE_ORDER_STATUS } from '../lib/types';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

interface ActiveDeliveryCardProps {
  delivery: Delivery;
  isMobile: boolean;
  onReset: () => void;
}

enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export default function ActiveDeliveryCard({ delivery, isMobile, onReset }: ActiveDeliveryCardProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionType, setActionType] = useState<'pickup' | 'delivered' | 'cancel' | null>(null);

  // Set up the mutation
  const [updateOrderStatus, { loading: mutationLoading }] = useMutation(UPDATE_ORDER_STATUS, {
    onCompleted: (data) => {
      const successMessage = data.updateOrderStatus?.statusText || 'Status updated successfully!';
      setMessage({ type: 'success', text: successMessage });
      
      setTimeout(() => {
        onReset();
        setMessage(null);
        setActionType(null);
      }, 2000);
    },
    onError: (error) => {
      const errorMessage = error.message || 'Failed to update order status';
      setMessage({ type: 'error', text: errorMessage });
      setTimeout(() => {
        setMessage(null);
        setActionType(null);
      }, 5000);
    }
  });

  const isLoading = mutationLoading;

  const handlePickup = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'User not authenticated' });
      return;
    }

    setActionType('pickup');
    const supplierItems = delivery.supplierItems || [];
    
    try {
      for (const item of supplierItems) {
        await updateOrderStatus({
          variables: {
            itemId: item.id,
            riderId: user.userId,
            supplierId: item.supplierId,
            userId: delivery.customerId,
            status: OrderStatus.SHIPPED,
            title: "Order On The Way",
            message: "Your order has been picked up and is on the way!"
          }
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setActionType(null);
    }
  };

  const handleDelivered = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'User not authenticated' });
      return;
    }

    setActionType('delivered');
    const supplierItems = delivery.supplierItems || [];
    
    try {
      for (const item of supplierItems) {
        await updateOrderStatus({
          variables: {
            itemId: item.id,
            riderId: user.userId,
            supplierId: item.supplierId,
            userId: delivery.customerId,
            status: OrderStatus.DELIVERED,
            title: "Order Delivered",
            message: "Your order has been successfully delivered!"
          }
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setActionType(null);
    }
  };

  const handleCancel = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'User not authenticated' });
      return;
    }

    if (!cancelReason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a reason for cancellation' });
      return;
    }

    setActionType('cancel');
    const supplierItems = delivery.supplierItems || [];
    
    try {
      for (const item of supplierItems) {
        await updateOrderStatus({
          variables: {
            itemId: item.id,
            riderId: user.userId,
            supplierId: item.supplierId,
            userId: delivery.customerId,
            status: OrderStatus.CANCELLED,
            title: "Order Cancelled",
            message: cancelReason
          }
        });
      }
      setShowCancelReason(false);
      setCancelReason('');
    } catch (error) {
      console.error('Error cancelling order:', error);
      setActionType(null);
    }
  };

  // Get status from URL or props - defaulting to PROCESSING since that's the active tab
  const currentStatus = window.location.pathname.includes('shipped') ? 'SHIPPED' : 
                       window.location.pathname.includes('delivered') ? 'DELIVERED' : 'PROCESSING';

  return (
    <div className="bg-white rounded-lg shadow-lg border border-indigo-200 overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-50 px-3 lg:px-4 py-2 lg:py-3 border-b border
