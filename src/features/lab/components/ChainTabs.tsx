import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Chain } from '@shared/lab-schema';

interface ChainTabsProps {
  selectedChain: Chain;
  onChainChange: (chain: Chain) => void;
}

export function ChainTabs({ selectedChain, onChainChange }: ChainTabsProps) {
  return (
    <Tabs value={selectedChain} onValueChange={(value) => onChainChange(value as Chain)}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="solana" data-testid="tab-solana">
          Solana
        </TabsTrigger>
        <TabsTrigger value="ethereum" data-testid="tab-ethereum">
          Ethereum
        </TabsTrigger>
        <TabsTrigger value="bsc" data-testid="tab-bsc">
          BSC
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
