import json
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import networkx as nx
import random

def generate_threat_narrative(suspect_name: str, threat_score: int, platforms: str) -> str:
    """
    Generate a unified threat narrative for a suspect
    
    Args:
        suspect_name: Name of the suspect
        threat_score: Threat score (0-100)
        platforms: Platforms where activity was detected
        
    Returns:
        Generated threat narrative
    """
    
    # Base narrative templates
    high_risk_template = f"""
    {suspect_name} represents a HIGH-RISK threat with a threat score of {threat_score}.
    Active across {platforms} with consistent drug-related activity patterns.
    Multiple indicators suggest organized drug trafficking operations.
    """
    
    medium_risk_template = f"""
    {suspect_name} shows MODERATE-RISK behavior with a threat score of {threat_score}.
    Activity detected on {platforms} with some suspicious patterns.
    Requires continued monitoring and investigation.
    """
    
    low_risk_template = f"""
    {suspect_name} displays LOW-RISK indicators with a threat score of {threat_score}.
    Limited activity on {platforms} with minimal suspicious patterns.
    Monitor for escalation in activity.
    """
    
    # Select template based on threat score
    if threat_score >= 80:
        template = high_risk_template
        risk_level = "HIGH"
    elif threat_score >= 50:
        template = medium_risk_template
        risk_level = "MODERATE"
    else:
        template = low_risk_template
        risk_level = "LOW"
    
    # Add specific details based on threat score
    details = _generate_threat_details(threat_score, platforms)
    
    # Combine into final narrative
    narrative = f"""
    **THREAT NARRATIVE - {suspect_name}**
    
    {template.strip()}
    
    **Key Indicators:**
    {details}
    
    **Risk Level:** {risk_level}
    **Recommendation:** {_generate_recommendation(threat_score)}
    
    **Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    """
    
    return narrative.strip()

def _generate_threat_details(threat_score: int, platforms: str) -> str:
    """Generate specific threat details based on score"""
    details = []
    
    if threat_score >= 90:
        details.extend([
            "• Multiple drug types mentioned (MDMA, LSD, Mephedrone)",
            "• Automated bot behavior detected",
            "• Cryptocurrency payment methods",
            "• 24/7 availability indicated",
            "• Multiple contact methods provided"
        ])
    elif threat_score >= 80:
        details.extend([
            "• Specific drug references detected",
            "• Suspicious payment patterns",
            "• Anonymous communication methods",
            "• Rapid response times",
            "• Template-based messaging"
        ])
    elif threat_score >= 60:
        details.extend([
            "• Some drug-related keywords",
            "• Suspicious timing patterns",
            "• Multiple platform presence",
            "• Generic contact information"
        ])
    else:
        details.extend([
            "• Limited suspicious activity",
            "• Minimal drug references",
            "• Standard communication patterns"
        ])
    
    return "\n".join(details)

def _generate_recommendation(threat_score: int) -> str:
    """Generate recommendation based on threat score"""
    if threat_score >= 90:
        return "IMMEDIATE ACTION REQUIRED - Prioritize for law enforcement investigation"
    elif threat_score >= 80:
        return "HIGH PRIORITY - Assign to investigation team within 24 hours"
    elif threat_score >= 60:
        return "MEDIUM PRIORITY - Monitor closely and investigate if activity escalates"
    else:
        return "LOW PRIORITY - Continue monitoring for changes in behavior"

def calculate_threat_score(
    keyword_score: int = 0,
    nlp_confidence: float = 0.0,
    bot_indicators: int = 0,
    metadata_count: int = 0,
    platform_risk: int = 0
) -> int:
    """
    Calculate comprehensive threat score
    
    Args:
        keyword_score: Score from keyword matching
        nlp_confidence: NLP model confidence (0-1)
        bot_indicators: Number of bot indicators
        metadata_count: Number of metadata items found
        platform_risk: Platform-specific risk score
        
    Returns:
        Threat score (0-100)
    """
    
    # Base scoring weights
    weights = {
        "keyword": 0.4,
        "nlp": 0.3,
        "bot": 0.15,
        "metadata": 0.1,
        "platform": 0.05
    }
    
    # Calculate weighted score
    total_score = (
        (keyword_score * weights["keyword"]) +
        (nlp_confidence * 100 * weights["nlp"]) +
        (bot_indicators * 10 * weights["bot"]) +
        (metadata_count * 5 * weights["metadata"]) +
        (platform_risk * weights["platform"])
    )
    
    # Normalize to 0-100 range
    threat_score = min(100, max(0, int(total_score)))
    
    return threat_score

