import React, { useMemo, useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';
import { useWalletStore } from '@/stores';
import { ParsedCommand } from '../../../utils/commandUtils';
import { enhanceParameters } from '../../../utils/tokenParamUtils';
import { numberIndent } from '@/utils/amount';
import logo from '@/assets/images/logo.png';
import WalletIcon from '../../../images/wallet.svg?react';
import QrCodeIcon from '../../../images/qrCode.svg?react';
import { getTokenOperationsService } from '@/services/tokenOperationsService';
import { useTokenStore } from '@/stores/tokenStore';

interface SendPreviewProps {
  parsedCommand: ParsedCommand;
  executeCommand: () => void;
}

const SendPreview: React.FC<SendPreviewProps> = ({ parsedCommand, executeCommand }) => {
  const [gasFee, setGasFee] = useState<string>();
  const currentWalletAddr = useWalletStore(state => state.address);
  const tokens = useTokenStore(state => state.tokens);

  // Extract information from parameters
  const amount = parsedCommand.parameters?.amount || '';
  const address = parsedCommand.parameters?.address || '';

  // Enhance tokens using the shared utility function
  const enhancedParams = useMemo(() => {
    if (!parsedCommand.command) return {};
    return enhanceParameters(
      parsedCommand.command,
      parsedCommand.parameters || {},
      parsedCommand.parsedParams
    );
  }, [parsedCommand]);

  // Get token information from enhanced parameters or fallback to symbol
  const tokenInfo = enhancedParams.token;
  const token = tokenInfo?.symbol || parsedCommand.parameters?.token || '';

  const tokenPrice = useMemo(() => {
    if (!tokenInfo?.price || !amount) return null;
    return new BigNumber(tokenInfo.price).multipliedBy(amount).toFixed();
  }, [tokenInfo, amount]);

  const gasPrice = useMemo(() => {
    const solPrice = tokens['So11111111111111111111111111111111111111112']?.price;
    if (!solPrice || !gasFee) return null;
    return new BigNumber(solPrice).multipliedBy(gasFee).toFixed();
  }, [gasFee, tokens]);

  useEffect(() => {
    const estimateGas = async () => {
      if (!amount || !address || !tokenInfo) return;
      const tokenOperationsService = getTokenOperationsService();
      const gasFee = await tokenOperationsService.estimateTransfer({
        from: currentWalletAddr || address,
        to: address,
        amount: Number(amount),
        mint: tokenInfo.mint,
      });
      setGasFee(gasFee);
    };
    const timer = setTimeout(() => {
      estimateGas();
    }, 500);
    return () => clearTimeout(timer);
  }, [amount, address, tokenInfo, currentWalletAddr]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        executeCommand();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeCommand]);

  return (
    <div className="flex flex-col">
      <div className="text-base font-semibold text-foreground mb-4">Send Preview</div>

      <div className="flex items-center">
        <WalletIcon className="size-7 shrink-0 mr-4" />
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">From</div>
          <img src={logo} alt="Donut" className="size-5" />
          <div className="text-sm text-foreground">Donut Wallet</div>
        </div>
      </div>

      <div className="border-l border-accent-foreground w-px h-3 ml-[13px]"></div>

      <div className="flex items-center">
        <QrCodeIcon className="size-7 shrink-0 mr-4" />
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">To</div>
          <div className="text-sm text-foreground break-all line-clamp-1" title={address}>
            {address}
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-3 mt-4 text-sm">
        <div className="flex items-center">
          <span className="text-muted-foreground w-40">Amount</span>
          <span className="text-foreground">
            {numberIndent(amount)} {token}
          </span>
          {!!tokenPrice && (
            <span className="text-muted-foreground ml-2">(${numberIndent(tokenPrice)})</span>
          )}
        </div>
        {!!gasFee && (
          <div className="flex items-center mt-2">
            <span className="text-muted-foreground w-40">Network Fees</span>
            <span className="text-foreground">{gasFee} SOL</span>
            {!!gasPrice && (
              <span className="text-muted-foreground ml-2">(${numberIndent(gasPrice)})</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SendPreview;
