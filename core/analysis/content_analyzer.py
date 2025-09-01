import re
import json
from typing import Dict, List, Tuple, Any
import pandas as pd
from datetime import datetime

class ContentAnalyzer:
    """
    AI/NLP-based content analyzer for detecting drug-related content
    """
    
    def __init__(self):
        self.drug_keywords = self._load_drug_keywords()
        self.slang_patterns = self._load_slang_patterns()
        self.emoji_patterns = self._load_emoji_patterns()
        self.context_patterns = self._load_context_patterns()
        
    def _load_drug_keywords(self) -> Dict[str, int]:
        """Load drug-related keywords with threat scores"""
        return {
            # Synthetic drugs
            "mdma": 90, "ecstasy": 90, "molly": 85, "x": 85,
            "lsd": 95, "acid": 95, "tabs": 80, "blotter": 85,
            "mephedrone": 95, "meow": 90, "m-cat": 90,
            "ketamine": 85, "k": 85, "special k": 85,
            "cocaine": 90, "coke": 90, "crack": 95,
            "heroin": 95, "smack": 95, "h": 95,
            "meth": 95, "crystal": 95, "ice": 95,
            
            # Prescription drugs
            "oxycodone": 80, "oxy": 80, "percocet": 80,
            "xanax": 75, "alprazolam": 75, "benzos": 75,
            "adderall": 70, "ritalin": 70, "stimulants": 70,
            
            # Cannabis
            "weed": 60, "marijuana": 60, "ganja": 60, "hash": 65,
            "thc": 65, "cbd": 40, "edibles": 70,
            
            # Slang terms
            "party pills": 85, "club drugs": 85, "designer drugs": 90,
            "research chemicals": 90, "rc": 90, "legal highs": 80,
            "supplies": 70, "gear": 70, "stuff": 65,
            
            # Delivery terms
            "delivery": 75, "pickup": 75, "meet": 75, "drop": 75,
            "contact": 70, "dm": 70, "telegram": 65, "whatsapp": 65,
            
            # Payment terms
            "cash": 60, "upi": 65, "bitcoin": 80, "crypto": 80,
            "payment": 65, "price": 65, "cost": 65
        }
    
    def _load_slang_patterns(self) -> List[str]:
        """Load drug-related slang patterns"""
        return [
            r'\b(party|club)\s+(pills?|drugs?)\b',
            r'\b(designer|research)\s+(chemicals?|drugs?)\b',
            r'\b(legal\s+)?highs?\b',
            r'\b(gear|stuff|supplies)\b',
            r'\b(delivery|pickup|meet|drop)\b',
            r'\b(dm|contact)\s+(for|details?)\b',
            r'\b(quality|pure|best)\s+(stuff|gear|supplies)\b',
            r'\b(available|in\s+stock)\b',
            r'\b(price|cost|payment)\s+(details?|info)\b'
        ]
    
    def _load_emoji_patterns(self) -> Dict[str, int]:
        """Load drug-related emoji patterns"""
        return {
            "🔥": 70, "💊": 80, "💉": 85, "🌿": 60,
            "💰": 65, "💵": 65, "🤑": 70, "💸": 70,
            "🚀": 75, "⚡": 75, "💥": 75, "🎉": 70,
            "🦄": 80, "🌈": 80, "⭐": 70, "💎": 75,
            "🔮": 80, "✨": 70, "🎭": 75, "🎪": 75
        }
    
    def _load_context_patterns(self) -> List[str]:
        """Load contextual patterns indicating drug sales"""
        return [
            r'\b(available|in\s+stock|ready)\b',
            r'\b(contact|dm|message)\s+(for|details?|info)\b',
            r'\b(price|cost|payment)\s+(details?|info|available)\b',
            r'\b(delivery|pickup|meet|drop)\s+(available|service)\b',
            r'\b(quality|pure|best|premium)\b',
            r'\b(discrete|discreet|private|confidential)\b',
            r'\b(no\s+questions|trusted|reliable)\b',
            r'\b(cash|upi|bitcoin|crypto)\s+(only|accepted)\b'
        ]
    
    def analyze_content(self, text: str, platform: str = "unknown") -> Dict[str, Any]:
        """
        Analyze content for drug-related activity
        
        Args:
            text: Text content to analyze
            platform: Platform where content was found
            
        Returns:
            Analysis results with threat score and details
        """
        text_lower = text.lower()
        
        # Initialize analysis results
        analysis = {
            "threat_score": 0,
            "keyword_matches": [],
            "slang_matches": [],
            "emoji_matches": [],
            "context_matches": [],
            "metadata_found": {},
            "bot_indicators": [],
            "risk_level": "low",
            "confidence": 0.0,
            "timestamp": datetime.now().isoformat()
        }
        
        # 1. Keyword Analysis
        keyword_score = self._analyze_keywords(text_lower)
        analysis["keyword_matches"] = keyword_score["matches"]
        analysis["threat_score"] += keyword_score["score"]
        
        # 2. Slang Pattern Analysis
        slang_score = self._analyze_slang_patterns(text_lower)
        analysis["slang_matches"] = slang_score["matches"]
        analysis["threat_score"] += slang_score["score"]
        
        # 3. Emoji Analysis
        emoji_score = self._analyze_emojis(text)
        analysis["emoji_matches"] = emoji_score["matches"]
        analysis["threat_score"] += emoji_score["score"]
        
        # 4. Context Analysis
        context_score = self._analyze_context(text_lower)
        analysis["context_matches"] = context_score["matches"]
        analysis["threat_score"] += context_score["score"]
        
        # 5. Metadata Extraction
        metadata = self._extract_metadata(text)
        analysis["metadata_found"] = metadata
        if metadata:
            analysis["threat_score"] += len(metadata) * 10
        
        # 6. Bot Detection
        bot_indicators = self._detect_bot_indicators(text, platform)
        analysis["bot_indicators"] = bot_indicators
        if bot_indicators:
            analysis["threat_score"] += len(bot_indicators) * 15
        
        # 7. Platform-specific adjustments
        platform_score = self._get_platform_score(platform)
        analysis["threat_score"] += platform_score
        
        # 8. Calculate final threat score (0-100)
        analysis["threat_score"] = min(100, max(0, analysis["threat_score"]))
        
        # 9. Determine risk level
        analysis["risk_level"] = self._get_risk_level(analysis["threat_score"])
        
        # 10. Calculate confidence
        analysis["confidence"] = self._calculate_confidence(analysis)
        
        return analysis
    
    def _analyze_keywords(self, text: str) -> Dict[str, Any]:
        """Analyze text for drug-related keywords"""
        matches = []
        total_score = 0
        
        for keyword, score in self.drug_keywords.items():
            if keyword in text:
                matches.append({"keyword": keyword, "score": score})
                total_score += score
        
        return {
            "matches": matches,
            "score": total_score
        }
    
    def _analyze_slang_patterns(self, text: str) -> Dict[str, Any]:
        """Analyze text for slang patterns"""
        matches = []
        total_score = 0
        
        for pattern in self.slang_patterns:
            if re.search(pattern, text):
                matches.append({"pattern": pattern, "score": 50})
                total_score += 50
        
        return {
            "matches": matches,
            "score": total_score
        }
    
    def _analyze_emojis(self, text: str) -> Dict[str, Any]:
        """Analyze text for drug-related emojis"""
        matches = []
        total_score = 0
        
        for emoji, score in self.emoji_patterns.items():
            if emoji in text:
                matches.append({"emoji": emoji, "score": score})
                total_score += score
        
        return {
            "matches": matches,
            "score": total_score
        }
    
    def _analyze_context(self, text: str) -> Dict[str, Any]:
        """Analyze text for contextual indicators"""
        matches = []
        total_score = 0
        
        for pattern in self.context_patterns:
            if re.search(pattern, text):
                matches.append({"pattern": pattern, "score": 30})
                total_score += 30
        
        return {
            "matches": matches,
            "score": total_score
        }
    
    def _extract_metadata(self, text: str) -> Dict[str, List[str]]:
        """Extract metadata from text"""
        metadata = {
            "phone_numbers": [],
            "email_addresses": [],
            "upi_ids": [],
            "bitcoin_addresses": [],
            "hashtags": []
        }
        
        # Phone numbers (Indian format)
        phone_pattern = r'\+?91[-\s]?\d{5}[-\s]?\d{5}'
        metadata["phone_numbers"] = re.findall(phone_pattern, text)
        
        # Email addresses
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        metadata["email_addresses"] = re.findall(email_pattern, text)
        
        # UPI IDs
        upi_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z]{2,}\b'
        upi_matches = re.findall(upi_pattern, text)
        metadata["upi_ids"] = [upi for upi in upi_matches if '@' in upi and '.' not in upi.split('@')[1]]
        
        # Bitcoin addresses
        btc_pattern = r'\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b'
        metadata["bitcoin_addresses"] = re.findall(btc_pattern, text)
        
        # Hashtags
        hashtag_pattern = r'#\w+'
        metadata["hashtags"] = re.findall(hashtag_pattern, text)
        
        # Remove empty lists
        return {k: v for k, v in metadata.items() if v}
    
    def _detect_bot_indicators(self, text: str, platform: str) -> List[str]:
        """Detect bot-like behavior indicators"""
        indicators = []
        
        # Repetitive patterns
        if len(set(text.split())) < len(text.split()) * 0.3:
            indicators.append("repetitive_content")
        
        # Excessive emojis
        emoji_count = sum(1 for char in text if ord(char) > 127)
        if emoji_count > len(text) * 0.3:
            indicators.append("excessive_emojis")
        
        # Generic templates
        template_phrases = [
            "contact for details", "dm for info", "available now",
            "best quality", "discrete delivery", "trusted supplier"
        ]
        if any(phrase in text.lower() for phrase in template_phrases):
            indicators.append("template_language")
        
        # Platform-specific indicators
        if platform == "telegram":
            if "/start" in text or "/help" in text:
                indicators.append("bot_commands")
        
        return indicators
    
    def _get_platform_score(self, platform: str) -> int:
        """Get platform-specific threat score adjustment"""
        platform_scores = {
            "telegram": 10,  # Higher risk due to encryption
            "whatsapp": 5,   # Medium risk
            "instagram": 8,  # Higher risk due to visual content
            "unknown": 0
        }
        return platform_scores.get(platform.lower(), 0)
    
    def _get_risk_level(self, threat_score: int) -> str:
        """Determine risk level based on threat score"""
        if threat_score >= 80:
            return "high"
        elif threat_score >= 50:
            return "medium"
        else:
            return "low"
    
    def _calculate_confidence(self, analysis: Dict[str, Any]) -> float:
        """Calculate confidence in the analysis"""
        confidence = 0.0
        
        # Base confidence from threat score
        if analysis["threat_score"] > 0:
            confidence += 0.3
        
        # Additional confidence from multiple indicators
        if analysis["keyword_matches"]:
            confidence += 0.2
        if analysis["slang_matches"]:
            confidence += 0.15
        if analysis["emoji_matches"]:
            confidence += 0.1
        if analysis["context_matches"]:
            confidence += 0.15
        if analysis["metadata_found"]:
            confidence += 0.1
        
        return min(1.0, confidence)
    
    def batch_analyze(self, texts: List[str], platforms: List[str] = None) -> List[Dict[str, Any]]:
        """Analyze multiple texts in batch"""
        if platforms is None:
            platforms = ["unknown"] * len(texts)
        
        results = []
        for text, platform in zip(texts, platforms):
            result = self.analyze_content(text, platform)
            results.append(result)
        
        return results
    
    def get_statistics(self, analyses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get statistics from batch analysis"""
        if not analyses:
            return {}
        
        threat_scores = [a["threat_score"] for a in analyses]
        risk_levels = [a["risk_level"] for a in analyses]
        
        return {
            "total_analyses": len(analyses),
            "average_threat_score": sum(threat_scores) / len(threat_scores),
            "max_threat_score": max(threat_scores),
            "min_threat_score": min(threat_scores),
            "high_risk_count": risk_levels.count("high"),
            "medium_risk_count": risk_levels.count("medium"),
            "low_risk_count": risk_levels.count("low"),
            "average_confidence": sum(a["confidence"] for a in analyses) / len(analyses)
        } 