/*import { createYoga } from "graphql-yoga";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "../../../graphql/schema";
import { resolvers } from "../../../graphql/resolver";

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql", // still points to main API
  fetchAPI: { Response },
  graphiql: true, // enable playground here
});

export { handleRequest as GET, handleRequest as POST };*/
import { createYoga } from "graphql-yoga";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { GraphQLUpload } from "graphql-upload"; // Add this import
import { typeDefs } from "../../../graphql/schema";
import { resolvers } from "../../../graphql/resolver";

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: {
    ...resolvers,
    Upload: GraphQLUpload, // Just add this one line
  },
});

const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
  graphiql: true,
  multipart: true, // Add this to enable file uploads
});

export { handleRequest as GET, handleRequest as POST };
