import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { evmCreateTokenSchema, type EvmCreateTokenRequest } from '@shared/lab-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface EvmCreateTokenProps {
  chain: 'ethereum' | 'bsc';
  network: 'mainnet' | 'testnet';
  walletAddress: string | null;
  onSubmit: (data: EvmCreateTokenRequest) => Promise<any>;
  isSubmitting: boolean;
}

export function EvmCreateToken({ chain, network, onSubmit, isSubmitting }: EvmCreateTokenProps) {
  const [contractCode, setContractCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<EvmCreateTokenRequest>({
    resolver: zodResolver(evmCreateTokenSchema),
    defaultValues: {
      chain,
      network,
      name: '',
      symbol: '',
      decimals: 18,
      supply: '',
      isMintable: false,
      isBurnable: false,
      isPausable: false,
      isCapped: false,
      hasTax: false,
      hasBlacklist: false,
    },
  });

  const handleSubmit = async (data: EvmCreateTokenRequest) => {
    const result = await onSubmit(data);
    if (result.success && result.message) {
      setContractCode(result.message);
    }
  };

  const copyToClipboard = () => {
    if (contractCode) {
      navigator.clipboard.writeText(contractCode);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Contract code copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Card data-testid="form-evm-create-token">
        <CardHeader>
          <CardTitle>Create {chain === 'ethereum' ? 'ERC20' : 'BEP20'} Token</CardTitle>
          <CardDescription>
            Generate OpenZeppelin contract code for deployment via Remix IDE
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="My Token" {...field} data-testid="input-token-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Symbol*</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="MTK"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            data-testid="input-token-symbol"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="decimals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Decimals (0-18)*</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={18}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-decimals"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supply"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Supply*</FormLabel>
                        <FormControl>
                          <Input placeholder="1000000" {...field} data-testid="input-supply" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3 rounded-md border p-4">
                  <h4 className="text-sm font-medium">Token Features</h4>
                  
                  <FormField
                    control={form.control}
                    name="isMintable"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Mintable</FormLabel>
                          <FormDescription>Owner can mint new tokens</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-mintable"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isBurnable"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Burnable</FormLabel>
                          <FormDescription>Tokens can be burned</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-burnable"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPausable"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Pausable</FormLabel>
                          <FormDescription>Owner can pause transfers</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-pausable"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isCapped"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Capped Supply</FormLabel>
                          <FormDescription>Maximum supply limit</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-capped"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('isCapped') && (
                    <FormField
                      control={form.control}
                      name="maxSupply"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Supply</FormLabel>
                          <FormControl>
                            <Input placeholder="10000000" {...field} data-testid="input-max-supply" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-generate-contract">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Contract Code'
                  )}
                </Button>
              </form>
            </Form>
        </CardContent>
      </Card>

      <Dialog open={!!contractCode} onOpenChange={() => setContractCode(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]" data-testid="dialog-contract-code">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Contract Code Generated
              <Button size="sm" variant="outline" onClick={copyToClipboard} data-testid="button-copy-code">
                {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-4 overflow-auto max-h-96">
              <pre className="text-xs font-mono" data-testid="text-contract-code">
                <code>{contractCode}</code>
              </pre>
            </div>
            <div className="rounded-md bg-blue-500/10 p-4 border border-blue-500/20">
              <h4 className="font-semibold text-sm mb-2">Deployment Instructions:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Copy the contract code above</li>
                <li>Open <a href="https://remix.ethereum.org" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Remix IDE</a></li>
                <li>Create a new file (e.g., MyToken.sol) and paste the code</li>
                <li>Compile the contract (Solidity 0.8.20)</li>
                <li>Connect MetaMask to the correct network</li>
                <li>Deploy the contract using the "Deploy & Run" tab</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
