import { gql } from '@apollo/client';


export const MANAGEMENTPRODUCTS = gql`
query GetProducts {
  getProducts {
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
query GetProducts($search: String, $cursor: String, $limit: Int) {
   products(search: $search, cursor: $cursor, limit: $limit) {
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
