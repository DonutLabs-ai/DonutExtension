import Web3AuthLayout from '@/layouts/Web3AuthLayout';
import Router from '@/routes';
import { HashRouter } from 'react-router-dom';

function App() {
  return (
    <HashRouter>
      <Web3AuthLayout>
        <Router />
      </Web3AuthLayout>
    </HashRouter>
  );
}

export default App;
