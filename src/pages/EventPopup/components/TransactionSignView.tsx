import React, { useState, useEffect } from 'react';
import { PopupEvent, PopupEventType } from '@/stores/popupEventStore';
import { TransactionSignData } from '@/services/popupEventService';
import { useWeb3Auth } from '@web3auth/modal-react-hooks';
import { SolanaWallet } from '@web3auth/solana-provider';
import { Transaction, VersionedTransaction } from '@solana/web3.js';

export function checkVersionedTransaction(txBuffer: Buffer) {
  try {
    VersionedTransaction.deserialize(txBuffer);
    return true;
  } catch (e) {
    return false;
  }
}

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
  const [statusMessage, setStatusMessage] = useState<string>('Processing transaction...');
  const { status, provider } = useWeb3Auth();

  useEffect(() => {
    if (!status || ['not_ready', 'ready', 'connecting'].includes(status)) return;

    if (status !== 'connected') {
      onReject('Wallet not connected, please try again.').catch(console.error);
      return;
    }

    if (!provider) return;

    const processTransaction = async () => {
      try {
        if (event.type !== PopupEventType.TRANSACTION_SIGN) {
          throw new Error('Invalid event type');
        }

        const data = event.data as TransactionSignData;
        const solanaWallet = new SolanaWallet(provider);
        const txBuffer = Buffer.from(data.transaction, 'base64');
        const isVersionedTransaction = checkVersionedTransaction(txBuffer);
        const tx = isVersionedTransaction
          ? VersionedTransaction.deserialize(txBuffer)
          : Transaction.from(txBuffer);

        setStatusMessage('Signing transaction...');
        const { signature } = await solanaWallet.signAndSendTransaction(tx);

        // Success - automatically close
        await onApprove(signature);
      } catch (error) {
        console.error('TransactionSignView error', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setStatusMessage(`Signing failed: ${errorMessage}`);

        // Failed - pass error message and automatically close
        await onReject(errorMessage);
      }
    };

    processTransaction();
  }, [event, status, provider, onApprove, onReject]);

  return (
    <div className="flex h-screen flex-col justify-center items-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm font-medium max-w-[240px] mx-auto">{statusMessage}</p>
      </div>
    </div>
  );
};

export default TransactionSignView;
