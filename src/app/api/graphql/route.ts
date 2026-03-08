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
  
  // Increase the timeout for long-running queries
  landingPage: false,
  
  // Add logging to debug
  logging: true,
  
  // Disable masked errors in development
  maskedErrors: false,
  
  // Add plugins for monitoring
  plugins: [
    {
      onExecute: () => {
        console.log('Executing query...');
      },
      onResultProcess: ({ result }) => {
        // Log response size
        try {
          const size = new TextEncoder().encode(JSON.stringify(result)).length;
          console.log(`Response size: ${(size / 1024).toFixed(2)} KB`);
        } catch (e) {
          // Ignore size calculation errors
        }
      },
    },
  ],
});

export async function GET(request: Request) {
  return yoga.fetch(request);
}

export async function POST(request: Request) {
  return yoga.fetch(request);
}
