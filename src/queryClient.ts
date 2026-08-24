import {QueryClient} from '@tanstack/react-query';
import {AuthenticationRequiredError} from './services/authApi';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        !(error instanceof AuthenticationRequiredError) && failureCount < 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
