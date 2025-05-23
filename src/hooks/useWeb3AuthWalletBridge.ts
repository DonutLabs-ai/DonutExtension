import { useEffect } from 'react';
import { useWalletStore } from '@/stores/walletStore';
import { useWeb3Auth } from '@web3auth/modal-react-hooks';
import { SolanaWallet } from '@web3auth/solana-provider';

export const useWeb3AuthWalletBridge = () => {
  const { isConnected, provider } = useWeb3Auth();
  const setAddress = useWalletStore(state => state.setAddress);

  useEffect(() => {
    // When not connected or provider missing -> reset store
    if (!isConnected || !provider) {
      setAddress(null);
      return;
    }

    // When connected, initialise SolanaProvider helper
    (async () => {
      try {
        // Wrap provider with SolanaWallet helper from SDK
        const solanaWallet = new SolanaWallet(provider);
        const accounts = await solanaWallet.requestAccounts();
        const address = accounts?.[0] ?? null;
        if (!address) throw new Error('Failed to obtain Solana address from Web3Auth');

        // Save address to global store
        setAddress(address);

        // get private key
        // const privateKey = await solanaWallet.request({
        //   method: 'solanaPrivateKey',
        // });
        // console.log('privateKey', address, privateKey);
      } catch (err) {
        console.error('[Web3AuthWalletBridge] failed to init signer', err);
        setAddress(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, provider]);
};
