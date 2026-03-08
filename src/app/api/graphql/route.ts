/*import { createYoga } from "graphql-yoga";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "../../../graphql/schema";
import { resolvers } from "../../../graphql/resolvers";

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  graphiql: true,
  multipart: true,
  cors: {
    origin: "*", // tighten later
  },
});

export async function GET(request: Request) {
  return yoga.fetch(request);
}

export async function POST(request: Request) {
  return yoga.fetch(request);
}
*/
import { createYoga } from "graphql-yoga";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "../../../graphql/schema";
import { resolvers } from "../../../graphql/resolvers";

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  graphiql: true,
  multipart: true,
  cors: {
    origin: "*", // tighten later
  },
  // Add these options for handling large responses
  maxRequestBodySize: 10 * 1024 * 1024, // 10MB max request size
  fetchAPI: {
    // Increase the response size limit
    Response: {
      // This helps with large responses
      maxSize: 50 * 1024 * 1024, // 50MB max response
    },
  },
  // Add timeout for long-running queries
  maskedErrors: false, // Set to true in production
  logging: true, // Enable logging to see what's happening
});

export async function GET(request: Request) {
  return yoga.fetch(request);
}

export async function POST(request: Request) {
  return yoga.fetch(request);
}
