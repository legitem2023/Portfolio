import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime
  scalar Json

  # ================= Enums =================
  enum Role {
    ADMIN
    CUSTOMER
    SUPPORT
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
    dimensions: String
    isActive: Boolean!
    featured: Boolean!
    tags: [String!]!
    attributes: Json
    createdAt: DateTime!
    updatedAt: DateTime!
    variants: [ProductVariant!]
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

  type ProductHaslimit {
    items:[Product]
    nextCursor: String,
    hasMore:Boolean!
  }
  # ================= Queries & Mutations =================
  type Query {
    users: [User!]
    user(id: ID!): User
    products(search: String, cursor:String, limit:Int,category:String,sortBy:String):ProductHaslimit
    product(id: ID!): Product
    categories: [Category!]
    orders(userId: ID!): [Order!]
    supportTickets: [SupportTicket!]
    getProducts:[Product!]
  }

  type Response {
     statusText: String
  }
 
  type Mutation {
    createUser(email: String!, password: String!, firstName: String!, lastName: String!): User!
    createProduct(id: String, name: String!, description: String!, price: Float!,salePrice: Float!, sku: String!): Response!
    createCategory(name:String!,description:String!,status:Boolean):Response!
    createOrder(userId: ID!, addressId: ID!, items: [OrderItemInput!]!): Order!
    respondToTicket(ticketId: ID!, userId: ID!, message: String!): TicketResponse!
  }

  input OrderItemInput {
    productId: ID!
    quantity: Int!
    price: Float!
  }
`;
