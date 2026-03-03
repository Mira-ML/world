import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { auth0Config } from './config/authConfig';
import WorldAuthGuard from './components/WorldAuthGuard';
import { WorldDataProvider } from './contexts/WorldDataContext';
import AppShell from './components/layout/AppShell';
import OverviewPage from './pages/Overview/OverviewPage';
import ClientsPage from './pages/Clients/ClientsPage';
import CostsPage from './pages/Costs/CostsPage';
import PromptsPage from './pages/Prompts/PromptsPage';
import NetworkPage from './pages/Network/NetworkPage';
import FeatureFlagsPage from './pages/FeatureFlags/FeatureFlagsPage';
import WidgetFlagsPage from './pages/WidgetFlags/WidgetFlagsPage';
import CardsPage from './pages/Cards/CardsPage';

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
              <Route path="prompts" element={<PromptsPage />} />
              <Route path="network" element={<NetworkPage />} />
              <Route path="flags" element={<FeatureFlagsPage />} />
              <Route path="widget-flags" element={<WidgetFlagsPage />} />
              <Route path="cards" element={<CardsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </WorldDataProvider>
    </WorldAuthGuard>
  </Auth0Provider>
);

export default App;
