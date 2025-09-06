import { gql } from "@apollo/client";

export const INSERTCATEGORY = gql`
  mutation InsertCategory($name: String!, $description: String!, $status: Boolean!) {
    createCategory(description: $description, name: $name, status: $status) {
      statusText
    }
  }
`;
