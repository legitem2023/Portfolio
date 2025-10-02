import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime
  scalar Json

  # ================= Enums =================
  enum Role {
    ADMIN
    MANAGER
    USER
  }

  enum AddressType {
    BILLING
    SHIPPING
  }

  enum OrderStatus {
    PENDING
    PROCESSING
    SHIPPED
    DELIVERED
    CANCELLED
    REFUNDED
  }

  enum PaymentMethod {
    CREDIT_CARD
    PAYPAL
    STRIPE
    BANK_TRANSFER
    COD
  }

  enum PaymentStatus {
    PENDING
    COMPLETED
    FAILED
    REFUNDED
  }

  enum TicketStatus {
    OPEN
    IN_PROGRESS
    RESOLVED
    CLOSED
  }

  enum TicketPriority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  enum NotificationType {
    ORDER_UPDATE
    PAYMENT_CONFIRMATION
    SHIPMENT
    PROMOTIONAL
    SUPPORT
  }

  # ================= Social Media Enums =================
  enum PrivacySetting {
    PUBLIC
    FRIENDS
    ONLY_ME
  }

  # ================= Models =================
  type User {
    id: ID!
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    avatar: String
    phone: String
    emailVerified: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    role: Role!
    addresses: [Address!]
    orders: [Order!]
    reviews: [Review!]
    wishlist: [WishlistItem!]
    cart: [CartItem!]
    payments: [Payment!]
    messagesSent: [Message!]
    messagesReceived: [Message!]
    supportTickets: [SupportTicket!]
    notifications: [Notification!]
    ticketResponses: [TicketResponse!]
    
    # Social media fields
    posts: [Post!]!
    followers: [User!]!
    following: [User!]!
    followerCount: Int!
    followingCount: Int!
    isFollowing: Boolean!
  }

  type Address {
    id: ID!
    type: AddressType!
    street: String!
    city: String!
    state: String!
    zipCode: String!
    country: String!
    isDefault: Boolean!
    createdAt: DateTime!
    user: User!
    orders: [Order!]
  }

  type Product {
    id: ID!
    name: String!
    description: String!
    price: Float!
    salePrice: Float
    sku: String!
    stock: Int!
    images: [String!]!
    category: Category!
    brand: String
    weight: Float
    supplierId: String
    supplier : User
    dimensions: String
    isActive: Boolean!
    featured: Boolean!
    tags: [String!]!
    attributes: Json
    createdAt: DateTime!
    updatedAt: DateTime!
    variants: [ProductVariant]
    orders: [OrderItem!]
    reviews: [Review!]
    wishlist: [WishlistItem!]
    cart: [CartItem!]
  }

  type ProductVariant {
    id: ID!
    name: String!
    options: [String!]!
    createdAt: DateTime!
    product: Product!
    productId:  String
    sku  : String
    color : String
    size  : String
    price : Float
    salePrice: Float
    stock : Int!
    images: [String!]!
  }

  type Category {
    id: ID!
    name: String!
    description: String
    image: String
    isActive: Boolean!
    createdAt: DateTime!
    parent: Category
    children: [Category!]
    products: [Product!]
  }

  type Order {
    id: ID!
    orderNumber: String!
    status: OrderStatus!
    total: Float!
    subtotal: Float!
    tax: Float!
    shipping: Float!
    discount: Float!
    createdAt: DateTime!
    updatedAt: DateTime!
    user: User!
    address: Address!
    items: [OrderItem!]
    payments: [Payment!]
  }

  type OrderItem {
    id: ID!
    quantity: Int!
    price: Float!
    variantInfo: String
    order: Order!
    product: Product!
  }

  type CartItem {
    id: ID!
    quantity: Int!
    variantInfo: String
    createdAt: DateTime!
    updatedAt: DateTime!
    user: User!
    product: Product!
  }

  type WishlistItem {
    id: ID!
    createdAt: DateTime!
    user: User!
    product: Product!
  }

  type Payment {
    id: ID!
    amount: Float!
    method: PaymentMethod!
    status: PaymentStatus!
    transactionId: String
    details: String
    createdAt: DateTime!
    order: Order!
    user: User!
  }

  type Review {
    id: ID!
    rating: Int!
    title: String
    comment: String
    isApproved: Boolean!
    createdAt: DateTime!
    user: User!
    product: Product!
  }

  type Message {
    id: ID!
    subject: String
    body: String!
    isRead: Boolean!
    createdAt: DateTime!
    sender: User!
    recipient: User!
    parent: Message
    replies: [Message!]
  }

  type SupportTicket {
    id: ID!
    subject: String!
    description: String!
    status: TicketStatus!
    priority: TicketPriority!
    assignedTo: ID
    createdAt: DateTime!
    updatedAt: DateTime!
    user: User!
    responses: [TicketResponse!]
  }

  type TicketResponse {
    id: ID!
    message: String!
    isInternal: Boolean!
    createdAt: DateTime!
    ticket: SupportTicket!
    user: User!
  }

  type Notification {
    id: ID!
    type: NotificationType!
    title: String!
    message: String!
    isRead: Boolean!
    link: String
    createdAt: DateTime!
    user: User!
  }

  # ================= Social Media Types =================
  type Post {
    id: ID!
    user: User!
    content: String!
    background: String
    images: [String!]!
    taggedUsers: [User!]!
    comments: [Comment!]!
    likes: [Like!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    privacy: PrivacySetting!
    commentCount: Int!
    likeCount: Int!
    isLikedByMe: Boolean!
  }

  type Comment {
    id: ID!
    post: Post!
    user: User!
    content: String!
    parent: Comment
    replies: [Comment!]!
    likes: [Like!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    likeCount: Int!
    isLikedByMe: Boolean!
  }

  type Like {
    id: ID!
    user: User!
    post: Post
    comment: Comment
    createdAt: DateTime!
  }

  type Follow {
    id: ID!
    follower: User!
    following: User!
    createdAt: DateTime!
  }

  # Feed types
  type PostFeed {
    posts: [Post!]!
    totalCount: Int!
    hasNextPage: Boolean!
  }

  type CommentFeed {
    comments: [Comment!]!
    totalCount: Int!
    hasNextPage: Boolean!
  }

  type UserSearchResult {
    users: [User!]!
    totalCount: Int!
    hasNextPage: Boolean!
  }

  type ProductHaslimit {
    items: [Product]
    nextCursor: String
    hasMore: Boolean!
  }

  # ================= Queries & Mutations =================
  type Query {
    users: [User!]
    user(id: ID!): User
    products(search: String, cursor: String, limit: Int, category: String, sortBy: String): ProductHaslimit
    product(id: ID!): Product
    categories: [Category!]
    orders(userId: ID!): [Order!]
    supportTickets: [SupportTicket!]
    getProducts(userId: ID!): [Product]
    
    # Social media queries
    posts(page: Int, limit: Int, userId: ID, followingOnly: Boolean): PostFeed!
    post(id: ID!): Post
    comments(postId: ID!, page: Int, limit: Int): CommentFeed!
    userFeed(page: Int, limit: Int, userId: String): PostFeed!
    userLikes(userId: ID!): [Like]!
    followers(userId: ID!): [User]!
    following(userId: ID!): [User]!
    searchUsers(query: String!, page: Int, limit: Int): UserSearchResult!
  }

  type Response {
    statusText: String
  }
  
  type Result {
    token: String
    statusText: String
  }

  input LoginInput {
    email: String
    password: String
  }

  input FacebookLoginInput {
    idToken: String!
  }

  input GoogleLoginInput {
    idToken: String!
  }

  # Social media input types
  input CreatePostInput {
    userId:String!
    content: String!
    background: String
    images: [String!]
    taggedUsers: [ID!]
    privacy: PrivacySetting
  }

  input UpdatePostInput {
    content: String
    background: String
    images: [String!]
    taggedUsers: [ID!]
    privacy: PrivacySetting
  }

  input CreateCommentInput {
    userId:String!
    postId: ID!
    content: String!
    parentId: ID
  }

  input UpdateCommentInput {
    content: String!
  }

type SetDefaultAddressResponse {
  success: Boolean!
  message: String
  address: Address
}


  type Mutation {
    setDefaultAddress(addressId: ID!,userId: ID!): SetDefaultAddressResponse!
    login(input: LoginInput): Result
    loginWithGoogle(input: GoogleLoginInput): Result
    loginWithFacebook(input: FacebookLoginInput): Result
    createUser(email: String!, password: String!, firstName: String!, lastName: String!): Result
    createProduct(id: String, name: String!, description: String!, price: Float!, salePrice: Float!, sku: String!, supplierId: String!): Response!
    createCategory(name: String!, description: String!, status: Boolean): Response!
    createOrder(userId: ID!, addressId: ID!, items: [OrderItemInput!]!): Result
    respondToTicket(ticketId: ID!, userId: ID!, message: String!): TicketResponse!

    createVariant(input: ProductVariantInput): Result
    createAddress (input:AddressInputs ): Result
    # Social media mutations
    createPost(input: CreatePostInput!): Post!
    updatePost(id: ID!, input: UpdatePostInput!): Post!
    deletePost(id: ID!): Boolean!
    createComment(input: CreateCommentInput!): Comment!
    updateComment(id: ID!, input: UpdateCommentInput!): Comment!
    deleteComment(id: ID!): Boolean!
    likePost(postId: ID!): Like!
    unlikePost(postId: ID!): Boolean!
    likeComment(commentId: ID!): Like!
    unlikeComment(commentId: ID!): Boolean!
    followUser(userId: ID!): Follow!
    unfollowUser(userId: ID!): Boolean!
    tagUsersInPost(postId: ID!, userIds: [ID!]!): Post!
    removeTagFromPost(postId: ID!, userId: ID!): Post!
  }

input ProductVariantInput {
    name: String!
    productId: String
    sku  : String
    color : String
    size  : String
    price : Float
    salePrice: Float
    stock : Int!
  }

input AddressInputs {
     userId :    String
     type :      String
     street :    String
     city :      String
     state :     String
     zipCode :   String
     country :   String
     isDefault : Boolean
}

  input OrderItemInput {
    productId: ID!
    quantity: Int!
    price: Float!
  }
`;
