import type { Chain } from '@shared/lab-schema';

interface ChainLandingProps {
  chain: Chain;
}

const chainData = {
  solana: {
    name: 'Solana',
    logo: '/logos/solana.png',
    description: 'Solana is a high-performance blockchain supporting builders around the world creating crypto apps that scale. Built for mass adoption with fast transaction speeds and low fees.',
  },
  ethereum: {
    name: 'Ethereum',
    logo: '/logos/ethereum.png',
    description: 'Ethereum is the community-run technology powering the cryptocurrency ether (ETH) and thousands of decentralized applications. The most widely used blockchain for smart contracts.',
  },
  bsc: {
    name: 'BNB Smart Chain',
    logo: '/logos/bsc.png',
    description: 'BNB Smart Chain (BSC) is a blockchain network built for running smart contract-based applications. Fast, affordable, and EVM-compatible with cross-chain interoperability.',
  },
};

export function ChainLanding({ chain }: ChainLandingProps) {
  const data = chainData[chain];

  return (
    <div className="w-full h-full px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-row gap-12 items-start justify-between">
          {/* Left side - Description */}
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold text-[#FFA500] mb-4">{data.name}</h1>
            <p className="text-base text-muted-foreground leading-relaxed line-clamp-6">
              {data.description}
            </p>
          </div>

          {/* Right side - Logo Grid */}
          <div className="flex-shrink-0">
            <div className="w-40 h-40 rounded-xl bg-gradient-to-br from-[#1a1f2e] to-[#0E1116] border border-[#FFA500]/20 p-4 flex items-center justify-center shadow-lg">
              <img 
                src={data.logo} 
                alt={`${data.name} logo`} 
                className="w-full h-full object-contain" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
