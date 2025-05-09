import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

const Web3AuthTest = lazy(() => import('@/pages/Web3AuthTest'));

const Router = () => (
  <Routes>
    <Route path="/" element={<Web3AuthTest />} />
  </Routes>
);

export default Router;
