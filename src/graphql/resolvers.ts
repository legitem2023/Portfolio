import { PrismaClient } from "@prisma/client";
import { comparePassword, encryptPassword, generateTrackingNumber } from '../../utils/script';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { EncryptJWT, jwtDecrypt } from 'jose';
const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    users: () => prisma.user.findMany(),
    user: (_: any, { id }: { id: string }) =>
      prisma.user.findUnique({ where: { id } }),

    // Updated products resolver with optimizations for large datasets
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
        // Build where clause conditionally with indexed fields only
        const where: any = {};

        if (search) {
          where.OR = [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { tags: { has: search } },
          ];
        }

        if (category && category !== "All Categories") {
          where.category = category;
        }

        // Determine sorting - use indexed fields for better performance
        let orderBy: any = { id: "asc" };
        if (sortBy) {
          switch (sortBy) {
            case "Newest":
              orderBy = { createdAt: "desc" };
              break;
            case "Price: Low to High":
              orderBy = { price: "asc" };
              break;
            case "Price: High to Low":
              orderBy = { price: "desc" };
              break;
            case "Highest Rated":
              orderBy = { rating: "desc" };
              break;
            default:
              orderBy = { featured: "desc", id: "asc" };
          }
        }

        const products = await prisma.product.findMany({
          where,
          take: limit + 1, // Get one extra to check for next page
          skip: cursor ? 1 : 0, // Skip cursor if provided
          cursor: cursor ? { id: cursor } : undefined,
          orderBy,
          // Only select necessary fields to reduce data transfer
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
            category: true,
            featured: true,
            isActive: true,
            stock: true,
            // Skip heavy fields like description unless needed
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

    categories: async (_:any,args:any) => {
      return prisma.category.findMany();
    },

    orders: (_: any, { userId }: { userId: string }) =>
      prisma.order.findMany({ where: { userId } }),

    supportTickets: () => prisma.supportTicket.findMany(),
    getProducts: async (_:any,_args:any) => {
       const products = await prisma.product.findMany({
         include:{
           category:true
         }
       });
      return products;
    }
  },

  Mutation: {
    login: async (_: any, args: any) => {
    const { email, password } = args.input;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }
   
    const isValid = await comparePassword(password, user.password || '');

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const secret = new TextEncoder().encode('QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz'); // ✅ Uint8Array
    // Use JOSE to create encrypted token (JWE)
    const token = await new EncryptJWT({
      userId: user.id,
      phone: user.phone,
      email: user.email,
      name: user.firstName,
      role:user.role,
      image:user.avatar
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
loginWithFacebook: async (_: any, args: any) => {
    const { idToken } = args.input;

// 1. Verify the token with Facebook Graph API
const fbRes = await fetch(
  `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${idToken}`
);
const fbUser = await fbRes.json();
if (!fbUser || !fbUser.id) {
  throw new Error('Invalid Facebook token');
}

const avatarUrl = fbUser.picture?.data?.url ?? '';

// 2. Find or create user in your DB
let user = await prisma.user.findUnique({
  where: { email: fbUser.email },
});

if (!user) {
  user = await prisma.user.create({
    data: {
      firstName: fbUser.name,
      lastName:'',
      email: fbUser.email,
      phone: '', // Facebook doesn't provide it
      password: '', // Use empty or a random placeholder
      avatar: avatarUrl,
      role:'USER'
    },
  });
}

    const secret = new TextEncoder().encode('QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz'); // ✅ Uint8Array

    // 3. Return encrypted JWT
    const token = await new EncryptJWT({
      userId: user.id,
      email: user.email,
      name: user.firstName,
      role:user.role,
      image:user.avatar
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
    createUser: async (
      _: any,
      { email, password, firstName, lastName }: any
    ) => {
      return prisma.user.create({
        data: { email, password, firstName, lastName },
      });
    },

    createProduct: async (_: any, { id, name, description, price, salePrice, sku }: any) => {
      const product = await prisma.product.create({
        data: {
          name,
          description,
          price,
          sku,
          salePrice,
          category: {
            connect: { id: id }, // Prisma will link it automatically
          },
        },
      });
    },
    createCategory: async (_:any, { name,description,status }: any) => {
      const response = await prisma.category.create({
        data:{
          name,
          description,
          isActive:status
        }
      })
      if(response) {
        return {
          statusText:'Successful!'
        }
      }
    },
    createOrder: async (_: any, { userId, addressId, items }: any) => {
      return prisma.order.create({
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
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: { items: true },
      });
    },

    respondToTicket: async (_: any, { ticketId, userId, message }: any) => {
      return prisma.ticketResponse.create({
        data: { ticketId, userId, message },
      });
    },
  },
};
