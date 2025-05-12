import { Web3AuthProvider } from '@web3auth/modal-react-hooks';
import { web3AuthOptions } from '@/constants/web3authConfig';
import { useWeb3AuthWalletBridge } from '@/hooks/useWeb3AuthWalletBridge';

const Web3AuthBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useWeb3AuthWalletBridge();
  return <>{children}</>;
};

const Web3AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Web3AuthProvider config={{ web3AuthOptions }}>
      <Web3AuthBridge>{children}</Web3AuthBridge>
    </Web3AuthProvider>
  );
};

export default Web3AuthLayout;
