import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Coins,
  Plus,
  Snowflake,
  Key,
  Send,
  Flame,
  PauseCircle,
  Check,
} from 'lucide-react';
import type { Chain } from '@shared/lab-schema';

interface ToolSidebarProps {
  chain: Chain;
  selectedTool: string | null;
  onToolSelect: (tool: string | null) => void;
}

const solanaTools = [
  { id: 'create-token', label: 'Create Token', icon: Coins },
  { id: 'mint', label: 'Mint', icon: Plus },
  { id: 'freeze', label: 'Freeze Account', icon: Snowflake },
  { id: 'authority', label: 'Manage Authority', icon: Key },
  { id: 'multisend', label: 'Multi-Send', icon: Send },
];

const evmTools = [
  { id: 'create-token', label: 'Create Token', icon: Coins },
  { id: 'mint', label: 'Mint', icon: Plus },
  { id: 'burn', label: 'Burn', icon: Flame },
  { id: 'pause', label: 'Pause', icon: PauseCircle },
  { id: 'approve', label: 'Approve', icon: Check },
  { id: 'multisend', label: 'Multi-Send', icon: Send },
];

export function ToolSidebar({ chain, selectedTool, onToolSelect }: ToolSidebarProps) {
  const tools = chain === 'solana' ? solanaTools : evmTools;

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-2 p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
          {chain === 'solana' ? 'Solana' : chain === 'ethereum' ? 'Ethereum' : 'BSC'} Tools
        </h3>
        <Separator />
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Button
              key={tool.id}
              variant={selectedTool === tool.id ? 'default' : 'ghost'}
              className="justify-start"
              onClick={() => onToolSelect(tool.id)}
              data-testid={`button-tool-${tool.id}`}
            >
              <Icon className="mr-2 h-4 w-4" />
              {tool.label}
            </Button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
