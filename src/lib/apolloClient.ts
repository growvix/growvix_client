import { ApolloClient, InMemoryCache } from '@apollo/client/core';
import { HttpLink } from '@apollo/client/link/http';

import { setContext } from '@apollo/client/link/context';
import { getCookie } from '@/utils/cookies';

const httpLink = new HttpLink({
    uri: `${import.meta.env.VITE_API_URL}/graphql`,
});

const authLink = setContext((_, { headers }) => {
    const token = getCookie('token');
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : "",
        }
    }
});

export const apolloClient = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
});
