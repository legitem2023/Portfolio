// resolvers.ts
import { PrismaClient, PrivacySetting, OrderStatus } from "@prisma/client";
import { comparePassword, encryptPassword } from '../../utils/script';
import { EncryptJWT, jwtDecrypt } from 'jose';
import { saveBase64Image, upload3DModel } from '../../utils/saveBase64Image';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from '../../utils/notificationService';
import { NotificationType } from '../../utils/notificationService'; // Import the enum
import { emailMutations } from '../../lib/email/emailService';
// import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server';
import {
  LogoutResponse,
  Context
} from './Types/graphql.js';

const prisma = new PrismaClient();

// Add date-fns imports for sales analytics
import { 
  startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, 
  startOfYear, endOfYear, format, subMonths, subYears 
} from 'date-fns';

// Utility function for authentication
const getUserId = (context: any, required = true): string => {
  const userId = context.user?.id;
  
  if (required && !userId) {
    // throw new AuthenticationError('Authentication required');
  }
  
  return userId;
};

interface SetDefaultAddressArgs {
  addressId: string;
  userId: string;
}

interface SetDefaultAddressResponse {
  success: boolean;
  message?: string;
  address?: any;
}
// ================= Sales Analytics Interfaces =================
interface SalesFilters {
  status?: OrderStatus;
  userId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  minAmount?: number;
  maxAmount?: number;
}

interface DateRange {
  start: Date;
  end: Date;
}

const secret = new TextEncoder().encode('QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz'); // ✅ Uint8Array

// ================= Sales Analytics Utility Functions =================
function getDateRange(timeframe: string, customRange?: { start: Date; end: Date }): DateRange {
  const now = new Date();
  
  if (customRange) {
    return customRange;
  }

  switch (timeframe) {
    case 'TODAY':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'YESTERDAY':
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    case 'LAST_7_DAYS':
      return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
    case 'LAST_30_DAYS':
      return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
    case 'THIS_MONTH':
      return { start: startOfMonth(now), end: endOfDay(now) };
    case 'LAST_MONTH':
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    case 'THIS_YEAR':
      return { start: startOfYear(now), end: endOfDay(now) };
    case 'LAST_YEAR':
      const lastYear = subYears(now, 1);
      return { start: startOfYear(lastYear), end: endOfYear(lastYear) };
    default:
      return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
  }
}

function getPreviousDateRange(timeframe: string, currentRange: DateRange): DateRange {
  const duration = currentRange.end.getTime() - currentRange.start.getTime();
  return {
    start: new Date(currentRange.start.getTime() - duration),
    end: new Date(currentRange.end.getTime() - duration)
  };
}

function buildWhereClause(filters: SalesFilters, dateRange: DateRange): any {
  const where: any = {
    createdAt: {
      gte: dateRange.start,
      lte: dateRange.end
    }
  };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.userId) {
    where.userId = filters.userId;
  }

  if (filters?.minAmount !== undefined) {
    where.total = { gte: filters.minAmount };
  }

  if (filters?.maxAmount !== undefined) {
    where.total = { lte: filters.maxAmount };
  }

  return where;
}

async function getGroupedSalesData(
  whereClause: any, 
  groupBy: string, 
  dateRange: DateRange
) {
  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      items: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Group data based on groupBy parameter
  const groupedData = groupOrdersByTimeframe(orders, groupBy, dateRange);
  return groupedData;
}

function groupOrdersByTimeframe(orders: any[], groupBy: string, dateRange: DateRange) {
  const formatMap: any = {
    DAILY: 'yyyy-MM-dd',
    WEEKLY: 'yyyy-\'W\'II',
    MONTHLY: 'yyyy-MM',
    QUARTERLY: 'yyyy-Qq',
    YEARLY: 'yyyy'
  };

  const formatString = formatMap[groupBy] || 'yyyy-MM-dd';
  
  const groups: { [key: string]: any } = {};
  
  orders.forEach((order: any) => {
    const period = format(order.createdAt, formatString);
    
    if (!groups[period]) {
      groups[period] = {
        period,
        date: order.createdAt,
        revenue: 0,
        orders: 0,
        itemsSold: 0
      };
    }
    
    groups[period].revenue += order.total;
    groups[period].orders += 1;
    groups[period].itemsSold += order.items.reduce((sum: number, item: any) => 
      sum + item.quantity, 0
    );
  });

  // Calculate average order value
  return Object.values(groups).map((group: any) => ({
    ...group,
    averageOrderValue: group.orders > 0 ? group.revenue / group.orders : 0
  }));
}

async function getSalesSummary(whereClause: any, dateRange: DateRange) {
  const result = await prisma.order.aggregate({
    where: whereClause,
    _sum: {
      total: true
    },
    _count: {
      id: true
    },
    _avg: {
      total: true
    }
  });

  const itemsResult = await prisma.orderItem.aggregate({
    where: {
      order: whereClause
    },
    _sum: {
      quantity: true
    }
  });

  const previousDateRange = getPreviousDateRange('CUSTOM', dateRange);
  const previousWhereClause = buildWhereClause({}, previousDateRange);
  const previousResult = await prisma.order.aggregate({
    where: previousWhereClause,
    _sum: {
      total: true
    }
  });

  return {
    totalRevenue: result._sum.total || 0,
    totalOrders: result._count.id,
    averageOrderValue: result._avg.total || 0,
    totalItemsSold: itemsResult._sum.quantity || 0,
    growthRate: calculateGrowthRate(result._sum.total || 0, previousResult._sum.total || 0)
  };
}

async function getBasicMetrics(whereClause: any) {
  const result = await prisma.order.aggregate({
    where: whereClause,
    _sum: {
      total: true
    },
    _count: {
      id: true
    },
    _avg: {
      total: true
    }
  });

  return {
    totalRevenue: result._sum.total || 0,
    totalOrders: result._count.id,
    averageOrderValue: result._avg.total || 0
  };
}

