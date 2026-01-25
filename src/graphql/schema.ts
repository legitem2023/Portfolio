import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime
  scalar Json
  scalar Upload
  
  # ================= Enums =================
  enum Role {
    ADMIN
    MANAGER
    USER
  }

  enum AddressType {
    HOME
    WORK
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

  # ================= API Bill Enums =================
  enum BillStatus {
    PENDING
    PAID
    OVERDUE
    CANCELLED
  }

  enum BillType {
    MONTHLY
    QUARTERLY
    YEARLY
    USAGE_BASED
    ONE_TIME
  }

  enum ApiServiceType {
    STRIPE
    TWILIO
    AWS
    SENDGRID
    FIREBASE
    GOOGLE_CLOUD
    AZURE
    MAILGUN
    SENDINBLUE
    OTHER
  }

  enum SortField {
    AMOUNT
    DUE_DATE
    CREATED_AT
    SERVICE
    PERIOD
  }

  enum SortOrder {
    ASC
    DESC
  }

  # ================= Social Media Enums =================
  enum PrivacySetting {
    PUBLIC
    FRIENDS
    ONLY_ME
  }

  # ================= Sales Analytics Enums =================
  enum Timeframe {
    TODAY
    YESTERDAY
    LAST_7_DAYS
    LAST_30_DAYS
    THIS_MONTH
    LAST_MONTH
    THIS_QUARTER
    LAST_QUARTER
    THIS_YEAR
    LAST_YEAR
    CUSTOM
  }

  enum GroupBy {
    DAILY
    WEEKLY
    MONTHLY
    QUARTERLY
    YEARLY
  }

  enum TrendGroupBy {
    DAY
    WEEK
    MONTH
  }

  # ================= Models =================
  type User {
    id: ID
    email: String
    password: String
    firstName: String
    lastName: String
    avatar: String
    phone: String
    emailVerified: Boolean
    createdAt: DateTime
    updatedAt: DateTime
    role: Role
    addresses: [Address]
    orders: [Order]
    reviews: [Review]
    wishlist: [WishlistItem]
    cart: [CartItem]
    products: [Product]
    payments: [Payment]
    messagesSent: [Message]
    messagesReceived: [Message]
    supportTickets: [SupportTicket]
    notifications: [Notification]
    ticketResponses: [TicketResponse]
    
    # Social media fields
    posts: [Post]
    followers: [User]
    following: [User]
    followerCount: Int
    followingCount: Int
    isFollowing: Boolean
  }

  type Address {
    id: ID
    type: AddressType
    street: String
    city: String
    state: String
    zipCode: String
    country: String
    isDefault: Boolean
    createdAt: DateTime
    user: User
    orders: [Order]
  }

  type Product {
    id: ID
    name: String
    description: String
    price: Float
    salePrice: Float
    sku: String
    stock: Int
    images: [String]
    model: String
    category: Category
    brand: String
    weight: Float
    supplierId: String
    supplier: User
    dimensions: String
    isActive: Boolean
    featured: Boolean
    tags: [String]
    attributes: Json
    createdAt: DateTime
    updatedAt: DateTime
    variants: [ProductVariant]
    orders: [OrderItem]
    reviews: [Review]
    wishlist: [WishlistItem]
    cart: [CartItem]
  }

  type ProductVariant {
    id: ID
    name: String
    options: [String]
    createdAt: DateTime
    product: Product
    productId: String
    sku: String
    color: String
    size: String
    price: Float
    salePrice: Float
    stock: Int
    images: [String]
    model: String
  }

  type Category {
    id: ID
    name: String
    description: String
    image: String
    isActive: Boolean
    createdAt: DateTime
    parent: Category
    children: [Category]
    products: [Product]
  }

  type Order {
    id: ID
    orderNumber: String
    userId: String
    supplierId: String
    status: OrderStatus
    total: Float
    subtotal: Float
    tax: Float
    shipping: Float
    discount: Float
    createdAt: DateTime
    updatedAt: DateTime
    user: User
    address: Address
    items: [OrderItem]
    payments: [Payment]
  }

  type OrderItem {
    id: ID
    quantity: Int
    price: Float
    variantInfo: String
    order: Order
    product: Product
  }

  type CartItem {
    id: ID
    quantity: Int
    variantInfo: String
    createdAt: DateTime
    updatedAt: DateTime
    user: User
    product: Product
  }

  type WishlistItem {
    id: ID
    createdAt: DateTime
    user: User
    product: Product
  }

  type Payment {
    id: ID
    amount: Float
    method: PaymentMethod
    status: PaymentStatus
    transactionId: String
    details: String
    createdAt: DateTime
    order: Order
    user: User
  }

  type Review {
    id: ID
    rating: Int
    title: String
    comment: String
    isApproved: Boolean
    createdAt: DateTime
    user: User
    product: Product
  }

  type Message {
    id: ID
    subject: String
    body: String
    isRead: Boolean
    createdAt: DateTime
    sender: User
    recipient: User
    parent: Message
    replies: [Message]
  }

  type SupportTicket {
    id: ID
    subject: String
    description: String
    status: TicketStatus
    priority: TicketPriority
    assignedTo: ID
    createdAt: DateTime
    updatedAt: DateTime
    user: User
    responses: [TicketResponse]
  }

  type TicketResponse {
    id: ID
    message: String
    isInternal: Boolean
    createdAt: DateTime
    ticket: SupportTicket
    user: User
  }

  type Notification {
    id: ID
    type: NotificationType
    title: String
    message: String
    isRead: Boolean
    link: String
    createdAt: DateTime
    user: User
  }

  # ================= API Bill Types =================
  type ApiBill {
    id: ID
    service: String
    apiName: String
    month: Int
    year: Int
    period: String
    amount: Float
    currency: String
    usage: String
    status: BillStatus
    paidAt: DateTime
    dueDate: DateTime
    invoiceId: String
    invoiceUrl: String
    tags: [String]
    createdAt: DateTime
    updatedAt: DateTime
  }

  type UsageMetrics {
    requests: Int
    successful: Int
    failed: Int
    dataProcessed: Float
    rate: Float
    customFields: Json
  }

  type ApiBillList {
    items: [ApiBill]
    total: Int
    page: Int
    pageSize: Int
    hasNext: Boolean
  }

  type BillingSummary {
    totalAmount: Float
    averageAmount: Float
    serviceBreakdown: [ServiceBreakdown]
    statusCount: StatusCount
    period: String
  }

  type ServiceBreakdown {
    service: String
    totalAmount: Float
    count: Int
    percentage: Float
  }

  type StatusCount {
    pending: Int
    paid: Int
    overdue: Int
  }

  type MonthlyTrend {
    month: Int
    year: Int
    period: String
    totalAmount: Float
    count: Int
    services: [String]
  }

  type ServiceInfo {
    name: String
    totalBills: Int
    totalAmount: Float
    lastBill: DateTime
  }

  type DashboardStats {
    totalPending: Float
    totalPaidThisMonth: Float
    upcomingDue: Int
    services: [ServiceStats]
    recentBills: [ApiBill]
  }

  type ServiceStats {
    service: String
    pendingAmount: Float
    paidAmount: Float
    billCount: Int
  }

  # ================= Social Media Types =================
  type Post {
    id: ID
    user: User
    content: String
    background: String
    images: [String]
    taggedUsers: [User]
    comments: [Comment]
    likes: [Like]
    createdAt: DateTime
    updatedAt: DateTime
    privacy: PrivacySetting
    commentCount: Int
    likeCount: Int
    isLikedByMe: Boolean
  }

  type Comment {
    id: ID
    post: Post
    user: User
    content: String
    parent: Comment
    replies: [Comment]
    likes: [Like]
    createdAt: DateTime
    updatedAt: DateTime
    likeCount: Int
    isLikedByMe: Boolean
  }

  type Like {
    id: ID
    user: User
    post: Post
    comment: Comment
    createdAt: DateTime
  }

  type Follow {
    id: ID
    follower: User
    following: User
    createdAt: DateTime
  }

  # ================= Sales Analytics Types =================
  type SalesDataResponse {
    data: [SalesDataPoint]
    summary: SalesSummary
    timeframe: TimeframeInfo
  }

  type SalesDataPoint {
    period: String
    date: DateTime
    revenue: Float
    orders: Int
    averageOrderValue: Float
    itemsSold: Int
  }

  type SalesSummary {
    totalRevenue: Float
    totalOrders: Int
    averageOrderValue: Float
    totalItemsSold: Int
    conversionRate: Float
    growthRate: Float
  }

  type SalesMetrics {
    revenue: RevenueMetrics
    orders: OrderMetrics
    customers: CustomerMetrics
  }

  type RevenueMetrics {
    total: Float
    average: Float
    growth: Float
    target: Float
  }

  type OrderMetrics {
    total: Int
    averageValue: Float
    growth: Float
    statusBreakdown: [OrderStatusCount]
  }

  type CustomerMetrics {
    total: Int
    repeatCustomers: Int
    newCustomers: Int
    averageSpend: Float
  }

  type OrderStatusCount {
    status: OrderStatus
    count: Int
    percentage: Float
  }

  type ProductSales {
    productId: String
    productName: String
    unitsSold: Int
    revenue: Float
    percentage: Float
  }

  type SalesTrendPoint {
    date: DateTime
    period: String
    revenue: Float
    orders: Int
    trend: Float
  }

  type TimeframeInfo {
    start: DateTime
    end: DateTime
    label: String
  }

  # Feed types
  type PostFeed {
    posts: [Post]
    totalCount: Int
    hasNextPage: Boolean
  }

  type CommentFeed {
    comments: [Comment]
    totalCount: Int
    hasNextPage: Boolean
  }

  type UserSearchResult {
    users: [User]
    totalCount: Int
    hasNextPage: Boolean
  }

  type ProductHaslimit {
    items: [Product]
    nextCursor: String
    hasMore: Boolean
  }

  # ================= Sales List Types =================
  type SalesListResponse {
    orders: [Order]
    totalCount: Int
    totalPages: Int
    currentPage: Int
    summary: SalesListSummary
  }

  type SalesListSummary {
    totalRevenue: Float
    totalOrders: Int
    averageOrderValue: Float
    pendingOrders: Int
    completedOrders: Int
  }

  type OrderDetail {
    order: Order
    customer: User
    shippingAddress: Address
    billingAddress: Address
    paymentDetails: [Payment]
    orderItems: [OrderItemDetail]
  }

  type OrderItemDetail {
    item: OrderItem
    product: Product
    variant: ProductVariant
  }
  
  type PageInfo {
    hasNextPage: Boolean
    hasPreviousPage: Boolean
    startCursor: String
    endCursor: String
  }
  
  type NotificationEdge {
    node: Notification
    cursor: String
  }

  type NotificationConnection {
    edges: [NotificationEdge]
    pageInfo: PageInfo
    totalCount: Int
    unreadCount: Int
  }

  # ================= Input Types =================
  input NotificationFilters {
    isRead: Boolean
    type: NotificationType
    limit: Int
    cursor: String
  }

  input CreateNotificationInput {
    userId: ID
    type: NotificationType
    title: String
    message: String
    link: String
  }

  # API Bill Input Types
  input CreateApiBillInput {
    service: String
    apiName: String
    month: Int
    year: Int
    amount: Float
    currency: String
    usage: UsageMetricsInput
    dueDate: DateTime
    invoiceId: String
    invoiceUrl: String
    tags: [String]
  }

  input UpdateApiBillInput {
    service: String
    apiName: String
    month: Int
    year: Int
    amount: Float
    currency: String
    usage: UsageMetricsInput
    status: BillStatus
    dueDate: DateTime
    invoiceId: String
    invoiceUrl: String
    tags: [String]
  }

  input UsageMetricsInput {
    requests: Int
    successful: Int
    failed: Int
    dataProcessed: Float
    rate: Float
    customFields: Json
  }

  # ================= Sales Analytics Input Types =================
  input SalesFilters {
    status: OrderStatus
    userId: String
    dateRange: DateRangeInput
    minAmount: Float
    maxAmount: Float
  }

  input DateRangeInput {
    start: DateTime
    end: DateTime
  }

  input LoginInput {
    email: String
    password: String
  }

  input FacebookLoginInput {
    idToken: String
  }

  input GoogleLoginInput {
    idToken: String
  }

  # Social media input types
  input CreatePostInput {
    userId: String
    content: String
    background: String
    images: [String]
    taggedUsers: [ID]
    privacy: PrivacySetting
  }

  input UpdatePostInput {
    content: String
    background: String
    images: [String]
    taggedUsers: [ID]
    privacy: PrivacySetting
  }

  input CreateCommentInput {
    userId: String
    postId: ID
    content: String
    parentId: ID
  }

  input UpdateCommentInput {
    content: String
  }

  type SetDefaultAddressResponse {
    success: Boolean
    message: String
    address: Address
  }

  type Response {
    statusText: String
  }
  
  type Result {
    token: String
    statusText: String
  }
  
  input PaginationInput {
    page: Int
    pageSize: Int
  }

  input SortInput {
    field: SortField
    order: SortOrder
  }
  
  input ApiBillFilters {
    service: String
    year: Int
    month: Int
    status: BillStatus
    tags: [String]
    fromDate: DateTime
    toDate: DateTime
    minAmount: Float
    maxAmount: Float
  }
  
  # ================= Queries & Mutations =================
  type Query {
    apiBills(
      filters: ApiBillFilters
      pagination: PaginationInput
      sort: SortInput
    ): ApiBillList
    
    apiBill(id: ID): ApiBill
    
    billingSummary(
      service: String
      year: Int
      quarter: Int
    ): BillingSummary
    
    # Existing queries
    notifications(userId: ID, filters: NotificationFilters): NotificationConnection
    notification(id: ID): Notification
    unreadNotificationCount(userId: ID): Int
    
    # Get messages for current user (both sent and received)
    myMessages(page: Int, limit: Int, isRead: Boolean): MessageConnection
  
    # Get conversation between two users
    conversation(userId: ID, page: Int, limit: Int): MessageConnection
  
    # Get unread message count
    unreadMessageCount: Int
  
    # Get specific message by ID
    message(id: ID): Message
  
    # Get message threads (conversations list)
    messageThreads(page: Int, limit: Int): MessageThreadConnection
  
    users: [User]
    user(id: ID): User
    products(search: String, cursor: String, limit: Int, category: String, sortBy: String): ProductHaslimit
    product(id: String): Product
    categories: [Category]
    orders(userId: ID): [Order]
    supportTickets: [SupportTicket]
    getProducts(userId: ID): [Product]
    
    # Social media queries
    posts(page: Int, limit: Int, userId: ID, followingOnly: Boolean): PostFeed
    post(id: ID): Post
    comments(postId: ID, page: Int, limit: Int): CommentFeed
    userFeed(page: Int, limit: Int, userId: String): PostFeed
    userLikes(userId: ID): [Like]
    followers(userId: ID): [User]
    following(userId: ID): [User]
    searchUsers(query: String, page: Int, limit: Int): UserSearchResult

    # Sales Analytics queries
    salesData(
      timeframe: Timeframe
      groupBy: GroupBy
      filters: SalesFilters
    ): SalesDataResponse
    
    salesMetrics(
      timeframe: Timeframe
      filters: SalesFilters
    ): SalesMetrics
    
    topProducts(
      timeframe: Timeframe
      limit: Int
    ): [ProductSales]
    
    salesTrend(
      timeframe: Timeframe
      groupBy: TrendGroupBy
    ): [SalesTrendPoint]
    
    # Sales List queries
    salesList(
      page: Int
      limit: Int
      filters: SalesFilters
      sortBy: String
      sortOrder: String
    ): SalesListResponse
    
    salesOrder(id: ID): Order

    # ================= API Bill Queries =================
    monthlyTrends(
      service: String
      year: Int
    ): [MonthlyTrend]
    
    apiServices: [ServiceInfo]
    
    apiDashboardStats: DashboardStats
  }

  type Mutation {
    # Existing mutations
    createNotification(input: CreateNotificationInput): Notification
    markNotificationAsRead(id: ID): Notification
    markAllNotificationsAsRead(userId: ID): Boolean
    deleteNotification(id: ID): Boolean
    deleteAllReadNotifications(userId: ID): Boolean
    
    # Send a new message
    sendMessage(input: SendMessageInput): Message
  
    # Reply to a message
    replyMessage(input: ReplyMessageInput): Message
  
    # Mark message as read
    markAsRead(messageId: ID): Message
  
    # Mark multiple messages as read
    markMultipleAsRead(messageIds: [ID]): Boolean
  
    # Delete a message (soft delete for sender)
    deleteMessage(messageId: ID): Boolean
  
    # Delete conversation with a user
    deleteConversation(userId: ID): Boolean

    setDefaultAddress(addressId: ID, userId: ID): SetDefaultAddressResponse
    logout: LogoutResponse
    login(input: LoginInput): Result
    loginWithGoogle(input: GoogleLoginInput): Result
    loginWithFacebook(input: FacebookLoginInput): Result
    createUser(email: String, password: String, firstName: String, lastName: String): Result
    createProduct(id: String, name: String, stock: Int, description: String, color: String, size: String, price: Float, salePrice: Float, sku: String, supplierId: String): Response
    deleteProduct(id: ID): Result
    deleteVariant(id: ID): Result
    createCategory(name: String, description: String, status: Boolean): Response
    createOrder(userId: ID, addressId: ID, items: [OrderItemInput]): Result
    respondToTicket(ticketId: ID, userId: ID, message: String): TicketResponse
    singleUpload(base64Image: String, productId: ID): Result
    categoryImageUpload(base64Image: String, categoryId: ID): Result
    createVariant(input: ProductVariantInput): Result
    updateVariant(id: String, input: ProductVariantInput): Result
    createAddress(input: AddressInputs): Result
    
    # Social media mutations
    createPost(input: CreatePostInput): Post
    updatePost(id: ID, input: UpdatePostInput): Post
    deletePost(id: ID): Boolean
    createComment(input: CreateCommentInput): Comment
    updateComment(id: ID, input: UpdateCommentInput): Comment
    deleteComment(id: ID): Boolean
    likePost(postId: ID): Like
    unlikePost(postId: ID): Boolean
    likeComment(commentId: ID): Like
    unlikeComment(commentId: ID): Boolean
    followUser(userId: ID): Follow
    unfollowUser(userId: ID): Boolean
    tagUsersInPost(postId: ID, userIds: [ID]): Post
    removeTagFromPost(postId: ID, userId: ID): Post
    upload3DModel(file: Upload, filename: String, productId: String): ModelUploadResponse

    # ================= API Bill Mutations =================
    createApiBill(input: CreateApiBillInput): ApiBill
    updateApiBill(id: ID, input: UpdateApiBillInput): ApiBill
    deleteApiBill(id: ID): Boolean
    
    # Bill Actions
    markApiBillAsPaid(id: ID, paidAt: DateTime): ApiBill
    markApiBillAsOverdue(id: ID): ApiBill
    
    # Bulk Operations
    createBulkApiBills(input: [CreateApiBillInput]): [ApiBill]
    
    # Tag Management
    addApiBillTag(id: ID, tag: String): ApiBill
    removeApiBillTag(id: ID, tag: String): ApiBill
  }

  type ModelUploadResponse {
    success: Boolean
    message: String
    model: Model
  }

  type Model {
    id: ID
    filename: String
    url: String
    filePath: String
    size: Int
    format: String
    uploadedAt: String
  }

  # Input Types
  input SendMessageInput {
    senderId: ID
    recipientId: ID
    body: String
    subject: String
  }

  input ReplyMessageInput {
    parentId: ID
    body: String
  }

  # Response Types
  type MessageConnection {
    messages: [Message]
    totalCount: Int
    hasNextPage: Boolean
    page: Int
  }

  type MessageThreadConnection {
    threads: [MessageThread]
    totalCount: Int
    hasNextPage: Boolean
    page: Int
  }

  type MessageThread {
    user: User
    lastMessage: Message
    unreadCount: Int
    updatedAt: DateTime
  }

  type LogoutResponse {
    success: Boolean
    message: String
  }

  input ProductVariantInput {
    name: String
    productId: String
    sku: String
    color: String
    size: String
    price: Float
    salePrice: Float
    stock: Int
  }

  input AddressInputs {
    userId: String
    type: String
    street: String
    city: String
    state: String
    zipCode: String
    country: String
    isDefault: Boolean
  }

  input OrderItemInput {
    productId: ID
    quantity: Int
    price: Float
  }
`;
