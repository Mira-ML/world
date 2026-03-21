import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { auth0Config } from './config/authConfig';
import WorldAuthGuard from './components/WorldAuthGuard';
import { WorldDataProvider } from './contexts/WorldDataContext';
import AppShell from './components/layout/AppShell';
import OverviewPage from './pages/Overview/OverviewPage';
import ClientsPage from './pages/Clients/ClientsPage';
import CostsPage from './pages/Costs/CostsPage';
import PromptsPage from './pages/Prompts/PromptsPage';
import SegmentsPage from './pages/Playbook/SegmentsPage';
import FunnelConfigPage from './pages/Playbook/FunnelConfigPage';
import NetworkPage from './pages/Network/NetworkPage';
import FeatureFlagsPage from './pages/FeatureFlags/FeatureFlagsPage';
import WidgetFlagsPage from './pages/WidgetFlags/WidgetFlagsPage';
import CardsPage from './pages/Cards/CardsPage';
import WidgetConfigPage from './pages/WidgetConfig/WidgetConfigPage';

const App: React.FC = () => (
  <Auth0Provider {...auth0Config}>
    <WorldAuthGuard>
      <WorldDataProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<OverviewPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="costs" element={<CostsPage />} />
              {/* Playbook section — sub-tabs: Prompts | Segments */}
              <Route path="playbook" element={<PromptsPage />} />
              <Route path="playbook/segments" element={<SegmentsPage />} />
              <Route path="playbook/funnel" element={<FunnelConfigPage />} />
              {/* Legacy redirect */}
              <Route path="prompts" element={<Navigate to="/playbook" replace />} />
              <Route path="network" element={<NetworkPage />} />
              <Route path="flags" element={<FeatureFlagsPage />} />
              <Route path="widget-flags" element={<WidgetFlagsPage />} />
              <Route path="cards" element={<CardsPage />} />
              <Route path="widget-config" element={<WidgetConfigPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </WorldDataProvider>
    </WorldAuthGuard>
  </Auth0Provider>
);

export default App;
