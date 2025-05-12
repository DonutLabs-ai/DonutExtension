import React, { useState, useEffect } from 'react';
import { PopupEvent, PopupEventType } from '@/stores/popupEventStore';
import { TransactionSignData } from '@/services/popupEventService';
import { useWeb3Auth } from '@web3auth/modal-react-hooks';
import { SolanaWallet } from '@web3auth/solana-provider';
import { VersionedTransaction } from '@solana/web3.js';
import { Button } from '@/components/shadcn/button';

interface TransactionSignViewProps {
  event: PopupEvent;
  onApprove: (result: any) => Promise<void>;
  onReject: (reason?: string) => Promise<void>;
}

const TransactionSignView: React.FC<TransactionSignViewProps> = ({
  event,
  onApprove,
  onReject,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { provider } = useWeb3Auth();

  // Ensure loading state resets whenever the component mounts or event changes
  useEffect(() => {
    setLoading(false);
    setError(null);
  }, [event.id]);

  // Type guard to ensure we have transaction sign data
  if (event.type !== PopupEventType.TRANSACTION_SIGN) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <div className="text-red-500 text-lg font-medium mb-4">Invalid Event</div>
        <div className="text-center">This is not a transaction signing event</div>
        <Button
          variant="destructive"
          className="mt-4"
          onClick={() => onReject('Invalid event type')}
        >
          Close
        </Button>
      </div>
    );
  }

  const data = event.data as TransactionSignData;

  const handleApprove = async () => {
    if (loading || !provider) return;

    setLoading(true);
    try {
      const solanaWallet = new SolanaWallet(provider);
      const txBuffer = Buffer.from(data.transaction, 'base64');
      const tx = VersionedTransaction.deserialize(txBuffer);
      const { signature } = await solanaWallet.signAndSendTransaction(tx);
      await onApprove(signature);
    } catch (error) {
      console.error('Error approving transaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (loading) return;

    setLoading(true);
    try {
      await onReject('User rejected transaction signing');
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex-1">
        <h2 className="text-xl font-semibold mb-6 text-foreground">Sign Transaction</h2>

        {data.description && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
            <p className="text-foreground">{data.description}</p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Transaction</h3>
          <div className="bg-secondary/50 p-4 rounded-md overflow-auto max-h-40 font-mono text-xs border border-border break-all">
            {data.transaction}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md mb-4">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      <div className="flex justify-between mt-4 border-t border-border pt-4">
        <Button variant="outline" onClick={handleReject} disabled={loading}>
          {loading ? 'Rejecting...' : 'Reject'}
        </Button>

        <Button onClick={handleApprove} disabled={loading || !provider}>
          {loading ? 'Signing...' : 'Sign Transaction'}
        </Button>
      </div>
    </div>
  );
};

export default TransactionSignView;
