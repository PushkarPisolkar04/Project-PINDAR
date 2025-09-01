import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef } from 'react';

// Mock data generation functions
const generateRandomThreat = () => {
  const platforms = ['Telegram', 'WhatsApp', 'Instagram'];
  const drugTypes = ['MDMA', 'LSD', 'Mephedrone', 'Cocaine', 'Heroin', 'Methamphetamine'];
  const locations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'];
  const usernames = ['dealer_xyz', 'supplier_123', 'gear_master', 'party_supplies', 'elite_dealer', 'premium_supplier'];
  const phoneNumbers = ['+91-98765-43210', '+91-87654-32109', '+91-76543-21098', '+91-65432-10987'];
  const emailAddresses = ['dealer@protonmail.com', 'supplier@tutanota.com', 'gear@mail.com', 'party@email.com'];
  const upiIds = ['dealer@upi', 'supplier@paytm', 'gear@okicici', 'party@phonepe'];
  
  return {
    id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    content: `Looking for ${drugTypes[Math.floor(Math.random() * drugTypes.length)]} in ${locations[Math.floor(Math.random() * locations.length)]}`,
    username: usernames[Math.floor(Math.random() * usernames.length)],
    threatScore: Math.floor(Math.random() * 40) + 60, // 60-100 range
    timestamp: new Date().toISOString(),
    status: 'active',
    type: 'drug_sale',
    location: locations[Math.floor(Math.random() * locations.length)],
    riskLevel: 'high',
    // Enhanced suspect information
    suspectInfo: {
      fullName: `${usernames[Math.floor(Math.random() * usernames.length)].replace('_', ' ')}`,
      phoneNumber: phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)],
      email: emailAddresses[Math.floor(Math.random() * emailAddresses.length)],
      upiId: upiIds[Math.floor(Math.random() * upiIds.length)],
      lastSeen: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Last 24 hours
      accountAge: Math.floor(Math.random() * 365) + 1, // Days
      followers: Math.floor(Math.random() * 1000) + 50,
      posts: Math.floor(Math.random() * 500) + 10,
      verified: Math.random() > 0.8, // 20% chance of verified account
      botDetected: Math.random() > 0.7, // 30% chance of bot
      crossPlatform: Math.random() > 0.6, // 40% chance of cross-platform activity
      languages: ['English', 'Hindi', 'Marathi'].slice(0, Math.floor(Math.random() * 3) + 1),
      interests: ['Party', 'Music', 'Travel', 'Fashion'].slice(0, Math.floor(Math.random() * 3) + 1)
    },
    // Network connections
    connections: Math.floor(Math.random() * 5) + 1,
    relatedAccounts: [],
    // Content analysis
    keywords: drugTypes[Math.floor(Math.random() * drugTypes.length)].split(' '),
    sentiment: Math.random() > 0.5 ? 'negative' : 'neutral',
    urgency: Math.random() > 0.7 ? 'high' : 'medium'
  };
};

const generateRandomAlert = () => {
  const alertTypes = ['New Threat Detected', 'High Risk Account', 'Bot Activity', 'Suspicious Content', 'Cross-Platform Activity'];
  const platforms = ['Telegram', 'WhatsApp', 'Instagram'];
  const usernames = ['dealer_xyz', 'supplier_123', 'gear_master', 'party_supplies', 'elite_dealer', 'premium_supplier'];
  
  return {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
    message: `New ${alertTypes[Math.floor(Math.random() * alertTypes.length)].toLowerCase()} detected on ${platforms[Math.floor(Math.random() * platforms.length)]}`,
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    username: usernames[Math.floor(Math.random() * usernames.length)],
    threatScore: Math.floor(Math.random() * 40) + 60,
    timestamp: new Date().toISOString(),
    status: 'unread',
    priority: Math.random() > 0.5 ? 'high' : 'medium',
    // Enhanced alert information
    details: {
      accountType: Math.random() > 0.7 ? 'bot' : 'human',
      contentLength: Math.floor(Math.random() * 200) + 50,
      hashtags: Math.floor(Math.random() * 5) + 1,
      mentions: Math.floor(Math.random() * 3),
      links: Math.floor(Math.random() * 2),
      images: Math.floor(Math.random() * 3)
    }
  };
};

