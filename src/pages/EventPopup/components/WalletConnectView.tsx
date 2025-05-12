import React, { useState, useEffect } from 'react';
import { PopupEvent, PopupEventType } from '@/stores/popupEventStore';
import { useWeb3Auth } from '@web3auth/modal-react-hooks';
import { useWalletStore } from '@/stores/walletStore';
import { Button } from '@/components/shadcn/button';

interface WalletConnectViewProps {
  event: PopupEvent;
  onApprove: (result: any) => Promise<void>;
  onReject: (reason?: string) => Promise<void>;
}

const WalletConnectView: React.FC<WalletConnectViewProps> = ({ event, onApprove, onReject }) => {
  const { connect, isConnected } = useWeb3Auth();
  const walletAddress = useWalletStore(state => state.address);

  const handleReject = async () => {
    try {
      await onReject('User rejected wallet connection');
    } catch (error) {
      console.error('Error rejecting connection:', error);
    }
  };

  useEffect(() => {
    if (isConnected && walletAddress) {
      onApprove(walletAddress);
    }
  }, [isConnected, walletAddress, onApprove]);

  // Type guard to ensure we have wallet connect data
  if (event.type !== PopupEventType.WALLET_CONNECT) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <div className="text-red-500 text-lg font-medium mb-4">Invalid Event</div>
        <div className="text-center">This is not a wallet connection event</div>
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

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex-1">
        <h2 className="text-xl font-semibold mb-6 text-foreground">Connect Wallet</h2>

        <div className="bg-card rounded-lg p-6 mb-6 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground mb-4">
            Please connect your wallet to continue.
          </p>
          <div className="flex flex-col gap-4">
            {/* Connection Status */}
            {isConnected && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-500/20 p-3 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-300 flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  Wallet connected successfully
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-4 border-t border-border pt-4">
        <Button variant="outline" onClick={handleReject}>
          Reject
        </Button>

        <Button onClick={connect} disabled={isConnected}>
          {isConnected ? 'Connected' : 'Connect Wallet'}
        </Button>
      </div>
    </div>
  );
};

export default WalletConnectView;
