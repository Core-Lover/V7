import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mintTokenSchema, type MintTokenRequest } from '@shared/lab-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

interface SolanaMintProps {
  network: 'mainnet' | 'testnet';
  walletAddress: string | null;
  onSubmit: (data: MintTokenRequest) => Promise<any>;
  isSubmitting: boolean;
}

export function SolanaMint({ network, walletAddress, onSubmit, isSubmitting }: SolanaMintProps) {
  const form = useForm<MintTokenRequest>({
    resolver: zodResolver(mintTokenSchema),
    defaultValues: {
      chain: 'solana',
      network,
      tokenAddress: '',
      amount: '',
    },
  });

  return (
    <Card data-testid="form-solana-mint">
      <CardHeader>
        <CardTitle>Mint Tokens</CardTitle>
        <CardDescription>Mint additional tokens to your wallet</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tokenAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mint Address*</FormLabel>
                    <FormControl>
                      <Input placeholder="Token mint address" {...field} data-testid="input-mint-address" />
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
