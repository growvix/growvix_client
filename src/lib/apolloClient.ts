import { ApolloClient, InMemoryCache } from '@apollo/client/core';
import { HttpLink } from '@apollo/client/link/http';

const httpLink = new HttpLink({
    uri: `${import.meta.env.VITE_API_URL}/graphql`,
});

export const apolloClient = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
});
