import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { LabShell } from './components/LabShell';
import { SolanaCreateToken } from './components/forms/SolanaCreateToken';
import { SolanaMint } from './components/forms/SolanaMint';
import { SolanaFreeze } from './components/forms/SolanaFreeze';
import { SolanaAuthority } from './components/forms/SolanaAuthority';
import { SolanaMultiSend } from './components/forms/SolanaMultiSend';
import { EvmCreateToken } from './components/forms/EvmCreateToken';
import { EvmMint } from './components/forms/EvmMint';
import { EvmBurn } from './components/forms/EvmBurn';
import { EvmPause } from './components/forms/EvmPause';
import { EvmApprove } from './components/forms/EvmApprove';
import { EvmMultiSend } from './components/forms/EvmMultiSend';

export default function Lab() {
  return (
    <QueryClientProvider client={queryClient}>
      <LabShell>
        {({ chain, selectedTool, solanaWallet, evmWallet, solanaOps, evmOps }) => {
          if (!selectedTool) {
            return null;
          }

          if (chain === 'solana') {
            const isSubmitting = solanaOps.txStatus.status === 'pending' || solanaOps.txStatus.status === 'confirming';

            switch (selectedTool) {
              case 'create-token':
                return (
                  <SolanaCreateToken
                    network={solanaWallet.network}
                    walletAddress={solanaWallet.address}
                    onSubmit={(data) => solanaOps.createToken(data, solanaWallet.address!)}
                    isSubmitting={isSubmitting}
                  />
                );
              case 'mint':
                return (
                  <SolanaMint
                    network={solanaWallet.network}
                    walletAddress={solanaWallet.address}
                    onSubmit={(data) => solanaOps.mintTokens(data, solanaWallet.address!)}
                    isSubmitting={isSubmitting}
                  />
                );
              case 'freeze':
                return (
                  <SolanaFreeze
                    network={solanaWallet.network}
                    walletAddress={solanaWallet.address}
                    onSubmit={(data) => solanaOps.freezeAccount(data, solanaWallet.address!)}
                    isSubmitting={isSubmitting}
                  />
                );
              case 'authority':
                return (
                  <SolanaAuthority
                    network={solanaWallet.network}
                    walletAddress={solanaWallet.address}
                    onSubmit={(data) => solanaOps.manageAuthority(data, solanaWallet.address!)}
                    isSubmitting={isSubmitting}
                  />
                );
              case 'multisend':
                return (
                  <SolanaMultiSend
                    network={solanaWallet.network}
                    walletAddress={solanaWallet.address}
                    onSubmit={(data) => solanaOps.multiSend(data, solanaWallet.address!)}
                    isSubmitting={isSubmitting}
                  />
                );
              default:
                return <div>Select a tool from the navigation above</div>;
            }
          } else {
            const isSubmitting = evmOps.txStatus.status === 'pending' || evmOps.txStatus.status === 'confirming';

            switch (selectedTool) {
              case 'create-token':
                return (
                  <EvmCreateToken
                    chain={evmWallet.chain}
                    network={evmWallet.network}
                    walletAddress={evmWallet.address}
                    onSubmit={(data) => evmOps.generateTokenContract(data)}
                    isSubmitting={isSubmitting}
                  />
                );
              case 'mint':
                return (
                  <EvmMint
                    chain={evmWallet.chain}
                    network={evmWallet.network}
                    walletAddress={evmWallet.address}
                    onSubmit={(data) => evmOps.mintTokens(data, evmWallet.address!)}
                    isSubmitting={isSubmitting}
                  />
                );
              case 'burn':
                return (
                  <EvmBurn
                    chain={evmWallet.chain}
                    network={evmWallet.network}
                    walletAddress={evmWallet.address}
                    onSubmit={(data) => evmOps.burnTokens(data)}
                    isSubmitting={isSubmitting}
                  />
                );
              case 'pause':
                return (
                  <EvmPause
                    chain={evmWallet.chain}
                    network={evmWallet.network}
                    walletAddress={evmWallet.address}
                    onSubmit={(data) => evmOps.pauseToken(data)}
                    isSubmitting={isSubmitting}
                  />
                );
              case 'approve':
                return (
                  <EvmApprove
                    chain={evmWallet.chain}
                    network={evmWallet.network}
                    walletAddress={evmWallet.address}
                    onSubmit={(data) => evmOps.approveToken(data)}
                    isSubmitting={isSubmitting}
                  />
                );
              case 'multisend':
                return (
                  <EvmMultiSend
                    chain={evmWallet.chain}
                    network={evmWallet.network}
                    walletAddress={evmWallet.address}
                    onSubmit={(data) => evmOps.multiSend(data)}
                    isSubmitting={isSubmitting}
                  />
                );
              default:
                return <div>Select a tool from the navigation above</div>;
            }
          }
        }}
      </LabShell>
      <Toaster />
    </QueryClientProvider>
  );
}
