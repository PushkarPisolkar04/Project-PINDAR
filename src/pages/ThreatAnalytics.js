import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useThreat } from '../context/ThreatContext';
import { useToast } from '../context/ToastContext';
import { exportToPDF, generateThreatAnalyticsContent } from '../utils/pdfExport';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity,
  Target,
  AlertTriangle,
  Download,
  Eye,
  FileText
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line } from 'recharts';

const ThreatAnalytics = () => {
  const { threats, metrics } = useThreat();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  // Prepare data for charts
  const threatScoreDistribution = [
    { range: '0-20', count: threats.filter(t => t.threatScore >= 0 && t.threatScore <= 20).length },
    { range: '21-40', count: threats.filter(t => t.threatScore >= 21 && t.threatScore <= 40).length },
    { range: '41-60', count: threats.filter(t => t.threatScore >= 41 && t.threatScore <= 60).length },
    { range: '61-80', count: threats.filter(t => t.threatScore >= 61 && t.threatScore <= 80).length },
    { range: '81-100', count: threats.filter(t => t.threatScore >= 81 && t.threatScore <= 100).length }
  ];

  const platformActivity = [
    { name: 'Telegram', value: threats.filter(t => t.platform === 'Telegram').length, color: '#3b82f6' },
    { name: 'WhatsApp', value: threats.filter(t => t.platform === 'WhatsApp').length, color: '#10b981' },
    { name: 'Instagram', value: threats.filter(t => t.platform === 'Instagram').length, color: '#f59e0b' }
  ];

  const riskLevelBreakdown = [
    { name: 'High Risk', value: metrics.highRiskThreats, color: '#ef4444' },
    { name: 'Medium Risk', value: metrics.mediumRiskThreats, color: '#f59e0b' },
    { name: 'Low Risk', value: metrics.lowRiskThreats, color: '#10b981' }
  ];

  const threatTrendData = [
    { time: '00:00', count: 2 },
    { time: '04:00', count: 1 },
    { time: '08:00', count: 3 },
    { time: '12:00', count: 5 },
    { time: '16:00', count: 4 },
    { time: '20:00', count: 6 },
    { time: '24:00', count: 3 }
  ];

  const handleExportAnalytics = async () => {
    try {
      const analyticsData = {
        exportDate: new Date().toISOString(),
        metrics: metrics,
        threatScoreDistribution: threatScoreDistribution,
        platformActivity: platformActivity,
        riskLevelBreakdown: riskLevelBreakdown,
        threatTrendData: threatTrendData,
        topThreats: threats.sort((a, b) => b.threatScore - a.threatScore).slice(0, 10),
        summary: `Threat Analytics Report - Total Threats: ${threats.length}, High Risk: ${metrics.highRiskThreats}`
      };
      
      const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pindar_threat_analytics_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSuccess('Analytics exported successfully!');
    } catch (error) {
      showError('Error exporting analytics. Please try again.');
    }
  };

  const handleExportPDF = async () => {
    try {
      const content = generateThreatAnalyticsContent(metrics, threats, platformActivity, riskLevelBreakdown);
      const success = await exportToPDF(
        'PINDAR Threat Analytics Report',
        content,
        `pindar_threat_analytics_${new Date().toISOString().split('T')[0]}`
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

  const handleViewLiveFeed = () => {
    navigate('/live-feed');
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
            <h1 className="text-3xl font-bold text-white mb-2">Threat Analytics</h1>
            <p className="text-secondary-400">
              Comprehensive analysis and insights into threat patterns and trends
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleViewLiveFeed}
              className="btn-secondary flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Live Feed</span>
            </button>
            <button 
              onClick={handleViewNetworkAnalysis}
              className="btn-secondary flex items-center space-x-2"
            >
              <Target className="w-4 h-4" />
              <span>Network View</span>
            </button>
            <button 
              onClick={handleExportAnalytics}
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
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-white mb-2">{metrics.activeThreats}</div>
          <div className="text-secondary-400">Total Threats</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-danger-500 mb-2">{metrics.highRiskThreats}</div>
          <div className="text-secondary-400">High Risk</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-warning-500 mb-2">{metrics.mediumRiskThreats}</div>
          <div className="text-secondary-400">Medium Risk</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-success-500 mb-2">{metrics.lowRiskThreats}</div>
          <div className="text-secondary-400">Low Risk</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Score Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Threat Score Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={threatScoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="range" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Activity by Platform
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={platformActivity}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {platformActivity.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Level Breakdown */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Risk Level Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={riskLevelBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {riskLevelBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Threat Trend */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Threat Trend (24h)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={threatTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Threats */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Top Threats by Score
          </h3>
          <div className="space-y-3">
            {threats
              .sort((a, b) => b.threatScore - a.threatScore)
              .slice(0, 5)
              .map((threat, index) => (
                <div key={threat.id} className="flex items-center justify-between p-3 bg-secondary-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-secondary-400">#{index + 1}</span>
                    <div>
                      <p className="text-white font-medium">{threat.channel}</p>
                      <p className="text-sm text-secondary-400">{threat.platform}</p>
                    </div>
                  </div>
                  <span className={`badge ${
                    threat.threatScore >= 80 ? 'badge-danger' : 
                    threat.threatScore >= 50 ? 'badge-warning' : 'badge-success'
                  }`}>
                    {threat.threatScore}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Platform Analysis */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Platform Analysis
          </h3>
          <div className="space-y-4">
            {platformActivity.map((platform) => (
              <div key={platform.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: platform.color }}
                  ></div>
                  <span className="text-white">{platform.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">{platform.value}</div>
                  <div className="text-sm text-secondary-400">
                    {((platform.value / threats.length) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreatAnalytics; 