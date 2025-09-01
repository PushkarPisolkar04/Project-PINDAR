import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThreat } from '../context/ThreatContext';
import { useToast } from '../context/ToastContext';
import { exportToPDF, generateDashboardContent } from '../utils/pdfExport';
import { 
  TrendingUp, 
  Users, 
  Bot, 
  Target, 
  Download, 
  FileText, 
  AlertTriangle,
  Eye
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { threats, alerts, metrics } = useThreat();
  const { showSuccess, showError } = useToast();
  const [recentAlerts, setRecentAlerts] = useState([]);

  // Update recent alerts when new alerts come in
  useEffect(() => {
    if (alerts.length > 0) {
      const newAlerts = alerts.filter(alert => 
        new Date(alert.timestamp) > new Date(Date.now() - 30000) // Last 30 seconds
      );
      setRecentAlerts(newAlerts);
    }
  }, [alerts]);

  const handleGenerateReport = async () => {
    try {
      const reportData = {
        reportType: 'Comprehensive Intelligence Report',
        timestamp: new Date().toISOString(),
        generatedBy: 'PINDAR Intelligence Platform',
        executiveSummary: {
          totalThreats: metrics.activeThreats,
          highRiskCount: metrics.highRiskThreats,
          mediumRiskCount: metrics.mediumRiskThreats,
          lowRiskCount: metrics.lowRiskThreats,
          threatLevel: metrics.highRiskThreats > 0 ? 'High' : metrics.mediumRiskThreats > 0 ? 'Medium' : 'Low'
    },
        detailedAnalysis: {
          platformBreakdown: threats.reduce((acc, threat) => {
            acc[threat.platform] = (acc[threat.platform] || 0) + 1;
            return acc;
          }, {}),
          recentThreats: threats.slice(0, 10),
          riskDistribution: {
            high: metrics.highRiskThreats,
            medium: metrics.mediumRiskThreats,
            low: metrics.lowRiskThreats
          }
        },
        recommendations: [
          'Prioritize investigation of high-risk threats (score 80+)',
          'Monitor cross-platform activity patterns',
          'Focus on emerging threat locations',
          'Implement enhanced bot detection measures'
        ],
        metadata: {
          reportVersion: '1.0',
          dataSource: 'PINDAR Intelligence Platform',
          confidence: 'High',
          lastUpdated: new Date().toISOString()
        }
      };
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pindar_intelligence_report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSuccess('Intelligence report generated successfully!');
    } catch (error) {
      showError('Error generating report. Please try again.');
    }
  };

  const handleViewSuspects = () => {
    navigate('/suspect-profiles');
  };

  const handleExportData = () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        totalThreats: threats.length,
        threats: threats,
        metrics: metrics,
        alerts: alerts
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pindar_raw_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSuccess('Raw data exported successfully!');
    } catch (error) {
      showError('Error exporting data. Please try again.');
    }
  };

  const handleExportPDF = async () => {
    try {
      const content = generateDashboardContent(metrics, threats);
      const success = await exportToPDF(
        'PINDAR Intelligence Dashboard Report',
        content,
        `pindar_dashboard_${new Date().toISOString().split('T')[0]}`
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
          <h1 className="text-3xl font-bold text-white mb-2">Intelligence Dashboard</h1>
          <p className="text-secondary-400">
            Real-time monitoring and analysis of drug-related activities across social media platforms
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleGenerateReport}
            className="btn-primary flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
          <button 
            onClick={handleExportData}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Raw Data</span>
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

      {/* Real-time Alert Notifications */}
      {recentAlerts.length > 0 && (
        <div className="card p-4 border-l-4 border-red-500 bg-red-900 bg-opacity-20">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Live Threat Alerts</h3>
              <p className="text-red-300 text-sm">New threats detected in real-time</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-red-400">{recentAlerts.length}</div>
              <div className="text-xs text-red-300">New Alerts</div>
            </div>
      </div>

          <div className="mt-4 space-y-2">
            {recentAlerts.slice(0, 3).map(alert => (
              <div key={alert.id} className="flex items-center justify-between bg-red-800 bg-opacity-30 p-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    alert.priority === 'high' ? 'bg-red-400' : 'bg-yellow-400'
                  }`}></div>
                <div>
                    <div className="text-white font-medium">{alert.type}</div>
                    <div className="text-red-200 text-sm">{alert.platform} • {alert.username}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-red-200">{alert.threatScore}</div>
                  <div className="text-xs text-red-300">Score</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-danger-500" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">{metrics.activeThreats}</div>
          <div className="text-secondary-400">Active Threats</div>
          <div className="text-sm text-danger-400 mt-2">+{Math.floor(Math.random() * 3) + 1} today</div>
        </div>
        
        <div className="card p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-primary-500" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">{metrics.platformsMonitored}</div>
          <div className="text-secondary-400">Platforms Monitored</div>
          <div className="text-sm text-primary-400 mt-2">Telegram, WhatsApp, Instagram</div>
        </div>
        
        <div className="card p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-warning-500" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">{metrics.botsDetected}</div>
          <div className="text-secondary-400">Bots Detected</div>
          <div className="text-sm text-warning-400 mt-2">+{Math.floor(Math.random() * 2) + 1} this hour</div>
        </div>
        
        <div className="card p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-success-500" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">{metrics.avgThreatScore}</div>
          <div className="text-secondary-400">Avg Threat Score</div>
          <div className="text-sm text-success-400 mt-2">+{Math.floor(Math.random() * 8) + 1}% from yesterday</div>
            </div>
      </div>

        {/* Risk Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Risk Breakdown</h3>
            <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-danger-500 rounded-full"></div>
                <span className="text-white">High Risk</span>
              </div>
              <div className="text-white font-semibold">{metrics.highRiskThreats} threats</div>
            </div>
            <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
                <span className="text-white">Medium Risk</span>
              </div>
              <div className="text-white font-semibold">{metrics.mediumRiskThreats} threats</div>
                  </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                <span className="text-white">Low Risk</span>
                </div>
              <div className="text-white font-semibold">{metrics.lowRiskThreats} threats</div>
            </div>
          </div>
        </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Threats</h3>
            <div className="space-y-3">
            {threats.slice(0, 4).map(threat => (
              <div key={threat.id} className="flex items-center justify-between p-3 bg-secondary-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    threat.threatScore >= 80 ? 'bg-danger-500' : 
                    threat.threatScore >= 50 ? 'bg-warning-500' : 'bg-success-500'
                    }`}></div>
                    <div>
                    <div className="text-white font-medium">@{threat.username}</div>
                    <div className="text-secondary-400 text-sm">{threat.platform}</div>
                    </div>
                  </div>
                  <div className="text-right">
                  <div className={`font-semibold ${
                    threat.threatScore >= 80 ? 'text-danger-500' :
                    threat.threatScore >= 50 ? 'text-warning-500' : 'text-success-500'
                    }`}>
                      Score: {threat.threatScore}
                  </div>
                  <div className="text-secondary-400 text-xs">
                    {new Date(threat.timestamp).toLocaleTimeString()}
                  </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Export Options Description */}
      <div className="mt-4 pt-4 border-t border-secondary-600">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-secondary-300">
            <strong className="text-white">Generate Report:</strong> Creates a comprehensive intelligence report with analysis and executive summary
          </div>
          <div className="text-secondary-300">
            <strong className="text-white">Export Raw Data:</strong> Downloads all threat data in JSON format for technical analysis
              </div>
          <div className="text-secondary-300">
            <strong className="text-white">Export PDF:</strong> Generates a professional PDF report for documentation and sharing
            </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center space-x-4">
        <button 
          onClick={handleViewSuspects}
          className="btn-primary flex items-center space-x-2"
        >
          <Eye className="w-4 h-4" />
          <span>View Suspect Profiles</span>
          </button>
      </div>
    </div>
  );
};

export default Dashboard; 