import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );
  }
  if (networkError) console.error(`[Network error]: ${networkError}`);
});

const isServer = typeof window === "undefined";

const httpLink = new HttpLink({
  uri: isServer
    ? process.env.NEXT_PUBLIC_GRAPHQL_URL ??
      "https://portfolio-xi-eight-92.vercel.app/api/graphql"
    : "/api/graphql",
  credentials: "include",
});

export function getServerClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: from([errorLink, httpLink]),
    ssrMode: true, // ✅ important for SSR
  });
}
