import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

const Web3AuthTest = lazy(() => import('@/pages/Web3AuthTest'));
const EventPopup = lazy(() => import('@/pages/EventPopup'));
const MCPDemo = lazy(() => import('@/pages/MCPDemo'));

const Router = () => (
  <Routes>
    <Route path="/" element={<MCPDemo />} />
    <Route path="/event" element={<EventPopup />} />
    <Route path="/mcp" element={<MCPDemo />} />
  </Routes>
);

export default Router;