const generateRandomNetworkNode = () => {
  const groups = ['telegram_group', 'whatsapp_network', 'instagram_handles', 'cross_platform', 'bot_network'];
  const labels = ['Elite Supplier', 'Premium Dealer', 'Gear Master', 'Party Supplies', 'Mumbai Gear', 'Delhi Supplier'];
  
  return {
    id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    label: labels[Math.floor(Math.random() * labels.length)],
    group: groups[Math.floor(Math.random() * groups.length)],
    threatScore: Math.floor(Math.random() * 50) + 50, // 50-100 range
    connections: Math.floor(Math.random() * 5) + 1,
    platform: ['Telegram', 'WhatsApp', 'Instagram'][Math.floor(Math.random() * 3)],
    lastActivity: new Date().toISOString(),
    // Enhanced node information
    metadata: {
      phoneNumber: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      email: `user${Math.floor(Math.random() * 1000)}@example.com`,
      upiId: `user${Math.floor(Math.random() * 1000)}@upi`,
      location: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai'][Math.floor(Math.random() * 4)],
      accountAge: Math.floor(Math.random() * 1000) + 1,
      followers: Math.floor(Math.random() * 5000) + 100,
      posts: Math.floor(Math.random() * 1000) + 20
    }
  };
};

const initialState = {
  threats: [],
  alerts: [],
  networkData: [],
  metrics: {
    activeThreats: 0,
    highRiskThreats: 0,
    mediumRiskThreats: 0,
    lowRiskThreats: 0,
    platformsMonitored: 3,
    botsDetected: 0,
    avgThreatScore: 0
  }
};

const threatReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_THREAT':
      // Check if threat with same ID already exists
      if (state.threats.some(threat => threat.id === action.payload.id)) {
        return state; // Don't add duplicate
      }
      return {
        ...state,
        threats: [action.payload, ...state.threats],
        metrics: {
          ...state.metrics,
          activeThreats: state.threats.length + 1,
          highRiskThreats: action.payload.threatScore >= 80 ? state.metrics.highRiskThreats + 1 : state.metrics.highRiskThreats,
          mediumRiskThreats: action.payload.threatScore >= 50 && action.payload.threatScore < 80 ? state.metrics.mediumRiskThreats + 1 : state.metrics.mediumRiskThreats,
          lowRiskThreats: action.payload.threatScore < 50 ? state.metrics.lowRiskThreats + 1 : state.metrics.lowRiskThreats,
          avgThreatScore: Math.round((state.metrics.avgThreatScore * state.threats.length + action.payload.threatScore) / (state.threats.length + 1))
        }
      };
    
    case 'ADD_ALERT':
      // Check if alert with same ID already exists
      if (state.alerts.some(alert => alert.id === action.payload.id)) {
        return state; // Don't add duplicate
      }
      return {
        ...state,
        alerts: [action.payload, ...state.alerts]
      };
    
    case 'ADD_NETWORK_NODE':
      // Check if node with same ID already exists
      if (state.networkData.some(node => node.id === action.payload.id)) {
        return state; // Don't add duplicate
      }
      return {
        ...state,
        networkData: [...state.networkData, action.payload]
      };
    
    case 'UPDATE_METRICS':
      return {
        ...state,
        metrics: {
          ...state.metrics,
          ...action.payload,
          // Ensure critical values never go below their minimum
          activeThreats: Math.max(action.payload.activeThreats || state.metrics.activeThreats, state.metrics.activeThreats),
          highRiskThreats: Math.max(action.payload.highRiskThreats || state.metrics.highRiskThreats, 0),
          mediumRiskThreats: Math.max(action.payload.mediumRiskThreats || state.metrics.mediumRiskThreats, 0),
          lowRiskThreats: Math.max(action.payload.lowRiskThreats || state.metrics.lowRiskThreats, 0),
          botsDetected: Math.max(action.payload.botsDetected || state.metrics.botsDetected, 2),
          platformsMonitored: Math.max(action.payload.platformsMonitored || state.metrics.platformsMonitored, 3)
        }
      };
    
    case 'CLEAR_ALERT':
      return {
        ...state,
        alerts: state.alerts.map(alert => 
          alert.id === action.payload ? { ...alert, status: 'read' } : alert
        )
      };
    
    case 'CLEAR_THREAT':
      return {
        ...state,
        threats: state.threats.map(threat => 
          threat.id === action.payload ? { ...threat, status: 'resolved' } : threat
        )
      };
    
    default:
      return state;
  }
};

