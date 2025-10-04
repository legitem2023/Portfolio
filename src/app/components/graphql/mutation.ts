import { gql } from "@apollo/client";

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      success
      message
    }
  }
`;

export const SET_DEFAULT_ADDRESS = gql`
  mutation SetDefaultAddress($addressId: ID!, $userId: ID!) {
    setDefaultAddress(addressId: $addressId,userId: $userId) {
      success
      message
      address {
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
    }
  }
`;
export const LOGIN = gql`
mutation Login($input: LoginInput) {
  login(input: $input) {
    statusText
    token
  }
}`
export const FBLOGIN = gql`
mutation LoginWithFacebook($input: GoogleLoginInput!) {
  loginWithFacebook(input: $input) {
    token
    statusText
  }
}
`
export const INSERTPRODUCT = gql`
  mutation InsertProduct( $id: String, $name: String!, $description: String!, $price: Float!, $salePrice: Float!, $sku: String!, $supplierId:String! ) {
    createProduct(id: $id, name: $name, description: $description, price: $price, salePrice: $salePrice, sku: $sku, supplierId: $supplierId) {
      statusText
    }  
  }
`
export const CREATE_VARIANT_MUTATION = gql`
  mutation CreateVariant($input: ProductVariantInput!) {
    createVariant(input: $input) {
      statusText
    }
  }
`;
export const INSERTCATEGORY = gql`
  mutation InsertCategory($name: String!, $description: String!, $status: Boolean!) {
    createCategory(description: $description, name: $name, status: $status) {
      statusText
    }
  }
`;

// mutations.js
//import { gql } from '@apollo/client';

// Create a new post
export const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      content
      background
      images
      createdAt
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
  }
`;

// Update an existing post
export const UPDATE_POST = gql`
  mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
    updatePost(id: $id, input: $input) {
      id
      content
      background
      images
      privacy
      taggedUsers {
        id
        firstName
        lastName
      }
      commentCount
      likeCount
      isLikedByMe
    }
  }
`;

// Delete a post
export const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`;

// Create a comment
export const CREATE_COMMENT = gql`
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
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
  }
`;

// Update a comment
export const UPDATE_COMMENT = gql`
  mutation UpdateComment($id: ID!, $input: UpdateCommentInput!) {
    updateComment(id: $id, input: $input) {
      id
      content
      likeCount
      isLikedByMe
    }
  }
`;

// Delete a comment
export const DELETE_COMMENT = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`;

// Like a post
export const LIKE_POST = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) {
      id
      user {
        id
        firstName
        lastName
      }
      post {
        id
        likeCount
        isLikedByMe
      }
    }
  }
`;

// Unlike a post
export const UNLIKE_POST = gql`
  mutation UnlikePost($postId: ID!) {
    unlikePost(postId: $postId)
  }
`;

// Like a comment
export const LIKE_COMMENT = gql`
  mutation LikeComment($commentId: ID!) {
    likeComment(commentId: $commentId) {
      id
      user {
        id
        firstName
        lastName
      }
      comment {
        id
        likeCount
        isLikedByMe
      }
    }
  }
`;

// Unlike a comment
export const UNLIKE_COMMENT = gql`
  mutation UnlikeComment($commentId: ID!) {
    unlikeComment(commentId: $commentId)
  }
`;

// Follow a user
export const FOLLOW_USER = gql`
  mutation FollowUser($userId: ID!) {
    followUser(userId: $userId) {
      id
      follower {
        id
        firstName
        lastName
      }
      following {
        id
        firstName
        lastName
      }
    }
  }
`;

// Unfollow a user
export const UNFOLLOW_USER = gql`
  mutation UnfollowUser($userId: ID!) {
    unfollowUser(userId: $userId)
  }
`;

// Tag users in a post
export const TAG_USERS_IN_POST = gql`
  mutation TagUsersInPost($postId: ID!, $userIds: [ID!]!) {
    tagUsersInPost(postId: $postId, userIds: $userIds) {
      id
      taggedUsers {
        id
        firstName
        lastName
      }
    }
  }
`;

// Remove tag from a post
export const REMOVE_TAG_FROM_POST = gql`
  mutation RemoveTagFromPost($postId: ID!, $userId: ID!) {
    removeTagFromPost(postId: $postId, userId: $userId) {
      id
      taggedUsers {
        id
        firstName
        lastName
      }
    }
  }
`;

export const CREATEUSER = gql`
mutation CreateUser($email:String!,$password: String!,$firstName: String!, $lastName: String!) {
  createUser(
    email: $email,
    password: $password,
    firstName: $firstName,
    lastName: $lastName
  ) {
    statusText
  }
}
`

export const CREATE_ORDER = gql`
  mutation CreateOrder($userId: ID!, $addressId: ID!, $items: [OrderItemInput!]!) {
  createOrder(userId: $userId, addressId: $addressId, items: $items) {
    statusText
  }
}
`;

export const CREATE_ADDRESS = gql`
mutation CreateAddress($input: AddressInputs!) {
  createAddress(input: $input) {
    statusText
  }
}
`
