import { Web3AuthProvider } from '@web3auth/modal-react-hooks';
import { web3AuthOptions } from '@/constants/web3authConfig';

const Web3AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return <Web3AuthProvider config={{ web3AuthOptions }}>{children}</Web3AuthProvider>;
};

export default Web3AuthLayout;
