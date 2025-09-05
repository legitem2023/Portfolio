// app/api/graphql/route.ts
import { createYoga } from "graphql-yoga";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "../../graphql/typeDefs";
import { resolvers } from "../../graphql/resolvers";

// Build schema properly
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response }, // required for Next.js App Router
});

export { handleRequest as GET, handleRequest as POST };
