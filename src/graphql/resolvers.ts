// resolvers.ts
import { PrismaClient, PrivacySetting } from "@prisma/client";
import { comparePassword } from '../../utils/script';
import { EncryptJWT } from 'jose';
//import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server';

const prisma = new PrismaClient();

// Utility function for authentication
const getUserId = (context: any, required = true): string => {
  const userId = context.user?.id;
  
  if (required && !userId) {
  //  throw new AuthenticationError('Authentication required');
  }
  
  return userId;
};

export const resolvers = {
  Query: {
    // Existing e-commerce queries
    users: () => prisma.user.findMany(),
    
    user: (_: any, { id }: { id: string }) =>
      prisma.user.findUnique({ where: { id } }),

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
            category: true,
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

    orders: (_: any, { userId }: { userId: string }) =>
      prisma.order.findMany({ where: { userId } }),

    supportTickets: () => prisma.supportTicket.findMany(),
    
    getProducts: async () => {
      const products = await prisma.product.findMany({
        include: {
          category: true
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
            { privacy: 'PUBLIC' },
            {
              AND: [
                { privacy: 'FRIENDS' },
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
            { privacy: 'PUBLIC' },
            {
              AND: [
                { privacy: 'FRIENDS' },
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
       //   throw new ForbiddenError('You do not have permission to view this post');
        }
        
        if (post?.privacy === 'FRIENDS') {
          const isFriend = await prisma.follow.findFirst({
            where: {
              followerId: currentUserId,
              followingId: post?.userId
            }
          });
          
          if (!isFriend) {
         //   throw new ForbiddenError('You do not have permission to view this post');
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
    
    userFeed: async (_: any, { page = 1, limit = 10 }: any, context: any) => {
      const currentUserId = getUserId(context);
      const skip = (page - 1) * limit;
      
      const whereClause = {
        OR: [
          { userId: currentUserId },
          {
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
    // Existing e-commerce mutations
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

      const secret = new TextEncoder().encode('QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz');
      const token = await new EncryptJWT({
        userId: user.id,
        phone: user.phone,
        email: user.email,
        name: user.firstName,
        role: user.role,
        image: user.avatar
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
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            firstName: fbUser.name,
            lastName: '',
            email: fbUser.email,
            phone: '',
            password: '',
            avatar: avatarUrl,
            role: 'USER'
          },
        });
      }

      const secret = new TextEncoder().encode('QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz');
      const token = await new EncryptJWT({
        userId: user.id,
        email: user.email,
        name: user.firstName,
        role: user.role,
        image: user.avatar
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
      await prisma.product.create({
        data: {
          name,
          description,
          price,
          sku,
          salePrice,
          category: {
            connect: { id: id },
          },
        },
      });
      return { statusText: 'Product created successfully!' };
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

    // Social media mutations
    createPost: async (_: any, { input }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      const post = await prisma.post.create({
        data: {
          content: input.content,
          background: input.background,
          images: input.images || [],
          privacy: input.privacy || 'PUBLIC',
          userId: currentUserId,
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
        throw new UserInputError('Post not found');
      }
      
      if (existingPost.userId !== currentUserId) {
        throw new ForbiddenError('You can only update your own posts');
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
        throw new UserInputError('Post not found');
      }
      
      if (existingPost.userId !== currentUserId) {
        throw new ForbiddenError('You can only delete your own posts');
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
          userId: currentUserId,
          parentId: input.parentId
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
        throw new UserInputError('Comment not found');
      }
      
      if (existingComment.userId !== currentUserId) {
        throw new ForbiddenError('You can only update your own comments');
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
        throw new UserInputError('Comment not found');
      }
      
      if (existingComment.userId !== currentUserId) {
        throw new ForbiddenError('You can only delete your own comments');
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
        throw new UserInputError('Post not found');
      }
      
      const existingLike = await prisma.like.findFirst({
        where: {
          postId,
          userId: currentUserId
        }
      });
      
      if (existingLike) {
        throw new UserInputError('You already liked this post');
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
        throw new UserInputError('You have not liked this post');
      }
      
      await prisma.like.delete({
        where: { id: like.id }
      });
      
      return true;
    },
    
    likeComment: async (_: any, { commentId }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      const comment = await prisma.comment.findUnique({
        where: { id: commentId }
      });
      
      if (!comment) {
        throw new UserInputError('Comment not found');
      }
      
      const existingLike = await prisma.like.findFirst({
        where: {
          commentId,
          userId: currentUserId
        }
      });
      
      if (existingLike) {
        throw new UserInputError('You already liked this comment');
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
        throw new UserInputError('You have not liked this comment');
      }
      
      await prisma.like.delete({
        where: { id: like.id }
      });
      
      return true;
    },
    
    followUser: async (_: any, { userId }: any, context: any) => {
      const currentUserId = getUserId(context);
      
      if (userId === currentUserId) {
        throw new UserInputError('You cannot follow yourself');
      }
      
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        throw new UserInputError('User not found');
      }
      
      const existingFollow = await prisma.follow.findFirst({
        where: {
          followerId: currentUserId,
          followingId: userId
        }
      });
      
      if (existingFollow) {
        throw new UserInputError('You are already following this user');
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
        throw new UserInputError('You are not following this user');
      }
      
      await prisma.follow.delete({
        where: { id: follow.id }
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
        throw new UserInputError('Post not found');
      }
      
      if (post.userId !== currentUserId) {
        throw new ForbiddenError('You can only tag users in your own posts');
      }
      
      await prisma.postTaggedUser.createMany({
        data: userIds.map((userId: any) => ({
          postId,
          userId
        })),
        skipDuplicates: true
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
        throw new UserInputError('Post not found');
      }
      
      if (post.userId !== currentUserId) {
        throw new ForbiddenError('You can only modify tags in your own posts');
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
  },

  // Extend the User type with social fields
  User: {
    posts: async (parent: any, _: any, context: any) => {
      const currentUserId = getUserId(context, false);
      
      let whereClause: any = { userId: parent.id };
      
      if (currentUserId !== parent.id) {
        whereClause.OR = [
          { privacy: 'PUBLIC' },
          {
            AND: [
              { privacy: 'FRIENDS' },
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
        where: { followingId: parent.id },
        include: {
          follower: true
        }
      });
      
      return followers.map(f => f.follower);
    },
    
    following: async (parent: any) => {
      const following = await prisma.follow.findMany({
        where: { followerId: parent.id },
        include: {
          following: true
        }
      });
      
      return following.map(f => f.following);
    },
    
    followerCount: async (parent: any) => {
      return prisma.follow.count({
        where: { followingId: parent.id }
      });
    },
    
    followingCount: async (parent: any) => {
      return prisma.follow.count({
        where: { followerId: parent.id }
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