async function getOrderStatusBreakdown(whereClause: any) {
  const statusCounts = await prisma.order.groupBy({
    by: ['status'],
    where: whereClause,
    _count: {
      id: true
    }
  });

  const total = statusCounts.reduce((sum: number, item: any) => sum + item._count.id, 0);

  return statusCounts.map((item: any) => ({
    status: item.status,
    count: item._count.id,
    percentage: total > 0 ? (item._count.id / total) * 100 : 0
  }));
}
/*
async function getCustomerMetrics(
  currentWhere: any, 
  previousWhere: any
) {
  const [currentCustomers, previousCustomers, repeatCustomers] = await Promise.all([
    prisma.order.groupBy({
      by: ['userId'],
      where: currentWhere,
      _count: {
        id: true
      }
    }),
    prisma.order.groupBy({
      by: ['userId'],
      where: previousWhere,
      _count: {
        id: true
      }
    }),
    prisma.order.groupBy({
      by: ['userId'],
      where: currentWhere,
      having: {
        userId: {
          _count: {
            id: {
              gt: 1
            }
          }
        }
      }
    })
  ]);

  const totalRevenueResult = await prisma.order.aggregate({
    where: currentWhere,
    _sum: {
      total: true
    }
  });

  return {
    total: currentCustomers.length,
    repeatCustomers: repeatCustomers.length,
    newCustomers: currentCustomers.length - repeatCustomers.length,
    averageSpend: currentCustomers.length > 0 ? 
      (totalRevenueResult._sum.total || 0) / currentCustomers.length : 0
  };
}
*/
async function getCustomerMetrics(
  currentWhere: any, 
  previousWhere: any
) {
  const [currentCustomers, previousCustomers, totalRevenueResult] = await Promise.all([
    prisma.order.groupBy({
      by: ['userId'],
      where: currentWhere,
      _count: {
        id: true
      }
    }),
    prisma.order.groupBy({
      by: ['userId'],
      where: previousWhere,
      _count: {
        id: true
      }
    }),
    prisma.order.aggregate({
      where: currentWhere,
      _sum: {
        total: true
      }
    })
  ]);

  // Calculate repeat customers (users with more than 1 order)
  const repeatCustomers = currentCustomers.filter(customer => customer._count.id > 1);

  return {
    total: currentCustomers.length,
    repeatCustomers: repeatCustomers.length,
    newCustomers: currentCustomers.length - repeatCustomers.length,
    averageSpend: currentCustomers.length > 0 ? 
      (totalRevenueResult._sum.total || 0) / currentCustomers.length : 0
  };
}
async function getSalesTrendData(
  whereClause: any, 
  groupBy: string, 
  dateRange: DateRange
) {
  // Implementation for trend data with moving averages
  const orders = await prisma.order.findMany({
    where: whereClause,
    select: {
      createdAt: true,
      total: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // This would implement more sophisticated trend calculation
  // For now, return basic grouped data
  const grouped = groupOrdersByTimeframe(orders as any, groupBy, dateRange);
  
  return grouped.map((point: any, index: number, array: any[]) => ({
    date: point.date,
    period: point.period,
    revenue: point.revenue,
    orders: point.orders,
    trend: index > 0 ? 
      ((point.revenue - array[index - 1].revenue) / array[index - 1].revenue) * 100 : 0
  }));
}

function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}



interface PaginationInput {
  page?: number;
  pageSize?: number;
}

interface SortInput {
  field?: 'DUE_DATE' | 'AMOUNT' | 'CREATED_AT' | 'UPDATED_AT';
  order?: 'ASC' | 'DESC';
}


interface ApiBillFilters {
  service?: string;
  year?: number;
  month?: number;
  status?: string;
  tags?: string[];
  fromDate?: Date;
  toDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

interface ApiBillList {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function apiBillsResolver(
  filters: ApiBillFilters = {},
  pagination: PaginationInput = {},
  sort: SortInput = {}
): Promise<ApiBillList> {
  const {
    page = 1,
    pageSize = 20
  } = pagination;

  const {
    field = 'DUE_DATE',
    order = 'DESC'
  } = sort;

  // Build Prisma where clause
  const where: any = {};

  // Apply filters
  if (filters.service) {
    where.service = filters.service;
  }

  if (filters.year !== undefined) {
    where.year = filters.year;
  }

  if (filters.month !== undefined) {
    where.month = filters.month;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.tags && filters.tags.length > 0) {
    where.tags = {
      hasEvery: filters.tags
    };
  }

  if (filters.fromDate || filters.toDate) {
    where.dueDate = {};
    if (filters.fromDate) {
      where.dueDate.gte = filters.fromDate;
    }
    if (filters.toDate) {
      where.dueDate.lte = filters.toDate;
    }
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    where.amount = {};
    if (filters.minAmount !== undefined) {
      where.amount.gte = filters.minAmount;
    }
    if (filters.maxAmount !== undefined) {
      where.amount.lte = filters.maxAmount;
    }
  }

  // Build orderBy clause
  let orderBy: any = {};
  
  switch (field) {
    case 'DUE_DATE':
      orderBy = { dueDate: order.toLowerCase() };
      break;
    case 'AMOUNT':
      orderBy = { amount: order.toLowerCase() };
      break;
    case 'CREATED_AT':
      orderBy = { createdAt: order.toLowerCase() };
      break;
    case 'UPDATED_AT':
      orderBy = { updatedAt: order.toLowerCase() };
      break;
    default:
      orderBy = { dueDate: 'desc' };
  }

  try {
    // Get total count for pagination
    const total = await prisma.apiBill.count({ where });

    // Calculate skip for pagination
    const skip = (page - 1) * pageSize;
    const totalPages = Math.ceil(total / pageSize);

    // Fetch bills with pagination and sorting
    const bills = await prisma.apiBill.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
    });

    return {
      data: bills,
      total,
      page,
      pageSize,
      totalPages
    };
  } catch (error) {
    console.error('Error fetching API bills:', error);
    throw new Error(`Failed to fetch API bills: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}




export const resolvers = {
  Query: {
// Find the orderlist resolver function (around line 550-560)
/*neworder: async(parent: any, args: any) => {
  // Set default values
  const filter = args.filter || {};
  const pagination = args.pagination || {};
  
  const page = pagination.page || 1;
  const pageSize = pagination.pageSize || 10;
  const skip = (page - 1) * pageSize;

  // Build where clause for ORDERS (NO filtering here)
  const where: any = {};

  try {
    // Get ALL orders count (no filtering)
    const totalCount = await prisma.order.count({ where });

      // Add supplierId filter through OrderItem relation
  if (filter && filter.status) {
    where.status = filter.status
  }
    
      // Add supplierId filter through OrderItem relation
  if (filter && filter.supplierId) {
    where.items = {
      some: {
        supplierId: filter.supplierId
      }
    };
  }

    // Get orders with pagination
    const orders = await prisma.order.findMany({
      where, // No filtering at order level
      skip,
      take: pageSize,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        items: {
          where: filter && filter.supplierId ? { supplierId: filter.supplierId } : {},
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                salePrice: true,
                images: true
              }
            },
            supplier: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                addresses: {
                  select: {
                    street: true,
                    city: true,
                    state: true,
                    zipCode: true,
                    country: true,
                    isDefault: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        address: {
          select: {
            id: true,
            street: true,
            city: true,
            state: true,
            zipCode: true,
            country: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            transactionId: true,
            createdAt: true
          }
        }
      }
    });

    // Format the response
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      status: order.status,
      total: order.total,
      subtotal: order.subtotal || 0,
      tax: order.tax || 0,
      shipping: order.shipping || 0,
      discount: order.discount || 0,
      createdAt: order.createdAt ? order.createdAt.toISOString() : null,
      updatedAt: order.updatedAt ? order.updatedAt.toISOString() : null,
      user: order.user,
      address: order.address,
      payments: order.payments,
      items: order.items.map(item => ({
        id: item.id,
        supplierId: item.supplierId,
        quantity: item.quantity,
        price: item.price,
        variantInfo: item.variantInfo,
        product: [item.product],
        supplier: item.supplier ? [item.supplier] : []
      }))
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / pageSize);

    const paginationInfo = {
      total: totalCount,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };

    return {
      orders: formattedOrders,
      pagination: paginationInfo
    };

  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to fetch orders');
  }
},*/
    // Find the orderlist resolver function (around line 550-560)
neworder: async(parent: any, args: any) => {
  // Set default values
  const filter = args.filter || {};
  const pagination = args.pagination || {};
  
  const page = pagination.page || 1;
  const pageSize = pagination.pageSize || 10;
  const skip = (page - 1) * pageSize;

  // Build where clause for ORDERS (NO filtering here)
  

  try {
    // Get ALL orders count (no filtering)
const where: any = {};
const totalCount = await prisma.order.count({ where });

const itemWhere: any = {};
// Apply status filter to ITEMS ONLY
if (filter && filter.status) {
  itemWhere.status = filter.status;
}

if (filter && filter.riderId) {
  // Get all items
  // Then exclude items where rejectedBy has riderId
  // But include items where rejectedBy is empty
  
  // This is the correct filter:
  itemWhere.NOT = {
    rejectedBy: {
      has: filter.riderId
    }
  };
  
  // Wait, this excludes items with empty arrays too... 
  // Actually no, empty arrays don't "have" the riderId, so they pass!
}
// Get orders with pagination
const orders = await prisma.order.findMany({
  where, // No filtering at order level
  skip,
  take: pageSize,
  orderBy: {
    createdAt: 'desc'
  },
  include: {
    items: {
      where: Object.keys(itemWhere).length > 0 ? itemWhere : {}, // All filtering happens here
      // REPLACE include+select with a single select
      select: {
        id: true,
        orderId: true,
        supplierId: true,
        quantity: true,
        price: true,
        variantInfo: true,
        status: true, // STATUS IS HERE
        riderId: true,
        recipientName: true,
        rejectedBy: true,
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            salePrice: true,
            images: true
          }
        },
        supplier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            addresses: {
              select: {
                street: true,
                city: true,
                state: true,
                zipCode: true,
                country: true,
                isDefault: true,
                lat: true,
                lng: true
              }
            }
          }
        }
      }
    },
    user: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true
      }
    },
    address: {
      select: {
        id: true,
        street: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        lat: true,
        lng: true
      }
    },
    payments: {
      select: {
        id: true,
        amount: true,
        method: true,
        status: true,
        transactionId: true,
        createdAt: true
      }
    }
  }
});

    // Format the response
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      status: order.status,
      total: order.total,
      subtotal: order.subtotal || 0,
      tax: order.tax || 0,
      shipping: order.shipping || 0,
      discount: order.discount || 0,
      createdAt: order.createdAt ? order.createdAt.toISOString() : null,
      updatedAt: order.updatedAt ? order.updatedAt.toISOString() : null,
      user: order.user,
      address: order.address,
      payments: order.payments,
      items: order.items.map(item => ({
        id: item.id,
        status: item.status,
        supplierId: item.supplierId,
        quantity: item.quantity,
        price: item.price,
        variantInfo: item.variantInfo,
        product: [item.product],
        supplier: item.supplier ? [item.supplier] : []
      }))
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / pageSize);

    const paginationInfo = {
      total: totalCount,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };

    return {
      orders: formattedOrders,
      pagination: paginationInfo
    };

  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to fetch orders');
  }
},
  activeorder: async(parent: any, args: any) => {
  // Set default values
  const filter = args.filter || {};
  const pagination = args.pagination || {};
  
  const page = pagination.page || 1;
  const pageSize = pagination.pageSize || 10;
  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: any = {};
  const itemWhere: any = {};
  // Add status filter if provided
/*if (filter && filter.status) {
    itemWhere.status = filter.status;
}*/
if (filter && filter.status) {
    itemsWhere.NOT = {
    status: {
        in: ['PENDING', 'DELIVERED', 'CANCELED']
    }
 }
}
    
  // Add supplierId filter through OrderItem relation
  if (filter && filter.supplierId) {
    itemWhere.items = {
      some: {
        supplierId: filter.supplierId
      }
    };
  }

  try {
    // Get orders count
    const totalCount = await prisma.order.count({ where });

    // Get orders with pagination - COMPLETE QUERY
    const orders = await prisma.order.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        items: {
          where: Object.keys(itemWhere).length > 0 ? itemWhere : {}, // All filtering happens here
          select: {
            id: true,
        orderId: true,
        supplierId: true,
        quantity: true,
        price: true,
        variantInfo: true,
        status: true, // STATUS IS HERE
        riderId: true,
        recipientName: true,
        rejectedBy: true,
            product: {
              select: {
                id: true,
                name: true,
                sku: true,          // Added for frontend query
                price: true,
                salePrice: true,
                images: true
              }
            },
            supplier: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                addresses: {
                  // Removed isDefault filter to match frontend query
                  select: {
                    street: true,
                    city: true,
                    state: true,
                    zipCode: true,
                    country: true,
                    isDefault: true,
                    lat: true,
                    lng: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        address: {
          select: {
            id: true,
            street: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
            lat: true,
            lng: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            transactionId: true,
            createdAt: true
          }
        }
      }
    });

    // Format the response to match GraphQL schema
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      status: order.status,
      total: order.total,
      subtotal: order.subtotal || 0,
      tax: order.tax || 0,
      shipping: order.shipping || 0,
      discount: order.discount || 0,
      createdAt: order.createdAt ? order.createdAt.toISOString() : null,
      updatedAt: order.updatedAt ? order.updatedAt.toISOString() : null,
      user: order.user,
      address: order.address,
      payments: order.payments,
      items: order.items.map(item => ({
        id: item.id,
        status: item.status,
        supplierId: item.supplierId,
        quantity: item.quantity,
        price: item.price,
        variantInfo: item.variantInfo,
        product: [item.product], // Wrap in array to match [Product] type
        supplier: item.supplier ? [item.supplier] : [] // Wrap in array to match [User] type
      }))
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / pageSize);

    const paginationInfo = {
      total: totalCount,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };

    return {
      orders: formattedOrders,
      pagination: paginationInfo
    };

  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to fetch orders');
  }
    },
 orderlist: async(parent: any, args: any) => {
  // Set default values
  const filter = args.filter || {};
  const pagination = args.pagination || {};
  
  const page = pagination.page || 1;
  const pageSize = pagination.pageSize || 10;
  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: any = {};

  // Add status filter if provided
  if (filter && filter.status) {
    where.status = filter.status;
  }

  // Add supplierId filter through OrderItem relation
  if (filter && filter.supplierId) {
    where.items = {
      some: {
        supplierId: filter.supplierId
      }
    };
  }

  try {
    // Get orders count
    const totalCount = await prisma.order.count({ where });

    // Get orders with pagination - COMPLETE QUERY
    const orders = await prisma.order.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        items: {
          where: filter && filter.supplierId ? { supplierId: filter.supplierId } : {},
          select: {
            id: true,
        orderId: true,
        supplierId: true,
        quantity: true,
        price: true,
        variantInfo: true,
        status: true, // STATUS IS HERE
        riderId: true,
        recipientName: true,
        rejectedBy: true,
            product: {
              select: {
                id: true,
                name: true,
                sku: true,          // Added for frontend query
                price: true,
                salePrice: true,
                images: true
              }
            },
            supplier: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                addresses: {
                  // Removed isDefault filter to match frontend query
                  select: {
                    street: true,
                    city: true,
                    state: true,
                    zipCode: true,
                    country: true,
                    isDefault: true,
                    lat: true,
                    lng: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        address: {
          select: {
            id: true,
            street: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
            lat: true,
            lng: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            transactionId: true,
            createdAt: true
          }
        }
      }
    });

    // Format the response to match GraphQL schema
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      status: order.status,
      total: order.total,
      subtotal: order.subtotal || 0,
      tax: order.tax || 0,
      shipping: order.shipping || 0,
      discount: order.discount || 0,
      createdAt: order.createdAt ? order.createdAt.toISOString() : null,
      updatedAt: order.updatedAt ? order.updatedAt.toISOString() : null,
      user: order.user,
      address: order.address,
      payments: order.payments,
      items: order.items.map(item => ({
        id: item.id,
        status: item.status,
        supplierId: item.supplierId,
        quantity: item.quantity,
        price: item.price,
        variantInfo: item.variantInfo,
        product: [item.product], // Wrap in array to match [Product] type
        supplier: item.supplier ? [item.supplier] : [] // Wrap in array to match [User] type
      }))
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / pageSize);

    const paginationInfo = {
      total: totalCount,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };

    return {
      orders: formattedOrders,
      pagination: paginationInfo
    };

  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to fetch orders');
  }
    },
    apiBills: async (
      _: any,
      args: {
        filters?: ApiBillFilters;
        pagination?: PaginationInput;
        sort?: SortInput;
      }
    ) => {
      return apiBillsResolver(
        args.filters || {},
        args.pagination || {},
        args.sort || {}
      );
    },

    // ================= Sales Analytics Queries =================
    salesData: async (
      _: any,
      { timeframe, groupBy, filters = {} }: 
      { timeframe: string; groupBy: string; filters?: SalesFilters }
    ) => {
      try {
        const dateRange = getDateRange(timeframe, filters?.dateRange);
        const whereClause = buildWhereClause(filters, dateRange);
        
        const [orders, summary] = await Promise.all([
          getGroupedSalesData(whereClause, groupBy, dateRange),
          getSalesSummary(whereClause, dateRange)
        ]);

        return {
          data: orders,
          summary,
          timeframe: {
            start: dateRange.start,
            end: dateRange.end,
            label: timeframe
          }
        };
      } catch (error) {
        console.error('Error in salesData query:', error);
        throw new Error('Failed to fetch sales data');
      }
    },

    salesMetrics: async (
      _: any,
      { timeframe, filters = {} }: 
      { timeframe: string; filters?: SalesFilters }
    ) => {
      try {
        const dateRange = getDateRange(timeframe, filters?.dateRange);
        const whereClause = buildWhereClause(filters, dateRange);
        const previousDateRange = getPreviousDateRange(timeframe, dateRange);
        const previousWhereClause = buildWhereClause(filters, previousDateRange);

        const [
          currentMetrics,
          previousMetrics,
          statusBreakdown,
          customerData
        ] = await Promise.all([
          getBasicMetrics(whereClause),
          getBasicMetrics(previousWhereClause),
          getOrderStatusBreakdown(whereClause),
          getCustomerMetrics(whereClause, previousWhereClause)
        ]);

        return {
          revenue: {
            total: currentMetrics.totalRevenue,
            average: currentMetrics.averageOrderValue,
            growth: calculateGrowthRate(currentMetrics.totalRevenue, previousMetrics.totalRevenue),
            target: null // You can implement target logic
          },
          orders: {
            total: currentMetrics.totalOrders,
            averageValue: currentMetrics.averageOrderValue,
            growth: calculateGrowthRate(currentMetrics.totalOrders, previousMetrics.totalOrders),
            statusBreakdown
          },
          customers: customerData
        };
      } catch (error) {
        console.error('Error in salesMetrics query:', error);
        throw new Error('Failed to fetch sales metrics');
      }
    },

    topProducts: async (
      _: any,
      { timeframe, limit = 10 }: 
      { timeframe: string; limit?: number }
    ) => {
      try {
        const dateRange = getDateRange(timeframe);
        const whereClause = buildWhereClause({}, dateRange);

        const productSales = await prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            order: whereClause
          },
          _sum: {
            quantity: true,
            price: true
          },
          _count: {
            id: true
          },
          orderBy: {
            _sum: {
              price: 'desc'
            }
          },
          take: limit
        });

        const totalRevenue = productSales.reduce((sum: number, item: any) => 
          sum + (item._sum.price || 0), 0
        );

        // Get product names
        const productIds = productSales.map((item: any) => item.productId);
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true }
        });

        const productMap = products.reduce((map: any, product: any) => {
          map[product.id] = product.name;
          return map;
        }, {});

        return productSales.map((item: any) => ({
          productId: item.productId,
          productName: productMap[item.productId] || `Product ${item.productId}`,
          unitsSold: item._sum.quantity || 0,
          revenue: item._sum.price || 0,
          percentage: totalRevenue > 0 ? ((item._sum.price || 0) / totalRevenue) * 100 : 0
        }));
      } catch (error) {
        console.error('Error in topProducts query:', error);
        throw new Error('Failed to fetch top products');
      }
    },

    salesTrend: async (
      _: any,
      { timeframe, groupBy }: 
      { timeframe: string; groupBy: string }
    ) => {
      try {
        const dateRange = getDateRange(timeframe);
        const whereClause = buildWhereClause({}, dateRange);
        
        return await getSalesTrendData(whereClause, groupBy, dateRange);
      } catch (error) {
        console.error('Error in salesTrend query:', error);
        throw new Error('Failed to fetch sales trend data');
      }
    },    
// In your GraphQL resolver file - update the notifications resolver
notifications: async (_:any, { userId, filters }:any, context:any) => {
  try {
    // Check if user is authenticated
   /* if (!context.user) {
      console.warn('No authenticated user in context');
      // Return empty instead of throwing error
      return {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
        unreadCount: 0,
      };
    }*/

    // Validate userId parameter
    if (!userId || userId.trim() === '') {
      console.warn('Empty userId provided');
      return {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
        unreadCount: 0,
      };
    }

    // Users can only access their own notifications
  /*  if (context.user.id !== userId) {
      return {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
        unreadCount: 0,
      };
    }*/

    const { isRead, type, limit = 20, cursor } = filters || {};

    const where = {
      userId,
      ...(isRead !== undefined && { isRead }),
      ...(type && { type }),
    };

    const notifications = await prisma.notification.findMany({
      where,
      take: limit + 1, // Take one extra to check if there's more
      ...(cursor && {
        cursor: {
          id: cursor,
        },
        skip: 1, // Skip the cursor
      }),
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          },
        },
      },
    });

    const hasNextPage = notifications.length > limit;
    const nodes = hasNextPage ? notifications.slice(0, -1) : notifications;

    // CRITICAL FIX: Convert to edges format
    const edges = nodes.map((notification) => ({
      node: notification,
      cursor: notification.id,
    }));

    const [totalCount, unreadCount] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { ...where, isRead: false },
      }),
    ]);

    // CRITICAL FIX: Return the exact structure that matches GraphQL schema
    return {
      edges, // Must be edges, not nodes
      pageInfo: {
        hasNextPage,
        hasPreviousPage: false, // Add this field
        startCursor: edges.length > 0 ? edges[0].cursor : null,
        endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
      },
      totalCount,
      unreadCount,
    };
  } catch (error) {
    console.error('Error in notifications resolver:', error);
    // Don't return null, return empty connection structure
    return {
      edges: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
      totalCount: 0,
      unreadCount: 0,
    };
  }
},

// Also add the unreadNotificationCount resolver
unreadNotificationCount: async (_:any, { userId }:any, context:any) => {
  if (!context.user) {
    throw new Error('Not authenticated');
  }

  if (context.user.id !== userId) {
    throw new Error('Unauthorized');
  }

  const count = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });

  return count;
},

    // Get a single notification by ID
    notification: async (_:any, { id }:any, context:any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const notification = await prisma.notification.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      // Users can only access their own notifications
      if (notification.userId !== context.user.id) {
        throw new Error('Unauthorized');
      }

      return notification;
    },

    myMessages: async (_: any, { page = 1, limit = 20, isRead }: any, { userId }: any): Promise<any> => {
      const skip = (page - 1) * limit;
      
      const where: any = {
        OR: [
          { senderId: userId },
          { recipientId: userId }
        ],
        ...(isRead !== undefined && { isRead })
      };

      const [messages, totalCount]: any = await Promise.all([
        prisma.message.findMany({
          where,
          include: {
            sender: true,
            recipient: true,
            parent: {
              include: {
                sender: true,
                recipient: true
              }
            },
            replies: {
              include: {
                sender: true,
                recipient: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.message.count({ where })
      ]);

      return {
        messages,
        totalCount,
        hasNextPage: totalCount > skip + limit,
        page
      };
    },

    conversation: async (_: any, { userId, page = 1, limit = 20 }: any, { currentUserId }: any): Promise<any> => {
      const skip = (page - 1) * limit;
      
      const where: any = {
        OR: [
          {
            senderId: currentUserId,
            recipientId: userId
          },
          {
            senderId: userId,
            recipientId: currentUserId
          }
        ]
      };

      const [messages, totalCount]: any = await Promise.all([
        prisma.message.findMany({
          where,
          include: {
            sender: true,
            recipient: true,
            parent: {
              include: {
                sender: true,
                recipient: true
              }
            },
            replies: {
              include: {
                sender: true,
                recipient: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.message.count({ where })
      ]);

      return {
        messages,
        totalCount,
        hasNextPage: totalCount > skip + limit,
        page
      };
    },

    unreadMessageCount: async (_: any, __: any, { userId }: any): Promise<any> => {
      return prisma.message.count({
        where: {
          recipientId: userId,
          isRead: false
        }
      });
    },

    message: async (_: any, { id }: any, { userId }: any): Promise<any> => {
      return prisma.message.findFirst({
        where: {
          id,
          OR: [
            { senderId: userId },
            { recipientId: userId }
          ]
        },
        include: {
          sender: true,
          recipient: true,
          parent: {
            include: {
              sender: true,
              recipient: true
            }
          },
          replies: {
            include: {
              sender: true,
              recipient: true
            }
          }
        }
      });
    },

    messageThreads: async (_: any, { page = 1, limit = 20 }: any, { userId }: any): Promise<any> => {
      const skip = (page - 1) * limit;

      // Get unique users that current user has conversations with
      const conversations: any = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId },
            { recipientId: userId }
          ]
        },
        select: {
          senderId: true,
          recipientId: true,
          createdAt: true,
          isRead: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Group by other user and get latest message
      const threadMap = new Map();
      
      for (const msg of conversations) {
        const otherUserId = msg.senderId === userId ? msg.recipientId : msg.senderId;
        
        if (!threadMap.has(otherUserId)) {
          threadMap.set(otherUserId, {
            lastMessage: msg,
            unreadCount: 0
          });
        }
        
        if (!msg.isRead && msg.recipientId === userId) {
          threadMap.get(otherUserId).unreadCount++;
        }
      }

      const threads: any = await Promise.all(
        Array.from(threadMap.entries()).map(async ([otherUserId, data]: any) => {
          const user = await prisma.user.findUnique({
            where: { id: otherUserId },
            select: { id: true, firstName: true, lastName: true, avatar: true, email: true }
          });

          const lastMessage = await prisma.message.findUnique({
            where: { id: data.lastMessage.id },
            include: {
              sender: true,
              recipient: true
            }
          });

          return {
            user,
            lastMessage,
            unreadCount: data.unreadCount,
            updatedAt: data.lastMessage.createdAt
          };
        })
      );

      // Sort by last message date
      threads.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      const paginatedThreads = threads.slice(skip, skip + limit);

      return {
        threads: paginatedThreads,
        totalCount: threads.length,
        hasNextPage: threads.length > skip + limit,
        page
      };
    },

    // Existing e-commerce queries
    users: async () => await prisma.user.findMany({
      include: {
        addresses: true,
        products: true
      }
    }),
    
    user: async (_: any, { id }: { id: string }) => {
      if (!id || id.length === 0) {
        console.log("Invalid ID");
        return null;
      }
      
      return await prisma.user.findUnique({ 
        where: { id },
        include: {
          addresses: true,
          products: {
            include: {
              category: {
                include: {
                  parent: true
                }
              },
              variants: {
                select: {
                  id: true,
                  name: true,
                  createdAt: true,
                  sku: true,
                  color: true,
                  size: true,
                  price: true,
                  salePrice: true,
                  stock: true,
                  images: true
                }
              }
            }
          },
          posts: {
            include: {
              user: true,
              taggedUsers: {
                include: {
                  user: true
                }
              },
              comments: {
                take: 2,
                include: {
                  user: true
                },
                orderBy: {
                  createdAt: 'desc'
                }
              },
              likes: {
                where: {
                  userId: id
                }
              },
              _count: {
                select: {
                  comments: true,
                  likes: true
                }
              }
            }
          }
        }
      })
    },

    products: async (
      _: any,
      {
        search,
        cursor,
        limit = 12,
        category,
        sortBy,
      }: {
        search?: string;
        cursor?: string;
        limit?: number;
        category?: string;
        sortBy?: string;
      }
    ) => {
      try {
        const where: any = {};

        if (search) {
          where.OR = [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { tags: { has: search } },
          ];
        }

        if (category && category !== "All Categories") {
          where.categoryId = category;
        }

        let orderBy: any = [{ id: "asc" }];
        if (sortBy) {
          switch (sortBy) {
            case "Newest":
              orderBy = [{ createdAt: "desc" }];
              break;
            case "Price: Low to High":
              orderBy = [{ price: "asc" }];
              break;
            case "Price: High to Low":
              orderBy = [{ price: "desc" }];
              break;
            case "Highest Rated":
              orderBy = [{ rating: "desc" }];
              break;
            default:
              orderBy = [{ featured: "desc" }, { id: "asc" }];
          }
        }

        const products = await prisma.product.findMany({
          where,
          take: limit + 1,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy,
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
            model: true,
            featured: true,
            isActive: true,
            stock: true,
            brand: true,
            weight: true,
            dimensions: true,
            createdAt: true,
            updatedAt: true,
            description: true,
            tags: true,
            sku: true,
            supplierId: true,
            category: {
              select: {
                id: true,
                name: true,
                description: true,
                image: true,
                isActive: true,
                createdAt: true,
                parent: true
              }
            },
            variants: {
              select: {
                id: true,
                name: true,
                createdAt: true,
                sku: true,
                color: true,
                size: true,
                price: true,
                salePrice: true,
                stock: true,
                images: true,
                model: true
              }
            }
          },
        });

        const hasMore = products.length > limit;
        const items = hasMore ? products.slice(0, -1) : products;

        return {
          items,
          nextCursor: hasMore ? products[products.length - 1].id : null,
          hasMore,
        };
      } catch (error) {
        console.error("Failed to fetch products:", error);
        throw new Error("Failed to fetch products");
      }
    },

    product: async (_: any, { id }: { id: string }) => {
      const products = await prisma.product.findMany({
          where: {
            id:id
          }, 
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
            model: true,
            featured: true,
            isActive: true,
            stock: true,
            brand: true,
            weight: true,
            dimensions: true,
            createdAt: true,
            updatedAt: true,
            description: true,
            tags: true,
            sku: true,
            supplierId: true,
            category: {
              select: {
                id: true,
                name: true,
                description: true,
                image: true,
                isActive: true,
                createdAt: true,
                parent: true
              }
            },
            variants: {
              select: {
                id: true,
                name: true,
                createdAt: true,
                sku: true,
                color: true,
                size: true,
                price: true,
                salePrice: true,
                stock: true,
                images: true,
                model: true
              }
            }
          },
        });
      return products;
    },
      
    categories: async () => {
      return prisma.category.findMany();
    },

    orders: async (_: any, { userId }: { userId: string }) => {
      try {
        return await prisma.order.findMany({ 
          where: { userId },
          include: {
            user: true,
            address: true,
            items: true,
            payments: true
          }
        });
      } catch (error) {
        console.error('Error fetching orders:', error);
        throw new Error('Could not fetch orders');
      }
    },

    supportTickets: () => prisma.supportTicket.findMany(),
    
    getProducts: async (_: any, args: any) => {
      const userId = args.userId;
      const products = await prisma.product.findMany({
        where: {
          supplierId: userId.toString()
        },
        include: {
          category: true,
          variants: true,
          supplier: true, // include the supplier relation
        }
      });
      return products;
    },

    // Social media queries
    posts: async (_: any, { page = 1, limit = 10, userId, followingOnly = false }: any, context: any) => {
      const currentUserId = getUserId(context);
      const skip = (page - 1) * limit;
      
      let whereClause: any = {};
      
      if (userId) {
        whereClause.userId = userId;
        
        if (userId !== currentUserId) {
          whereClause.OR = [
            { privacy: PrivacySetting.PUBLIC },
            {
              AND: [
                { privacy: PrivacySetting.FRIENDS },
                {
                  user: {
                    followers: {
                      some: {
                        followerId: currentUserId
                      }
                    }
                  }
                }
              ]
            }
          ];
        }
      } else if (followingOnly) {
        whereClause = {
          user: {
            followers: {
              some: {
                followerId: currentUserId
              }
            }
          },
          OR: [
            { privacy: 'PUBLIC' },
            { privacy: 'FRIENDS' }
          ]
        };
      } else {
        whereClause = {
          OR: [
            { privacy: PrivacySetting.PUBLIC },
            {
              AND: [
                { privacy: PrivacySetting.FRIENDS },
                {
                  user: {
                    followers: {
                      some: {
                        followerId: currentUserId
                      }
                    }
                  }
                }
              ]
            }
          ]
        };
      }
      
      const [posts, totalCount] = await Promise.all([
        prisma.post.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            user: true,
            taggedUsers: {
              include: {
                user: true
              }
            },
            comments: {
              take: 2,
              include: {
                user: true
              },
              orderBy: {
                createdAt: 'desc'
              }
            },
            likes: {
              where: {
                userId: currentUserId
              }
            },
            _count: {
              select: {
                comments: true,
                likes: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.post.count({ where: whereClause })
      ]);
      
      return {
        posts: posts.map(post => ({
          ...post,
          taggedUsers: post.taggedUsers?.map((tu: any) => tu.user) || [],
          isLikedByMe: (post.likes?.length || 0) > 0,
          likeCount: post._count?.likes || 0,
          commentCount: post._count?.comments || 0
        })),
        totalCount,
        hasNextPage: totalCount > page * limit
      };
    },
    
    post: async (_: any, { id }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          user: true,
          taggedUsers: {
            include: {
              user: true
            }
          },
          comments: {
            include: {
              user: true,
              likes: {
                where: {
                  userId: currentUserId
                }
              },
              _count: {
                select: {
                  likes: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          likes: {
            where: {
              userId: currentUserId
            }
          },
          _count: {
            select: {
              comments: true,
              likes: true
            }
          }
        }
      });
      
      if (!post) {
        // throw new UserInputError('Post not found');
      }
      
      if (post?.userId !== currentUserId) {
        if (post?.privacy === 'ONLY_ME') {
          // throw new ForbiddenError('You do not have permission to view this post');
        }
        
        if (post?.privacy === 'FRIENDS') {
          const isFriend = await prisma.follow.findFirst({
            where: {
              followerId: currentUserId,
              followingId: post?.userId
            }
          });
          
          if (!isFriend) {
            // throw new ForbiddenError('You do not have permission to view this post');
          }
        }
      }
      
      return {
        ...post,
        taggedUsers: post?.taggedUsers?.map((tu: any) => tu.user) || [],
        isLikedByMe: (post?.likes?.length || 0) > 0,
        likeCount: post?._count?.likes || 0,
        commentCount: post?._count?.comments || 0,
        comments: post?.comments?.map((comment: any) => ({
          ...comment,
          isLikedByMe: (comment.likes?.length || 0) > 0,
          likeCount: comment._count?.likes || 0
        })) || []
      };
    },
    
    comments: async (_: any, { postId, page = 1, limit = 10 }: any, context: any) => {
      const currentUserId = getUserId(context);
      const skip = (page - 1) * limit;
      
      const [comments, totalCount] = await Promise.all([
        prisma.comment.findMany({
          where: { postId },
          skip,
          take: limit,
          include: {
            user: true,
            likes: {
              where: {
                userId: currentUserId
              }
            },
            _count: {
              select: {
                likes: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.comment.count({ where: { postId } })
      ]);
      
      return {
        comments: comments.map(comment => ({
          ...comment,
          isLikedByMe: (comment.likes?.length || 0) > 0,
          likeCount: comment._count?.likes || 0
        })),
        totalCount,
        hasNextPage: totalCount > page * limit
      };
    },
    
    userFeed: async (_: any, { page = 1, limit = 10, userId = "" }: any, context: any) => {
      const currentUserId = getUserId(context);
      const skip = (page - 1) * limit;
      
      const whereClause = {
        OR: [
          { userId: userId },
          {
            user: {
              followers: {
                some: {
                  followerId: userId
                }
              }
            },
            OR: [
              { privacy: PrivacySetting.PUBLIC },
              { privacy: PrivacySetting.FRIENDS }
            ]
          }
        ]
      };
      
      const [posts, totalCount] = await Promise.all([
        prisma.post.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            user: true,
            taggedUsers: {
              include: {
                user: true
              }
            },
            comments: {
              take: 2,
              include: {
                user: true
              },
              orderBy: {
                createdAt: 'desc'
              }
            },
            likes: {
              where: {
                userId: userId
              }
            },
            _count: {
              select: {
                comments: true,
                likes: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.post.count({ where: whereClause })
      ]);
      
      return {
        posts: posts.map(post => ({
          ...post,
          taggedUsers: post.taggedUsers?.map((tu: any) => tu.user) || [],
          isLikedByMe: (post.likes?.length || 0) > 0,
          likeCount: post._count?.likes || 0,
          commentCount: post._count?.comments || 0
        })),
        totalCount,
        hasNextPage: totalCount > page * limit
      };
    },
    
    userLikes: async (_: any, { userId }: any, context: any) => {
      getUserId(context);
      
      return prisma.like.findMany({
        where: { userId },
        include: {
          user: true,
          post: {
            include: {
              user: true
            }
          },
          comment: {
            include: {
              user: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    },
    
    followers: async (_: any, { userId }: any, context: any) => {
      getUserId(context);
      
      const followers = await prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: true
        }
      });
      
      return followers.map(f => f.follower);
    },
    
    following: async (_: any, { userId }: any, context: any) => {
      getUserId(context);
      
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: true
        }
      });
      
      return following.map(f => f.following);
    },
    
    searchUsers: async (_: any, { query, page = 1, limit = 10 }: any, context: any) => {
      getUserId(context);
      const skip = (page - 1) * limit;
      
      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where: {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } }
            ]
          },
          skip,
          take: limit
        }),
        prisma.user.count({
          where: {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } }
            ]
          }
        })
      ]);
      
      return {
        users,
        totalCount,
        hasNextPage: totalCount > page * limit
      };
    },

    // ================= Sales List Queries =================
salesList: async (
  _: any, 
  { 
    page = 1, 
    limit = 20, 
    filters, 
    sortBy = "createdAt", 
    sortOrder = "DESC" 
  }: any
) => {
  try {
    const skip = (page - 1) * limit;
    
    // Build where clause from filters
    const where: any = {};
    
    if (filters) {
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.userId) {
        where.userId = filters.userId;
      }
      
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }
      
      if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
        where.total = {};
        if (filters.minAmount !== undefined) {
          where.total.gte = filters.minAmount;
        }
        if (filters.maxAmount !== undefined) {
          where.total.lte = filters.maxAmount;
        }
      }
    }
    
    // Build orderBy clause
    let orderBy: any = {};
    if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder.toLowerCase();
    } else if (sortBy === "total") {
      orderBy.total = sortOrder.toLowerCase();
    } else if (sortBy === "orderNumber") {
      orderBy.orderNumber = sortOrder.toLowerCase();
    } else {
      orderBy.createdAt = 'desc';
    }
    
    // Get paginated orders with proper error handling
    const orders = await prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        address: true,
        items: {
          include: {
            product: true // This will fail if product is null
          }
        },
        payments: true
      },
      orderBy
    });
    
    // Process orders to handle null products
    const processedOrders = orders.map(order => ({
      ...order,
      // Transform items to handle null products
      items: order.items.map(item => {
        // If product is null, create a fallback product
        if (!item.product) {
          return {
            ...item,
            product: {
              id: item.id, // Use item ID as fallback product ID
              name: "Product Not Available",
              price: 0, // Use 0 as fallback price
              images: [], // Empty images array
              // Add other required product fields if they exist in your schema
              description: "",
              category: "",
              createdAt: new Date(),
              updatedAt: new Date()
            }
          };
        }
        return item;
      })
    }));
    
    const totalCount = await prisma.order.count({ where });
    
    // Calculate summary statistics
    const [totalRevenue, pendingOrders, completedOrders] = await Promise.all([
      prisma.order.aggregate({
        where,
        _sum: {
          total: true
        }
      }),
      prisma.order.count({
        where: {
          ...where,
          status: 'PENDING'
        }
      }),
      prisma.order.count({
        where: {
          ...where,
          status: 'COMPLETED'
        }
      })
    ]);
    
    const averageOrderValue = totalRevenue._sum.total ? 
      totalRevenue._sum.total / totalCount : 0;
    
    return {
      orders: processedOrders,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      summary: {
        totalRevenue: totalRevenue._sum.total || 0,
        totalOrders: totalCount,
        averageOrderValue,
        pendingOrders,
        completedOrders
      }
    };
  } catch (error:any) {
    console.error('Error fetching sales list:', error);
    throw new Error('Failed to fetch sales list');
  }
},
    
    salesOrder: async (_: any, { id }: { id: string }) => {
      try {
        const order = await prisma.order.findUnique({
          where: { id },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatar: true
              }
            },
            address: true,
            items: {
              include: {
                product: {
                  include: {
                    variants: true,
                    category: true
                  }
                }
              }
            },
            payments: {
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        });
        
        if (!order) {
          throw new Error('Order not found');
        }
        
        return order;
      } catch (error) {
        console.error('Error fetching sales order:', error);
        throw new Error('Failed to fetch order details');
      }
    }
  },

  Mutation: {
rejectByRider: async (_: any, { itemId, riderId }: any) => {
  try {
    // Validate inputs
    if (!itemId || !riderId) {
      throw new Error('itemId and riderId are required');
    }

    // Check if rider has already rejected this item
    const existingItem = await prisma.orderItem.findUnique({
      where: { id: itemId },
      select: { rejectedBy: true }
    });

    if (!existingItem) {
      throw new Error('Order item not found');
    }

    // Prevent duplicate rejections
    if (existingItem.rejectedBy.includes(riderId)) {
      return {
        statusText: "Rider has already rejected this item"
      };
    }

    // Update the order item
    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        rejectedBy: {
          push: riderId
        }
      }
    });

    return {
      statusText: "Successfully rejected!",
    };
  } catch (error:any) {
    console.error('Error in rejectByRider:', error);
    throw new Error(`Failed to reject item: ${error.message}`);
  }
},
acceptByRider: async (_:any, { itemId, riderId, supplierId, userId }:any) => {
  try {  
    const rider = await prisma.user.findUnique({
      where: { id: riderId },
      select: { firstName: true, email:true }
    });

    const updatedOrder = await prisma.orderItem.updateMany({
        where: { orderId:itemId,
                 supplierId:supplierId
               },
        data: {
          status: 'PROCESSING',
          riderId: riderId,
        }});

     await prisma.notification.create({
        data: { 
          userId: supplierId,
          title: 'RIDER_ACCEPTED',
          message: 'Rider accepted the order'
        }
      });
    
      // Create delivery record
    await prisma.notification.create({
        data: { 
          userId: userId,
          title: 'RIDER_ACCEPTED',
          message: 'Rider accepted the order'
        }
      });
      return {
        statusText:"Successfully Accepted!"
      }
  } catch (error) {
    console.error('Error accepting order:', error);
    return {
      statusText: 'Failed to accept order'
    };
  }
},
  createApiBill: async (parent: any, args:any) => {
    try {
      const { input } = args;
      
      // Basic validation
      if (!input.service || !input.service.trim()) {
        console.log('Service is required', 'VALIDATION_ERROR');
      }
      
      if (!input.apiName || !input.apiName.trim()) {
        console.log('API name is required', 'VALIDATION_ERROR');
      }
      
      if (input.month < 1 || input.month > 12) {
        console.log('Month must be between 1 and 12', 'VALIDATION_ERROR');
      }
      
      if (input.year < 2000 || input.year > 2100) {
        console.log('Year must be between 2000 and 2100', 'VALIDATION_ERROR');
      }
      
      if (input.amount <= 0) {
        console.log('Amount must be greater than 0', 'VALIDATION_ERROR');
      }
      
      // Check if dueDate is valid
      const dueDate = new Date(input.dueDate);
      if (isNaN(dueDate.getTime())) {
        console.log('Invalid due date', 'VALIDATION_ERROR');
      }

      // Check for duplicate bill
      const existingBill = await prisma.apiBill.findFirst({
        where: {
          service: input.service,
          apiName: input.apiName,
          month: input.month,
          year: input.year,
        },
      });

      if (existingBill) {
        console.log(
          `Bill for ${input.service}/${input.apiName} already exists for ${input.month}/${input.year}`,
          'DUPLICATE_BILL'
        );
      }

      // Create new API bill
      const newBill = await prisma.apiBill.create({
        data: {
          service: input.service,
          apiName: input.apiName,
          month: input.month,
          year: input.year,
          amount: input.amount,
          currency: input.currency || 'USD',
          dueDate: input.dueDate,
          invoiceId: input.invoiceId,
          invoiceUrl: input.invoiceUrl,
          tags: input.tags || [],
          status: 'PENDING',
          
          usage: input.usage ? {
            create: {
              requests: input.usage.requests || 0,
              successful: input.usage.successful || 0,
              failed: input.usage.failed || 0,
              dataProcessed: input.usage.dataProcessed || 0,
              rate: input.usage.rate || 0,
              customFields: input.usage.customFields || {},
            },
          } : undefined,
        }
      });

      return newBill;
      
    } catch (error: any) {
      console.error('Error creating API bill:', error);
      
    }
  },
updateApiBill: async (parent: any, args: any) => {
  try {
    const { id, input } = args;
    
    // Check if bill exists
    const existingBill = await prisma.apiBill.findUnique({
      where: { id }
    });

    if (!existingBill) {
      throw new Error(`API bill with ID ${id} not found`);
    }

    // Validate input
    if (input.month && (input.month < 1 || input.month > 12)) {
      throw new Error('Month must be between 1 and 12');
    }
    
    if (input.year && (input.year < 2000 || input.year > 2100)) {
      throw new Error('Year must be between 2000 and 2100');
    }
    
    if (input.amount && input.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Check for duplicate
    if (input.service || input.apiName || input.month || input.year) {
      const service = input.service ?? existingBill.service;
      const apiName = input.apiName ?? existingBill.apiName;
      const month = input.month ?? existingBill.month;
      const year = input.year ?? existingBill.year;

      const duplicateBill = await prisma.apiBill.findFirst({
        where: {
          service,
          apiName,
          month,
          year,
          id: { not: id },
        },
      });

      if (duplicateBill) {
        throw new Error(`Another bill already exists for ${service}/${apiName} for ${month}/${year}`);
      }
    }

    // Prepare update data
    const updateData: any = {};
    const basicFields = ['service', 'apiName', 'month', 'year', 'amount', 
                         'currency', 'status', 'dueDate', 'invoiceId', 'invoiceUrl', 'tags'];
    
    basicFields.forEach(field => {
      if (input[field] !== undefined) {
        updateData[field] = input[field];
      }
    });

    // Handle usage metrics update if provided
    if (input.usage) {
      // Type cast the existing usage since it's JSON
      const existingUsage = existingBill.usage as any;
      
      // Merge existing usage with new usage data
      const usageData = {
        ...(existingUsage || {}),
        ...(input.usage || {})
      };
      
      // Set specific fields with defaults
      updateData.usage = {
        requests: input.usage.requests ?? existingUsage?.requests ?? 0,
        successful: input.usage.successful ?? existingUsage?.successful ?? 0,
        failed: input.usage.failed ?? existingUsage?.failed ?? 0,
        dataProcessed: input.usage.dataProcessed ?? existingUsage?.dataProcessed ?? 0,
        rate: input.usage.rate ?? existingUsage?.rate ?? 0,
        customFields: input.usage.customFields ?? existingUsage?.customFields ?? {},
      };
    }

    // Update the bill
    const updatedBill = await prisma.apiBill.update({
      where: { id },
      data: updateData
    });

    // Return the updated bill
    return updatedBill;

  } catch (error: any) {
    console.error('Error updating API bill:', error);
    throw error;
  }
},

  deleteApiBill: async (parent: any, args:any) => {
    try {
      const { id } = args;
      
      // Check if bill exists
      const existingBill = await prisma.apiBill.findUnique({
        where: { id }
      });

      if (!existingBill) {
        console.log(`API bill with ID ${id} not found`, 'NOT_FOUND');
      }

      // Delete the bill
      await prisma.apiBill.delete({
        where: { id }
      });


      return true;
      
    } catch (error: any) {
      console.error('Error deleting API bill:', error);
      

    }
  },
    markNotificationAsRead: async (_: any, { id }: any) => {
  try {
    // Find the notification
    const notification = await prisma.notification.findUnique({
      where: { id }
    });
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    // Update notification
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        // Remove createdAt: new Date() - don't modify creation timestamp
      }
    });
    
    return updatedNotification;
  } catch (error: any) {
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
},

// 2. Mark all notifications as read for a user
markAllNotificationsAsRead: async (_: any, { userId }: any) => {
  try {
    // Update all unread notifications for this user
    const result = await prisma.notification.updateMany({
      where: {
        userId: userId,
        isRead: false
      },
      data: {
        isRead: true,
        // Remove createdAt: new Date() - don't modify creation timestamp
      }
    });
    
    // Return true if at least one notification was updated
    return result.count > 0;
  } catch (error: any) {
    throw new Error(`Failed to mark all notifications as read: ${error.message}`);
  }
},

// 3. Delete a single notification
deleteNotification: async (_: any, { id }: any) => {
  try {
    // Check if notification exists
    const notification = await prisma.notification.findUnique({
      where: { id }
    });
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    // Delete the notification
    await prisma.notification.delete({ 
      where: { id: id }
    });
    
    return true;
  } catch (error: any) {
    throw new Error(`Failed to delete notification: ${error.message}`);
  }
},

// 4. Delete all read notifications for a user
deleteAllReadNotifications: async (_: any, { userId }: any) => {
  try {
    // Delete all read notifications for this user
    const result = await prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true
      }
    });
    
    // Return true if at least one notification was deleted
    return result.count > 0;
  } catch (error: any) {
    throw new Error(`Failed to delete all read notifications: ${error.message}`);
  }
},
  

     categoryImageUpload: async (_: any, args: any) =>{
        try {
        const { base64Image, categoryId } = args;
        
        // Validate required inputs
        if (!base64Image || !categoryId) {
          //throw new Error('base64Image and categoryId are required');
          return {
            statusText: "base64Image and categoryId are required"
          };
        }

        const imageUUID = uuidv4();
        
        // Save images
        const imageFile = await saveBase64Image(base64Image, `vendorsify_category_${imageUUID}.webp`);
        if (!imageFile) return { statusText: "Upload failed!" };
        const updatedProduct = await prisma.category.update({
          where: { id: categoryId },
          data: {
            image: imageFile.url // Or base64Image if storing directly 
          }
        });
        
        if (!updatedProduct) {
          return {
            statusText: "Upload failed!"
          };
        }
        
        // For this example, we return a success message.
        return {
          statusText: "Successfully Uploaded"
        };
        
      } catch (error: any) {
        //console.error('Error in singleUpload:', error);
        return {
            statusText:"Error in singleUpload:", error
          };
      }
},
upload3DModel: async (_: any, args: any) => {
  try {
    const { file, fileName, productId } = args;
    
    // Validate required parameters
    if (!file) {
      return {
        success: false,
        message: 'No file provided for upload',
        url: null,
        filename: null,
        fileSize: null,
        fileType: null
      };
    }
    
    // With GraphQL Yoga, 'file' is already resolved, no need to await it
    // But check if it's a Promise (some implementations still return Promise)
    const uploadFile = file.then ? await file : file;
    const { createReadStream, filename: uploadedFilename } = uploadFile;
    
    if (!createReadStream) {
      return {
        success: false,
        message: 'Invalid file object - missing createReadStream',
        url: null,
        filename: null,
        fileSize: null,
        fileType: null
      };
    }
    
    // Use provided fileName or fallback to uploaded filename
    const finalFilename = fileName || uploadedFilename;
    
    if (!finalFilename) {
      return {
        success: false,
        message: 'No filename available for the upload',
        url: null,
        filename: null,
        fileSize: null,
        fileType: null
      };
    }
    
    // Validate it's a 3D model file
    const fileExt = finalFilename.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['glb', 'gltf', 'obj', 'stl', 'fbx'];
    
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      return {
        success: false,
        message: `Invalid 3D model format. Allowed formats: ${allowedExtensions.join(', ')}`,
        url: null,
        filename: null,
        fileSize: null,
        fileType: null
      };
    }
    
    // Convert stream to buffer
    const stream = createReadStream();
    const chunks: Buffer[] = [];
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    // Validate buffer size
    if (buffer.length === 0) {
      return {
        success: false,
        message: 'Uploaded file is empty',
        url: null,
        filename: null,
        fileSize: null,
        fileType: null
      };
    }
    
    // Maximum file size: 100MB
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    if (buffer.length > MAX_FILE_SIZE) {
      const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
      return {
        success: false,
        message: `File size exceeds maximum limit of ${maxSizeMB}MB`,
        url: null,
        filename: null,
        fileSize: buffer.length,
        fileType: fileExt
      };
    }
    
    // Call upload function with buffer and filename
    const result = await upload3DModel(buffer, finalFilename);
    
    // Validate the upload result
    if (!result) {
      return {
        success: false,
        message: 'Upload failed - no result returned from upload service',
        url: null,
        filename: null,
        fileSize: buffer.length,
        fileType: fileExt
      };
    }
    
    if (!result.url) {
      return {
        success: false,
        message: 'Upload failed - no URL returned from upload service',
        url: null,
        filename: result.filename || finalFilename,
        fileSize: buffer.length,
        fileType: fileExt
      };
    }
    
    if (!result.filename) {
      return {
        success: false,
        message: 'Upload failed - no filename returned from upload service',
        url: result.url,
        filename: null,
        fileSize: buffer.length,
        fileType: fileExt
      };
    }
    
    // Verify the URL is valid (basic check)
    if (!result.url.startsWith('http://') && !result.url.startsWith('https://')) {
      return {
        success: false,
        message: 'Upload failed - invalid URL format returned',
        url: result.url,
        filename: result.filename,
        fileSize: buffer.length,
        fileType: fileExt
      };
    }
    
    // Return success with message
    return {
      success: true,
      message: `3D model "${result.filename}" uploaded successfully`,
      url: result.url,
      filename: result.filename,
      fileSize: buffer.length,
      fileType: fileExt,
      // Optional: Add more metadata if available
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    
    
    // Provide more specific error messages for common issues
    let userMessage = error.message || 'An unexpected error occurred during upload';
    
    // Handle common error types with user-friendly messages
    if (error.code === 'ENOENT' || error.code === 'ENOTFOUND') {
      userMessage = 'Storage service unavailable. Please try again later.';
    } else if (error.code === 'ECONNREFUSED') {
      userMessage = 'Unable to connect to storage service.';
    } else if (error.message.includes('timeout')) {
      userMessage = 'Upload timed out. Please try again.';
    } else if (error.message.includes('network')) {
      userMessage = 'Network error. Please check your connection and try again.';
    }
    
    return {
      success: false,
      message: userMessage,
      url: null,
      filename: null,
      fileSize: null,
      fileType: null,
      // Optional: include error code for debugging (be careful with sensitive info)
      errorCode: process.env.NODE_ENV === 'development' ? error.code : null
    };
  }
},
    singleUpload: async (_: any, args: any) => {
      try {
        const { base64Image, productId } = args;
        
        // Validate required inputs
        if (!base64Image || !productId) {
          throw new Error('base64Image and productId are required');
        }

        const imageUUID = uuidv4();
        
        // Save images
        const imageFile = await saveBase64Image(base64Image, `DVN-product-${imageUUID}.webp`);
        
        const updatedProduct = await prisma.productVariant.update({
          where: { id: productId },
          data: {
            images: {
              push: imageFile.url // Or base64Image if storing directly
            }
          }
        });
        
        if (!updatedProduct) {
          return {
            statusText: "Upload failed!"
          };
        }
        
        // For this example, we return a success message.
        return {
          statusText: "Successfully Uploaded"
        };
        
      } catch (error: any) {
        console.error('Error in singleUpload:', error);
      }
    },

    sendMessage: async (_: any, args: any): Promise<any> => {
      const { senderId, recipientId, body, subject } = args.input;

      // Check if recipient exists
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId }
      });

      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Prevent sending to self
      if (recipientId === senderId) {
        throw new Error('Cannot send message to yourself');
      }

      return prisma.message.create({
        data: {
          senderId,
          recipientId,
          body,
          subject,
          isRead: false
        },
        include: {
          sender: true,
          recipient: true,
          parent: true,
          replies: true
        }
      });
    },

    replyMessage: async (_: any, { input }: any, { userId }: any): Promise<any> => {
      const { parentId, body } = input;

      // Check if parent message exists and user is participant
      const parentMessage = await prisma.message.findFirst({
        where: {
          id: parentId,
          OR: [
            { senderId: userId },
            { recipientId: userId }
          ]
        }
      });

      if (!parentMessage) {
        throw new Error('Message not found or access denied');
      }

      // Determine recipient (the other person in the conversation)
      const recipientId = parentMessage.senderId === userId ? parentMessage.recipientId : parentMessage.senderId;

      return prisma.message.create({
        data: {
          senderId: userId,
          recipientId,
          body,
          parentId,
          isRead: false
        },
        include: {
          sender: true,
          recipient: true,
          parent: {
            include: {
              sender: true,
              recipient: true
            }
          },
          replies: true
        }
      });
    },

    markAsRead: async (_: any, { messageId }: any, { userId }: any): Promise<any> => {
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          recipientId: userId
        }
      });

      if (!message) {
        throw new Error('Message not found or access denied');
      }

      return prisma.message.update({
        where: { id: messageId },
        data: { isRead: true },
        include: {
          sender: true,
          recipient: true,
          parent: true,
          replies: true
        }
      });
    },

    markMultipleAsRead: async (_: any, { messageIds }: any, { userId }: any): Promise<any> => {
      await prisma.message.updateMany({
        where: {
          id: { in: messageIds },
          recipientId: userId
        },
        data: { isRead: true }
      });

      return true;
    },
deleteVariant: async (_: any, { id }: any) => {
  await prisma.productVariant.delete({
    where: {
      id
    }
  })
  return {
    statusText: "Successful"
  }  
}, 
deleteProduct: async (_: any, { id }: any) => {
  await prisma.$transaction(async (tx) => {
    // 1. First delete OrderItems that reference ProductVariants
    await tx.orderItem.deleteMany({
      where: {
        product: {
          id: id
        }
      }
    });

    // 2. Delete product variants
    await tx.productVariant.deleteMany({
      where: {
        productId: id
      }
    });

    // 3. Delete any OrderItems that directly reference the Product (if applicable)
    // Check your schema - if OrderItem has both productId and productVariantId
    await tx.orderItem.deleteMany({
      where: {
        productId: id
      }
    });

    // 4. Finally delete the product
    await tx.product.delete({
      where: {
        id
      }
    });
  });

  return {
    statusText: "Successful"
  } 
},
    deleteMessage: async (_: any, { messageId }: any, { userId }: any): Promise<any> => {
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          senderId: userId // Only sender can delete
        }
      });

      if (!message) {
        throw new Error('Message not found or access denied');
      }

      await prisma.message.delete({
        where: { id: messageId }
      });

      return true;
    },

    deleteConversation: async (_: any, { userId: otherUserId }: any, { currentUserId }: any): Promise<any> => {
      await prisma.message.deleteMany({
        where: {
          OR: [
            {
              senderId: currentUserId,
              recipientId: otherUserId
            },
            {
              senderId: otherUserId,
              recipientId: currentUserId
            }
          ]
        }
      });

      return true;
    },

    // Existing e-commerce mutations
    login: async (_: any, args: any) => {
      try {
        const { email, password } = args.input || {};
        
        if (!email || !password) {
          console.log("Bad User Inputs"); // throw new ApolloError("Missing email or password.", "BAD_USER_INPUT");
        }

        const user = await prisma.user.findUnique({ 
          where: { email: email },
          include: {
            addresses: true
          }
        });
        
        if (!user) {
          console.log("User not found");
          // throw new ApolloError("User not found.", "USER_NOT_FOUND");
        }

        if (!user?.password) {
          console.log("User has no password");
          // throw new ApolloError("User has no password set.", "INTERNAL_SERVER_ERROR");
        }

        const isValid = await comparePassword(password, user?.password || "");
       
        if (!isValid) {
          console.log("Invalid password");
          // throw new ApolloError("Invalid credentials.", "INVALID_CREDENTIALS");
        }

        const secret = new TextEncoder().encode('QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz');

        let token;
        try {
          token = await new EncryptJWT({
            userId: user?.id,
            phone: user?.phone,
            email: user?.email,
            name: user?.firstName,
            role: user?.role,
            image: user?.avatar,
            addresses: user?.addresses
          })
            .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
            .setIssuedAt()
            .encrypt(secret);
        } catch (err) {
          console.error('Token encryption error:', err);
          // throw new ApolloError("Token generation failed.", "TOKEN_ERROR");
        }

        return {
          statusText: "success",
          token
        };

      } catch (err) {
        console.error('Login resolver error:', err);
      }
    },

    logout: async (_: any, __: any, context: Context): Promise<LogoutResponse> => {
      try {
        const { token } = context;

        if (!token) {
          return {
            success: false,
            message: 'No authentication token provided'
          };
        }

        // Decrypt token to get user info
        const { payload } = await jwtDecrypt(token, secret);
        
        // Add token to blacklist (valid for 7 days)
        await prisma.blacklistedToken.upsert({
          where: { token },
          update: { 
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
          },
          create: {
            token,
            userId: payload.userId as string,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        });

        return {
          success: true,
          message: 'Successfully logged out'
        };
      } catch (error) {
        console.error('Logout error:', error);
        return {
          success: false,
          message: 'Failed to complete logout process'
        };
      }
    },

    loginWithFacebook: async (_: any, args: any) => {
      const { idToken } = args.input;

      const fbRes = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${idToken}`
      );
      const fbUser = await fbRes.json();
      if (!fbUser || !fbUser.id) {
        throw new Error('Invalid Facebook token');
      }

      const avatarUrl = fbUser.picture?.data?.url ?? '';

      let user = await prisma.user.findUnique({
        where: { email: fbUser.email },
        include: {
          addresses: true
        }
      });

      if (!user) {
        await prisma.user.create({
          data: {
            firstName: fbUser.name,
            lastName: '',
            email: fbUser.email,
            phone: '',
            password: '',
            role: 'USER',
            avatar: avatarUrl
          },
        });
      }

      const secret = new TextEncoder().encode('QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz');
      const token = await new EncryptJWT({
        userId: user?.id,
        phone: user?.phone,
        email: user?.email,
        name: user?.firstName,
        role: user?.role,
        image: user?.avatar,
        addresses: user?.addresses
      })
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .encrypt(secret);

      return {
        statusText: 'success',
        token
      };
    },
    
    createUser: async (_: any, { email, password, firstName, lastName }: any) => {
      const passwordHash = await encryptPassword(password, 10);

      const result = await prisma.user.create({
        data: { 
          email: email,
          password: passwordHash, 
          firstName: firstName, 
          lastName: lastName
        },
      });

      if (result) {
        return {
          statusText: "Account Successfully Created."
        }
      }
    },

    createProduct: async (_: any, { id, name, description, price, salePrice, color, size, stock, sku, supplierId }: any) => {
      await prisma.product.create({
        data: {
          name,
          description,
          price,
          sku,
          salePrice,
          variants: {
            create: {
              name,
              sku,
              color,
              size,
              price,
              salePrice: salePrice || null, // Ensure it can be null
              stock: stock || 0,
            } as any
          },
          supplier: {
            connect: { id: supplierId }
          },
          category: {
            connect: { id: id },
          },
        },
      });
      return { statusText: 'Product created successfully!' };
    },
    
    createVariant: async (_parent: any, { input }: { input: any }, _context: any) => {
      try {
        // Validate required fields
        if (!input.name || input.stock === undefined) {
          return {
            statusText: 'Name and stock are required fields'
          };
        }

        // Check if product exists when productId is provided
        if (input.productId) {
          const productExists = await prisma.product.findUnique({
            where: { id: input.productId }
          });

          if (!productExists) {
            return {
              statusText: 'Product not found'
            };
          }
        }

        // Check for duplicate SKU
        if (input.sku) {
          const existingVariant = await prisma.productVariant.findUnique({
            where: { sku: input.sku }
          });

          if (existingVariant) {
            return {
              statusText: 'SKU must be unique'
            };
          }
        }

        // Create the variant
        const variant = await prisma.productVariant.create({
          data: {
            name: input.name,
            productId: input.productId,
            sku: input.sku || `SKU-${Date.now()}`, // Generate SKU if not provided
            color: input.color,
            size: input.size,
            price: input.price,
            salePrice: input.salePrice,
            stock: input.stock,
            images: [], // Default empty array
            options: [], // Default empty array
            isActive: true
          }
        });

        return {
          statusText: 'Successful'
        };

      } catch (error) {
        console.error('Error creating product variant:', error);
        return {
          statusText: 'Product creation Failed!'
        };
      }
    },
updateVariant: async (_parent: any, { id, input }: { id: string, input: any }, _context: any) => {
  try {
    // Check if variant exists
    const existingVariant = await prisma.productVariant.findUnique({
      where: { id: id }
    });

    if (!existingVariant) {
      return {
        statusText: 'Variant not found'
      };
    }

    // Validate required fields if they're being updated
    if (input.name !== undefined && !input.name) {
      return {
        statusText: 'Name cannot be empty'
      };
    }

    if (input.stock !== undefined && input.stock < 0) {
      return {
        statusText: 'Stock cannot be negative'
      };
    }

    // Check if product exists when productId is being updated
    if (input.productId && input.productId !== existingVariant.productId) {
      const productExists = await prisma.product.findUnique({
        where: { id: input.productId }
      });

      if (!productExists) {
        return {
          statusText: 'Product not found'
        };
      }
    }

    // Check for duplicate SKU (excluding current variant)
    if (input.sku && input.sku !== existingVariant.sku) {
      const existingSKU = await prisma.productVariant.findUnique({
        where: { sku: input.sku }
      });

      if (existingSKU) {
        return {
          statusText: 'SKU must be unique'
        };
      }
    }

    // Prepare update data (only include fields that are provided)
    const updateData: any = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.productId !== undefined) updateData.productId = input.productId;
    if (input.sku !== undefined) updateData.sku = input.sku;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.size !== undefined) updateData.size = input.size;
    if (input.price !== undefined) updateData.price = input.price;
    if (input.salePrice !== undefined) updateData.salePrice = input.salePrice;
    if (input.stock !== undefined) updateData.stock = input.stock;

    // Update the variant
    const variant = await prisma.productVariant.update({
      where: { id: id },
      data: updateData
    });

    return {
      statusText: 'Variant updated successfully'
    };

  } catch (error) {
    console.error('Error updating product variant:', error);
    return {
      statusText: 'Variant update failed!'
    };
  }
},
    createAddress: async (_: any, args: any) => {
      const {
        userId,
        type,
        receiver,
        street,
        city,
        state,
        zipCode,
        country,
        isDefault,
        lat,
        lng
      } = args.input;

      const response = await prisma.address.create({
        data: {
          userId,
          type,
          receiver,
          street,
          city,
          state,
          zipCode,
          country,
          isDefault,
          lat,
          lng
        },
      });
      return {
        statusText: "Succesful"
      };
    },

    createCategory: async (_: any, { name, description, status }: any) => {
      const response = await prisma.category.create({
        data: {
          name,
          description,
          isActive: status
        }
      });
      if (response) {
        return {
          statusText: 'Successful!'
        };
      }
      throw new Error('Failed to create category');
    },

    setDefaultAddress: async (_: any, { addressId, userId }: SetDefaultAddressArgs): Promise<SetDefaultAddressResponse> => {
      try {
        // Find the target address and verify ownership
        const targetAddress = await prisma.address.findFirst({
          where: {
            id: addressId,
            userId: userId,
          },
        });

        if (!targetAddress) {
          throw new Error('Address not found or unauthorized');
        }

        // Use transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
          // Set all user addresses to non-default first
          await tx.address.updateMany({
            where: {
              userId: userId,
            },
            data: {
              isDefault: false,
            },
          });

          // Set the target address as default
          const updatedAddress = await tx.address.update({
            where: {
              id: addressId,
            },
            data: {
              isDefault: true,
            },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          });

          return updatedAddress;
        });

        return {
          success: true,
          message: 'Default address updated successfully',
          address: result,
        };

      } catch (error: any) {
        console.error('Error setting default address:', error);
        return {
          success: false,
          message: error.message,
          address: null,
        };
      }
    },
