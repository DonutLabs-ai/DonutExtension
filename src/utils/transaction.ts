import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

export const checkVersionedTransaction = (txBuffer: Buffer) => {
  try {
    VersionedTransaction.deserialize(txBuffer);
    return true;
  } catch (e) {
    return false;
  }
};

export const estimateGasByRawTx = async (txStr: string) => {
  const txBuffer = Buffer.from(txStr, 'base64');
  const isVersionedTransaction = checkVersionedTransaction(txBuffer);
  const connection = new Connection(import.meta.env.VITE_APP_SOLANA_RPC_URL);

  const getFeeWithRetry = async (message: any): Promise<number | null> => {
    const result = await connection.getFeeForMessage(message);

    if (result.value === null) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const retryResult = await connection.getFeeForMessage(message);
      return retryResult.value;
    } else {
      return result.value;
    }
  };

  let gasFee: number | null;

  if (isVersionedTransaction) {
    const transaction = VersionedTransaction.deserialize(txBuffer);
    gasFee = await getFeeWithRetry(transaction.message);
  } else {
    const transaction = Transaction.from(txBuffer);
    gasFee = await getFeeWithRetry(transaction.compileMessage());
  }

  if (!gasFee) {
    throw new Error('Failed to estimate gas fee');
  }

  return new BigNumber(gasFee).div(10 ** 9).toFixed();
};
