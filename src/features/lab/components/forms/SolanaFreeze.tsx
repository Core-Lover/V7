import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { freezeAccountSchema, type FreezeAccountRequest } from '@shared/lab-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

interface SolanaFreezeProps {
  network: 'mainnet' | 'testnet';
  walletAddress: string | null;
  onSubmit: (data: FreezeAccountRequest) => Promise<any>;
  isSubmitting: boolean;
}

export function SolanaFreeze({ network, onSubmit, isSubmitting }: SolanaFreezeProps) {
  const form = useForm<FreezeAccountRequest>({
    resolver: zodResolver(freezeAccountSchema),
    defaultValues: {
      chain: 'solana',
      network,
      tokenAccount: '',
      mintAddress: '',
      freeze: true,
    },
  });

  return (
    <Card data-testid="form-solana-freeze">
      <CardHeader>
        <CardTitle>Freeze/Thaw Account</CardTitle>
        <CardDescription>Freeze or thaw a token account</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tokenAccount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Account Address*</FormLabel>
                    <FormControl>
                      <Input placeholder="Token account to freeze/thaw" {...field} data-testid="input-token-account" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mintAddress"
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
                name="freeze"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-4">
                    <div>
                      <FormLabel>Action</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {field.value ? 'Freeze account' : 'Thaw account'}
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-freeze"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-freeze">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  form.watch('freeze') ? 'Freeze Account' : 'Thaw Account'
                )}
              </Button>
            </form>
          </Form>
      </CardContent>
    </Card>
  );
}
