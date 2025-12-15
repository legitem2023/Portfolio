import { gql } from '@apollo/client';

export const UPLOAD_3D_MODEL = gql`
  mutation Upload3DModel($file: Upload!, $filename: String, productId: String) {
    upload3DModel(file: $file, filename: $filename, productId: $productId) {
      success
      message
      model {
        id
        filename
        url
        size
        format
        uploadedAt
      }
    }
  }
`;

export const GET_MODELS = gql`
  query GetModels {
    models {
      id
      filename
      url
      size
      format
      uploadedAt
    }
  }
`;
export const SALEVIEW = gql`
query SalesOrder($id: ID!) {
  salesOrder(id: $id) {
    id
    orderNumber
    status
    total
    subtotal
    tax
    shipping
    discount
    createdAt
    updatedAt
    user {
      id
      firstName
      lastName
      email
      phone
      avatar
    }
    address {
      id
      type
      street
      city
      state
      zipCode
      country
      isDefault
    }
    items {
      id
      quantity
      price
      variantInfo
      product {
        id
        name
        description
        price
        salePrice
        sku
        stock
        images
        category {
          id
          name
        }
        variants {
          id
          name
          sku
          color
          size
          price
          stock
        }
      }
    }
    payments {
      id
      amount
      method
      status
      transactionId
      details
      createdAt
    }
  }
}
`

export const SALES_LIST_QUERY = gql`
query SalesList(
  $page: Int
  $limit: Int
  $filters: SalesFilters
  $sortBy: String
  $sortOrder: String
) {
  salesList(
    page: $page
    limit: $limit
    filters: $filters
    sortBy: $sortBy
    sortOrder: $sortOrder
  ) {
    orders {
      id
      orderNumber
      status
      total
      subtotal
      tax
      shipping
      discount
      createdAt
      user {
        id
        firstName
        lastName
        email
        avatar
      }
      address {
        id
        street
        city
        state
        zipCode
        country
      }
      items {
        id
        quantity
        price
        variantInfo
        product {
          id
          name
          price
          images
        }
      }
      payments {
        id
        amount
        method
        status
        transactionId
        createdAt
      }
    }
    totalCount
    totalPages
    currentPage
    summary {
      totalRevenue
      totalOrders
      averageOrderValue
      pendingOrders
      completedOrders
    }
  }
}
`



export const SALES_DATA_QUERY = gql`
  query SalesData($timeframe: Timeframe!, $groupBy: GroupBy!, $filters: SalesFilters) {
    salesData(timeframe: $timeframe, groupBy: $groupBy, filters: $filters) {
      data {
        period
        date
        revenue
        orders
        averageOrderValue
        itemsSold
      }
      summary {
        totalRevenue
        totalOrders
        averageOrderValue
        totalItemsSold
        growthRate
      }
      timeframe {
        start
        end
        label
      }
    }
  }
`;

export const SALES_METRICS_QUERY = gql`
  query SalesMetrics($timeframe: Timeframe!, $filters: SalesFilters) {
    salesMetrics(timeframe: $timeframe, filters: $filters) {
      revenue {
        total
        average
        growth
        target
      }
      orders {
        total
        averageValue
        growth
        statusBreakdown {
          status
          count
          percentage
        }
      }
      customers {
        total
        repeatCustomers
        newCustomers
        averageSpend
      }
    }
  }
`;

export const TOP_PRODUCTS_QUERY = gql`
  query TopProducts($timeframe: Timeframe!, $limit: Int) {
    topProducts(timeframe: $timeframe, limit: $limit) {
      productId
      productName
      unitsSold
      revenue
      percentage
    }
  }
`;

export const SALES_TREND_QUERY = gql`
  query SalesTrend($timeframe: Timeframe!, $groupBy: TrendGroupBy!) {
    salesTrend(timeframe: $timeframe, groupBy: $groupBy) {
      date
      period
      revenue
      orders
      trend
    }
  }
`;
// ============ USER QUERIES ============
export const USERS = gql`
  query GetUsers {
    users {
      id
      email
      password
      firstName
      lastName
      addresses {
        type
        street
        city
        state
        zipCode
        country
        isDefault
        createdAt
      }
      avatar
      phone
      emailVerified
      createdAt
      updatedAt
      role
    }
  }
`;

export const GET_USER_PROFILE = gql`
  query GetUser($id: ID) {
    user(id: $id) {
      id
      firstName
      lastName
      avatar
      followerCount
      followingCount
      isFollowing
      products {
        id
        name
        description
        price
        salePrice
        supplierId
        sku
        stock
        images
        category {
          id
        }
        variants {
          name
          createdAt
          sku
          color
          size
          price
          salePrice
          stock
        }
        brand
        weight
        dimensions
        isActive
        featured
        tags
        createdAt
        updatedAt
      }
      addresses {
        id
        type
        street
        city
        state
        zipCode
        country
        isDefault
        createdAt
      }
      posts {
        id
        content
        createdAt
        privacy
        isLikedByMe
        likeCount
        commentCount
        user {
          id
          firstName
          lastName
          avatar
        }
        taggedUsers {
          id
          firstName
          lastName
        }
        comments {
          id
          content
          createdAt
          user {
           id
           firstName
           lastName
           avatar
         }
        }
      }
    }
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($query: String, $page: Int, $limit: Int) {
    searchUsers(query: $query, page: $page, limit: $limit) {
      users {
        id
        firstName
        lastName
        avatar
        followerCount
        isFollowing
      }
      totalCount
      hasNextPage
    }
  }
`;

