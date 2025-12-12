import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { multiSendSchema, type MultiSendRequest } from '@shared/lab-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { useRef } from 'react';

interface SolanaMultiSendProps {
  network: 'mainnet' | 'testnet';
  walletAddress: string | null;
  onSubmit: (data: MultiSendRequest) => Promise<any>;
  isSubmitting: boolean;
}

export function SolanaMultiSend({ network, onSubmit, isSubmitting }: SolanaMultiSendProps) {
  const form = useForm<MultiSendRequest>({
    resolver: zodResolver(multiSendSchema),
    defaultValues: {
      chain: 'solana',
      network,
      tokenAddress: '',
      recipients: [{ address: '', amount: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'recipients',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number, field: 'address' | 'amount') => {
    const maxIndex = fields.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (index < maxIndex) {
          const nextFieldName = field === 'address' 
            ? `recipients.${index + 1}.address` 
            : `recipients.${index + 1}.amount`;
          const nextInput = document.querySelector(`[data-field="${nextFieldName}"]`) as HTMLInputElement;
          nextInput?.focus();
        } else if (field === 'amount') {
          // Add new row when at the last row's amount field
          append({ address: '', amount: '' });
          setTimeout(() => {
            const newInput = document.querySelector(`[data-field="recipients.${index + 1}.address"]`) as HTMLInputElement;
            newInput?.focus();
          }, 0);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (index > 0) {
          const prevFieldName = field === 'address' 
            ? `recipients.${index - 1}.address` 
            : `recipients.${index - 1}.amount`;
          const prevInput = document.querySelector(`[data-field="${prevFieldName}"]`) as HTMLInputElement;
          prevInput?.focus();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (field === 'address') {
          const amountInput = document.querySelector(`[data-field="recipients.${index}.amount"]`) as HTMLInputElement;
          amountInput?.focus();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (field === 'amount') {
          const addressInput = document.querySelector(`[data-field="recipients.${index}.address"]`) as HTMLInputElement;
          addressInput?.focus();
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (field === 'amount' && index === maxIndex) {
          append({ address: '', amount: '' });
          setTimeout(() => {
            const newInput = document.querySelector(`[data-field="recipients.${index + 1}.address"]`) as HTMLInputElement;
            newInput?.focus();
          }, 0);
        }
        break;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const lines = content.split('\n').filter(line => line.trim());
        
        const newRecipients = lines.map(line => {
          const parts = line.trim().split(/\s+/);
          return {
            address: parts[0] || '',
            amount: parts[1] || '',
          };
        }).filter(r => r.address);

        if (newRecipients.length > 0) {
          // Clear existing and add new recipients
          while (fields.length > 0) {
            remove(0);
          }
          newRecipients.forEach(r => append(r));
        }
      } catch (error) {
        console.error('Error parsing file:', error);
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card data-testid="form-solana-multisend">
      <CardHeader>
        <CardTitle>Multi-Send</CardTitle>
        <CardDescription>Send tokens to multiple recipients in one transaction</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tokenAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Address*</FormLabel>
                    <FormControl>
                      <Input placeholder="Token mint address" {...field} data-testid="input-token-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-medium">Recipients Grid</h4>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-upload-file"
                    >
                      <Upload className="mr-1 h-3 w-3" />
                      Upload TXT
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      data-testid="input-file-upload"
                    />
                  </div>
                </div>

                {/* Fixed height scrollable grid container */}
                <div className="border rounded-md overflow-hidden flex flex-col h-96">
                  {/* Header Row - sticky */}
                  <div className="grid grid-cols-[1fr_120px_40px] gap-0 bg-muted/50 border-b flex-shrink-0 sticky top-0">
                    <div className="px-3 py-2 text-xs font-medium">Address</div>
                    <div className="px-3 py-2 text-xs font-medium">Amount</div>
                    <div className="px-3 py-2 text-xs font-medium"></div>
                  </div>

                  {/* Data Rows - scrollable */}
                  <div className="overflow-y-auto flex-1">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-[1fr_120px_40px] gap-0 border-b hover:bg-muted/30">
                        <FormField
                          control={form.control}
                          name={`recipients.${index}.address`}
                          render={({ field }) => (
                            <FormItem className="m-0">
                              <FormControl>
                                <Input
                                  placeholder="Recipient address"
                                  {...field}
                                  data-field={`recipients.${index}.address`}
                                  onKeyDown={(e) => handleKeyDown(e, index, 'address')}
                                  className="rounded-none border-0 border-r"
                                  data-testid={`input-recipient-address-${index}`}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`recipients.${index}.amount`}
                          render={({ field }) => (
                            <FormItem className="m-0">
                              <FormControl>
                                <Input
                                  placeholder="100"
                                  {...field}
                                  data-field={`recipients.${index}.amount`}
                                  onKeyDown={(e) => handleKeyDown(e, index, 'amount')}
                                  className="rounded-none border-0 border-r"
                                  data-testid={`input-recipient-amount-${index}`}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="rounded-none border-0 h-auto"
                            data-testid={`button-remove-recipient-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Use arrow keys to navigate. Press Enter or Down arrow on the last row to add a new recipient.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-multisend">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  `Send to ${fields.length} Recipient${fields.length > 1 ? 's' : ''}`
                )}
              </Button>
            </form>
          </Form>
      </CardContent>
    </Card>
  );
}
