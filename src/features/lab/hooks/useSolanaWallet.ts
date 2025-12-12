import { useState, useEffect, useCallback } from 'react';
import { Connection, clusterApiUrl, Transaction } from '@solana/web3.js';
import type { Network } from '@shared/lab-schema';
import { toast } from '@/hooks/use-toast';

interface PhantomWallet {
  isPhantom?: boolean;
  publicKey?: { toString(): string };
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  on(event: string, handler: (...args: any[]) => void): void;
  off(event: string, handler: (...args: any[]) => void): void;
}

declare global {
  interface Window {
    solana?: PhantomWallet;
  }
}

export interface UseSolanaWalletReturn {
  connected: boolean;
  connecting: boolean;
  address: string | null;
  network: Network;
  connection: Connection | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: (network: Network) => void;
}

export function useSolanaWallet(): UseSolanaWalletReturn {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const network: Network = 'testnet';
  const [connection, setConnection] = useState<Connection | null>(null);

  useEffect(() => {
    const rpcUrl = clusterApiUrl('devnet');
    setConnection(new Connection(rpcUrl, 'confirmed'));
  }, []);

  useEffect(() => {
    if (!window.solana?.isPhantom) return;

    const handleConnect = () => {
      if (window.solana?.publicKey) {
        setConnected(true);
        setAddress(window.solana.publicKey.toString());
      }
    };

    const handleDisconnect = () => {
      setConnected(false);
      setAddress(null);
    };

    window.solana.on('connect', handleConnect);
    window.solana.on('disconnect', handleDisconnect);
    window.solana.on('accountChanged', (publicKey: any) => {
      if (publicKey) {
        setAddress(publicKey.toString());
      } else {
        setConnected(false);
        setAddress(null);
      }
    });

    if (window.solana.publicKey) {
      handleConnect();
    }

    return () => {
      window.solana?.off('connect', handleConnect);
      window.solana?.off('disconnect', handleDisconnect);
    };
  }, []);

  const connect = useCallback(async () => {
    if (!window.solana?.isPhantom) {
      toast({
        title: 'Phantom Wallet Not Found',
        description: 'Please install Phantom wallet extension',
        variant: 'destructive',
      });
      window.open('https://phantom.app/', '_blank');
      return;
    }

    try {
      setConnecting(true);
      const response = await window.solana.connect();
      setConnected(true);
      setAddress(response.publicKey.toString());
      toast({
        title: 'Wallet Connected',
        description: `Connected to ${response.publicKey.toString().slice(0, 8)}...`,
      });
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
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await window.solana?.disconnect();
      setConnected(false);
      setAddress(null);
      toast({
        title: 'Wallet Disconnected',
        description: 'Your wallet has been disconnected',
      });
    } catch (error: any) {
      console.error('Wallet disconnection failed:', error);
    }
  }, []);

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
    network,
    connection,
    connect,
    disconnect,
    switchNetwork,
  };
}
