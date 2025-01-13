import { http, createConfig } from 'wagmi';
import { hardhat } from 'wagmi/chains';
import { QueryClient } from '@tanstack/react-query';

const hardhatChain = {
  ...hardhat,
  id: 31337,
  name: 'Hardhat',
  network: 'hardhat',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    }
  }
};

// Create a custom query client with shorter stale time
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // This ensures we always get fresh data
      retry: 0,     // Don't retry failed requests
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

export const config = createConfig({
  chains: [hardhatChain],
  transports: {
    [hardhatChain.id]: http('http://127.0.0.1:8545', {
      batch: false,
      timeout: 30_000,
      pollingInterval: 1_000,
    }),
  },
}); 