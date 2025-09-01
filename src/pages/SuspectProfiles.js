import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThreat } from '../context/ThreatContext';
import { useToast } from '../context/ToastContext';
import { exportToPDF, generateSuspectProfileContent } from '../utils/pdfExport';
import { 
  Users, 
  Globe, 
  Bot, 
  Phone, 
  Mail, 
  CreditCard,
  MapPin,
  Activity,
  Download,
  Eye,
  Shield,
  Filter,
  X,
  AlertTriangle,
  BarChart3,
  FileText
} from 'lucide-react';

const SuspectProfiles = () => {
  const { threats } = useThreat();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [selectedSuspect, setSelectedSuspect] = useState(null);
  const [filterRisk, setFilterRisk] = useState('all');

  // Transform threats into suspect profiles
  const suspects = threats.map(threat => ({
    id: threat.id,
    name: threat.suspectInfo?.fullName || threat.username,
    username: threat.username,
    threatScore: threat.threatScore,
    riskLevel: threat.threatScore >= 80 ? 'high' : threat.threatScore >= 50 ? 'medium' : 'low',
    platform: threat.platform,
    platforms: [threat.platform],
    location: threat.location,
    phoneNumbers: threat.suspectInfo?.phoneNumber ? [threat.suspectInfo.phoneNumber] : [],
    emailIds: threat.suspectInfo?.email ? [threat.suspectInfo.email] : [],
    upiIds: threat.suspectInfo?.upiId ? [threat.suspectInfo.upiId] : [],
    ipAddresses: [],
    messagesFlagged: Math.floor(Math.random() * 20) + 5,
    connections: threat.connections || 0,
    botActivity: threat.suspectInfo?.botDetected || false,
    lastSeen: threat.suspectInfo?.lastSeen || threat.timestamp,
    accountAge: threat.suspectInfo?.accountAge || 0,
    followers: threat.suspectInfo?.followers || 0,
    posts: threat.suspectInfo?.posts || 0,
    verified: threat.suspectInfo?.verified || false,
    crossPlatform: threat.suspectInfo?.crossPlatform || false,
    languages: threat.suspectInfo?.languages || ['English'],
    interests: threat.suspectInfo?.interests || [],
    content: threat.content,
    keywords: threat.keywords || [],
    sentiment: threat.sentiment || 'neutral',
    urgency: threat.urgency || 'medium'
  }));

  const filteredSuspects = filterRisk === 'all' 
    ? suspects 
    : suspects.filter(s => s.riskLevel === filterRisk);

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'border-l-danger-500 bg-danger-500/5';
      case 'medium': return 'border-l-warning-500 bg-warning-500/5';
      case 'low': return 'border-l-success-500 bg-success-500/5';
      default: return 'border-l-secondary-500';
    }
  };

  const getRiskBadge = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'badge-danger';
      case 'medium': return 'badge-warning';
      case 'low': return 'badge-success';
      default: return 'badge-info';
    }
  };

  const handleExportProfile = (suspect) => {
    // Simulate export functionality
    const profileData = {
      name: suspect.name,
      threatScore: suspect.threatScore,
      riskLevel: suspect.riskLevel,
      platforms: suspect.platforms,
      metadata: {
        phoneNumbers: suspect.phoneNumbers,
        emailIds: suspect.emailIds,
        upiIds: suspect.upiIds,
        ipAddresses: suspect.ipAddresses
      },
      activity: {
        messagesFlagged: suspect.messagesFlagged,
        connections: suspect.connections,
        botActivity: suspect.botActivity
      }
    };
    
    const blob = new Blob([JSON.stringify(profileData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${suspect.name.replace(/\s+/g, '_')}_profile.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success feedback
    showSuccess(`Profile for ${suspect.name} exported successfully!`);
  };

  const handleExportProfilePDF = async (suspect) => {
    try {
      const content = generateSuspectProfileContent(suspect);
      const success = await exportToPDF(
        `Suspect Profile: ${suspect.name}`,
        content,
        `${suspect.name.replace(/\s+/g, '_')}_profile`
      );
      
      if (success) {
        showSuccess(`PDF profile for ${suspect.name} generated successfully!`);
      } else {
        showError('Error generating PDF. Please try again.');
      }
    } catch (error) {
      showError('Error generating PDF. Please try again.');
    }
  };

  const handleViewAnalytics = () => {
    navigate('/threat-analytics');
  };

  const handleViewNetworkAnalysis = () => {
    navigate('/network-analysis');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Suspect Profiles</h1>
            <p className="text-secondary-400">
              Detailed profiles and intelligence on suspicious entities and networks
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleViewAnalytics}
              className="btn-secondary flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Analytics</span>
            </button>
            <button 
              onClick={handleViewNetworkAnalysis}
              className="btn-secondary flex items-center space-x-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Network View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-secondary-400" />
            <span className="text-white font-medium">Filter by Risk Level:</span>
          </div>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="input-field"
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk Only</option>
            <option value="medium">Medium Risk Only</option>
            <option value="low">Low Risk Only</option>
          </select>
        </div>
      </div>

      {/* Suspects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSuspects.map((suspect) => (
          <div
            key={suspect.id}
            className={`card p-6 ${getRiskColor(suspect.riskLevel)} cursor-pointer hover:scale-105 transition-transform duration-200`}
            onClick={() => setSelectedSuspect(suspect)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{suspect.name}</h3>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`badge ${getRiskBadge(suspect.riskLevel)}`}>
                    Score: {suspect.threatScore}
                  </span>
                  <span className="badge badge-info">
                    {suspect.riskLevel.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{suspect.threatScore}</div>
                <div className="text-sm text-secondary-400">Threat Score</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-secondary-400" />
                <span className="text-secondary-300">
                  {suspect.platforms.join(', ')}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-secondary-400" />
                <span className="text-secondary-300">
                  Bot Activity: {suspect.botActivity}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-secondary-400" />
                <span className="text-secondary-300">
                  {suspect.messagesFlagged} messages flagged
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-secondary-400" />
                <span className="text-secondary-300">
                  {suspect.connections} connections
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-secondary-600">
              <div className="flex space-x-2">
                <button 
                  className="btn-secondary flex-1 flex items-center justify-center space-x-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportProfile(suspect);
                  }}
                >
                  <Download className="w-4 h-4" />
                  <span>Export JSON</span>
                </button>
                <button 
                  className="btn-secondary flex-1 flex items-center justify-center space-x-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportProfilePDF(suspect);
                  }}
                >
                  <FileText className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Suspect Details Modal */}
      {selectedSuspect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-secondary-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{selectedSuspect.name}</h2>
                <button 
                  onClick={() => setSelectedSuspect(null)}
                  className="text-secondary-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Basic Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-secondary-400">Threat Score:</span>
                      <span className={`font-semibold ${
                        selectedSuspect.threatScore >= 80 ? 'text-danger-500' :
                        selectedSuspect.threatScore >= 50 ? 'text-warning-500' : 'text-success-500'
                      }`}>
                        {selectedSuspect.threatScore}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-400">Risk Level:</span>
                      <span className={`badge ${getRiskBadge(selectedSuspect.riskLevel)}`}>
                        {selectedSuspect.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-400">Platforms:</span>
                      <span className="text-white">{selectedSuspect.platforms.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-400">Bot Activity:</span>
                      <span className="text-white">{selectedSuspect.botActivity}</span>
                    </div>
                  </div>
                </div>

                {/* Activity Metrics */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Activity Metrics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-secondary-400">Messages Flagged:</span>
                      <span className="text-white font-semibold">{selectedSuspect.messagesFlagged}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-400">Network Connections:</span>
                      <span className="text-white font-semibold">{selectedSuspect.connections}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-400">Platform Coverage:</span>
                      <span className="text-white">{selectedSuspect.platforms.length}/3</span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Phone className="w-5 h-5 mr-2" />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    {selectedSuspect.phoneNumbers.map((phone, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-secondary-400" />
                        <span className="text-white">{phone}</span>
                      </div>
                    ))}
                    {selectedSuspect.emailIds.map((email, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-secondary-400" />
                        <span className="text-white">{email}</span>
                      </div>
                    ))}
                    {selectedSuspect.upiIds.map((upi, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-secondary-400" />
                        <span className="text-white">{upi}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Network Information */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Network Information
                  </h3>
                  <div className="space-y-3">
                    {selectedSuspect.ipAddresses.map((ip, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-secondary-400" />
                        <span className="text-white">{ip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Intelligence Summary */}
              <div className="card p-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Profile Summary</h3>
                <div className="bg-secondary-700/50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-white font-medium mb-2">Activity Summary</h4>
                      <div className="space-y-1 text-sm text-secondary-300">
                        <div>Messages Flagged: {selectedSuspect.messagesFlagged}</div>
                        <div>Network Connections: {selectedSuspect.connections}</div>
                        <div>Platform Coverage: {selectedSuspect.platforms.length}/3</div>
                        <div>Bot Activity: {selectedSuspect.botActivity}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-2">Risk Assessment</h4>
                      <div className="space-y-1 text-sm text-secondary-300">
                        <div>Threat Score: {selectedSuspect.threatScore}</div>
                        <div>Risk Level: {selectedSuspect.riskLevel.toUpperCase()}</div>
                        <div>Priority: {selectedSuspect.threatScore >= 80 ? 'High' : selectedSuspect.threatScore >= 50 ? 'Medium' : 'Low'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-secondary-600">
                <button 
                  className="btn-secondary flex items-center space-x-2"
                  onClick={() => handleExportProfile(selectedSuspect)}
                >
                  <Download className="w-4 h-4" />
                  <span>Export JSON</span>
                </button>
                <button 
                  className="btn-secondary flex items-center space-x-2"
                  onClick={() => handleExportProfilePDF(selectedSuspect)}
                >
                  <FileText className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
                <button 
                  className="btn-primary flex items-center space-x-2"
                  onClick={() => setSelectedSuspect(null)}
                >
                  <Eye className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Profile Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{suspects.length}</div>
            <div className="text-sm text-secondary-400">Total Suspects</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-danger-500">
              {suspects.filter(s => s.riskLevel === 'high').length}
            </div>
            <div className="text-sm text-secondary-400">High Risk</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning-500">
              {suspects.filter(s => s.riskLevel === 'medium').length}
            </div>
            <div className="text-sm text-secondary-400">Medium Risk</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success-500">
              {suspects.filter(s => s.riskLevel === 'low').length}
            </div>
            <div className="text-sm text-secondary-400">Low Risk</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuspectProfiles; 