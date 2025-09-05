// app/api/graphql/route.ts
import { createYoga } from "graphql-yoga";
import { typeDefs } from "../../graphql/typeDefs";
import { resolvers } from "../../graphql/resolvers";

const { handleRequest } = createYoga({
  schema: {
    typeDefs,
    resolvers,
  },
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response }, // required in Next.js App Router
});

export { handleRequest as GET, handleRequest as POST };
