import { gql } from "@apollo/client";

// Create notification mutation

export const CREATE_API_BILL = gql`
  mutation CreateApiBill($input: ApiBillInput!) {
    createApiBill(input: $input) {
      id
      service
      apiName
      month
      year
      amount
      currency
      status
      dueDate
      invoiceId
      invoiceUrl
      tags
      createdAt
      updatedAt
      usage {
        requests
        successful
        failed
        dataProcessed
        rate
        customFields
      }
    }
  }
`;

export const UPDATE_API_BILL = gql`
  mutation UpdateApiBill($id: ID!, $input: ApiBillUpdateInput!) {
    updateApiBill(id: $id, input: $input) {
      id
      service
      apiName
      month
      year
      amount
      currency
      status
      dueDate
      invoiceId
      invoiceUrl
      tags
      createdAt
      updatedAt
      usage
    }
  }
`;

// Define input types based on your GraphQL schema
export interface ApiBillInput {
  service: string;
  apiName: string;
  month: number;
  year: number;
  amount: number;
  currency?: string;
  dueDate: string;
  invoiceId?: string;
  invoiceUrl?: string;
  tags?: string[];
  usage?: {
    requests?: number;
    successful?: number;
    failed?: number;
    dataProcessed?: number;
    rate?: number;
    customFields?: Record<string, any>;
  };
}

export interface ApiBillUpdateInput {
  service?: string;
  apiName?: string;
  month?: number;
  year?: number;
  amount?: number;
  currency?: string;
  dueDate?: string;
  invoiceId?: string;
  invoiceUrl?: string;
  tags?: string[];
  status?: string;
  usage?: {
    requests?: number;
    successful?: number;
    failed?: number;
    dataProcessed?: number;
    rate?: number;
    customFields?: Record<string, any>;
  };
}


export const CREATE_NOTIFICATION = gql`
  mutation CreateNotification($input: CreateNotificationInput!) {
    createNotification(input: $input) {
      id
      type
      title
      message
      isRead
      link
      createdAt
      user {
        id
        email
        firstName
        lastName
      }
    }
  }
`;

// Mark notification as read mutation
export const MARK_AS_READ = gql`
  mutation MarkNotificationAsRead($id: ID!) {
    markNotificationAsRead(id: $id) {
      id
      isRead
    }
  }
`;

// Mark all notifications as read mutation
export const MARK_ALL_AS_READ = gql`
  mutation MarkAllNotificationsAsRead($userId: ID!) {
    markAllNotificationsAsRead(userId: $userId)
  }
`;

// Delete notification mutation
export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($id: ID!) {
    deleteNotification(id: $id)
  }
`;

// Delete all read notifications mutation
export const DELETE_ALL_READ = gql`
  mutation DeleteAllReadNotifications($userId: ID!) {
    deleteAllReadNotifications(userId: $userId)
  }
`;

export const UPLOAD_3D_MODEL = gql`
  mutation Upload3DModel($file: Upload, $filename: String, $productId: String) {
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
// Delete Variant Mutation
export const DELETE_VARIANT = gql`
  mutation DeleteVariant($id: ID!) {
    deleteVariant(id: $id) {
      statusText
    }
  }
`;

// Delete Product Mutation
export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id) {
      statusText
    }
  }
`;


export const SINGLE_UPLOAD_MUTATION = gql`
  mutation SingleUpload($base64Image: String, $productId: ID) {
    singleUpload(base64Image: $base64Image, productId: $productId) {
      statusText
    }
  }
`;

export const CATEGORY_IMAGE_UPLOAD_MUTATION = gql`
mutation CategoryImageUpload($base64Image: String!, $categoryId: ID!) {
  categoryImageUpload(base64Image: $base64Image, categoryId: $categoryId) {
    statusText
    token
  }
}
`;
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
    setDefaultAddress(addressId: $addressId, userId: $userId) {
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
  }
`;

export const FBLOGIN = gql`
  mutation LoginWithFacebook($input: GoogleLoginInput!) {
    loginWithFacebook(input: $input) {
      token
      statusText
    }
  }
`;

export const INSERTPRODUCT = gql`
  mutation InsertProduct($id: String, $name: String, $description: String, $color: String, $stock: Int, $size: String, $price: Float, $salePrice: Float, $sku: String, $supplierId: String) {
    createProduct(id: $id, name: $name, description: $description, color: $color, stock: $stock, size: $size, price: $price, salePrice: $salePrice, sku: $sku, supplierId: $supplierId) {
      statusText
    }  
  }
`;

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

export const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`;

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

export const DELETE_COMMENT = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`;

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

export const UNLIKE_POST = gql`
  mutation UnlikePost($postId: ID!) {
    unlikePost(postId: $postId)
  }
`;

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

export const UNLIKE_COMMENT = gql`
  mutation UnlikeComment($commentId: ID!) {
    unlikeComment(commentId: $commentId)
  }
`;

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

export const UNFOLLOW_USER = gql`
  mutation UnfollowUser($userId: ID!) {
    unfollowUser(userId: $userId)
  }
`;

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
  mutation CreateUser($email: String!, $password: String!, $firstName: String!, $lastName: String!) {
    createUser(
      email: $email,
      password: $password,
      firstName: $firstName,
      lastName: $lastName
    ) {
      statusText
    }
  }
`;

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
`;