def create_network_graph(accounts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Create network graph from account data
    
    Args:
        accounts: List of account dictionaries
        
    Returns:
        Network graph data for visualization
    """
    
    # Create NetworkX graph
    G = nx.Graph()
    
    # Add nodes
    for account in accounts:
        node_id = account.get("id", account.get("username", f"account_{len(G.nodes)}"))
        G.add_node(node_id, **account)
    
    # Add edges based on shared metadata
    for i, account1 in enumerate(accounts):
        for j, account2 in enumerate(accounts[i+1:], i+1):
            # Check for shared metadata
            shared_metadata = _find_shared_metadata(account1, account2)
            if shared_metadata:
                weight = len(shared_metadata) / 10.0  # Normalize weight
                G.add_edge(
                    account1.get("id", f"account_{i}"),
                    account2.get("id", f"account_{j}"),
                    weight=weight,
                    shared_metadata=shared_metadata
                )
    
    # Calculate centrality measures
    centrality = nx.degree_centrality(G)
    betweenness = nx.betweenness_centrality(G)
    
    # Prepare data for visualization
    nodes = []
    for node in G.nodes():
        node_data = G.nodes[node]
        nodes.append({
            "id": node,
            "label": node_data.get("username", node),
            "group": _get_risk_group(node_data.get("threat_score", 0)),
            "threat_score": node_data.get("threat_score", 0),
            "centrality": centrality.get(node, 0),
            "betweenness": betweenness.get(node, 0)
        })
    
    edges = []
    for edge in G.edges(data=True):
        edges.append({
            "from": edge[0],
            "to": edge[1],
            "weight": edge[2].get("weight", 0),
            "shared_metadata": edge[2].get("shared_metadata", [])
        })
    
    return {
        "nodes": nodes,
        "edges": edges,
        "statistics": {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "average_threat_score": sum(n["threat_score"] for n in nodes) / len(nodes) if nodes else 0,
            "high_risk_nodes": len([n for n in nodes if n["threat_score"] >= 80]),
            "network_density": nx.density(G)
        }
    }

def _find_shared_metadata(account1: Dict[str, Any], account2: Dict[str, Any]) -> List[str]:
    """Find shared metadata between two accounts"""
    shared = []
    
    # Check phone numbers
    phones1 = set(account1.get("metadata", {}).get("phone_numbers", []))
    phones2 = set(account2.get("metadata", {}).get("phone_numbers", []))
    if phones1 & phones2:
        shared.append("phone_numbers")
    
    # Check email addresses
    emails1 = set(account1.get("metadata", {}).get("email_addresses", []))
    emails2 = set(account2.get("metadata", {}).get("email_addresses", []))
    if emails1 & emails2:
        shared.append("email_addresses")
    
    # Check UPI IDs
    upis1 = set(account1.get("metadata", {}).get("upi_ids", []))
    upis2 = set(account2.get("metadata", {}).get("upi_ids", []))
    if upis1 & upis2:
        shared.append("upi_ids")
    
    # Check cryptocurrency addresses
    cryptos1 = set(account1.get("metadata", {}).get("cryptocurrency_addresses", []))
    cryptos2 = set(account2.get("metadata", {}).get("cryptocurrency_addresses", []))
    if cryptos1 & cryptos2:
        shared.append("cryptocurrency_addresses")
    
    return shared

def _get_risk_group(threat_score: int) -> str:
    """Get risk group based on threat score"""
    if threat_score >= 80:
        return "high_risk"
    elif threat_score >= 50:
        return "medium_risk"
    else:
        return "low_risk"

def generate_alert_message(alert_type: str, details: Dict[str, Any]) -> str:
    """
    Generate alert message for different alert types
    
    Args:
        alert_type: Type of alert
        details: Alert details
        
    Returns:
        Formatted alert message
    """
    
    alert_templates = {
        "high_threat": """
        🚨 HIGH THREAT ALERT 🚨
        
        New high-threat account detected:
        • Account: {account}
        • Platform: {platform}
        • Threat Score: {threat_score}
        • Risk Level: {risk_level}
        
        Immediate attention required!
        """,
        
        "bot_detected": """
        🤖 BOT DETECTION ALERT 🤖
        
        Automated behavior detected:
        • Account: {account}
        • Platform: {platform}
        • Bot Confidence: {confidence}%
        • Indicators: {indicators}
        
        Investigate for automated drug sales.
        """,
        
        "network_connection": """
        🕸️ NETWORK CONNECTION ALERT 🕸️
        
        New connection detected:
        • Account 1: {account1}
        • Account 2: {account2}
        • Shared Metadata: {shared_metadata}
        • Connection Strength: {strength}
        
        Potential organized activity detected.
        """,
        
        "metadata_extracted": """
        📋 METADATA EXTRACTION ALERT 📋
        
        Significant metadata found:
        • Account: {account}
        • Phone Numbers: {phone_count}
        • Email Addresses: {email_count}
        • UPI IDs: {upi_count}
        • Cryptocurrency: {crypto_count}
        
        Contact information available for investigation.
        """
    }
    
    template = alert_templates.get(alert_type, "Alert: {details}")
    
    # Format template with details
    try:
        message = template.format(**details)
    except KeyError:
        message = f"Alert: {json.dumps(details, indent=2)}"
    
    return message.strip()

def simulate_ip_triangulation(metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Simulate IP triangulation for demo purposes
    
    Args:
        metadata: Extracted metadata
        
    Returns:
        Simulated IP triangulation results
    """
    
    # Simulate IP addresses based on metadata
    simulated_ips = []
    
    # Generate IPs based on location indicators
    locations = metadata.get("location_indicators", [])
    if locations:
        for location in locations:
            # Simulate IP ranges for Indian cities
            ip_ranges = {
                "Mumbai": ["103.21.244.0", "103.21.255.255"],
                "Delhi": ["103.15.36.0", "103.15.47.255"],
                "Bangalore": ["103.5.134.0", "103.5.135.255"],
                "Chennai": ["103.5.132.0", "103.5.133.255"],
                "Kolkata": ["103.5.130.0", "103.5.131.255"]
            }
            
            if location in ip_ranges:
                ip_range = ip_ranges[location]
                # Generate random IP in range
                ip_parts = ip_range[0].split(".")
                simulated_ip = f"{ip_parts[0]}.{ip_parts[1]}.{ip_parts[2]}.{random.randint(1, 254)}"
                simulated_ips.append({
                    "ip": simulated_ip,
                    "location": location,
                    "confidence": random.uniform(0.7, 0.95)
                })
    
    # Generate additional IPs based on other metadata
    if metadata.get("phone_numbers"):
        # Simulate IPs based on phone number area codes
        for phone in metadata["phone_numbers"][:2]:  # Limit to 2 IPs
            simulated_ips.append({
                "ip": f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}",
                "source": "phone_triangulation",
                "confidence": random.uniform(0.6, 0.85)
            })
    
    return {
        "simulated_ips": simulated_ips,
        "total_ips": len(simulated_ips),
        "average_confidence": sum(ip["confidence"] for ip in simulated_ips) / len(simulated_ips) if simulated_ips else 0,
        "note": "IP addresses are simulated for demonstration purposes"
    }

def format_timestamp(timestamp: datetime) -> str:
    """Format timestamp for display"""
    return timestamp.strftime("%Y-%m-%d %H:%M:%S")

def calculate_time_difference(timestamp1: datetime, timestamp2: datetime) -> str:
    """Calculate and format time difference"""
    diff = abs(timestamp2 - timestamp1)
    
    if diff.days > 0:
        return f"{diff.days} days ago"
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f"{hours} hours ago"
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        return f"{minutes} minutes ago"
    else:
        return "Just now" 