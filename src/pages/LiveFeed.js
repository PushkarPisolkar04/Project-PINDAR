import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThreat } from '../context/ThreatContext';
import { useToast } from '../context/ToastContext';
import { exportToPDF } from '../utils/pdfExport';
import { 
  AlertTriangle, 
  Bot, 
  Globe, 
  Clock, 
  Search,
  RefreshCw,
  BarChart3,
  Download,
  FileText
} from 'lucide-react';

const LiveFeed = () => {
  const { threats, dispatch } = useThreat();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');

  const filteredThreats = threats.filter(threat => {
    const matchesSearch = (threat.username && threat.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (threat.content && threat.content.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPlatform = filterPlatform === 'all' || threat.platform === filterPlatform;
    const matchesRisk = filterRisk === 'all' || 
                       (filterRisk === 'high' && threat.threatScore >= 80) ||
                       (filterRisk === 'medium' && threat.threatScore >= 50 && threat.threatScore < 80) ||
                       (filterRisk === 'low' && threat.threatScore < 50);
    
    return matchesSearch && matchesPlatform && matchesRisk;
  });

  const getRiskColor = (threatScore) => {
    if (threatScore >= 80) return 'border-l-danger-500 bg-danger-500/5';
    if (threatScore >= 50) return 'border-l-warning-500 bg-warning-500/5';
    return 'border-l-success-500 bg-success-500/5';
  };

  const getRiskBadge = (threatScore) => {
    if (threatScore >= 80) return 'badge-danger';
    if (threatScore >= 50) return 'badge-warning';
    return 'badge-success';
  };

  const getRiskLevel = (threatScore) => {
    if (threatScore >= 80) return 'high';
    if (threatScore >= 50) return 'medium';
    return 'low';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    // Ensure timestamp is a Date object
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const handleRefresh = () => {
    // Simulate refresh with loading state
    dispatch({ type: 'SET_LOADING', payload: true });
    setTimeout(() => {
      dispatch({ type: 'SET_LOADING', payload: false });
      // Show success feedback
      showSuccess('Live feed refreshed successfully!');
    }, 1000);
  };

  const handleViewAnalytics = () => {
    navigate('/threat-analytics');
  };

  const handleExportJSON = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalThreats: filteredThreats.length,
      filters: {
        searchTerm,
        platform: filterPlatform,
        risk: filterRisk
      },
      threats: filteredThreats
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pindar_live_feed_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess('Live feed data exported successfully!');
  };

  const handleExportPDF = async () => {
    try {
      const content = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #1f2937; color: white;">
          <h2 style="color: #3b82f6; margin-bottom: 20px;">PINDAR Live Feed Report</h2>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #f59e0b; margin-bottom: 10px;">Feed Summary</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
              <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
                <strong>Total Threats:</strong> ${filteredThreats.length}
              </div>
              <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
                <strong>High Risk:</strong> ${filteredThreats.filter(t => t.threatScore >= 80).length}
              </div>
              <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
                <strong>Platforms:</strong> ${[...new Set(filteredThreats.map(t => t.platform))].join(', ')}
              </div>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #ef4444; margin-bottom: 10px;">Threat Details</h3>
            ${filteredThreats.slice(0, 10).map(threat => `
              <div style="background: #374151; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid ${
                threat.threatScore >= 80 ? '#dc2626' : 
                threat.threatScore >= 50 ? '#d97706' : '#059669'
              }">
                <strong>${threat.username}</strong> on ${threat.platform}<br>
                <span style="color: #9ca3af;">${threat.content}</span><br>
                <span style="color: #3b82f6;">Threat Score: ${threat.threatScore}</span><br>
                <span style="color: #10b981;">Location: ${threat.location}</span><br>
                <span style="color: #f59e0b;">Time: ${formatTime(threat.timestamp)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      
      const success = await exportToPDF(
        'PINDAR Live Feed Report',
        content,
        `pindar_live_feed_${new Date().toISOString().split('T')[0]}`
      );
      
      if (success) {
        showSuccess('PDF report generated successfully!');
      } else {
        showError('Error generating PDF. Please try again.');
      }
    } catch (error) {
      showError('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Live Feed</h1>
          <p className="text-secondary-400">
            Real-time monitoring of drug-related activities across social media platforms
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleRefresh}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button 
            onClick={handleViewAnalytics}
            className="btn-primary flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>View Analytics</span>
          </button>
          <button 
            onClick={handleExportJSON}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
          <button 
            onClick={handleExportPDF}
            className="btn-primary flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search threats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">Platform</label>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="input-field w-full"
            >
              <option value="all">All Platforms</option>
              <option value="Telegram">Telegram</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Instagram">Instagram</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">Risk Level</label>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="input-field w-full"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk (80+)</option>
              <option value="medium">Medium Risk (50-79)</option>
              <option value="low">Low Risk (&lt;50)</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <div className="text-center w-full">
              <div className="text-2xl font-bold text-white">{filteredThreats.length}</div>
              <div className="text-sm text-secondary-400">Threats Found</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Threat Feed */}
      <div className="space-y-4">
        {filteredThreats.map(threat => (
          <div key={threat.id} className={`card p-6 border-l-4 ${getRiskColor(threat.threatScore)}`}>
            {/* Main Threat Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-primary-500" />
                  <span className="text-white font-medium">{threat.platform}</span>
                </div>
                <span className={`badge ${getRiskBadge(threat.threatScore)}`}>
                  {getRiskLevel(threat.threatScore).toUpperCase()} RISK
                </span>
                {threat.suspectInfo?.botDetected && (
                  <span className="badge badge-warning flex items-center space-x-1">
                    <Bot className="w-3 h-3" />
                    <span>BOT</span>
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{threat.threatScore}</div>
                <div className="text-sm text-secondary-400">Threat Score</div>
              </div>
            </div>

            {/* Threat Content */}
            <div className="mb-4">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-lg font-semibold text-white">@{threat.username}</span>
                <span className="text-secondary-400">•</span>
                <span className="text-secondary-400">{threat.location}</span>
                <span className="text-secondary-400">•</span>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-secondary-400" />
                  <span className="text-secondary-400">{formatTime(threat.timestamp)}</span>
                </div>
              </div>
              <div className="text-white text-lg mb-3">{threat.content}</div>
            </div>

            {/* Enhanced Suspect Information */}
            {threat.suspectInfo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div className="bg-secondary-700 p-4 rounded-lg">
                  <h4 className="text-white font-semibold mb-3 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-warning-500" />
                    <span>Suspect Profile</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary-400">Full Name:</span>
                      <span className="text-white">{threat.suspectInfo.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-400">Phone:</span>
                      <span className="text-white font-mono">{threat.suspectInfo.phoneNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-400">Email:</span>
                      <span className="text-white font-mono">{threat.suspectInfo.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-400">UPI ID:</span>
                      <span className="text-white font-mono">{threat.suspectInfo.upiId}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-secondary-700 p-4 rounded-lg">
                  <h4 className="text-white font-semibold mb-3 flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-primary-500" />
                    <span>Account Analysis</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary-400">Account Age:</span>
                      <span className="text-white">{threat.suspectInfo.accountAge} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-400">Followers:</span>
                      <span className="text-white">{threat.suspectInfo.followers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-400">Posts:</span>
                      <span className="text-white">{threat.suspectInfo.posts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-400">Verified:</span>
                      <span className={`${threat.suspectInfo.verified ? 'text-success-500' : 'text-secondary-400'}`}>
                        {threat.suspectInfo.verified ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Threat Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-secondary-700 p-3 rounded-lg">
                <h5 className="text-white font-medium mb-2">Network Connections</h5>
                <div className="text-2xl font-bold text-primary-500">{threat.connections}</div>
                <div className="text-xs text-secondary-400">Related Accounts</div>
              </div>
              
              <div className="bg-secondary-700 p-3 rounded-lg">
                <h5 className="text-white font-medium mb-2">Content Analysis</h5>
                <div className="text-sm text-secondary-300">
                  <div>Sentiment: <span className={`${threat.sentiment === 'negative' ? 'text-danger-500' : 'text-secondary-400'}`}>
                    {threat.sentiment.charAt(0).toUpperCase() + threat.sentiment.slice(1)}
                  </span></div>
                  <div>Urgency: <span className={`${threat.urgency === 'high' ? 'text-danger-500' : 'text-warning-500'}`}>
                    {threat.urgency.charAt(0).toUpperCase() + threat.urgency.slice(1)}
                  </span></div>
                </div>
              </div>
              
              <div className="bg-secondary-700 p-3 rounded-lg">
                <h5 className="text-white font-medium mb-2">Keywords Detected</h5>
                <div className="flex flex-wrap gap-1">
                  {threat.keywords?.map((keyword, index) => (
                    <span key={index} className="badge badge-info text-xs">{keyword}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Languages and Interests */}
            {threat.suspectInfo && (
              <div className="flex flex-wrap gap-2">
                {threat.suspectInfo.languages?.map((lang, index) => (
                  <span key={index} className="badge badge-secondary text-xs">{lang}</span>
                ))}
                {threat.suspectInfo.interests?.map((interest, index) => (
                  <span key={index} className="badge badge-primary text-xs">{interest}</span>
                ))}
                {threat.suspectInfo.crossPlatform && (
                  <span className="badge badge-warning text-xs">Cross-Platform</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No Threats Message */}
      {filteredThreats.length === 0 && (
        <div className="card p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Threats Found</h3>
          <p className="text-secondary-400">
            No threats match your current filters. Try adjusting your search criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveFeed; 