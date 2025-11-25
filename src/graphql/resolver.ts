// resolver.ts
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

    // ================= Existing Queries =================
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
      });
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
                images: true
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

    product: (_: any, { id }: { id: string }) =>
      prisma.product.findUnique({ where: { id } }),

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
        /*where: {
          supplierId: userId.toString()
        },*/
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
    }
  },

  Mutation: {
    // ================= Message Mutations =================
    sendMessage: async (_: any, { input }: any, { userId }: any): Promise<any> => {
      const { recipientId, body, subject } = input;

      // Check if recipient exists
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId }
      });

      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Prevent sending to self
      if (recipientId === userId) {
        throw new Error('Cannot send message to yourself');
      }

      return prisma.message.create({
        data: {
          senderId: userId,
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

    // ================= E-commerce Mutations =================
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
        
        return {
          statusText: "Successfully Uploaded"
        };
        
      } catch (error: any) {
        console.error('Error in singleUpload:', error);
        return {
          statusText: "Upload failed!"
        };
      }
    },

    deleteVariant: async (_: any, { id }: any) => {
      await prisma.productVariant.delete({
        where: { id }
      });
      return {
        statusText: "Successful"
      };  
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
        await tx.orderItem.deleteMany({
          where: {
            productId: id
          }
        });

        // 4. Finally delete the product
        await tx.product.delete({
          where: { id }
        });
      });

      return {
        statusText: "Successful"
      }; 
    },

    login: async (_: any, args: any) => {
      try {
        const { email, password } = args.input || {};
        
        if (!email || !password) {
          console.log("Bad User Inputs");
          return {
            statusText: "Missing email or password",
            token: null
          };
        }

        const user = await prisma.user.findUnique({ 
          where: { email: email },
          include: {
            addresses: true
          }
        });
        
        if (!user) {
          console.log("User not found");
          return {
            statusText: "User not found",
            token: null
          };
        }

        if (!user?.password) {
          console.log("User has no password");
          return {
            statusText: "User has no password set",
            token: null
          };
        }

        const isValid = await comparePassword(password, user?.password || "");
       
        if (!isValid) {
          console.log("Invalid password");
          return {
            statusText: "Invalid credentials",
            token: null
          };
        }

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
            .setExpirationTime('7d')
            .encrypt(secret);
        } catch (err) {
          console.error('Token encryption error:', err);
          return {
            statusText: "Token generation failed",
            token: null
          };
        }

        return {
          statusText: "success",
          token
        };

      } catch (err) {
        console.error('Login resolver error:', err);
        return {
          statusText: "Login failed",
          token: null
        };
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

      try {
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
          user = await prisma.user.create({
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
      } catch (error) {
        console.error('Facebook login error:', error);
        return {
          statusText: 'Facebook login failed',
          token: null
        };
      }
    },
    
    createUser: async (_: any, { email, password, firstName, lastName }: any) => {
      try {
        const passwordHash = await encryptPassword(password, 10);

        console.log(email, password, firstName, lastName);
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
          };
        }
      } catch (error) {
        console.error('Create user error:', error);
        return {
          statusText: "Account creation failed"
        };
      }
    },

    createProduct: async (_: any, { id, name, description, price, salePrice, color, size, stock, sku, supplierId }: any) => {
      try {
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
                salePrice: salePrice || null,
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
      } catch (error) {
        console.error('Create product error:', error);
        return { statusText: 'Product creation failed!' };
      }
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
        await prisma.productVariant.create({
          data: {
            name: input.name,
            productId: input.productId,
            sku: input.sku || `SKU-${Date.now()}`,
            color: input.color,
            size: input.size,
            price: input.price,
            salePrice: input.salePrice,
            stock: input.stock,
            images: [],
            options: [],
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

    createAddress: async (_: any, args: any) => {
      try {
        const {
          userId,
          type,
          street,
          city,
          state,
          zipCode,
          country,
          isDefault,
        } = args.input;

        await prisma.address.create({
          data: {
            userId,
            type,
            street,
            city,
            state,
            zipCode,
            country,
            isDefault,
          },
        });
        return {
          statusText: "Successful"
        };
      } catch (error) {
        console.error('Create address error:', error);
        return {
          statusText: "Address creation failed"
        };
      }
    },

    createCategory: async (_: any, { name, description, status }: any) => {
      try {
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
      } catch (error) {
        console.error('Create category error:', error);
        return {
          statusText: 'Failed to create category'
        };
      }
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
            quantity: item.quantity,
            price: item.price,
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
          return {
            statusText: 'Successful!'
          };
        }
      } catch (error) {
        console.error('Create order error:', error);
        return {
          statusText: 'Order creation failed'
        };
      }
    },

    respondToTicket: async (_: any, { ticketId, userId, message }: any) => {
      try {
        const response = await prisma.ticketResponse.create({
          data: { ticketId, userId, message },
        });
        return response;
      } catch (error) {
        console.error('Respond to ticket error:', error);
        throw new Error('Failed to respond to ticket');
      }
    },

    // ================= Social Media Mutations =================
    createPost: async (_: any, { input }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      try {
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
      } catch (error) {
        console.error('Create post error:', error);
        throw new Error('Failed to create post');
      }
    },
    
    updatePost: async (_: any, { id, input }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      try {
        const existingPost = await prisma.post.findUnique({
          where: { id },
          select: { userId: true }
        });
        
        if (!existingPost) {
          throw new Error('Post not found');
        }
        
        if (existingPost?.userId !== currentUserId) {
          throw new Error('You can only update your own posts');
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
      } catch (error) {
        console.error('Update post error:', error);
        throw new Error('Failed to update post');
      }
    },
    
    deletePost: async (_: any, { id }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      try {
        const existingPost = await prisma.post.findUnique({
          where: { id },
          select: { userId: true }
        });
        
        if (!existingPost) {
          throw new Error('Post not found');
        }
        
        if (existingPost?.userId !== currentUserId) {
          throw new Error('You can only delete your own posts');
        }
        
        await prisma.post.delete({
          where: { id }
        });
        
        return true;
      } catch (error) {
        console.error('Delete post error:', error);
        throw new Error('Failed to delete post');
      }
    },
    
    createComment: async (_: any, { input }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      try {
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
      } catch (error) {
        console.error('Create comment error:', error);
        throw new Error('Failed to create comment');
      }
    },
    
    updateComment: async (_: any, { id, input }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      try {
        const existingComment = await prisma.comment.findUnique({
          where: { id },
          select: { userId: true }
        });
        
        if (!existingComment) {
          throw new Error('Comment not found');
        }
        
        if (existingComment?.userId !== currentUserId) {
          throw new Error('You can only update your own comments');
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
      } catch (error) {
        console.error('Update comment error:', error);
        throw new Error('Failed to update comment');
      }
    },
    
    deleteComment: async (_: any, { id }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      try {
        const existingComment = await prisma.comment.findUnique({
          where: { id },
          select: { userId: true }
        });
        
        if (!existingComment) {
          throw new Error('Comment not found');
        }
        
        if (existingComment?.userId !== currentUserId) {
          throw new Error('You can only delete your own comments');
        }
        
        await prisma.comment.delete({
          where: { id }
        });
        
        return true;
      } catch (error) {
        console.error('Delete comment error:', error);
        throw new Error('Failed to delete comment');
      }
    },
    
    likePost: async (_: any, { postId }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      try {
        const post = await prisma.post.findUnique({
          where: { id: postId }
        });
        
        if (!post) {
          throw new Error('Post not found');
        }
        
        const existingLike = await prisma.like.findFirst({
          where: {
            postId,
            userId: currentUserId
          }
        });
        
        if (existingLike) {
          throw new Error('You already liked this post');
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
      } catch (error) {
        console.error('Like post error:', error);
        throw new Error('Failed to like post');
      }
    },
    
    unlikePost: async (_: any, { postId }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      try {
        const like = await prisma.like.findFirst({
          where: {
            postId,
            userId: currentUserId
          }
        });
        
        if (!like) {
          throw new Error('You have not liked this post');
        }
        
        await prisma.like.delete({
          where: { id: like?.id }
        });
        
        return true;
      } catch (error) {
        console.error('Unlike post error:', error);
        throw new Error('Failed to unlike post');
      }
    },
    
    likeComment: async (_: any, { commentId }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      try {
        const comment = await prisma.comment.findUnique({
          where: { id: commentId }
        });
        
        if (!comment) {
          throw new Error('Comment not found');
        }
        
        const existingLike = await prisma.like.findFirst({
          where: {
            commentId,
            userId: currentUserId
          }
        });
        
        if (existingLike) {
          throw new Error('You already liked this comment');
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
      } catch (error) {
        console.error('Like comment error:', error);
        throw new Error('Failed to like comment');
      }
    },
    
    unlikeComment: async (_: any, { commentId }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      try {
        const like = await prisma.like.findFirst({
          where: {
            commentId,
            userId: currentUserId
          }
        });
        
        if (!like) {
          throw new Error('You have not liked this comment');
        }
        
        await prisma.like.delete({
          where: { id: like?.id }
        });
        
        return true;
      } catch (error) {
        console.error('Unlike comment error:', error);
        throw new Error('Failed to unlike comment');
      }
    },
    
    followUser: async (_: any, { userId }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      try {
        if (userId === currentUserId) {
          throw new Error('You cannot follow yourself');
        }
        
        const user = await prisma.user.findUnique({
          where: { id: userId }
        });
        
        if (!user) {
          throw new Error('User not found');
        }
        
        const existingFollow = await prisma.follow.findFirst({
          where: {
            followerId: currentUserId,
            followingId: userId
          }
        });
        
        if (existingFollow) {
          throw new Error('You are already following this user');
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
      } catch (error) {
        console.error('Follow user error:', error);
        throw new Error('Failed to follow user');
      }
    },
    
    unfollowUser: async (_: any, { userId }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      try {
        const follow = await prisma.follow.findFirst({
          where: {
            followerId: currentUserId,
            followingId: userId
          }
        });
        
        if (!follow) {
          throw new Error('You are not following this user');
        }
        
        await prisma.follow.delete({
          where: { id: follow?.id }
        });
        
        return true;
      } catch (error) {
        console.error('Unfollow user error:', error);
        throw new Error('Failed to unfollow user');
      }
    },
    
    tagUsersInPost: async (_: any, { postId, userIds }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      try {
        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { userId: true }
        });
        
        if (!post) {
          throw new Error('Post not found');
        }
        
        if (post?.userId !== currentUserId) {
          throw new Error('You can only tag users in your own posts');
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
      } catch (error) {
        console.error('Tag users in post error:', error);
        throw new Error('Failed to tag users in post');
      }
    },
    
    removeTagFromPost: async (_: any, { postId, userId }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      try {
        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { userId: true }
        });
        
        if (!post) {
          throw new Error('Post not found');
        }
        
        if (post?.userId !== currentUserId) {
          throw new Error('You can only modify tags in your own posts');
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
      } catch (error) {
        console.error('Remove tag from post error:', error);
        throw new Error('Failed to remove tag from post');
      }
    }
  },

  // ================= Type Resolvers =================
  User: {
    posts: async (parent: any, _: any, context: any) => {
      const currentUserId = getUserId(context, false);
      
      let whereClause: any = { userId: parent.id };
      
      if (currentUserId !== parent.id) {
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
      
      const posts = await prisma.post.findMany({
        where: whereClause,
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
      });
      
      return posts.map(post => ({
        ...post,
        taggedUsers: post.taggedUsers?.map((tu: any) => tu.user) || [],
        isLikedByMe: (post.likes?.length || 0) > 0,
        likeCount: post._count?.likes || 0,
        commentCount: post._count?.comments || 0
      }));
    },
    
    followers: async (parent: any) => {
      const followers = await prisma.follow.findMany({
        where: { followingId: parent?.id },
        include: {
          follower: true
        }
      });
      
      return followers.map(f => f.follower);
    },
    
    following: async (parent: any) => {
      const following = await prisma.follow.findMany({
        where: { followerId: parent?.id },
        include: {
          following: true
        }
      });
      
      return following.map(f => f.following);
    },
    
    followerCount: async (parent: any) => {
      return prisma.follow.count({
        where: { followingId: parent?.id }
      });
    },
    
    followingCount: async (parent: any) => {
      return prisma.follow.count({
        where: { followerId: parent?.id }
      });
    },

    isFollowing: async (parent: any, _: any, context: any) => {
      const currentUserId = getUserId(context, false);
      
      if (!currentUserId || currentUserId === parent.id) {
        return false;
      }
      
      const follow = await prisma.follow.findFirst({
        where: {
          followerId: currentUserId,
          followingId: parent.id
        }
      });
      
      return !!follow;
    }
  }
};