export const GET_FOLLOWERS = gql`
  query GetFollowers($userId: ID) {
    followers(userId: $userId) {
      id
      firstName
      lastName
      avatar
      isFollowing
    }
  }
`;

export const GET_FOLLOWING = gql`
  query GetFollowing($userId: ID) {
    following(userId: $userId) {
      id
      firstName
      lastName
      avatar
      isFollowing
    }
  }
`;

// ============ PRODUCT QUERIES ============
export const GETCATEGORY = gql`
  query GetCategories {
    categories {
      id
      name
      description
      image
      isActive
      createdAt
    }
  }
`;

export const GETPRODUCTS = gql`
  query GetProducts($search: String, $cursor: String, $limit: Int, $category: String, $sortBy: String) {
    products(search: $search, cursor: $cursor, limit: $limit, category: $category, sortBy: $sortBy) {
      items {
        id
        name
        description
        price
        salePrice
        supplierId
        sku
        stock
        images
        model
        category {
          id
        }
        variants {
          name
          createdAt
          sku
          color
          size
          price
          salePrice
          stock
          images
          model
        }
        brand
        weight
        dimensions
        isActive
        featured
        tags
        createdAt
        updatedAt
      }
      nextCursor
      hasMore
    }
  }
`;

export const MANAGEMENTPRODUCTS = gql`
  query GetProducts($userId: ID) {
    getProducts(userId: $userId) {
      id
      name
      description
      price
      salePrice
      supplierId
      sku
      stock
      images
      model
      category {
        id
        name
        description
        image
        isActive
        createdAt
      }
      variants {
        id
        name
        createdAt
        sku
        color
        size
        price
        salePrice
        stock
        images
        model
      }
      brand
      weight
      dimensions
      isActive
      featured
      tags
      createdAt
      updatedAt
    }
  }
`;

// ============ ORDER QUERIES ============
export const ORDER_ITEMS = gql`
  query GetOrders($userId: ID) {
    orders(userId: $userId) {
      id
      orderNumber
      status
      total
      subtotal
      tax
      shipping
      discount
      createdAt
      updatedAt
      user {
        id
      }
      address {
        id
      }
      items {
        id
      }
      payments {
        id
      }
    }
  }
`;

// ============ POST QUERIES ============
export const GET_USER_FEED = gql`
  query GetUserFeed($page: Int, $limit: Int, $userId: String) {
    userFeed(page: $page, limit: $limit, userId: $userId) {
      posts {
        id
        content
        background
        images
        createdAt
        privacy
        user {
          id
          firstName
          lastName
          avatar
        }
        taggedUsers {
          id
          firstName
          lastName
        }
        commentCount
        likeCount
        isLikedByMe
      }
      totalCount
      hasNextPage
    }
  }
`;

export const GET_POST = gql`
  query GetPost($id: ID!) {
    post(id: $id) {
      id
      content
      background
      images
      createdAt
      privacy
      user {
        id
        firstName
        lastName
        avatar
      }
      taggedUsers {
          id
          firstName
          lastName
        }
      comments {
          id
          content
          createdAt
          user {
           id
           firstName
           lastName
           avatar
         }
      }
      commentCount
      likeCount
      isLikedByMe
    }
  }
`;

export const GET_USER_FOLLOWING_POSTS = gql`
  query GetFollowingPosts($page: Int, $limit: Int) {
    posts(followingOnly: true, page: $page, limit: $limit) {
      posts {
        id
        content
        createdAt
        privacy
        isLikedByMe
        likeCount
        commentCount
        user {
          id
          firstName
          lastName
          avatar
        }
        taggedUsers {
          id
          firstName
          lastName
        }
        comments {
          id
          content
          createdAt
          user {
           id
           firstName
           lastName
           avatar
         }
        }
      }
      totalCount
      hasNextPage
    }
  }
`;

export const GET_USER_POSTS = gql`
  query GetUserPosts($userId: ID, $page: Int, $limit: Int) {
    posts(userId: $userId, page: $page, limit: $limit) {
      posts {
        id
        content
        background
        images
        createdAt
        privacy
        commentCount
        likeCount
        isLikedByMe
      }
      totalCount
      hasNextPage
    }
  }
`;

export const GET_ALL_POSTS = gql`
  query GetPosts($page: Int, $limit: Int) {
    posts(page: $page, limit: $limit) {
      posts {
        id
        content
        createdAt
        privacy
        isLikedByMe
        likeCount
        commentCount
        images
        user {
          id
          firstName
          lastName
          avatar
        }
        taggedUsers {
          id
          firstName
          lastName
        }
        comments {
          id
          content
          createdAt
          user {
           id
           firstName
           lastName
           avatar
         }
        }
      }
      totalCount
      hasNextPage
    }
  }
`;

// ============ COMMENT QUERIES ============
export const GET_COMMENTS = gql`
  query GetComments($postId: ID, $page: Int, $limit: Int) {
    comments(postId: $postId, page: $page, limit: $limit) {
      comments {
        id
        content
        createdAt
        user {
          id
          firstName
          lastName
          avatar
        }
        likeCount
        isLikedByMe
      }
      totalCount
      hasNextPage
    }
  }
`;
