import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import type { TransactionStatusType } from '@shared/lab-schema';

interface TransactionStatusProps {
  status: TransactionStatusType;
  onClose: () => void;
  onRetry?: () => void;
}

export function TransactionStatus({ status, onClose, onRetry }: TransactionStatusProps) {
  const isOpen = status.status !== 'idle';

  return (
    <Dialog open={isOpen} onOpenChange={() => status.status !== 'confirming' && onClose()}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-transaction-status">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status.status === 'pending' && <Loader2 className="h-5 w-5 animate-spin text-[#FFA500]" />}
            {status.status === 'confirming' && <Loader2 className="h-5 w-5 animate-spin text-[#FFA500]" />}
            {status.status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {status.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
            {status.status === 'pending' && 'Transaction Pending'}
            {status.status === 'confirming' && 'Confirming Transaction'}
            {status.status === 'success' && 'Transaction Successful'}
            {status.status === 'error' && 'Transaction Failed'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {status.message && (
            <p className="text-sm text-muted-foreground" data-testid="text-status-message">
              {status.message}
            </p>
          )}

          {status.mintAddress && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Token Address</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-2 py-1 text-xs font-mono overflow-hidden text-ellipsis" data-testid="text-mint-address">
                  {status.mintAddress}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(status.mintAddress!)}
                  data-testid="button-copy-mint-address"
                  title="Copy to clipboard"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {status.contractAddress && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Contract Address</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-2 py-1 text-xs font-mono overflow-hidden text-ellipsis" data-testid="text-contract-address">
                  {status.contractAddress}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(status.contractAddress!)}
                  data-testid="button-copy-contract-address"
                  title="Copy to clipboard"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {status.signature && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Transaction Hash</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-2 py-1 text-xs font-mono overflow-hidden text-ellipsis" data-testid="text-transaction-hash">
                  {status.signature}
                </code>
                {status.explorerUrl && (
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => window.open(status.explorerUrl, '_blank')}
                    data-testid="button-view-explorer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {status.error && (
            <div className="rounded-md bg-destructive/10 p-3" data-testid="text-error-message">
              <p className="text-sm text-destructive">{status.error}</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            {status.status === 'error' && onRetry && (
              <Button onClick={onRetry} data-testid="button-retry">
                Retry
              </Button>
            )}
            {status.status === 'success' && status.explorerUrl && (
              <Button onClick={() => window.open(status.explorerUrl, '_blank')} data-testid="button-view-on-explorer">
                View on Explorer
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            )}
            {status.status !== 'confirming' && (
              <Button variant="outline" onClick={onClose} data-testid="button-close">
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
