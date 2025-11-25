// resolvers.ts
import { PrismaClient, PrivacySetting, OrderStatus } from "@prisma/client";
import { comparePassword, encryptPassword } from '../../utils/script';
import { EncryptJWT, jwtDecrypt } from 'jose';
import { saveBase64Image } from '../../utils/saveBase64Image';
import { v4 as uuidv4 } from 'uuid';
// import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server';
import {
  LogoutResponse,
  Context
} from './Types/graphql.js';

// Add date-fns imports for sales analytics
import { 
  startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, 
  startOfYear, endOfYear, format, subMonths, subYears 
} from 'date-fns';

const prisma = new PrismaClient();

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

export const resolvers = {
  Query: {
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
                image: true
