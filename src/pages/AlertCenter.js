import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThreat } from '../context/ThreatContext';
import { useToast } from '../context/ToastContext';
import { exportToPDF, generateAlertCenterContent } from '../utils/pdfExport';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  Filter, 
  CheckCircle,
  XCircle,
  Download,
  Eye,
  Trash2,
  Settings,
  Users,
  BarChart3,
  FileText
} from 'lucide-react';

const AlertCenter = () => {
  const { alerts, clearAlert } = useThreat();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterRead, setFilterRead] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState(null);

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = filterSeverity === 'all' || alert.priority === filterSeverity;
    const matchesRead = filterRead === 'all' || 
      (filterRead === 'read' && alert.status === 'read') || 
      (filterRead === 'unread' && alert.status === 'unread');
    
    return matchesSeverity && matchesRead;
  });

  const getSeverityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-danger-500 bg-danger-500/5';
      case 'medium': return 'border-l-warning-500 bg-warning-500/5';
      case 'low': return 'border-l-success-500 bg-success-500/5';
      default: return 'border-l-secondary-500';
    }
  };

  const getSeverityBadge = (priority) => {
    switch (priority) {
      case 'high': return 'badge-danger';
      case 'medium': return 'badge-warning';
      case 'low': return 'badge-success';
      default: return 'badge-info';
    }
  };

  const getSeverityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-5 h-5 text-danger-500" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-warning-500" />;
      case 'low': return <AlertTriangle className="w-5 h-5 text-success-500" />;
      default: return <Bell className="w-5 h-5 text-secondary-400" />;
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diff = now - alertTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return alertTime.toLocaleDateString();
  };

  const markAsRead = (alertId) => {
    // Update alert status to read
    showSuccess('Alert marked as read!');
  };

  const markAllAsRead = () => {
    // Mark all alerts as read
    showSuccess('All alerts marked as read!');
  };

  const deleteAlert = (alertId) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      clearAlert(alertId);
      showSuccess('Alert deleted successfully!');
    }
  };

  const exportAlerts = () => {
    const alertsData = {
      exportDate: new Date().toISOString(),
      totalAlerts: alerts.length,
      alerts: alerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        message: alert.message,
        timestamp: alert.timestamp.toISOString(),
        severity: alert.severity,
        read: alert.read
      }))
    };
    
    const blob = new Blob([JSON.stringify(alertsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pindar_alerts_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show feedback
    showSuccess('Alerts exported successfully!');
  };

  const handleExportPDF = async () => {
    try {
      const content = generateAlertCenterContent(alerts);
      const success = await exportToPDF(
        'PINDAR Alert Center Report',
        content,
        `pindar_alerts_${new Date().toISOString().split('T')[0]}`
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

  const handleViewSuspects = () => {
    navigate('/suspect-profiles');
  };

  const handleViewAnalytics = () => {
    navigate('/threat-analytics');
  };

  const unreadCount = alerts.filter(alert => alert.status === 'unread').length;
  const highSeverityCount = alerts.filter(alert => alert.priority === 'high').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Alert Center</h1>
          <p className="text-secondary-400">
            Real-time notifications and alerts for threat detection and system events
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleViewSuspects}
            className="btn-secondary flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>View Suspects</span>
          </button>
          <button 
            onClick={handleViewAnalytics}
            className="btn-secondary flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>View Analytics</span>
          </button>
          <button 
            onClick={markAllAsRead}
            className="btn-secondary flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
          <button 
            onClick={exportAlerts}
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

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-white mb-2">{alerts.length}</div>
          <div className="text-secondary-400">Total Alerts</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-danger-500 mb-2">{unreadCount}</div>
          <div className="text-secondary-400">Unread</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-danger-500 mb-2">{highSeverityCount}</div>
          <div className="text-secondary-400">High Severity</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-primary-500 mb-2">
            {alerts.filter(a => a.priority === 'medium').length}
          </div>
          <div className="text-secondary-400">Medium Severity</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-secondary-400" />
            <span className="text-white font-medium">Filters:</span>
          </div>
          
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="input-field"
          >
            <option value="all">All Severities</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>
          
          <select
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value)}
            className="input-field"
          >
            <option value="all">All Alerts</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="card p-12 text-center">
            <Bell className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No alerts found</h3>
            <p className="text-secondary-400">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`card p-6 ${getSeverityColor(alert.priority)} ${
                alert.status === 'unread' ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-1">
                    {getSeverityIcon(alert.priority)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{alert.type}</h3>
                      <span className={`badge ${getSeverityBadge(alert.priority)}`}>
                        {alert.priority.toUpperCase()}
                      </span>
                      {alert.status === 'unread' && (
                        <span className="badge badge-primary">NEW</span>
                      )}
                    </div>
                    <p className="text-secondary-300 leading-relaxed">{alert.message}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <div className="flex items-center space-x-1 text-secondary-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{formatTime(alert.timestamp)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {alert.status === 'unread' ? (
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className="p-2 text-secondary-400 hover:text-success-500 transition-colors"
                        title="Mark as read"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className="p-2 text-success-500 hover:text-success-400 transition-colors"
                        title="Mark as unread"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="p-2 text-secondary-400 hover:text-primary-500 transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-2 text-secondary-400 hover:text-danger-500 transition-colors"
                      title="Delete alert"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-secondary-800 rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {getSeverityIcon(selectedAlert.priority)}
                  <h2 className="text-2xl font-bold text-white">{selectedAlert.type}</h2>
                </div>
                <button 
                  onClick={() => setSelectedAlert(null)}
                  className="text-secondary-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="card p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Alert Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-secondary-400">Severity:</span>
                      <span className={`badge ${getSeverityBadge(selectedAlert.priority)}`}>
                        {selectedAlert.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-400">Status:</span>
                      <span className={`badge ${selectedAlert.status === 'read' ? 'badge-success' : 'badge-primary'}`}>
                        {selectedAlert.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-400">Timestamp:</span>
                      <span className="text-white">{selectedAlert.timestamp.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="card p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Message</h3>
                  <p className="text-secondary-300 leading-relaxed">{selectedAlert.message}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-secondary-600">
                <button 
                  className="btn-secondary flex items-center space-x-2"
                  onClick={() => markAsRead(selectedAlert.id)}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{selectedAlert.status === 'read' ? 'Mark Unread' : 'Mark Read'}</span>
                </button>
                <button 
                  className="btn-primary flex items-center space-x-2"
                  onClick={() => setSelectedAlert(null)}
                >
                  <Eye className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Settings */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Alert Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-3">Notification Preferences</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input type="checkbox" defaultChecked className="rounded border-secondary-600 bg-secondary-700 text-primary-600 focus:ring-primary-500" />
                <span className="text-secondary-300">High severity alerts</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" defaultChecked className="rounded border-secondary-600 bg-secondary-700 text-primary-600 focus:ring-primary-500" />
                <span className="text-secondary-300">Medium severity alerts</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="rounded border-secondary-600 bg-secondary-700 text-primary-600 focus:ring-primary-500" />
                <span className="text-secondary-300">Low severity alerts</span>
              </label>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-3">Auto-cleanup</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input type="checkbox" defaultChecked className="rounded border-secondary-600 bg-secondary-700 text-primary-600 focus:ring-primary-500" />
                <span className="text-secondary-300">Auto-mark as read after 7 days</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="rounded border-secondary-600 bg-secondary-700 text-primary-600 focus:ring-primary-500" />
                <span className="text-secondary-300">Auto-delete after 30 days</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertCenter; 