import { gql } from "@apollo/client";

export const INSERTCATEGORY = gql`
mutation MyMutation {
  createCategory(description: String, name: String, status:Boolean) {
    statusText
  }
}
`
