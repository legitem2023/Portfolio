export type Timeframe = 
  | 'TODAY' 
  | 'YESTERDAY' 
  | 'LAST_7_DAYS' 
  | 'LAST_30_DAYS' 
  | 'THIS_MONTH' 
  | 'LAST_MONTH' 
  | 'THIS_QUARTER' 
  | 'LAST_QUARTER' 
  | 'THIS_YEAR' 
  | 'LAST_YEAR' 
  | 'CUSTOM';

export type GroupBy = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type TrendGroupBy = 'DAY' | 'WEEK' | 'MONTH';
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export interface SalesFilters {
  status?: OrderStatus;
  userId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  minAmount?: number;
  maxAmount?: number;
}

export interface SalesDataPoint {
  period: string;
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  itemsSold: number;
}

export interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalItemsSold: number;
  growthRate: number;
  conversionRate?: number;
}

export interface TimeframeInfo {
  start: string;
  end: string;
  label: string;
}

// ADD THIS MISSING INTERFACE
export interface SalesDataResponse {
  data: SalesDataPoint[];
  summary: SalesSummary;
  timeframe: TimeframeInfo;
}

export interface RevenueMetrics {
  total: number;
  average: number;
  growth: number;
  target: number | null;
}

export interface OrderStatusCount {
  status: OrderStatus;
  count: number;
  percentage: number;
}

export interface OrderMetrics {
  total: number;
  averageValue: number;
  growth: number;
  statusBreakdown: OrderStatusCount[];
}

export interface CustomerMetrics {
  total: number;
  repeatCustomers: number;
  newCustomers: number;
  averageSpend: number;
}

export interface SalesMetrics {
  revenue: RevenueMetrics;
  orders: OrderMetrics;
  customers: CustomerMetrics;
}

export interface ProductSales {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
  percentage: number;
}

export interface SalesTrendPoint {
  date: string;
  period: string;
  revenue: number;
  orders: number;
  trend: number;
}
