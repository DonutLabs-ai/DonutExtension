import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from '@web3auth/base';
import { Web3AuthOptions } from '@web3auth/modal';
import { SolanaPrivateKeyProvider } from '@web3auth/solana-provider';

// get from https://dashboard.web3auth.io
export const clientId = import.meta.env.VITE_APP_WEB3AUTH_CLIENT_ID;

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  chainId: '0x2', // Please use 0x1 for Mainnet, 0x2 for Testnet, 0x3 for Devnet
  rpcTarget: 'https://api.testnet.solana.com',
  displayName: 'Solana Testnet',
  blockExplorerUrl: 'https://explorer.solana.com',
  ticker: 'SOL',
  tickerName: 'Solana',
  logo: 'https://images.toruswallet.io/solana.svg',
};

export const privateKeyProvider = new SolanaPrivateKeyProvider({
  config: { chainConfig },
});

export const web3AuthOptions: Web3AuthOptions = {
  clientId,
  chainConfig,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
};
