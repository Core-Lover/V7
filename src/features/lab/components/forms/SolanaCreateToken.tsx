import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { solanaCreateTokenSchema, type SolanaCreateTokenRequest } from '@shared/lab-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { Loader2 } from 'lucide-react';

interface SolanaCreateTokenProps {
  network: 'mainnet' | 'testnet';
  walletAddress: string | null;
  onSubmit: (data: SolanaCreateTokenRequest) => Promise<any>;
  isSubmitting: boolean;
}

export function SolanaCreateToken({ network, walletAddress, onSubmit, isSubmitting }: SolanaCreateTokenProps) {
  const form = useForm<SolanaCreateTokenRequest>({
    resolver: zodResolver(solanaCreateTokenSchema),
    defaultValues: {
      chain: 'solana',
      network: 'testnet',
      name: '',
      symbol: '',
      decimals: 9,
      supply: '',
      description: '',
      logoUrl: '',
      logoIpfsHash: '',
      website: '',
      twitter: '',
      telegram: '',
      revokeFreezeAuthority: true,
      revokeMintAuthority: false,
      revokeUpdateAuthority: false,
    },
  });

  const handleImageUpload = (hash: string, url: string) => {
    form.setValue('logoIpfsHash', hash);
    form.setValue('logoUrl', url);
  };

  return (
    <Card data-testid="form-solana-create-token">
      <CardHeader>
        <CardTitle>Create Solana Token</CardTitle>
        <CardDescription>
          Deploy a new SPL token on Solana {network}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <FormLabel>Decimals (0-9)*</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={9}
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

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Token description..." {...field} data-testid="input-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ImageUploader
                onUploadComplete={handleImageUpload}
                currentImageUrl={form.watch('logoUrl')}
                label="Token Logo (Optional)"
                description="Upload your token logo to IPFS. Recommended: 512x512px PNG or WebP (max 10MB)"
              />

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="social-links">
                  <AccordionTrigger>Social Links & Metadata (Optional)</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input placeholder="https://yourproject.com" {...field} data-testid="input-website" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="twitter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Twitter/X</FormLabel>
                            <FormControl>
                              <Input placeholder="https://twitter.com/yourproject" {...field} data-testid="input-twitter" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="telegram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telegram</FormLabel>
                            <FormControl>
                              <Input placeholder="https://t.me/yourproject" {...field} data-testid="input-telegram" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="space-y-3 rounded-md border p-4">
                <h4 className="text-sm font-medium">Authority Settings</h4>
                
                <FormField
                  control={form.control}
                  name="revokeFreezeAuthority"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Revoke Freeze Authority</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-revoke-freeze"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="revokeMintAuthority"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Revoke Mint Authority</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-revoke-mint"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="revokeUpdateAuthority"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Revoke Update Authority</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-revoke-update"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-create-token">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Token...
                  </>
                ) : (
                  'Create Token'
                )}
              </Button>
            </form>
          </Form>
      </CardContent>
    </Card>
  );
}
