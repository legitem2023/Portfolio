import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    users: () => prisma.user.findMany(),
    user: (_: any, { id }: { id: string }) =>
      prisma.user.findUnique({ where: { id } }),

    products: (_: any, { search }: { search?: string }) =>
      search
        ? prisma.product.findMany({
            where: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { tags: { has: search } },
              ],
            },
          })
        : prisma.product.findMany(),

    product: (_: any, { id }: { id: string }) =>
      prisma.product.findUnique({ where: { id } }),

    categories: () => prisma.category.findMany(),

    orders: (_: any, { userId }: { userId: string }) =>
      prisma.order.findMany({ where: { userId } }),

    supportTickets: () => prisma.supportTicket.findMany(),
  },

  Mutation: {
    createUser: async (
      _: any,
      { email, password, firstName, lastName }: any
    ) => {
      return prisma.user.create({
        data: { email, password, firstName, lastName },
      });
    },

    createProduct: async (_: any, {id, name, description, price, sku }: any) => {
    const product = await prisma.product.create({
        data: {
          name,
          description,
          price,
          sku,
          category: {
            connect: { id: id }, // Prisma will link it automatically
          },
        },
});

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
