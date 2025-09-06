import { gql } from "@apollo/client";

export const INSERTCATEGORY = gql`
mutation MyMutation {
  createCategory(description: string, name: string, status:boolean) {
    statusText
  }
}
`
