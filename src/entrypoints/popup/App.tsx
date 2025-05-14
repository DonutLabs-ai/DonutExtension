import { HashRouter } from 'react-router-dom';
import Router from '@/routes';
import Web3AuthLayout from '@/layouts/Web3AuthLayout';
import SizeLayout from '@/layouts/SizeLayout';

function App() {
  return (
    <HashRouter>
      <SizeLayout>
        <Web3AuthLayout>
          <Router />
        </Web3AuthLayout>
      </SizeLayout>
    </HashRouter>
  );
}

export default App;
