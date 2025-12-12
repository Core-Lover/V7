import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import type { Network } from '@shared/lab-schema';
import { toast } from '@/hooks/use-toast';

type EvmChain = 'ethereum' | 'bsc';

interface UseEvmWalletReturn {
  connected: boolean;
  connecting: boolean;
  address: string | null;
  chain: EvmChain;
  network: Network;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chain: EvmChain) => Promise<void>;
  switchNetwork: (network: Network) => void;
}

const CHAIN_IDS: Record<EvmChain, Record<Network, string>> = {
  ethereum: {
    mainnet: '0x1',
    testnet: '0xaa36a7', // Sepolia
  },
  bsc: {
    mainnet: '0x38',
    testnet: '0x61',
  },
};

const CHAIN_PARAMS: Record<EvmChain, Record<Network, any>> = {
  ethereum: {
    mainnet: {
      chainId: '0x1',
      chainName: 'Ethereum Mainnet',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://eth.llamarpc.com'],
      blockExplorerUrls: ['https://etherscan.io'],
    },
    testnet: {
      chainId: '0xaa36a7',
      chainName: 'Sepolia Testnet',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://rpc.sepolia.org'],
      blockExplorerUrls: ['https://sepolia.etherscan.io'],
    },
  },
  bsc: {
    mainnet: {
      chainId: '0x38',
      chainName: 'BNB Smart Chain',
      nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      rpcUrls: ['https://bsc-dataseed.binance.org'],
      blockExplorerUrls: ['https://bscscan.com'],
    },
    testnet: {
      chainId: '0x61',
      chainName: 'BNB Testnet',
      nativeCurrency: { name: 'BNB', symbol: 'tBNB', decimals: 18 },
      rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
      blockExplorerUrls: ['https://testnet.bscscan.com'],
    },
  },
};

export function useEvmWallet(initialChain: EvmChain = 'ethereum'): UseEvmWalletReturn {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chain, setChain] = useState<EvmChain>(initialChain);
  const network: Network = 'testnet';
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setConnected(true);
      } else {
        setAddress(null);
        setConnected(false);
        setProvider(null);
        setSigner(null);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      toast({
        title: 'MetaMask Not Found',
        description: 'Please install MetaMask extension',
        variant: 'destructive',
      });
      window.open('https://metamask.io/', '_blank');
      return;
    }

    try {
      setConnecting(true);
      const newProvider = new BrowserProvider(window.ethereum);
      const accounts = await newProvider.send('eth_requestAccounts', []);
      
      if (accounts.length > 0) {
        const newSigner = await newProvider.getSigner();
        setProvider(newProvider);
        setSigner(newSigner);
        setAddress(accounts[0]);
        setConnected(true);

        const targetChainId = CHAIN_IDS[chain][network];
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

        if (currentChainId !== targetChainId) {
          await switchToChain(chain, network);
        }

        toast({
          title: 'Wallet Connected',
          description: `Connected to ${accounts[0].slice(0, 8)}...`,
        });
      }
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect wallet',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
    }
  }, [chain, network]);

  const disconnect = useCallback(async () => {
    setConnected(false);
    setAddress(null);
    setProvider(null);
    setSigner(null);
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected',
    });
  }, []);

  const switchToChain = async (targetChain: EvmChain, targetNetwork: Network) => {
    if (!window.ethereum) return;

    const targetChainId = CHAIN_IDS[targetChain][targetNetwork];
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [CHAIN_PARAMS[targetChain][targetNetwork]],
          });
        } catch (addError: any) {
          console.error('Failed to add chain:', addError);
          throw addError;
        }
      } else {
        throw error;
      }
    }
  };

  const switchChain = useCallback(async (newChain: EvmChain) => {
    try {
      await switchToChain(newChain, network);
      setChain(newChain);
      toast({
        title: 'Chain Switched',
        description: `Switched to ${newChain === 'ethereum' ? 'Ethereum' : 'BSC'}`,
      });
    } catch (error: any) {
      console.error('Chain switch failed:', error);
      toast({
        title: 'Chain Switch Failed',
        description: error.message || 'Failed to switch chain',
        variant: 'destructive',
      });
    }
  }, [network]);

  const switchNetwork = useCallback((newNetwork: Network) => {
    toast({
      title: 'Testnet Only Mode',
      description: 'EthicX Lab operates in testnet-only mode for safety',
      variant: 'default',
    });
  }, []);

  return {
    connected,
    connecting,
    address,
    chain,
    network,
    provider,
    signer,
    connect,
    disconnect,
    switchChain,
    switchNetwork,
  };
}
