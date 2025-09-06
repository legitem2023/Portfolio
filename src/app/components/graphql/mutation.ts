import { gql } from "@apollo/client";

export const INSERTCATEGORY = gql`
mutation MyMutation {
  createCategory(description: $description, name:$name, status:$status) {
    statusText
  }
}
`
