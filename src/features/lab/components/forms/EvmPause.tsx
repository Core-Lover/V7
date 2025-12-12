import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pauseTokenSchema, type PauseTokenRequest } from '@shared/lab-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

interface EvmPauseProps {
  chain: 'ethereum' | 'bsc';
  network: 'mainnet' | 'testnet';
  walletAddress: string | null;
  onSubmit: (data: PauseTokenRequest) => Promise<any>;
  isSubmitting: boolean;
}

export function EvmPause({ chain, network, walletAddress, onSubmit, isSubmitting }: EvmPauseProps) {
  const form = useForm<PauseTokenRequest>({
    resolver: zodResolver(pauseTokenSchema),
    defaultValues: {
      chain,
      network,
      tokenAddress: '',
      pause: true,
    },
  });

  return (
    <Card data-testid="form-evm-pause">
      <CardHeader>
        <CardTitle>Pause/Unpause Token</CardTitle>
        <CardDescription>Control token transfers (requires pausable token)</CardDescription>
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
                name="pause"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-4">
                    <div>
                      <FormLabel>Action</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {field.value ? 'Pause all token transfers' : 'Resume token transfers'}
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-pause"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-pause">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  form.watch('pause') ? 'Pause Token' : 'Unpause Token'
                )}
              </Button>
            </form>
          </Form>
      </CardContent>
    </Card>
  );
}