createOrder: async (_: any, { userId, addressId, items }: any) => {
  try {
    // Validate and convert productIds to proper ObjectID format
    const validItems = items.map((item: any) => {
      let productId = item.productId;
      let supplierId = item.supplierId;
      // If it's a numeric string, pad it to 24 hex characters
      if (/^\d+$/.test(productId)) {
        productId = productId.padStart(24, '0');
      }
      
      // If it's already a hex string but wrong length, handle it
      if (productId.length !== 24) {
        throw new Error(`Invalid productId length: ${productId}. Must be 24 characters for MongoDB ObjectID.`);
      }
      
      return {
        productId,
        supplierId,
        quantity: item.quantity,
        price: item.price,
        status: "PENDING",
      };
    });

    const response = await prisma.order.create({
      data: {
        userId,
        addressId,
        orderNumber: `ORD-${Date.now()}`,
        status: "PENDING",
        total: items.reduce(
          (sum: number, item: any) => sum + item.price * item.quantity,
          0
        ),
        subtotal: items.reduce(
          (sum: number, item: any) => sum + item.price * item.quantity,
          0
        ),
        items: {
          create: validItems,
        },
      },
      include: { items: true },
    });
    
    if (response) {
      try {
        // ===== INTEGRATE EMAIL SENDING HERE =====
        // First fetch user data to get their email
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, firstName: true }
        });
        
        // Send order confirmation email using your email service
        if (user && user.email) {
          try {
            const emailResult = await emailMutations.sendNotificationEmail({
              recipientEmail: user.email,
              title: "Order Created Successfully",
              message: `Your order #${response.orderNumber} has been created and is being processed. Order total: $${response.total}`,
              actionUrl: `/orders/${response.id}`,
              userName: user.firstName || 'Customer',
              subject: `Order Confirmation: ${response.orderNumber}`
            });
            
            console.log(`Order confirmation email sent to ${user.email}, Message ID: ${emailResult.messageId}`);
          } catch (emailError: any) {
            console.error('Failed to send order confirmation email:', emailError);
            // Don't throw - just log the error and continue
          }
        }
        // ===== END EMAIL INTEGRATION =====
        
        // Create notification for the order (your existing code)
        const notificationResult = await createNotification({
          userId: userId,
          type: NotificationType.ORDER_UPDATE,
          title: "Order Created Successfully",
          message: `Your order #${response.orderNumber} has been created and is being processed.`,
          link: `/orders/${response.id}`,
          isRead: false
        });

        if (!notificationResult.success) {
          // Return error response
          return {
            success: false,
            statusText: 'Order created but notification failed',
            order: response,
            error: {
              code: 'NOTIFICATION_FAILED',
              message: notificationResult.error?.message,
              details: notificationResult.error?.details
            }
          };
        }

        return {
          success: true,
          statusText: 'Order Successful!',
          order: response
        };
      } catch (error: any) {
        console.error('Failed to create order notification or send email:', error);
        // Don't throw here - we still want to return the order success
        // even if notification or email fails
        return {
          statusText: 'Failed Notification',
          order: response
        };
      }
    }
  } catch (error: any) {
    // Re-throw any errors from the main try block
    throw error;
  }
},
    respondToTicket: async (_: any, { ticketId, userId, message }: any) => {
      return prisma.ticketResponse.create({
        data: { ticketId, userId, message },
      });
    },

    // Social media mutations
    createPost: async (_: any, { input }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      const post = await prisma.post.create({
        data: {
          content: input.content,
          background: input.background,
          images: input.images || [],
          privacy: input.privacy || 'PUBLIC',
          userId: input.userId,
          taggedUsers: {
            create: input.taggedUsers?.map((userId: any) => ({ userId })) || []
          }
        },
        include: {
          user: true,
          taggedUsers: {
            include: {
              user: true
            }
          },
          comments: true,
          likes: true,
          _count: {
            select: {
              comments: true,
              likes: true
            }
          }
        }
      });
      
      return {
        ...post,
        taggedUsers: post.taggedUsers?.map((tu: any) => tu.user) || [],
        isLikedByMe: false,
        likeCount: 0,
        commentCount: 0
      };
    },
    
    updatePost: async (_: any, { id, input }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      const existingPost = await prisma.post.findUnique({
        where: { id },
        select: { userId: true }
      });
      
      if (!existingPost) {
        // throw new UserInputError('Post not found');
      }
      
      if (existingPost?.userId !== currentUserId) {
        // throw new ForbiddenError('You can only update your own posts');
      }
      
      await prisma.postTaggedUser.deleteMany({
        where: { postId: id }
      });
      
      const post = await prisma.post.update({
        where: { id },
        data: {
          content: input.content,
          background: input.background,
          images: input.images,
          privacy: input.privacy,
          taggedUsers: {
            create: input.taggedUsers?.map((userId: any) => ({ userId })) || []
          }
        },
        include: {
          user: true,
          taggedUsers: {
            include: {
              user: true
            }
          },
          comments: {
            include: {
              user: true
            }
          },
          likes: {
            where: {
              userId: currentUserId
            }
          },
          _count: {
            select: {
              comments: true,
              likes: true
            }
          }
        }
      });
      
      return {
        ...post,
        taggedUsers: post.taggedUsers?.map((tu: any) => tu.user) || [],
        isLikedByMe: (post.likes?.length || 0) > 0,
        likeCount: post._count?.likes || 0,
        commentCount: post._count?.comments || 0
      };
    },
    
    deletePost: async (_: any, { id }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      const existingPost = await prisma.post.findUnique({
        where: { id },
        select: { userId: true }
      });
      
      if (!existingPost) {
        // throw new UserInputError('Post not found');
      }
      
      if (existingPost?.userId !== currentUserId) {
        // throw new ForbiddenError('You can only delete your own posts');
      }
      
      await prisma.post.delete({
        where: { id }
      });
      
      return true;
    },
    
    createComment: async (_: any, { input }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      const comment = await prisma.comment.create({
        data: {
          content: input.content,
          postId: input.postId,
          userId: input.userId,
          parentId: input.parentId
        },
        include: {
          user: true,
          post: true,
          likes: {
            where: {
              userId: input.userId
            }
          },
          _count: {
            select: {
              likes: true
            }
          }
        }
      });
      
      return {
        ...comment,
        isLikedByMe: false,
        likeCount: 0
      };
    },
    
    updateComment: async (_: any, { id, input }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      const existingComment = await prisma.comment.findUnique({
        where: { id },
        select: { userId: true }
      });
      
      if (!existingComment) {
        // throw new UserInputError('Comment not found');
      }
      
      if (existingComment?.userId !== currentUserId) {
        // throw new ForbiddenError('You can only update your own comments');
      }
      
      const comment = await prisma.comment.update({
        where: { id },
        data: {
          content: input.content
        },
        include: {
          user: true,
          post: true,
          likes: {
            where: {
              userId: currentUserId
            }
          },
          _count: {
            select: {
              likes: true
            }
          }
        }
      });
      
      return {
        ...comment,
        isLikedByMe: (comment.likes?.length || 0) > 0,
        likeCount: comment._count?.likes || 0
      };
    },
    
    deleteComment: async (_: any, { id }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      const existingComment = await prisma.comment.findUnique({
        where: { id },
        select: { userId: true }
      });
      
      if (!existingComment) {
        // throw new UserInputError('Comment not found');
      }
      
      if (existingComment?.userId !== currentUserId) {
        // throw new ForbiddenError('You can only delete your own comments');
      }
      
      await prisma.comment.delete({
        where: { id }
      });
      
      return true;
    },
    
    likePost: async (_: any, { postId }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      const post = await prisma.post.findUnique({
        where: { id: postId }
      });
      
      if (!post) {
        // throw new UserInputError('Post not found');
      }
      
      const existingLike = await prisma.like.findFirst({
        where: {
          postId,
          userId: currentUserId
        }
      });
      
      if (existingLike) {
        // throw new UserInputError('You already liked this post');
      }
      
      const like = await prisma.like.create({
        data: {
          postId,
          userId: currentUserId
        },
        include: {
          user: true,
          post: {
            include: {
              user: true
            }
          }
        }
      });
      
      return like;
    },
    
    unlikePost: async (_: any, { postId }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      const like = await prisma.like.findFirst({
        where: {
          postId,
          userId: currentUserId
        }
      });
      
      if (!like) {
        // throw new UserInputError('You have not liked this post');
      }
      
      await prisma.like.delete({
        where: { id: like?.id }
      });
      
      return true;
    },
    
    likeComment: async (_: any, { commentId }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      const comment = await prisma.comment.findUnique({
        where: { id: commentId }
      });
      
      if (!comment) {
        // throw new UserInputError('Comment not found');
      }
      
      const existingLike = await prisma.like.findFirst({
        where: {
          commentId,
          userId: currentUserId
        }
      });
      
      if (existingLike) {
        // throw new UserInputError('You already liked this comment');
      }
      
      const like = await prisma.like.create({
        data: {
          commentId,
          userId: currentUserId
        },
        include: {
          user: true,
          comment: {
            include: {
              user: true,
              post: true
            }
          }
        }
      });
      
      return like;
    },
    
    unlikeComment: async (_: any, { commentId }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      const like = await prisma.like.findFirst({
        where: {
          commentId,
          userId: currentUserId
        }
      });
      
      if (!like) {
        // throw new UserInputError('You have not liked this comment');
      }
      
      await prisma.like.delete({
        where: { id: like?.id }
      });
      
      return true;
    },
    
    followUser: async (_: any, { userId }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      if (userId === currentUserId) {
        // throw new UserInputError('You cannot follow yourself');
      }
      
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        // throw new UserInputError('User not found');
      }
      
      const existingFollow = await prisma.follow.findFirst({
        where: {
          followerId: currentUserId,
          followingId: userId
        }
      });
      
      if (existingFollow) {
        // throw new UserInputError('You are already following this user');
      }
      
      const follow = await prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: userId
        },
        include: {
          follower: true,
          following: true
        }
      });
      
      return follow;
    },
    
    unfollowUser: async (_: any, { userId }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      const follow = await prisma.follow.findFirst({
        where: {
          followerId: currentUserId,
          followingId: userId
        }
      });
      
      if (!follow) {
        // throw new UserInputError('You are not following this user');
      }
      
      await prisma.follow.delete({
        where: { id: follow?.id }
      });
      
      return true;
    },
    
    tagUsersInPost: async (_: any, { postId, userIds }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { userId: true }
      });
      
      if (!post) {
        // throw new UserInputError('Post not found');
      }
      
      if (post?.userId !== currentUserId) {
        // throw new ForbiddenError('You can only tag users in your own posts');
      }
      
      await prisma.postTaggedUser.createMany({
        data: userIds.map((userId: any) => ({
          postId,
          userId
        }))
      });
      
      const updatedPost = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          user: true,
          taggedUsers: {
            include: {
              user: true
            }
          },
          comments: {
            include: {
              user: true
            }
          },
          likes: {
            where: {
              userId: currentUserId
            }
          },
          _count: {
            select: {
              comments: true,
              likes: true
            }
          }
        }
      });
      
      return {
        ...updatedPost,
        taggedUsers: updatedPost?.taggedUsers?.map((tu: any) => tu.user) || [],
        isLikedByMe: (updatedPost?.likes?.length || 0) > 0,
        likeCount: updatedPost?._count?.likes || 0,
        commentCount: updatedPost?._count?.comments || 0
      };
    },
    
    removeTagFromPost: async (_: any, { postId, userId }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { userId: true }
      });
      
      if (!post) {
        // throw new UserInputError('Post not found');
      }
      
      if (post?.userId !== currentUserId) {
        // throw new ForbiddenError('You can only modify tags in your own posts');
      }
      
      await prisma.postTaggedUser.deleteMany({
        where: {
          postId,
          userId
        }
      });
      
      const updatedPost = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          user: true,
          taggedUsers: {
            include: {
              user: true
            }
          },
          comments: {
            include: {
              user: true
            }
          },
          likes: {
            where: {
              userId: currentUserId
            }
          },
          _count: {
            select: {
              comments: true,
              likes: true
            }
          }
        }
      });
      
      return {
        ...updatedPost,
        taggedUsers: updatedPost?.taggedUsers?.map((tu: any) => tu.user) || [],
        isLikedByMe: (updatedPost?.likes?.length || 0) > 0,
        likeCount: updatedPost?._count?.likes || 0,
        commentCount: updatedPost?._count?.comments || 0
      };
    }
  }
};
