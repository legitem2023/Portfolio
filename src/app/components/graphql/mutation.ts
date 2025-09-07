import { gql } from "@apollo/client";

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
  mutation InsertProduct( $id: String, $name: String!, $description: String!, $price: Float!, $salePrice: Float!, $sku: String! ) {
    createProduct(id: $id, name: $name, description: $description, price: $price, salePrice: $salePrice, sku: $sku) {
      statusText
    }  
  }
`

export const INSERTCATEGORY = gql`
  mutation InsertCategory($name: String!, $description: String!, $status: Boolean!) {
    createCategory(description: $description, name: $name, status: $status) {
      statusText
    }
  }
`;
