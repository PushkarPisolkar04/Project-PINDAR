import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { 
  LayoutDashboard, 
  Radio, 
  Network, 
  BarChart3, 
  Users, 
  Bell,
  Shield,
  Settings,
  X
} from 'lucide-react';

const Sidebar = () => {
  const [showSettings, setShowSettings] = useState(false);
  const { showSuccess } = useToast();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Live Feed', href: '/live-feed', icon: Radio },
    { name: 'Network Analysis', href: '/network-analysis', icon: Network },
    { name: 'Threat Analytics', href: '/threat-analytics', icon: BarChart3 },
    { name: 'Suspect Profiles', href: '/suspect-profiles', icon: Users },
    { name: 'Alert Center', href: '/alert-center', icon: Bell },
  ];

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  return (
    <>
      <div className="w-64 bg-secondary-800 border-r border-secondary-700 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-secondary-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">PINDAR</h1>
              <p className="text-sm text-secondary-400">Intelligence Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-secondary-300 hover:bg-secondary-700 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-secondary-700">
          <div className="space-y-2">
            <button 
              onClick={handleSettingsClick}
              className="flex items-center space-x-3 px-3 py-2 text-sm text-secondary-400 hover:text-white hover:bg-secondary-700 rounded-lg transition-colors duration-200 w-full"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            <div className="px-3 py-2">
              <div className="text-xs text-secondary-500">
                <p>Intelligence & Threat Analysis</p>
                <p>Real-time Monitoring System</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-secondary-800 rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <Settings className="w-6 h-6" />
                  <span>Platform Settings</span>
                </h2>
                <button 
                  onClick={handleCloseSettings}
                  className="text-secondary-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">System Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-secondary-300">Auto-refresh interval</span>
                      <select className="input-field">
                        <option value="30">30 seconds</option>
                        <option value="60">1 minute</option>
                        <option value="300">5 minutes</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-secondary-300">Theme</span>
                      <select className="input-field">
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Notification Settings</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" defaultChecked className="rounded border-secondary-600 bg-secondary-700 text-primary-600 focus:ring-primary-500" />
                      <span className="text-secondary-300">High priority alerts</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" defaultChecked className="rounded border-secondary-600 bg-secondary-700 text-primary-600 focus:ring-primary-500" />
                      <span className="text-secondary-300">System updates</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded border-secondary-600 bg-secondary-700 text-primary-600 focus:ring-primary-500" />
                      <span className="text-secondary-300">Performance metrics</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-600">
                  <button 
                    onClick={handleCloseSettings}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      showSuccess('Settings saved successfully!');
                      handleCloseSettings();
                    }}
                    className="btn-primary"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar; 