import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Loader2, AlertCircle } from 'lucide-react';

const approveTokenSchema = z.object({
  chain: z.enum(['ethereum', 'bsc']),
  network: z.enum(['mainnet', 'testnet']),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address'),
  spenderAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid spender address'),
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid amount'),
});

type ApproveTokenRequest = z.infer<typeof approveTokenSchema>;

interface EvmApproveProps {
  chain: 'ethereum' | 'bsc';
  network: 'mainnet' | 'testnet';
  walletAddress: string | null;
  onSubmit: (data: ApproveTokenRequest) => Promise<any>;
  isSubmitting: boolean;
}

export function EvmApprove({ chain, walletAddress, onSubmit, isSubmitting }: EvmApproveProps) {
  const form = useForm<ApproveTokenRequest>({
    resolver: zodResolver(approveTokenSchema),
    defaultValues: {
      chain,
      network: 'testnet',
      tokenAddress: '',
      spenderAddress: '',
      amount: '',
    },
  });

  return (
    <Card data-testid="form-evm-approve">
      <CardHeader>
        <CardTitle>Approve Token Spending</CardTitle>
        <CardDescription>
          Allow a contract or address to spend your tokens (required for DEXs, lending protocols, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-500">Security Warning</p>
                  <p className="text-yellow-500/90 mt-1">
                    Only approve trusted contracts. Malicious contracts can steal approved tokens. Always verify the contract address before approval.
                  </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="tokenAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Contract Address*</FormLabel>
                    <FormControl>
                      <Input placeholder="0x..." {...field} data-testid="input-token-address" />
                    </FormControl>
                    <FormDescription>The ERC20 token you want to approve</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spenderAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spender Contract Address*</FormLabel>
                    <FormControl>
                      <Input placeholder="0x..." {...field} data-testid="input-spender-address" />
                    </FormControl>
                    <FormDescription>
                      The contract address that will be allowed to spend your tokens (e.g., Uniswap Router)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approval Amount*</FormLabel>
                    <FormControl>
                      <Input placeholder="1000000" {...field} data-testid="input-amount" />
                    </FormControl>
                    <FormDescription className="space-y-2">
                      <div>Amount to approve.</div>
                      <div>For unlimited approval, use: <code className="bg-muted px-1.5 py-0.5 rounded text-xs break-all">115792089237316195423570985008687907853269984665640564039457584007913129639935</code></div>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-approve">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  'Approve Tokens'
                )}
              </Button>
            </form>
          </Form>
      </CardContent>
    </Card>
  );
}
