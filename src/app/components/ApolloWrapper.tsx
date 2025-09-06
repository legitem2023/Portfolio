// app/components/ApolloWrapper.tsx
'use client';

import { ApolloLink, HttpLink, from } from '@apollo/client';
import { 
  ApolloNextAppProvider, 
  ApolloClient, 
  InMemoryCache 
} from '@apollo/experimental-nextjs-app-support';
import { onError } from '@apollo/client/link/error';

// This component will only be used on the client side
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
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
