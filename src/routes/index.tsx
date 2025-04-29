import loadable from '@loadable/component';
import { Route, Routes } from 'react-router-dom';

const Web3AuthTest = loadable(() => import('@/pages/Web3AuthTest'));

const Router = () => (
  <Routes>
    <Route path="/" element={<Web3AuthTest />} />
  </Routes>
);

export default Router;
