import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { manageAuthoritySchema, revokeUpdateAuthoritySchema, type ManageAuthorityRequest, type RevokeUpdateAuthorityRequest } from '@shared/lab-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SolanaAuthorityProps {
  network: 'mainnet' | 'testnet';
  walletAddress: string | null;
  onSubmit: (data: ManageAuthorityRequest | RevokeUpdateAuthorityRequest) => Promise<any>;
  isSubmitting: boolean;
}

export function SolanaAuthority({ network, onSubmit, isSubmitting }: SolanaAuthorityProps) {
  const [showImmutable, setShowImmutable] = useState(false);
  
  const form = useForm<ManageAuthorityRequest>({
    resolver: zodResolver(manageAuthoritySchema),
    defaultValues: {
      chain: 'solana',
      network,
      mintAddress: '',
      authorityType: 'mint',
    },
  });

  const immutableForm = useForm<RevokeUpdateAuthorityRequest>({
    resolver: zodResolver(revokeUpdateAuthoritySchema),
    defaultValues: {
      chain: 'solana',
      network,
      mintAddress: '',
    },
  });

  if (showImmutable) {
    return (
      <Card data-testid="form-solana-authority">
        <CardHeader>
          <CardTitle>Make Token Immutable</CardTitle>
          <CardDescription>Revoke the update authority to make token metadata permanent and immutable</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...immutableForm}>
            <form onSubmit={immutableForm.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={immutableForm.control}
                name="mintAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mint Address*</FormLabel>
                    <FormControl>
                      <Input placeholder="Token mint address" {...field} data-testid="input-mint-address-immutable" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-md bg-amber-500/10 p-3 border border-amber-500/20">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Warning: This action is permanent. Once you revoke the update authority, you will not be able to change the token's name, symbol, or metadata.
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isSubmitting} data-testid="button-make-immutable">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Revoking...
                    </>
                  ) : (
                    'Make Immutable'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowImmutable(false)} data-testid="button-back-to-authority">
                  Back
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="form-solana-authority">
      <CardHeader>
        <CardTitle>Manage Authority</CardTitle>
        <CardDescription>Transfer or revoke token authorities</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                name="authorityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authority Type*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-authority-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mint">Mint Authority</SelectItem>
                        <SelectItem value="freeze">Freeze Authority</SelectItem>
                        <SelectItem value="update">Update Authority (Metadata)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isSubmitting} data-testid="button-update-authority">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Authority'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowImmutable(true)} data-testid="button-make-immutable">
                  Make Immutable
                </Button>
              </div>
            </form>
          </Form>
      </CardContent>
    </Card>
  );
}
