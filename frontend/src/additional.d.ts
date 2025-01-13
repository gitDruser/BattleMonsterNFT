import { Chain } from 'viem';
import { type Config } from 'wagmi';

declare module '@rainbow-me/rainbowkit' {
  interface RainbowKitProviderProps {
    children?: React.ReactNode;
  }
}

declare module 'wagmi' {
  interface UseContractWriteConfig {
    address: `0x${string}`;
    abi: any;
    functionName: string;
  }

  interface UseContractWriteResult {
    writeAsync: ((config?: any) => Promise<`0x${string}`>) | undefined;
    data: `0x${string}` | undefined;
  }

  interface UseTransactionResult {
    isLoading: boolean;
  }

  interface UseContractWriteReturnType<TConfig extends Config, TChain extends Config['chains'][number] | undefined = undefined> {
    writeAsync: ((config?: any) => Promise<`0x${string}`>) | undefined;
    data: `0x${string}` | undefined;
  }

  interface UseContractWriteParameters<TConfig extends Config, TChain extends Config['chains'][number] | undefined = undefined> {
    address: `0x${string}`;
    abi: any;
    functionName: string;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h2: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h3: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h4: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
      span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
    }
  }
} 