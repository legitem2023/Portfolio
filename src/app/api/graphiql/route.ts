import { createYoga } from "graphql-yoga";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { GraphQLUpload } from "graphql-upload";  // This should work with v15.0.2
import { typeDefs } from "../../../graphql/schema";
import { resolvers } from "../../../graphql/resolver";

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: {
    ...resolvers,
    Upload: GraphQLUpload,
  },
});

const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
  graphiql: true,
  multipart: true,
});

export { handleRequest as GET, handleRequest as POST };
