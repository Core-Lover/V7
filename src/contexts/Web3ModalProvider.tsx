import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { mainnet } from '@reown/appkit/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

const queryClient = new QueryClient()

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id'

const metadata = {
  name: 'EthicX Lab Network',
  description: 'The Collective Intelligence Layer for Community Earning',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://ethicx.app',
  icons: ['/icon.png']
}

const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet],
  projectId
})

createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet],
  projectId,
  metadata,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#FF7A1A',
    '--w3m-color-mix': '#1a1a2e',
    '--w3m-color-mix-strength': 40
  },
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
    'ecc4036f814562b41a5268adc86270fea1e1e92f69e9830bbf59612b59efb579',
    '38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662',
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0'
  ],
  allWallets: 'SHOW',
  features: {
    email: false,
    socials: false,
    emailShowWallets: false,
    swaps: false,
    onramp: false,
    analytics: false
  }
})

export const wagmiConfig = wagmiAdapter.wagmiConfig

export function Web3ModalProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
