import { gql } from '@apollo/client';


export const USERS = gql`
query GetUsers {
  users {
    id
    email
    password
    firstName
    lastName
    avatar
    phone
    emailVerified
    createdAt
    updatedAt
    role
  }
}
`


export const MANAGEMENTPRODUCTS = gql`
query GetProducts($userId: ID!) {
  getProducts(userId:$userId)   {
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
`

export const GETCATEGORY = gql`
query GetCategories {
  categories{
    id
    name
    description
    image
    isActive
    createdAt
  }
}
`
export const GETPRODUCTS = gql`
query GetProducts($search: String, $cursor: String, $limit: Int, $category: String, $sortBy: String) {
   products(search: $search, cursor: $cursor, limit: $limit, category: $category, sortBy: $sortBy) {
     items { id
             name
             description
             price
             salePrice
             sku
             stock
             images
             category {
                    id
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
            }`




// Get user feed with posts
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

// Get specific post with comments
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
        likeCount
        isLikedByMe
      }
      commentCount
      likeCount
      isLikedByMe
    }
  }
`;

// Get user profile with posts and follow info
export const GET_USER_PROFILE = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      firstName
      lastName
      avatar
      followerCount
      followingCount
      isFollowing
      posts {
        id
        content
        createdAt
        likeCount
        commentCount
        privacy
      }
    }
  }
`;

// Search for users
export const SEARCH_USERS = gql`
  query SearchUsers($query: String!, $page: Int, $limit: Int) {
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

// Get user's followers
export const GET_FOLLOWERS = gql`
  query GetFollowers($userId: ID!) {
    followers(userId: $userId) {
      id
      firstName
      lastName
      avatar
      isFollowing
    }
  }
`;

// Get users that a user is following
export const GET_FOLLOWING = gql`
  query GetFollowing($userId: ID!) {
    following(userId: $userId) {
      id
      firstName
      lastName
      avatar
      isFollowing
    }
  }
`;

// Get posts by a specific user
export const GET_USER_POSTS = gql`
  query GetUserPosts($userId: ID!, $page: Int, $limit: Int) {
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

// Get comments for a post
export const GET_COMMENTS = gql`
  query GetComments($postId: ID!, $page: Int, $limit: Int) {
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
