import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// PDF Export utility functions
export const exportToPDF = async (title, content, filename) => {
  try {
    // Create a temporary div to render the content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '800px';
    tempDiv.style.backgroundColor = '#1f2937';
    tempDiv.style.color = '#ffffff';
    tempDiv.style.padding = '20px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '12px';
    tempDiv.style.lineHeight = '1.5';
    
    document.body.appendChild(tempDiv);

    // Convert to canvas
    const canvas = await html2canvas(tempDiv, {
      backgroundColor: '#1f2937',
      width: 800,
      height: tempDiv.scrollHeight,
      scale: 2
    });

    // Remove temporary div
    document.body.removeChild(tempDiv);

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Add title
    pdf.setFontSize(20);
    pdf.setTextColor(59, 130, 246); // Primary blue color
    pdf.text(title, pdfWidth / 2, 20, { align: 'center' });
    
    // Add timestamp
    pdf.setFontSize(10);
    pdf.setTextColor(156, 163, 175); // Gray color
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, pdfWidth / 2, 30, { align: 'center' });
    
    // Add content image
    const imgWidth = pdfWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    if (imgHeight > pdfHeight - 40) {
      // Content is too long, split into multiple pages
      let heightLeft = imgHeight;
      
      while (heightLeft >= pdfHeight - 40) {
        pdf.addImage(imgData, 'PNG', 10, 40, imgWidth, imgHeight, '', 'FAST');
        heightLeft -= (pdfHeight - 40);
        
        if (heightLeft > 0) {
          pdf.addPage();
        }
      }
      
      if (heightLeft > 0) {
        pdf.addImage(imgData, 'PNG', 10, 40, imgWidth, imgHeight, '', 'FAST');
      }
    } else {
      // Content fits on one page
      pdf.addImage(imgData, 'PNG', 10, 40, imgWidth, imgHeight);
    }
    
    // Save PDF
    pdf.save(`${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('PDF export error:', error);
    return false;
  }
};

// Generate comprehensive Dashboard PDF content
export const generateDashboardContent = (metrics, threats) => {
  return `
    <div style="font-family: Arial, sans-serif;">
      <h2 style="color: #3b82f6; margin-bottom: 20px;">PINDAR Intelligence Dashboard Report</h2>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #f59e0b; margin-bottom: 10px;">Executive Summary</h3>
        <div style="background: #374151; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 0; line-height: 1.6;">
            This intelligence report provides a comprehensive overview of current threat activities 
            across monitored social media platforms. The system has detected ${metrics.activeThreats} active threats 
            with an average threat score of ${metrics.avgThreatScore}. ${metrics.highRiskThreats} high-risk threats 
            require immediate attention. This report includes complete analysis of all ${threats.length} detected threats.
          </p>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #f59e0b; margin-bottom: 10px;">Key Metrics Overview</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px;">
          <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
            <strong style="color: #ef4444;">Active Threats:</strong><br>
            <span style="font-size: 24px; color: #ffffff;">${metrics.activeThreats}</span><br>
            <small style="color: #9ca3af;">Currently monitored</small>
          </div>
          <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
            <strong style="color: #f59e0b;">Platforms:</strong><br>
            <span style="font-size: 24px; color: #ffffff;">${metrics.platformsMonitored}</span><br>
            <small style="color: #9ca3af;">Telegram, WhatsApp, Instagram</small>
          </div>
          <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
            <strong style="color: #10b981;">Bots Detected:</strong><br>
            <span style="font-size: 24px; color: #ffffff;">${metrics.botsDetected}</span><br>
            <small style="color: #9ca3af;">Automated accounts</small>
          </div>
          <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
            <strong style="color: #3b82f6;">Avg Score:</strong><br>
            <span style="font-size: 24px; color: #ffffff;">${metrics.avgThreatScore}</span><br>
            <small style="color: #9ca3af;">Threat assessment</small>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #ef4444; margin-bottom: 10px;">Risk Assessment Breakdown</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
          <div style="background: #dc2626; padding: 15px; border-radius: 8px; text-align: center; border: 2px solid #ef4444;">
            <strong style="color: #ffffff;">HIGH RISK</strong><br>
            <span style="font-size: 28px; color: #ffffff;">${metrics.highRiskThreats}</span><br>
            <small style="color: #fecaca;">Threat Score: 80+</small><br>
            <small style="color: #fecaca;">Immediate action required</small>
          </div>
          <div style="background: #d97706; padding: 15px; border-radius: 8px; text-align: center; border: 2px solid #f59e0b;">
            <strong style="color: #ffffff;">MEDIUM RISK</strong><br>
            <span style="font-size: 28px; color: #ffffff;">${metrics.mediumRiskThreats}</span><br>
            <small style="color: #fed7aa;">Threat Score: 50-79</small><br>
            <small style="color: #fed7aa;">Monitor closely</small>
          </div>
          <div style="background: #059669; padding: 15px; border-radius: 8px; text-align: center; border: 2px solid #10b981;">
            <strong style="color: #ffffff;">LOW RISK</strong><br>
            <span style="font-size: 28px; color: #ffffff;">${metrics.lowRiskThreats}</span><br>
            <small style="color: #a7f3d0;">Threat Score: &lt;50</small><br>
            <small style="color: #a7f3d0;">Routine monitoring</small>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #10b981; margin-bottom: 10px;">Complete Threat Analysis</h3>
        ${threats.map((threat, index) => `
          <div style="background: #374151; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${
            threat.threatScore >= 80 ? '#dc2626' : 
            threat.threatScore >= 50 ? '#d97706' : '#059669'
          }">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <strong style="color: #ffffff; font-size: 16px;">#${index + 1} ${threat.username}</strong>
              <span style="background: ${
                threat.threatScore >= 80 ? '#dc2626' : 
                threat.threatScore >= 50 ? '#d97706' : '#059669'
              }; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                Score: ${threat.threatScore}
              </span>
            </div>
            <div style="color: #9ca3af; margin-bottom: 8px;">
              <strong>Platform:</strong> ${threat.platform} | 
              <strong>Location:</strong> ${threat.location} | 
              <strong>Type:</strong> ${threat.type.replace('_', ' ').toUpperCase()}
            </div>
            <div style="color: #d1d5db; font-style: italic; margin-bottom: 8px;">
              "${threat.content}"
            </div>
            <div style="color: #6b7280; font-size: 11px;">
              <strong>Detected:</strong> ${new Date(threat.timestamp).toLocaleString()} | 
              <strong>Status:</strong> ${threat.status.toUpperCase()}
            </div>
          </div>
        `).join('')}
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #8b5cf6; margin-bottom: 10px;">Intelligence Insights</h3>
        <div style="background: #374151; padding: 15px; border-radius: 8px;">
          <ul style="margin: 0; padding-left: 20px; color: #d1d5db;">
            <li style="margin-bottom: 8px;">${metrics.highRiskThreats > 0 ? `Immediate investigation required for ${metrics.highRiskThreats} high-risk threats` : 'No high-risk threats currently detected'}</li>
            <li style="margin-bottom: 8px;">Platform distribution shows ${threats.filter(t => t.platform === 'Telegram').length} threats on Telegram, ${threats.filter(t => t.platform === 'WhatsApp').length} on WhatsApp, and ${threats.filter(t => t.platform === 'Instagram').length} on Instagram</li>
            <li style="margin-bottom: 8px;">${metrics.botsDetected} automated accounts detected, indicating potential organized activity</li>
            <li style="margin-bottom: 8px;">Geographic spread covers ${[...new Set(threats.map(t => t.location))].length} major cities across India</li>
          </ul>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #f59e0b; margin-bottom: 10px;">Recommendations</h3>
        <div style="background: #374151; padding: 15px; border-radius: 8px;">
          <ol style="margin: 0; padding-left: 20px; color: #d1d5db;">
            <li style="margin-bottom: 8px;">Prioritize investigation of threats with scores above 80 (${metrics.highRiskThreats} cases)</li>
            <li style="margin-bottom: 8px;">Focus monitoring efforts on ${threats.reduce((acc, t) => { acc[t.platform] = (acc[t.platform] || 0) + 1; return acc; }, {}).Telegram > 0 ? 'Telegram' : threats.reduce((acc, t) => { acc[t.platform] = (acc[t.platform] || 0) + 1; return acc; }, {}).WhatsApp > 0 ? 'WhatsApp' : 'Instagram'} channels showing highest activity</li>
            <li style="margin-bottom: 8px;">Implement enhanced bot detection for automated threats</li>
            <li style="margin-bottom: 8px;">Coordinate with local law enforcement in ${[...new Set(threats.map(t => t.location))].slice(0, 3).join(', ')} areas</li>
          </ol>
        </div>
      </div>
      
      <div style="background: #1f2937; padding: 15px; border-radius: 8px; border: 1px solid #374151;">
        <p style="margin: 0; text-align: center; color: #9ca3af; font-size: 11px;">
          <strong>PINDAR Intelligence Platform</strong> | 
          Report generated automatically | 
          For official use only | 
          Classification: Law Enforcement Sensitive
        </p>
      </div>
    </div>
  `;
};

export const generateThreatAnalyticsContent = (metrics, threats, platformActivity, riskLevelBreakdown) => {
  return `
    <div style="font-family: Arial, sans-serif;">
      <h2 style="color: #3b82f6; margin-bottom: 20px;">PINDAR Threat Analytics Report</h2>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #f59e0b; margin-bottom: 10px;">Executive Summary</h3>
        <div style="background: #374151; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 0; line-height: 1.6;">
            This threat analytics report provides detailed insights into current threat patterns, 
            platform distribution, and risk assessment across monitored social media networks. 
            Analysis covers all ${threats.length} threats with comprehensive scoring and categorization.
          </p>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #f59e0b; margin-bottom: 10px;">Comprehensive Threat Statistics</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px;">
          <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
            <strong style="color: #ef4444;">Total Threats:</strong><br>
            <span style="font-size: 24px; color: #ffffff;">${metrics.activeThreats}</span><br>
            <small style="color: #9ca3af;">Currently active</small>
          </div>
          <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
            <strong style="color: #dc2626;">High Risk:</strong><br>
            <span style="font-size: 24px; color: #ffffff;">${metrics.highRiskThreats}</span><br>
            <small style="color: #fecaca;">Score 80+</small>
          </div>
          <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
            <strong style="color: #d97706;">Medium Risk:</strong><br>
            <span style="font-size: 24px; color: #ffffff;">${metrics.mediumRiskThreats}</span><br>
            <small style="color: #fed7aa;">Score 50-79</small>
          </div>
          <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
            <strong style="color: #059669;">Low Risk:</strong><br>
            <span style="font-size: 24px; color: #ffffff;">${metrics.lowRiskThreats}</span><br>
            <small style="color: #a7f3d0;">Score &lt;50</small>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #ef4444; margin-bottom: 10px;">Platform Activity Analysis</h3>
        <div style="background: #374151; padding: 15px; border-radius: 8px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
            <div style="text-align: center;">
              <strong style="color: #3b82f6;">Telegram</strong><br>
              <span style="font-size: 20px; color: #ffffff;">${threats.filter(t => t.platform === 'Telegram').length}</span><br>
              <small style="color: #9ca3af;">Threats detected</small>
            </div>
            <div style="text-align: center;">
              <strong style="color: #10b981;">WhatsApp</strong><br>
              <span style="font-size: 20px; color: #ffffff;">${threats.filter(t => t.platform === 'WhatsApp').length}</span><br>
              <small style="color: #9ca3af;">Threats detected</small>
            </div>
            <div style="text-align: center;">
              <strong style="color: #f59e0b;">Instagram</strong><br>
              <span style="font-size: 20px; color: #ffffff;">${threats.filter(t => t.platform === 'Instagram').length}</span><br>
              <small style="color: #9ca3af;">Threats detected</small>
            </div>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #10b981; margin-bottom: 10px;">Complete Threat Analysis by Risk Score</h3>
        ${threats.sort((a, b) => b.threatScore - a.threatScore).map((threat, index) => `
          <div style="background: #374151; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${
            threat.threatScore >= 80 ? '#dc2626' : 
            threat.threatScore >= 50 ? '#d97706' : '#059669'
          }">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <strong style="color: #ffffff; font-size: 16px;">#${index + 1} ${threat.username}</strong>
              <span style="background: ${
                threat.threatScore >= 80 ? '#dc2626' : 
                threat.threatScore >= 50 ? '#d97706' : '#059669'
              }; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                Score: ${threat.threatScore}
              </span>
            </div>
            <div style="color: #9ca3af; margin-bottom: 8px;">
              <strong>Platform:</strong> ${threat.platform} | 
              <strong>Location:</strong> ${threat.location} | 
              <strong>Type:</strong> ${threat.type.replace('_', ' ').toUpperCase()}
            </div>
            <div style="color: #d1d5db; font-style: italic; margin-bottom: 8px;">
              "${threat.content}"
            </div>
            <div style="color: #6b7280; font-size: 11px;">
              <strong>Detected:</strong> ${new Date(threat.timestamp).toLocaleString()} | 
              <strong>Status:</strong> ${threat.status.toUpperCase()}
            </div>
          </div>
        `).join('')}
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #8b5cf6; margin-bottom: 10px;">Analytical Insights</h3>
        <div style="background: #374151; padding: 15px; border-radius: 8px;">
          <ul style="margin: 0; padding-left: 20px; color: #d1d5db;">
            <li style="margin-bottom: 8px;">Average threat score: ${metrics.avgThreatScore} (${metrics.avgThreatScore >= 70 ? 'High risk environment' : metrics.avgThreatScore >= 50 ? 'Moderate risk environment' : 'Low risk environment'})</li>
            <li style="margin-bottom: 8px;">Risk distribution: ${((metrics.highRiskThreats / metrics.activeThreats) * 100).toFixed(1)}% high-risk, ${((metrics.mediumRiskThreats / metrics.activeThreats) * 100).toFixed(1)}% medium-risk, ${((metrics.lowRiskThreats / metrics.activeThreats) * 100).toFixed(1)}% low-risk</li>
            <li style="margin-bottom: 8px;">Geographic concentration: ${[...new Set(threats.map(t => t.location))].slice(0, 3).join(', ')} showing highest activity</li>
            <li style="margin-bottom: 8px;">Content analysis: ${threats.filter(t => t.content.includes('MDMA') || t.content.includes('LSD') || t.content.includes('Cocaine')).length} threats mention specific drug types</li>
          </ul>
        </div>
      </div>
      
      <div style="background: #1f2937; padding: 15px; border-radius: 8px; border: 1px solid #374151;">
        <p style="margin: 0; text-align: center; color: #9ca3af; font-size: 11px;">
          <strong>PINDAR Intelligence Platform</strong> | 
          Threat Analytics Report | 
          For official use only | 
          Classification: Law Enforcement Sensitive
        </p>
      </div>
    </div>
  `;
};

export const generateSuspectProfileContent = (suspect) => {
  return `
    <div style="font-family: Arial, sans-serif;">
      <h2 style="color: #3b82f6; margin-bottom: 20px;">Suspect Profile: ${suspect.name}</h2>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #f59e0b; margin-bottom: 10px;">Executive Summary</h3>
        <div style="background: #374151; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 0; line-height: 1.6;">
            This suspect profile provides comprehensive intelligence on ${suspect.name}, 
            a ${suspect.threatScore >= 80 ? 'high-risk' : suspect.threatScore >= 50 ? 'medium-risk' : 'low-risk'} 
            individual with a threat score of ${suspect.threatScore}. 
            The suspect operates across ${suspect.platforms.length} platforms and shows 
            ${suspect.botActivity ? 'automated' : 'manual'} activity patterns.
          </p>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #f59e0b; margin-bottom: 10px;">Risk Assessment</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
          <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
            <strong style="color: #ef4444;">Threat Score</strong><br>
            <span style="font-size: 28px; color: #ffffff;">${suspect.threatScore}</span><br>
            <small style="color: #9ca3af;">Risk assessment</small>
          </div>
          <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
            <strong style="color: #f59e0b;">Risk Level</strong><br>
            <span style="font-size: 24px; color: #ffffff;">${suspect.riskLevel.toUpperCase()}</span><br>
            <small style="color: #fed7aa;">Classification</small>
          </div>
          <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
            <strong style="color: #10b981;">Platforms</strong><br>
            <span style="font-size: 24px; color: #ffffff;">${suspect.platforms.length}</span><br>
            <small style="color: #a7f3d0;">Active on</small>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #ef4444; margin-bottom: 10px;">Detailed Profile Information</h3>
        <div style="background: #374151; padding: 15px; border-radius: 8px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <strong style="color: #ffffff;">Full Name:</strong> ${suspect.name}<br>
              <strong style="color: #ffffff;">Phone Number:</strong> ${suspect.phoneNumber}<br>
              <strong style="color: #ffffff;">Email Address:</strong> ${suspect.email}<br>
              <strong style="color: #ffffff;">UPI ID:</strong> ${suspect.upiId}<br>
              <strong style="color: #ffffff;">Location:</strong> ${suspect.location}
            </div>
            <div>
              <strong style="color: #ffffff;">Account Age:</strong> ${suspect.accountAge} days<br>
              <strong style="color: #ffffff;">Followers:</strong> ${suspect.followers}<br>
              <strong style="color: #ffffff;">Posts:</strong> ${suspect.posts}<br>
              <strong style="color: #ffffff;">Verified:</strong> ${suspect.verified ? 'Yes' : 'No'}<br>
              <strong style="color: #ffffff;">Bot Detected:</strong> ${suspect.botDetected ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #10b981; margin-bottom: 10px;">Activity Analysis</h3>
        <div style="background: #374151; padding: 15px; border-radius: 8px;">
          <div style="margin-bottom: 15px;">
            <strong style="color: #ffffff;">Last Seen:</strong> ${new Date(suspect.lastSeen).toLocaleString()}<br>
            <strong style="color: #ffffff;">Cross-Platform Activity:</strong> ${suspect.crossPlatform ? 'Yes' : 'No'}<br>
            <strong style="color: #ffffff;">Languages Used:</strong> ${suspect.languages.join(', ')}<br>
            <strong style="color: #ffffff;">Interests:</strong> ${suspect.interests.join(', ')}
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #8b5cf6; margin-bottom: 10px;">Intelligence Assessment</h3>
        <div style="background: #374151; padding: 15px; border-radius: 8px;">
          <ul style="margin: 0; padding-left: 20px; color: #d1d5db;">
            <li style="margin-bottom: 8px;">${suspect.threatScore >= 80 ? 'CRITICAL: Immediate investigation required due to high threat score' : suspect.threatScore >= 50 ? 'MODERATE: Monitor closely for escalation' : 'LOW: Routine monitoring sufficient'}</li>
            <li style="margin-bottom: 8px;">${suspect.botDetected ? 'Automated activity detected - potential for mass distribution' : 'Manual activity - individual operator'}</li>
            <li style="margin-bottom: 8px;">${suspect.crossPlatform ? 'Multi-platform presence indicates organized operation' : 'Single platform activity - localized threat'}</li>
            <li style="margin-bottom: 8px;">Account age of ${suspect.accountAge} days suggests ${suspect.accountAge > 180 ? 'established' : 'recent'} presence</li>
          </ul>
        </div>
      </div>
      
      <div style="background: #1f2937; padding: 15px; border-radius: 8px; border: 1px solid #374151;">
        <p style="margin: 0; text-align: center; color: #9ca3af; font-size: 11px;">
          <strong>PINDAR Intelligence Platform</strong> | 
          Suspect Profile Report | 
          For official use only | 
          Classification: Law Enforcement Sensitive
        </p>
      </div>
    </div>
  `;
};

export const generateAlertCenterContent = (alerts) => {
  return `
    <div style="font-family: Arial, sans-serif;">
      <h2 style="color: #3b82f6; margin-bottom: 20px;">PINDAR Alert Center Report</h2>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #f59e0b; margin-bottom: 10px;">Executive Summary</h3>
        <div style="background: #374151; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 0; line-height: 1.6;">
            This alert center report provides comprehensive monitoring of ${alerts.length} active alerts 
            across all monitored platforms. The system has identified ${alerts.filter(a => a.priority === 'high').length} 
            high-priority alerts requiring immediate attention and ${alerts.filter(a => a.status === 'unread').length} 
            unread notifications. This report includes complete analysis of all ${alerts.length} alerts.
          </p>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #f59e0b; margin-bottom: 10px;">Alert Statistics Overview</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px;">
          <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
            <strong style="color: #ef4444;">Total Alerts:</strong><br>
            <span style="font-size: 24px; color: #ffffff;">${alerts.length}</span><br>
            <small style="color: #9ca3af;">Active notifications</small>
          </div>
          <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
            <strong style="color: #dc2626;">High Priority:</strong><br>
            <span style="font-size: 24px; color: #ffffff;">${alerts.filter(a => a.priority === 'high').length}</span><br>
            <small style="color: #fecaca;">Immediate action</small>
          </div>
          <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
            <strong style="color: #d97706;">Medium Priority:</strong><br>
            <span style="font-size: 24px; color: #ffffff;">${alerts.filter(a => a.priority === 'medium').length}</span><br>
            <small style="color: #fed7aa;">Monitor closely</small>
          </div>
          <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
            <strong style="color: #10b981;">Unread:</strong><br>
            <span style="font-size: 24px; color: #ffffff;">${alerts.filter(a => a.status === 'unread').length}</span><br>
            <small style="color: #a7f3d0;">Pending review</small>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #ef4444; margin-bottom: 10px;">Priority Alert Breakdown</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div style="background: #dc2626; padding: 15px; border-radius: 8px; border: 2px solid #ef4444;">
            <h4 style="color: #ffffff; margin: 0 0 10px 0;">HIGH PRIORITY ALERTS</h4>
            <span style="font-size: 32px; color: #ffffff;">${alerts.filter(a => a.priority === 'high').length}</span><br>
            <small style="color: #fecaca;">Require immediate investigation</small>
          </div>
          <div style="background: #d97706; padding: 15px; border-radius: 8px; border: 2px solid #f59e0b;">
            <h4 style="color: #ffffff; margin: 0 0 10px 0;">MEDIUM PRIORITY ALERTS</h4>
            <span style="font-size: 32px; color: #ffffff;">${alerts.filter(a => a.priority === 'medium').length}</span><br>
            <small style="color: #fed7aa;">Monitor for escalation</small>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #10b981; margin-bottom: 10px;">Complete Alert Analysis</h3>
        ${alerts.map((alert, index) => `
          <div style="background: #374151; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${
            alert.priority === 'high' ? '#dc2626' : '#d97706'
          }">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <strong style="color: #ffffff; font-size: 16px;">#${index + 1} ${alert.type}</strong>
              <span style="background: ${
                alert.priority === 'high' ? '#dc2626' : '#d97706'
              }; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                ${alert.priority.toUpperCase()} PRIORITY
              </span>
            </div>
            <div style="color: #d1d5db; margin-bottom: 8px;">
              ${alert.message}
            </div>
            <div style="color: #9ca3af; margin-bottom: 8px;">
              <strong>Platform:</strong> ${alert.platform} | 
              <strong>Username:</strong> ${alert.username} | 
              <strong>Threat Score:</strong> ${alert.threatScore}
            </div>
            <div style="color: #6b7280; font-size: 11px;">
              <strong>Detected:</strong> ${new Date(alert.timestamp).toLocaleString()} | 
              <strong>Status:</strong> ${alert.status.toUpperCase()}
            </div>
            ${alert.details ? `
              <div style="background: #1f2937; padding: 10px; border-radius: 4px; margin-top: 8px;">
                <small style="color: #9ca3af;">
                  <strong>Account Type:</strong> ${alert.details.accountType} | 
                  <strong>Content Length:</strong> ${alert.details.contentLength} chars | 
                  <strong>Hashtags:</strong> ${alert.details.hashtags} | 
                  <strong>Mentions:</strong> ${alert.details.mentions} | 
                  <strong>Links:</strong> ${alert.details.links} | 
                  <strong>Images:</strong> ${alert.details.images}
                </small>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #8b5cf6; margin-bottom: 10px;">Alert Patterns & Insights</h3>
        <div style="background: #374151; padding: 15px; border-radius: 8px;">
          <ul style="margin: 0; padding-left: 20px; color: #d1d5db;">
            <li style="margin-bottom: 8px;">${alerts.filter(a => a.priority === 'high').length > 0 ? `${alerts.filter(a => a.priority === 'high').length} high-priority alerts require immediate investigation` : 'No high-priority alerts currently active'}</li>
            <li style="margin-bottom: 8px;">Platform distribution: ${alerts.filter(a => a.platform === 'Telegram').length} on Telegram, ${alerts.filter(a => a.platform === 'WhatsApp').length} on WhatsApp, ${alerts.filter(a => a.platform === 'Instagram').length} on Instagram</li>
            <li style="margin-bottom: 8px;">${alerts.filter(a => a.status === 'unread').length} unread alerts pending review and action</li>
            <li style="margin-bottom: 8px;">Average threat score across alerts: ${(alerts.reduce((sum, a) => sum + a.threatScore, 0) / alerts.length).toFixed(1)}</li>
          </ul>
        </div>
      </div>
      
      <div style="background: #1f2937; padding: 15px; border-radius: 8px; border: 1px solid #374151;">
        <p style="margin: 0; text-align: center; color: #9ca3af; font-size: 11px;">
          <strong>PINDAR Intelligence Platform</strong> | 
          Alert Center Report | 
          For official use only | 
          Classification: Law Enforcement Sensitive
        </p>
      </div>
    </div>
  `;
};

export const generateNetworkAnalysisContent = (networkData) => {
  return `
    <div style="font-family: Arial, sans-serif;">
      <h2 style="color: #3b82f6; margin-bottom: 20px;">PINDAR Network Analysis Report</h2>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #f59e0b; margin-bottom: 10px;">Executive Summary</h3>
        <div style="background: #374151; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 0; line-height: 1.6;">
            This network analysis report provides comprehensive mapping of ${networkData.length} suspicious entities 
            and their interconnections across monitored social media platforms. The analysis reveals 
            ${networkData.filter(n => n.threatScore >= 80).length} high-risk nodes and 
            ${networkData.reduce((sum, n) => sum + n.connections, 0)} total network connections, 
            indicating potential organized activity patterns. This report includes complete analysis of all ${networkData.length} network nodes.
          </p>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #f59e0b; margin-bottom: 10px;">Network Statistics Overview</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px;">
          <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
            <strong style="color: #ef4444;">Total Nodes:</strong><br>
            <span style="font-size: 24px; color: #ffffff;">${networkData.length}</span><br>
            <small style="color: #9ca3af;">Suspicious entities</small>
          </div>
          <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
            <strong style="color: #dc2626;">High Risk:</strong><br>
            <span style="font-size: 24px; color: #ffffff;">${networkData.filter(n => n.threatScore >= 80).length}</span><br>
            <small style="color: #fecaca;">Score 80+</small>
          </div>
          <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
            <strong style="color: #10b981;">Connections:</strong><br>
            <span style="font-size: 24px; color: #ffffff;">${networkData.reduce((sum, n) => sum + n.connections, 0)}</span><br>
            <small style="color: #a7f3d0;">Total links</small>
          </div>
          <div style="background: #374151; padding: 15px; border-radius: 8px; text-align: center;">
            <strong style="color: #3b82f6;">Platforms:</strong><br>
            <span style="font-size: 24px; color: #ffffff;">${[...new Set(networkData.map(n => n.platform))].length}</span><br>
            <small style="color: #9ca3af;">Active on</small>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #ef4444; margin-bottom: 10px;">Risk Distribution Analysis</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
          <div style="background: #dc2626; padding: 15px; border-radius: 8px; text-align: center; border: 2px solid #ef4444;">
            <strong style="color: #ffffff;">HIGH RISK</strong><br>
            <span style="font-size: 28px; color: #ffffff;">${networkData.filter(n => n.threatScore >= 80).length}</span><br>
            <small style="color: #fecaca;">Threat Score: 80+</small><br>
            <small style="color: #fecaca;">Immediate action</small>
          </div>
          <div style="background: #d97706; padding: 15px; border-radius: 8px; text-align: center; border: 2px solid #f59e0b;">
            <strong style="color: #ffffff;">MEDIUM RISK</strong><br>
            <span style="font-size: 28px; color: #ffffff;">${networkData.filter(n => n.threatScore >= 50 && n.threatScore < 80).length}</span><br>
            <small style="color: #fed7aa;">Threat Score: 50-79</small><br>
            <small style="color: #fed7aa;">Monitor closely</small>
          </div>
          <div style="background: #059669; padding: 15px; border-radius: 8px; text-align: center; border: 2px solid #10b981;">
            <strong style="color: #ffffff;">LOW RISK</strong><br>
            <span style="font-size: 28px; color: #ffffff;">${networkData.filter(n => n.threatScore < 50).length}</span><br>
            <small style="color: #a7f3d0;">Threat Score: &lt;50</small><br>
            <small style="color: #a7f3d0;">Routine monitoring</small>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #10b981; margin-bottom: 10px;">Platform Distribution</h3>
        <div style="background: #374151; padding: 15px; border-radius: 8px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
            <div style="text-align: center;">
              <strong style="color: #3b82f6;">Telegram</strong><br>
              <span style="font-size: 20px; color: #ffffff;">${networkData.filter(n => n.platform === 'Telegram').length}</span><br>
              <small style="color: #9ca3af;">Nodes detected</small>
            </div>
            <div style="text-align: center;">
              <strong style="color: #10b981;">WhatsApp</strong><br>
              <span style="font-size: 20px; color: #ffffff;">${networkData.filter(n => n.platform === 'WhatsApp').length}</span><br>
              <small style="color: #9ca3af;">Nodes detected</small>
            </div>
            <div style="text-align: center;">
              <strong style="color: #f59e0b;">Instagram</strong><br>
              <span style="font-size: 20px; color: #ffffff;">${networkData.filter(n => n.platform === 'Instagram').length}</span><br>
              <small style="color: #9ca3af;">Nodes detected</small>
            </div>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #8b5cf6; margin-bottom: 10px;">Complete Network Analysis by Risk</h3>
        ${networkData.sort((a, b) => b.threatScore - a.threatScore).map((node, index) => `
          <div style="background: #374151; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${
            node.threatScore >= 80 ? '#dc2626' : 
            node.threatScore >= 50 ? '#d97706' : '#059669'
          }">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <strong style="color: #ffffff; font-size: 16px;">#${index + 1} ${node.label}</strong>
              <span style="background: ${
                node.threatScore >= 80 ? '#dc2626' : 
                node.threatScore >= 50 ? '#d97706' : '#059669'
              }; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                Score: ${node.threatScore}
              </span>
            </div>
            <div style="color: #9ca3af; margin-bottom: 8px;">
              <strong>Platform:</strong> ${node.platform} | 
              <strong>Group:</strong> ${node.group.replace('_', ' ').toUpperCase()} | 
              <strong>Connections:</strong> ${node.connections}
            </div>
            <div style="color: #6b7280; font-size: 11px;">
              <strong>Last Activity:</strong> ${new Date(node.lastActivity).toLocaleString()}
            </div>
            ${node.metadata ? `
              <div style="background: #1f2937; padding: 10px; border-radius: 4px; margin-top: 8px;">
                <small style="color: #9ca3af;">
                  <strong>Phone:</strong> ${node.metadata.phoneNumber} | 
                  <strong>Email:</strong> ${node.metadata.email} | 
                  <strong>UPI:</strong> ${node.metadata.upiId} | 
                  <strong>Location:</strong> ${node.metadata.location}
                </small>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #f59e0b; margin-bottom: 10px;">Network Intelligence Insights</h3>
        <div style="background: #374151; padding: 15px; border-radius: 8px;">
          <ul style="margin: 0; padding-left: 20px; color: #d1d5db;">
            <li style="margin-bottom: 8px;">${networkData.filter(n => n.threatScore >= 80).length} high-risk nodes require immediate investigation and potential takedown</li>
            <li style="margin-bottom: 8px;">Average connections per node: ${(networkData.reduce((sum, n) => sum + n.connections, 0) / networkData.length).toFixed(1)}, indicating ${(networkData.reduce((sum, n) => sum + n.connections, 0) / networkData.length) > 3 ? 'highly connected' : 'moderately connected'} network structure</li>
            <li style="margin-bottom: 8px;">Platform concentration: ${networkData.reduce((acc, n) => { acc[n.platform] = (acc[n.platform] || 0) + 1; return acc; }, {}).Telegram > 0 ? 'Telegram' : networkData.reduce((acc, n) => { acc[n.platform] = (acc[n.platform] || 0) + 1; return acc; }, {}).WhatsApp > 0 ? 'WhatsApp' : 'Instagram'} shows highest suspicious activity</li>
            <li style="margin-bottom: 8px;">Geographic spread covers ${[...new Set(networkData.map(n => n.metadata?.location).filter(Boolean))].length} major cities, suggesting organized distribution network</li>
          </ul>
        </div>
      </div>
      
      <div style="background: #1f2937; padding: 15px; border-radius: 8px; border: 1px solid #374151;">
        <p style="margin: 0; text-align: center; color: #9ca3af; font-size: 11px;">
          <strong>PINDAR Intelligence Platform</strong> | 
          Network Analysis Report | 
          For official use only | 
          Classification: Law Enforcement Sensitive
        </p>
      </div>
    </div>
  `;
}; 