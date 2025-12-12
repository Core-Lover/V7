import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { burnTokenSchema, type BurnTokenRequest } from '@shared/lab-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

interface EvmBurnProps {
  chain: 'ethereum' | 'bsc';
  network: 'mainnet' | 'testnet';
  walletAddress: string | null;
  onSubmit: (data: BurnTokenRequest) => Promise<any>;
  isSubmitting: boolean;
}

export function EvmBurn({ chain, network, walletAddress, onSubmit, isSubmitting }: EvmBurnProps) {
  const form = useForm<BurnTokenRequest>({
    resolver: zodResolver(burnTokenSchema),
    defaultValues: {
      chain,
      network,
      tokenAddress: '',
      amount: '',
    },
  });

  return (
    <Card data-testid="form-evm-burn">
      <CardHeader>
        <CardTitle>Burn Tokens</CardTitle>
        <CardDescription>Permanently destroy tokens (requires burnable token)</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tokenAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Contract Address*</FormLabel>
                    <FormControl>
                      <Input placeholder="0x..." {...field} data-testid="input-token-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount to Burn*</FormLabel>
                    <FormControl>
                      <Input placeholder="1000" {...field} data-testid="input-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-md bg-destructive/10 p-3 border border-destructive/20">
                <p className="text-sm text-destructive">
                  ⚠️ Warning: Burned tokens cannot be recovered
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-burn">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Burning...
                  </>
                ) : (
                  'Burn Tokens'
                )}
              </Button>
            </form>
          </Form>
      </CardContent>
    </Card>
  );
}
