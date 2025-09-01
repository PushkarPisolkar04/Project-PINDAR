import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useThreat } from '../context/ThreatContext';
import { useToast } from '../context/ToastContext';
import { exportToPDF } from '../utils/pdfExport';
import { Filter, Download, Eye, FileText } from 'lucide-react';

const NetworkAnalysis = () => {
  const { networkData } = useThreat();
  const { showSuccess, showError } = useToast();
  const canvasRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterRisk, setFilterRisk] = useState('all');
  const [hoveredNode, setHoveredNode] = useState(null);

  // Create stable connections based on meaningful relationships
  const stableConnections = useMemo(() => {
    if (!networkData.length) return [];
    
    const connections = [];
    const groups = {};
    
    // Group nodes by their group/cluster
    networkData.forEach(node => {
      if (!groups[node.group]) groups[node.group] = [];
      groups[node.group].push(node);
    });

    // Create connections within groups (stronger connections)
    Object.values(groups).forEach(groupNodes => {
      if (groupNodes.length > 1) {
        // Connect nodes within the same group
        for (let i = 0; i < groupNodes.length; i++) {
          for (let j = i + 1; j < groupNodes.length; j++) {
            const strength = Math.min(0.8, 0.3 + (groupNodes[i].threatScore + groupNodes[j].threatScore) / 200);
            connections.push({
              source: groupNodes[i].id,
              target: groupNodes[j].id,
              strength: strength,
              type: 'group'
            });
          }
        }
      }
    });
    
    // Create cross-group connections based on threat score similarity
    const highRiskNodes = networkData.filter(n => n.threatScore >= 80);
    const mediumRiskNodes = networkData.filter(n => n.threatScore >= 50 && n.threatScore < 80);
    
    // Connect high-risk nodes across groups
    if (highRiskNodes.length > 1) {
      for (let i = 0; i < highRiskNodes.length; i++) {
        for (let j = i + 1; j < highRiskNodes.length; j++) {
          if (highRiskNodes[i].group !== highRiskNodes[j].group) {
            connections.push({
              source: highRiskNodes[i].id,
              target: highRiskNodes[j].id,
              strength: 0.6,
              type: 'high-risk'
            });
          }
        }
      }
    }
    
    // Connect medium-risk nodes with some high-risk nodes
    mediumRiskNodes.forEach(mediumNode => {
      const similarHighRisk = highRiskNodes.find(highNode => 
        highNode.group !== mediumNode.group && 
        Math.abs(highNode.threatScore - mediumNode.threatScore) < 30
      );
      if (similarHighRisk) {
        connections.push({
          source: mediumNode.id,
          target: similarHighRisk.id,
          strength: 0.4,
          type: 'risk-similarity'
        });
      }
    });
    
    return connections;
  }, [networkData]);

  // Calculate stable grid positions
  const positionedNodes = useMemo(() => {
    if (!networkData.length) return [];
    
    const filteredData = filterRisk === 'all' 
      ? networkData 
      : networkData.filter(node => {
          if (filterRisk === 'high') return node.threatScore >= 80;
          if (filterRisk === 'medium') return node.threatScore >= 50 && node.threatScore < 80;
          if (filterRisk === 'low') return node.threatScore < 50;
          return true;
        });

    const groups = {};
    filteredData.forEach(node => {
      if (!groups[node.group]) groups[node.group] = [];
      groups[node.group].push(node);
    });

    const positioned = [];
    const canvasWidth = 800;
    const margin = 60;
    const usableWidth = canvasWidth - (2 * margin);
    
    let yOffset = margin + 40; // Reduced initial offset
    const spacing = 120; // Reduced spacing between nodes
    const rowSpacing = 140; // Reduced spacing between rows

    Object.entries(groups).forEach(([groupName, groupNodes]) => {
      const groupWidth = groupNodes.length * spacing;
      let xOffset = margin + (usableWidth - groupWidth) / 2; // Center the group horizontally

      groupNodes.forEach((node, index) => {
        positioned.push({
          ...node,
          x: xOffset + index * spacing,
          y: yOffset,
          groupName
        });
      });

      yOffset += rowSpacing; // Move to next row with reduced spacing
    });

    return positioned;
  }, [networkData, filterRisk]);

  // Filter connections for positioned nodes
  const positionedConnections = useMemo(() => {
    const nodeIds = positionedNodes.map(n => n.id);
    return stableConnections.filter(link => 
      nodeIds.includes(link.source) && nodeIds.includes(link.target)
    );
  }, [stableConnections, positionedNodes]);

  // Draw network on canvas
  useEffect(() => {
    if (!canvasRef.current || !positionedNodes.length) return;

    console.log('Drawing network with:', {
      positionedNodes: positionedNodes.length,
      positionedConnections: positionedConnections.length,
      canvasRef: canvasRef.current,
      networkData: networkData.length
    });

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    // Set canvas size to match container
    canvas.width = rect.width;
    canvas.height = 800; // Updated to match new height

    console.log('Canvas dimensions:', { width: canvas.width, height: canvas.height });

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw connections first (behind nodes)
    positionedConnections.forEach(connection => {
      const sourceNode = positionedNodes.find(n => n.id === connection.source);
      const targetNode = positionedNodes.find(n => n.id === connection.target);
      
      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        
        // Set connection color and style
        switch(connection.type) {
          case 'group':
            ctx.strokeStyle = '#3b82f6';
            break;
          case 'high-risk':
            ctx.strokeStyle = '#ef4444';
            break;
          case 'risk-similarity':
            ctx.strokeStyle = '#f59e0b';
            break;
          default:
            ctx.strokeStyle = '#6b7280';
        }
        
        ctx.lineWidth = Math.max(2, connection.strength * 4);
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });

    // Draw nodes
    positionedNodes.forEach(node => {
      const isHovered = hoveredNode && hoveredNode.id === node.id;
      const isSelected = selectedNode && selectedNode.id === node.id;
      
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, 25, 0, 2 * Math.PI);
      
      // Node color based on threat score
      if (node.threatScore >= 80) {
        ctx.fillStyle = '#ef4444'; // High risk - red
      } else if (node.threatScore >= 50) {
        ctx.fillStyle = '#f59e0b'; // Medium risk - orange
      } else {
        ctx.fillStyle = '#10b981'; // Low risk - green
      }
      
      ctx.fill();
      
      // Node border
      ctx.lineWidth = isHovered || isSelected ? 4 : 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Node label (truncated if too long)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const label = node.label.length > 12 ? node.label.substring(0, 12) + '...' : node.label;
      ctx.fillText(label, node.x, node.y - 30); // Reduced from -35

      // Threat score
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter';
      ctx.fillText(node.threatScore.toString(), node.x, node.y + 30); // Reduced from +35

      // Group indicator
      ctx.fillStyle = '#6b7280';
      ctx.font = '9px Inter';
      ctx.fillText(node.groupName.replace('_', ' ').toUpperCase(), node.x, node.y + 45); // Reduced from +50
    });

  }, [positionedNodes, positionedConnections, hoveredNode, selectedNode, networkData.length]);

  // Handle canvas interactions
  const handleCanvasMouseMove = (event) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Find if mouse is over a node
    const nodeUnderMouse = positionedNodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= 25;
    });
    
    setHoveredNode(nodeUnderMouse || null);
    
    // Change cursor style
    canvas.style.cursor = nodeUnderMouse ? 'pointer' : 'default';
  };

  const handleCanvasClick = (event) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked node
    const clickedNode = positionedNodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= 25;
    });
    
    if (clickedNode) {
      setSelectedNode(clickedNode);
    }
  };

  const handleCanvasMouseLeave = () => {
    setHoveredNode(null);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default';
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && positionedNodes.length > 0) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = 800; // Updated to match new height
        
        // Redraw the network
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Redraw connections and nodes
        positionedConnections.forEach(connection => {
          const sourceNode = positionedNodes.find(n => n.id === connection.source);
          const targetNode = positionedNodes.find(n => n.id === connection.target);
          
          if (sourceNode && targetNode) {
            ctx.beginPath();
            ctx.moveTo(sourceNode.x, sourceNode.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            
            switch(connection.type) {
              case 'group':
                ctx.strokeStyle = '#3b82f6';
                break;
              case 'high-risk':
                ctx.strokeStyle = '#ef4444';
                break;
              case 'risk-similarity':
                ctx.strokeStyle = '#f59e0b';
                break;
              default:
                ctx.strokeStyle = '#6b7280';
            }
            
            ctx.lineWidth = Math.max(2, connection.strength * 4);
            ctx.globalAlpha = 0.7;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        });

        positionedNodes.forEach(node => {
          const isHovered = hoveredNode && hoveredNode.id === node.id;
          const isSelected = selectedNode && selectedNode.id === node.id;
          
          ctx.beginPath();
          ctx.arc(node.x, node.y, 25, 0, 2 * Math.PI);
          
          if (node.threatScore >= 80) {
            ctx.fillStyle = '#ef4444';
          } else if (node.threatScore >= 50) {
            ctx.fillStyle = '#f59e0b';
          } else {
            ctx.fillStyle = '#10b981';
    }

          ctx.fill();
          
          ctx.lineWidth = isHovered || isSelected ? 4 : 2;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px Inter';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const label = node.label.length > 12 ? node.label.substring(0, 12) + '...' : node.label;
          ctx.fillText(label, node.x, node.y - 30); // Reduced from -35

          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px Inter';
          ctx.fillText(node.threatScore.toString(), node.x, node.y + 30); // Reduced from +35

          ctx.fillStyle = '#6b7280';
          ctx.font = '9px Inter';
          ctx.fillText(node.groupName.replace('_', ' ').toUpperCase(), node.x, node.y + 45); // Reduced from +50
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [positionedNodes, positionedConnections, hoveredNode, selectedNode, networkData.length]);

  const getRiskStats = () => {
    const highRisk = networkData.filter(n => n.threatScore >= 80).length;
    const mediumRisk = networkData.filter(n => n.threatScore >= 50 && n.threatScore < 80).length;
    const lowRisk = networkData.filter(n => n.threatScore < 50).length;
    
    return { highRisk, mediumRisk, lowRisk };
  };

  const riskStats = getRiskStats();

  const handleExportNetworkData = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalNodes: networkData.length,
      filterApplied: filterRisk,
      networkData: networkData,
      selectedNode: selectedNode,
      riskStats: getRiskStats()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pindar_network_analysis_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess('Network data exported successfully!');
  };

  const handleExportPDF = async () => {
    try {
      // Create a temporary div to capture the network visualization
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #1f2937; color: white;">
          <h2 style="color: #3b82f6; margin-bottom: 20px;">PINDAR Network Analysis Report</h2>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #f59e0b; margin-bottom: 10px;">Network Statistics</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px;">
              <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
                <strong>Total Nodes:</strong> ${networkData.length}
              </div>
              <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
                <strong>High Risk:</strong> ${getRiskStats().highRisk}
              </div>
              <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
                <strong>Medium Risk:</strong> ${getRiskStats().mediumRisk}
              </div>
              <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
                <strong>Low Risk:</strong> ${getRiskStats().lowRisk}
              </div>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #ef4444; margin-bottom: 10px;">Network Nodes</h3>
            ${networkData.map(node => `
              <div style="background: #374151; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid ${
                node.threatScore >= 80 ? '#dc2626' : 
                node.threatScore >= 50 ? '#d97706' : '#059669'
              }">
                <strong>${node.label}</strong><br>
                <span style="color: #9ca3af;">Threat Score: ${node.threatScore}</span><br>
                <span style="color: #3b82f6;">Connections: ${node.connections}</span><br>
                <span style="color: #10b981;">Group: ${node.group.replace('_', ' ').toUpperCase()}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      
      const success = await exportToPDF(
        'PINDAR Network Analysis Report',
        tempDiv.innerHTML,
        `pindar_network_analysis_${new Date().toISOString().split('T')[0]}`
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

  const handleCloseDetails = () => {
    setSelectedNode(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Network Analysis</h1>
          <p className="text-secondary-400">
            Visualize connections and relationships between suspicious accounts and entities
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleExportNetworkData}
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

      {/* Network Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-white mb-2">{networkData.length}</div>
          <div className="text-secondary-400">Total Nodes</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-danger-500 mb-2">{riskStats.highRisk}</div>
          <div className="text-secondary-400">High Risk</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-warning-500 mb-2">{riskStats.mediumRisk}</div>
          <div className="text-secondary-400">Medium Risk</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-success-500 mb-2">{riskStats.lowRisk}</div>
          <div className="text-secondary-400">Low Risk</div>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
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
          {selectedNode && (
            <button 
              onClick={handleCloseDetails}
              className="btn-secondary flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Hide Details</span>
            </button>
          )}
        </div>
      </div>

      {/* Network Visualization */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Suspicious Network Connections</h3>
        <div className="relative">
          {positionedNodes.length === 0 && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-secondary-400">No network data available</p>
                <p className="text-sm text-secondary-500">Network connections will appear here when data is loaded</p>
              </div>
            </div>
          )}
          
          <canvas
            ref={canvasRef}
            width="800"
            height="800"
            className="border border-secondary-600 rounded-lg bg-secondary-900 w-full"
            style={{ 
              display: positionedNodes.length === 0 ? 'none' : 'block',
              minHeight: '800px'
            }}
            onMouseMove={handleCanvasMouseMove}
            onClick={handleCanvasClick}
            onMouseLeave={handleCanvasMouseLeave}
          />
          
                     {/* Legend */}
           <div className="absolute top-4 right-4 bg-secondary-800 p-4 rounded-lg border border-secondary-600">
            <h4 className="text-sm font-medium text-white mb-3">Network Legend</h4>
            <div className="space-y-3">
              <div>
                <h5 className="text-xs font-medium text-secondary-300 mb-2">Risk Levels</h5>
             <div className="space-y-2">
               <div className="flex items-center space-x-2">
                 <div className="w-3 h-3 bg-danger-500 rounded-full"></div>
                    <span className="text-xs text-secondary-300">High Risk (80+)</span>
               </div>
               <div className="flex items-center space-x-2">
                 <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
                    <span className="text-xs text-secondary-300">Medium Risk (50-79)</span>
               </div>
               <div className="flex items-center space-x-2">
                 <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                    <span className="text-xs text-secondary-300">Low Risk (&lt;50)</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-secondary-600 pt-2">
                <h5 className="text-xs font-medium text-secondary-300 mb-2">Connection Types</h5>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-1 bg-blue-500"></div>
                    <span className="text-xs text-secondary-300">Group (Same Cluster)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-1 bg-red-500"></div>
                    <span className="text-xs text-secondary-300">High Risk Cross-Group</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-1 bg-orange-500"></div>
                    <span className="text-xs text-secondary-300">Risk Similarity</span>
                  </div>
                </div>
               </div>
             </div>
           </div>
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Node Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-medium mb-2">Basic Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-secondary-400">Name:</span>
                  <span className="text-white">{selectedNode.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-400">Threat Score:</span>
                  <span className={`font-semibold ${
                    selectedNode.threatScore >= 80 ? 'text-danger-500' :
                    selectedNode.threatScore >= 50 ? 'text-warning-500' : 'text-success-500'
                  }`}>
                    {selectedNode.threatScore}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-400">Connections:</span>
                  <span className="text-white">{selectedNode.connections}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-400">Risk Level:</span>
                  <span className={`badge ${
                    selectedNode.threatScore >= 80 ? 'badge-danger' :
                    selectedNode.threatScore >= 50 ? 'badge-warning' : 'badge-success'
                  }`}>
                    {selectedNode.threatScore >= 80 ? 'High' : selectedNode.threatScore >= 50 ? 'Medium' : 'Low'}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-2">Network Analysis</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-secondary-400">Centrality:</span>
                  <span className="text-white">{(selectedNode.connections / Math.max(...networkData.map(n => n.connections)) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-400">Cluster:</span>
                  <span className="text-white">{selectedNode.group.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-400">Influence:</span>
                  <span className="text-white">{selectedNode.threatScore >= 80 ? 'High' : selectedNode.threatScore >= 50 ? 'Medium' : 'Low'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-secondary-600">
            <button 
              onClick={handleCloseDetails}
              className="btn-secondary"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* Network Insights */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Network Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-3">Network Statistics</h4>
            <div className="space-y-2 text-secondary-300">
              <div className="flex justify-between">
                <span>Total Nodes:</span>
                <span className="text-white">{networkData.length}</span>
              </div>
              <div className="flex justify-between">
                <span>High Risk Nodes:</span>
                <span className="text-white">{riskStats.highRisk}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Connections:</span>
                <span className="text-white">
                  {(networkData.reduce((sum, n) => sum + n.connections, 0) / networkData.length).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-3">Risk Distribution</h4>
            <div className="space-y-2 text-secondary-300">
              <div className="flex justify-between">
                <span>High Risk:</span>
                <span className="text-danger-500 font-semibold">{riskStats.highRisk}</span>
              </div>
              <div className="flex justify-between">
                <span>Medium Risk:</span>
                <span className="text-warning-500 font-semibold">{riskStats.mediumRisk}</span>
              </div>
              <div className="flex justify-between">
                <span>Low Risk:</span>
                <span className="text-success-500 font-semibold">{riskStats.lowRisk}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkAnalysis; 