'use client';

import { ApolloLink, HttpLink, from } from '@apollo/client';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

function makeClient() {
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors)
      graphQLErrors.forEach(({ message, locations, path }) =>
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        ),
      );
    if (networkError) console.error(`[Network error]: ${networkError}`);
  });

  const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_SERVER_LINK,
    credentials: 'include',
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: from([errorLink, httpLink]),
  });
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
  const client = makeClient();

  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
}
