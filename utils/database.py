import sqlite3
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
import os
from pathlib import Path

class Database:
    """
    Database utility for storing and retrieving threat data
    """
    
    def __init__(self, db_path: str = "data/pindar.db"):
        self.db_path = db_path
        self._ensure_data_directory()
        self._init_database()
    
    def _ensure_data_directory(self):
        """Ensure data directory exists"""
        data_dir = Path(self.db_path).parent
        data_dir.mkdir(parents=True, exist_ok=True)
    
    def _init_database(self):
        """Initialize database tables"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Create threats table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS threats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    platform TEXT NOT NULL,
                    channel TEXT NOT NULL,
                    message TEXT NOT NULL,
                    threat_score INTEGER NOT NULL,
                    risk_level TEXT NOT NULL,
                    bot_detected BOOLEAN DEFAULT FALSE,
                    metadata TEXT,
                    analysis_result TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create accounts table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS accounts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    platform TEXT NOT NULL,
                    threat_score INTEGER DEFAULT 0,
                    risk_level TEXT DEFAULT 'low',
                    bot_confidence REAL DEFAULT 0.0,
                    metadata TEXT,
                    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                    message_count INTEGER DEFAULT 0
                )
            """)
            
            # Create alerts table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    alert_type TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    message TEXT NOT NULL,
                    details TEXT,
                    acknowledged BOOLEAN DEFAULT FALSE,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create network_connections table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS network_connections (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    account1_id INTEGER,
                    account2_id INTEGER,
                    connection_type TEXT NOT NULL,
                    shared_metadata TEXT,
                    strength REAL DEFAULT 0.0,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (account1_id) REFERENCES accounts (id),
                    FOREIGN KEY (account2_id) REFERENCES accounts (id)
                )
            """)
            
            # Create analysis_logs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS analysis_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    analysis_type TEXT NOT NULL,
                    input_data TEXT,
                    result TEXT,
                    processing_time REAL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()
    
    def store_threat(self, threat_data: Dict[str, Any]) -> int:
        """
        Store threat data in database
        
        Args:
            threat_data: Dictionary containing threat information
            
        Returns:
            ID of stored threat
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO threats (
                    platform, channel, message, threat_score, risk_level,
                    bot_detected, metadata, analysis_result
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                threat_data.get("platform", "unknown"),
                threat_data.get("channel", "unknown"),
                threat_data.get("message", ""),
                threat_data.get("threat_score", 0),
                threat_data.get("risk_level", "low"),
                threat_data.get("bot_detected", False),
                json.dumps(threat_data.get("metadata", {})),
                json.dumps(threat_data.get("analysis_result", {}))
            ))
            
            threat_id = cursor.lastrowid
            conn.commit()
            return threat_id
    
    def store_account(self, account_data: Dict[str, Any]) -> int:
        """
        Store account data in database
        
        Args:
            account_data: Dictionary containing account information
            
        Returns:
            ID of stored account
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Check if account already exists
            cursor.execute("""
                SELECT id, message_count, last_seen FROM accounts 
                WHERE username = ? AND platform = ?
            """, (account_data.get("username"), account_data.get("platform")))
            
            existing = cursor.fetchone()
            
            if existing:
                # Update existing account
                account_id, message_count, last_seen = existing
                cursor.execute("""
                    UPDATE accounts SET 
                        threat_score = ?,
                        risk_level = ?,
                        bot_confidence = ?,
                        metadata = ?,
                        last_seen = CURRENT_TIMESTAMP,
                        message_count = message_count + 1
                    WHERE id = ?
                """, (
                    account_data.get("threat_score", 0),
                    account_data.get("risk_level", "low"),
                    account_data.get("bot_confidence", 0.0),
                    json.dumps(account_data.get("metadata", {})),
                    account_id
                ))
                return account_id
            else:
                # Insert new account
                cursor.execute("""
                    INSERT INTO accounts (
                        username, platform, threat_score, risk_level,
                        bot_confidence, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    account_data.get("username"),
                    account_data.get("platform"),
                    account_data.get("threat_score", 0),
                    account_data.get("risk_level", "low"),
                    account_data.get("bot_confidence", 0.0),
                    json.dumps(account_data.get("metadata", {}))
                ))
                
                account_id = cursor.lastrowid
                conn.commit()
                return account_id
    
    def store_alert(self, alert_data: Dict[str, Any]) -> int:
        """
        Store alert data in database
        
        Args:
            alert_data: Dictionary containing alert information
            
        Returns:
            ID of stored alert
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO alerts (
                    alert_type, severity, message, details
                ) VALUES (?, ?, ?, ?)
            """, (
                alert_data.get("alert_type", "unknown"),
                alert_data.get("severity", "medium"),
                alert_data.get("message", ""),
                json.dumps(alert_data.get("details", {}))
            ))
            
            alert_id = cursor.lastrowid
            conn.commit()
            return alert_id
    
    def store_network_connection(self, connection_data: Dict[str, Any]) -> int:
        """
        Store network connection data in database
        
        Args:
            connection_data: Dictionary containing connection information
            
        Returns:
            ID of stored connection
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO network_connections (
                    account1_id, account2_id, connection_type,
                    shared_metadata, strength
                ) VALUES (?, ?, ?, ?, ?)
            """, (
                connection_data.get("account1_id"),
                connection_data.get("account2_id"),
                connection_data.get("connection_type", "metadata"),
                json.dumps(connection_data.get("shared_metadata", [])),
                connection_data.get("strength", 0.0)
            ))
            
            connection_id = cursor.lastrowid
            conn.commit()
            return connection_id
    
    def get_recent_threats(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get recent threats from database
        
        Args:
            limit: Maximum number of threats to retrieve
            
        Returns:
            List of threat dictionaries
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM threats 
                ORDER BY timestamp DESC 
                LIMIT ?
            """, (limit,))
            
            columns = [description[0] for description in cursor.description]
            threats = []
            
            for row in cursor.fetchall():
                threat = dict(zip(columns, row))
                # Parse JSON fields
                if threat.get("metadata"):
                    threat["metadata"] = json.loads(threat["metadata"])
                if threat.get("analysis_result"):
                    threat["analysis_result"] = json.loads(threat["analysis_result"])
                threats.append(threat)
            
            return threats
    
    def get_high_risk_accounts(self, min_score: int = 80) -> List[Dict[str, Any]]:
        """
        Get high-risk accounts from database
        
        Args:
            min_score: Minimum threat score threshold
            
        Returns:
            List of account dictionaries
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM accounts 
                WHERE threat_score >= ?
                ORDER BY threat_score DESC
            """, (min_score,))
            
            columns = [description[0] for description in cursor.description]
            accounts = []
            
            for row in cursor.fetchall():
                account = dict(zip(columns, row))
                # Parse JSON fields
                if account.get("metadata"):
                    account["metadata"] = json.loads(account["metadata"])
                accounts.append(account)
            
            return accounts
    
    def get_unacknowledged_alerts(self) -> List[Dict[str, Any]]:
        """
        Get unacknowledged alerts from database
        
        Returns:
            List of alert dictionaries
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM alerts 
                WHERE acknowledged = FALSE
                ORDER BY timestamp DESC
            """)
            
            columns = [description[0] for description in cursor.description]
            alerts = []
            
            for row in cursor.fetchall():
                alert = dict(zip(columns, row))
                # Parse JSON fields
                if alert.get("details"):
                    alert["details"] = json.loads(alert["details"])
                alerts.append(alert)
            
            return alerts
    
    def get_network_connections(self, account_id: int = None) -> List[Dict[str, Any]]:
        """
        Get network connections from database
        
        Args:
            account_id: Optional account ID to filter connections
            
        Returns:
            List of connection dictionaries
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            if account_id:
                cursor.execute("""
                    SELECT * FROM network_connections 
                    WHERE account1_id = ? OR account2_id = ?
                    ORDER BY strength DESC
                """, (account_id, account_id))
            else:
                cursor.execute("""
                    SELECT * FROM network_connections 
                    ORDER BY strength DESC
                """)
            
            columns = [description[0] for description in cursor.description]
            connections = []
            
            for row in cursor.fetchall():
                connection = dict(zip(columns, row))
                # Parse JSON fields
                if connection.get("shared_metadata"):
                    connection["shared_metadata"] = json.loads(connection["shared_metadata"])
                connections.append(connection)
            
            return connections
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get database statistics
        
        Returns:
            Dictionary containing statistics
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            stats = {}
            
            # Threat statistics
            cursor.execute("SELECT COUNT(*) FROM threats")
            stats["total_threats"] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM threats WHERE threat_score >= 80")
            stats["high_risk_threats"] = cursor.fetchone()[0]
            
            cursor.execute("SELECT AVG(threat_score) FROM threats")
            avg_score = cursor.fetchone()[0]
            stats["average_threat_score"] = round(avg_score, 2) if avg_score else 0
            
            # Account statistics
            cursor.execute("SELECT COUNT(*) FROM accounts")
            stats["total_accounts"] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM accounts WHERE threat_score >= 80")
            stats["high_risk_accounts"] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM accounts WHERE bot_confidence > 0.7")
            stats["bot_accounts"] = cursor.fetchone()[0]
            
            # Alert statistics
            cursor.execute("SELECT COUNT(*) FROM alerts WHERE acknowledged = FALSE")
            stats["unacknowledged_alerts"] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM alerts WHERE severity = 'high'")
            stats["high_severity_alerts"] = cursor.fetchone()[0]
            
            # Platform statistics
            cursor.execute("""
                SELECT platform, COUNT(*) as count 
                FROM threats 
                GROUP BY platform
            """)
            stats["platform_distribution"] = dict(cursor.fetchall())
            
            # Recent activity
            cursor.execute("""
                SELECT COUNT(*) FROM threats 
                WHERE timestamp >= datetime('now', '-24 hours')
            """)
            stats["threats_last_24h"] = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT COUNT(*) FROM alerts 
                WHERE timestamp >= datetime('now', '-24 hours')
            """)
            stats["alerts_last_24h"] = cursor.fetchone()[0]
            
            return stats
    
    def acknowledge_alert(self, alert_id: int) -> bool:
        """
        Acknowledge an alert
        
        Args:
            alert_id: ID of alert to acknowledge
            
        Returns:
            True if successful, False otherwise
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    UPDATE alerts 
                    SET acknowledged = TRUE 
                    WHERE id = ?
                """, (alert_id,))
                
                conn.commit()
                return cursor.rowcount > 0
        except:
            return False
    
    def cleanup_old_data(self, days: int = 30) -> int:
        """
        Clean up old data from database
        
        Args:
            days: Number of days to keep data
            
        Returns:
            Number of records deleted
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Delete old threats
            cursor.execute("""
                DELETE FROM threats 
                WHERE timestamp < datetime('now', '-{} days')
            """.format(days))
            
            threats_deleted = cursor.rowcount
            
            # Delete old alerts (keep high severity)
            cursor.execute("""
                DELETE FROM alerts 
                WHERE timestamp < datetime('now', '-{} days')
                AND severity != 'high'
            """.format(days))
            
            alerts_deleted = cursor.rowcount
            
            # Delete old analysis logs
            cursor.execute("""
                DELETE FROM analysis_logs 
                WHERE timestamp < datetime('now', '-{} days')
            """.format(days))
            
            logs_deleted = cursor.rowcount
            
            conn.commit()
            
            return threats_deleted + alerts_deleted + logs_deleted
    
    def export_data(self, table: str = None) -> Dict[str, Any]:
        """
        Export data from database
        
        Args:
            table: Specific table to export, or None for all
            
        Returns:
            Dictionary containing exported data
        """
        tables = ["threats", "accounts", "alerts", "network_connections", "analysis_logs"]
        
        if table and table in tables:
            tables = [table]
        
        exported_data = {}
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            for table_name in tables:
                cursor.execute(f"SELECT * FROM {table_name}")
                
                columns = [description[0] for description in cursor.description]
                rows = []
                
                for row in cursor.fetchall():
                    row_dict = dict(zip(columns, row))
                    # Parse JSON fields
                    for key, value in row_dict.items():
                        if isinstance(value, str) and value.startswith('{'):
                            try:
                                row_dict[key] = json.loads(value)
                            except:
                                pass
                    rows.append(row_dict)
                
                exported_data[table_name] = rows
        
        return exported_data 