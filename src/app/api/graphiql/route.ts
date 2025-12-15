import { createYoga } from "graphql-yoga";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "../../../graphql/schema";
import { resolvers } from "../../../graphql/resolver";

// CORRECT IMPORT for graphql-upload v13.0.0
import { GraphQLUpload } from "graphql-upload";

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: {
    ...resolvers,
    Upload: GraphQLUpload, // Add this
  },
});

const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
  graphiql: true,
  multipart: true, // Enable file uploads
});

export { handleRequest as GET, handleRequest as POST };
