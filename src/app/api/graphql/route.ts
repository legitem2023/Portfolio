import { createYoga } from "graphql-yoga";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "../../../graphql/schema";
import { resolvers } from "../../../graphql/resolver";
import { useGraphQLUpload } from "@graphql-yoga/plugin-graphql-upload";

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
  graphiql: true,
  plugins: [useGraphQLUpload()], // Use the plugin instead
});

export { handleRequest as GET, handleRequest as POST };