const ThreatContext = createContext();

export const ThreatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(threatReducer, initialState);
  const isInitialized = useRef(false);

  // Mock data arrays wrapped in useMemo
  const mockThreats = useMemo(() => [
    {
      id: 'threat_1_initial_001',
      platform: 'Telegram',
      content: 'Looking for MDMA in Mumbai area. DM for details.',
      username: 'elite_supplies',
      threatScore: 96,
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      status: 'active',
      type: 'drug_sale',
      location: 'Mumbai',
      riskLevel: 'high',
      suspectInfo: {
        fullName: 'Elite Supplies',
        phoneNumber: '+91-98765-43210',
        email: 'elite@protonmail.com',
        upiId: 'elite@upi',
        lastSeen: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        accountAge: 180,
        followers: 1250,
        posts: 450,
        verified: false,
        botDetected: false,
        crossPlatform: true,
        languages: ['English', 'Hindi'],
        interests: ['Party', 'Music']
      },
      connections: 4,
      relatedAccounts: [],
      keywords: ['MDMA', 'Mumbai'],
      sentiment: 'negative',
      urgency: 'high'
    },
    {
      id: 'threat_2_initial_002',
      platform: 'WhatsApp',
      content: 'Premium quality party supplies available. Contact for prices.',
      username: 'premium_supplier',
      threatScore: 89,
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      status: 'active',
      type: 'drug_sale',
      location: 'Delhi',
      riskLevel: 'high',
      suspectInfo: {
        fullName: 'Premium Supplier',
        phoneNumber: '+91-87654-32109',
        email: 'premium@tutanota.com',
        upiId: 'premium@paytm',
        lastSeen: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        accountAge: 365,
        followers: 2100,
        posts: 780,
        verified: true,
      botDetected: false,
        crossPlatform: true,
        languages: ['English', 'Hindi'],
        interests: ['Party', 'Fashion']
      },
      connections: 3,
      relatedAccounts: [],
      keywords: ['Premium', 'Party', 'Supplies'],
      sentiment: 'negative',
      urgency: 'high'
    },
    {
      id: 'threat_3_initial_003',
      platform: 'Instagram',
      content: 'Gear available. Stories updated regularly.',
      username: 'party_gear_india',
      threatScore: 82,
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      status: 'active',
      type: 'drug_sale',
      location: 'Bangalore',
      riskLevel: 'medium',
      suspectInfo: {
        fullName: 'Party Gear India',
        phoneNumber: '+91-76543-21098',
        email: 'gear@mail.com',
        upiId: 'gear@okicici',
        lastSeen: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        accountAge: 120,
        followers: 890,
        posts: 320,
        verified: false,
      botDetected: true,
        crossPlatform: false,
        languages: ['English'],
        interests: ['Party', 'Travel']
      },
      connections: 2,
      relatedAccounts: [],
      keywords: ['Gear', 'Available'],
      sentiment: 'negative',
      urgency: 'medium'
    },
    {
      id: 'threat_4_initial_004',
      platform: 'Telegram',
      content: 'Mumbai area delivery. Fast and reliable.',
      username: 'mumbai_gear',
      threatScore: 78,
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      status: 'active',
      type: 'drug_sale',
      location: 'Mumbai',
      riskLevel: 'medium',
      suspectInfo: {
        fullName: 'Mumbai Gear',
        phoneNumber: '+91-65432-10987',
        email: 'party@email.com',
        upiId: 'party@phonepe',
        lastSeen: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        accountAge: 90,
        followers: 650,
        posts: 180,
        verified: false,
      botDetected: false,
        crossPlatform: true,
        languages: ['Hindi', 'Marathi'],
        interests: ['Music', 'Fashion']
      },
      connections: 3,
      relatedAccounts: [],
      keywords: ['Mumbai', 'Delivery', 'Fast'],
      sentiment: 'negative',
      urgency: 'medium'
    }
  ], []);

  const mockAlerts = useMemo(() => [
    {
      id: 'alert_1_initial_001',
      type: 'New Threat Detected',
      message: 'High-risk account detected on Telegram',
      platform: 'Telegram',
      username: 'elite_supplies',
      threatScore: 96,
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      status: 'unread',
      priority: 'high',
      details: {
        accountType: 'human',
        contentLength: 150,
        hashtags: 3,
        mentions: 2,
        links: 1,
        images: 2
      }
    },
    {
      id: 'alert_2_initial_002',
      type: 'Bot Activity',
      message: 'Automated posting detected on Instagram',
      platform: 'Instagram',
      username: 'party_gear_india',
      threatScore: 82,
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      status: 'unread',
      priority: 'medium',
      details: {
        accountType: 'bot',
        contentLength: 80,
        hashtags: 5,
        mentions: 0,
        links: 2,
        images: 3
      }
    }
  ], []);

  const mockNetworkData = useMemo(() => [
    {
      id: 'node_1_initial_001',
      label: 'Elite Supplies',
      group: 'telegram_group',
      threatScore: 96,
      connections: 4,
      platform: 'Telegram',
      lastActivity: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      metadata: {
        phoneNumber: '+91-98765-43210',
        email: 'elite@protonmail.com',
        upiId: 'elite@upi',
        location: 'Mumbai',
        accountAge: 180,
        followers: 1250,
        posts: 450
      }
    },
    {
      id: 'node_2_initial_002',
      label: 'Premium Supplier',
      group: 'whatsapp_network',
      threatScore: 89,
      connections: 3,
      platform: 'WhatsApp',
      lastActivity: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      metadata: {
        phoneNumber: '+91-87654-32109',
        email: 'premium@tutanota.com',
        upiId: 'premium@paytm',
        location: 'Delhi',
        accountAge: 365,
        followers: 2100,
        posts: 780
      }
    },
    {
      id: 'node_3_initial_003',
      label: 'Party Gear India',
      group: 'instagram_handles',
      threatScore: 82,
      connections: 2,
      platform: 'Instagram',
      lastActivity: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      metadata: {
        phoneNumber: '+91-76543-21098',
        email: 'gear@mail.com',
        upiId: 'gear@okicici',
        location: 'Bangalore',
        accountAge: 120,
        followers: 890,
        posts: 320
      }
    },
    {
      id: 'node_4_initial_004',
      label: 'Mumbai Gear',
      group: 'telegram_group',
      threatScore: 78,
      connections: 3,
      platform: 'Telegram',
      lastActivity: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      metadata: {
        phoneNumber: '+91-65432-10987',
        email: 'party@email.com',
        upiId: 'party@phonepe',
        location: 'Mumbai',
        accountAge: 90,
        followers: 650,
        posts: 180
      }
    },
    {
      id: 'node_5_initial_005',
      label: 'Delhi Supplier',
      group: 'cross_platform',
      threatScore: 45,
      connections: 1,
      platform: 'WhatsApp',
      lastActivity: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      metadata: {
        phoneNumber: '+91-54321-09876',
        email: 'delhi@email.com',
        upiId: 'delhi@upi',
        location: 'Delhi',
        accountAge: 45,
        followers: 320,
        posts: 95
      }
    }
  ], []);

  // Initialize with mock data
  useEffect(() => {
    if (!isInitialized.current) {
      // Add initial mock data
      mockThreats.forEach(threat => dispatch({ type: 'ADD_THREAT', payload: threat }));
      mockAlerts.forEach(alert => dispatch({ type: 'ADD_ALERT', payload: alert }));
      mockNetworkData.forEach(node => dispatch({ type: 'ADD_NETWORK_NODE', payload: node }));
      
      // Update initial metrics - ensure they never start at 0
      const highRisk = mockThreats.filter(t => t.threatScore >= 80).length;
      const mediumRisk = mockThreats.filter(t => t.threatScore >= 50 && t.threatScore < 80).length;
      const lowRisk = mockThreats.filter(t => t.threatScore < 50).length;
      const avgScore = Math.round(mockThreats.reduce((sum, t) => sum + t.threatScore, 0) / mockThreats.length);
      
      // Set initial metrics immediately after adding threats
      setTimeout(() => {
    dispatch({
          type: 'UPDATE_METRICS',
      payload: {
        activeThreats: mockThreats.length,
        highRiskThreats: highRisk,
        mediumRiskThreats: mediumRisk,
            lowRiskThreats: lowRisk,
            avgThreatScore: avgScore,
            botsDetected: 2,
            platformsMonitored: 3
          }
        });
      }, 100); // Small delay to ensure threats are added first
      
      isInitialized.current = true;
    }
  }, [mockThreats, mockAlerts, mockNetworkData]);

  // Auto-generate new threats and alerts for demonstration
  useEffect(() => {
    const threatInterval = setInterval(() => {
      // Only add new threats if we have less than 15 total threats (to keep it manageable)
      if (state.threats.length < 15) {
        const newThreat = generateRandomThreat();
        // Ensure unique ID by adding timestamp
        newThreat.id = `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        dispatch({ type: 'ADD_THREAT', payload: newThreat });
        
        // Also create an alert for the new threat
        const newAlert = generateRandomAlert();
        // Ensure unique ID by adding timestamp
        newAlert.id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        dispatch({ type: 'ADD_ALERT', payload: newAlert });
        
        // Occasionally add new network nodes (but limit to 10 total)
        if (state.networkData.length < 10 && Math.random() < 0.3) {
          const newNode = generateRandomNetworkNode();
          // Ensure unique ID by adding timestamp
          newNode.id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          dispatch({ type: 'ADD_NETWORK_NODE', payload: newNode });
        }
      }
    }, 10000); // New threat every 10 seconds (slower for video recording)

    const metricsInterval = setInterval(() => {
      // Get current state for metrics calculation
      const currentThreats = state.threats.filter(t => t.status === 'active');
      const highRisk = currentThreats.filter(t => t.threatScore >= 80).length;
      const mediumRisk = currentThreats.filter(t => t.threatScore >= 50 && t.threatScore < 80).length;
      const lowRisk = currentThreats.filter(t => t.threatScore < 50).length;
      const avgScore = currentThreats.length > 0 
        ? Math.round(currentThreats.reduce((sum, t) => sum + t.threatScore, 0) / currentThreats.length)
        : 0;

      dispatch({
        type: 'UPDATE_METRICS',
        payload: {
          activeThreats: currentThreats.length,
          highRiskThreats: highRisk,
          mediumRiskThreats: mediumRisk,
          lowRiskThreats: lowRisk,
          avgThreatScore: avgScore,
          platformsMonitored: 3,
          botsDetected: Math.floor(Math.random() * 5) + 1
        }
      });
    }, 8000); // Update metrics every 8 seconds

    return () => {
      clearInterval(threatInterval);
      clearInterval(metricsInterval);
    };
  }, [state.threats, state.networkData.length]); // Added missing dependency

  const addThreat = useCallback((threat) => {
    dispatch({ type: 'ADD_THREAT', payload: threat });
  }, []);

  const addAlert = useCallback((alert) => {
    dispatch({ type: 'ADD_ALERT', payload: alert });
  }, []);

  const clearAlert = useCallback((alertId) => {
    dispatch({ type: 'CLEAR_ALERT', payload: alertId });
  }, []);

  const clearThreat = useCallback((threatId) => {
    dispatch({ type: 'CLEAR_THREAT', payload: threatId });
  }, []);

  const clearAllAlerts = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_ALERTS' });
  }, []);

  const clearAllThreats = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_THREATS' });
  }, []);

  const resetMetrics = useCallback(() => {
    dispatch({
      type: 'UPDATE_METRICS',
      payload: {
        activeThreats: 0,
        highRiskThreats: 0,
        mediumRiskThreats: 0,
        lowRiskThreats: 0,
        avgThreatScore: 0,
        botsDetected: 0
      }
    });
  }, []);

  const value = {
    threats: state.threats,
    alerts: state.alerts,
    networkData: state.networkData,
    metrics: state.metrics,
    addThreat,
    addAlert,
    clearAlert,
    clearThreat,
    clearAllAlerts,
    clearAllThreats,
    resetMetrics
  };

  return (
    <ThreatContext.Provider value={value}>
      {children}
    </ThreatContext.Provider>
  );
};

export const useThreat = () => {
  const context = useContext(ThreatContext);
  if (!context) {
    throw new Error('useThreat must be used within a ThreatProvider');
  }
  return context;
}; 