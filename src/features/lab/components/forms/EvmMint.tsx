import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mintTokenSchema, type MintTokenRequest } from '@shared/lab-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

interface EvmMintProps {
  chain: 'ethereum' | 'bsc';
  network: 'mainnet' | 'testnet';
  walletAddress: string | null;
  onSubmit: (data: MintTokenRequest) => Promise<any>;
  isSubmitting: boolean;
}

export function EvmMint({ chain, network, walletAddress, onSubmit, isSubmitting }: EvmMintProps) {
  const form = useForm<MintTokenRequest>({
    resolver: zodResolver(mintTokenSchema),
    defaultValues: {
      chain,
      network,
      tokenAddress: '',
      amount: '',
    },
  });

  return (
    <Card data-testid="form-evm-mint">
      <CardHeader>
        <CardTitle>Mint Tokens</CardTitle>
        <CardDescription>Mint additional tokens to your wallet (requires mintable token)</CardDescription>
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
                    <FormLabel>Amount*</FormLabel>
                    <FormControl>
                      <Input placeholder="1000" {...field} data-testid="input-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-mint">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Minting...
                  </>
                ) : (
                  'Mint Tokens'
                )}
              </Button>
            </form>
          </Form>
      </CardContent>
    </Card>
  );
}
