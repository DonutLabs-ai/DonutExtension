import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

const Web3AuthTest = lazy(() => import('@/pages/Web3AuthTest'));
const EventPopup = lazy(() => import('@/pages/EventPopup'));

const Router = () => (
  <Routes>
    <Route path="/" element={<Web3AuthTest />} />
    <Route path="/event" element={<EventPopup />} />
  </Routes>
);

export default Router;
