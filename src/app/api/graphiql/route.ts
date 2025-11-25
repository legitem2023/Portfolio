import { createYoga } from "graphql-yoga";
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

export { handleRequest as GET, handleRequest as POST };
