import { gql } from '@apollo/client';

export const GETPRODUCTS = gql`
     query GetProducts($search: String, $cursor: String, $limit: Int) {

              products(search: $search, cursor: $cursor, limit: $limit) {

                items {

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

                nextCursor

                hasMore

              }

            }`
