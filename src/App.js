import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import LiveFeed from './pages/LiveFeed';
import NetworkAnalysis from './pages/NetworkAnalysis';
import ThreatAnalytics from './pages/ThreatAnalytics';
import SuspectProfiles from './pages/SuspectProfiles';
import AlertCenter from './pages/AlertCenter';
import { ThreatProvider } from './context/ThreatContext';
import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <ToastProvider>
      <ThreatProvider>
        <Router>
          <div className="flex h-screen bg-secondary-900">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/live-feed" element={<LiveFeed />} />
                <Route path="/network-analysis" element={<NetworkAnalysis />} />
                <Route path="/threat-analytics" element={<ThreatAnalytics />} />
                <Route path="/suspect-profiles" element={<SuspectProfiles />} />
                <Route path="/alert-center" element={<AlertCenter />} />
              </Routes>
            </main>
          </div>
        </Router>
      </ThreatProvider>
    </ToastProvider>
  );
}

export default App; 