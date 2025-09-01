import re
import time
from typing import Dict, List, Any, Tuple
from datetime import datetime, timedelta
from collections import defaultdict, Counter

class BotDetector:
    """
    Bot detection system for identifying automated behavior patterns
    """
    
    def __init__(self):
        self.bot_patterns = self._load_bot_patterns()
        self.behavior_thresholds = self._load_behavior_thresholds()
        self.template_phrases = self._load_template_phrases()
        
    def _load_bot_patterns(self) -> Dict[str, List[str]]:
        """Load patterns that indicate bot behavior"""
        return {
            "repetitive_content": [
                r'(\b\w+\b)(?:\s+\1){2,}',  # Repeated words
                r'([^\w\s])\1{2,}',  # Repeated punctuation
                r'(\d+)\1{2,}',  # Repeated numbers
            ],
            "template_language": [
                r'contact\s+for\s+details',
                r'dm\s+for\s+info',
                r'available\s+now',
                r'best\s+quality',
                r'discrete\s+delivery',
                r'trusted\s+supplier',
                r'no\s+questions',
                r'cash\s+only',
                r'bitcoin\s+accepted',
                r'upi\s+payment'
            ],
            "excessive_emojis": [
                r'[^\w\s]{3,}',  # 3+ consecutive non-word characters
                r'[🔥💊💉🌿💰💵🤑💸🚀⚡💥🎉🦄🌈⭐💎🔮✨🎭🎪]{2,}'  # Drug-related emojis
            ],
            "bot_commands": [
                r'^/start\b',
                r'^/help\b',
                r'^/menu\b',
                r'^/info\b',
                r'^/contact\b'
            ],
            "suspicious_timing": [
                r'24/7',
                r'always\s+available',
                r'immediate\s+response',
                r'instant\s+delivery'
            ]
        }
    
    def _load_behavior_thresholds(self) -> Dict[str, float]:
        """Load thresholds for bot behavior detection"""
        return {
            "message_frequency": 10.0,  # messages per hour
            "repetitive_content_ratio": 0.3,  # 30% repetitive content
            "template_usage_ratio": 0.5,  # 50% template phrases
            "emoji_density": 0.4,  # 40% emojis in text
            "response_time": 2.0,  # 2 seconds average response time
            "identical_messages": 0.2,  # 20% identical messages
            "url_density": 0.3,  # 30% messages with URLs
            "hashtag_density": 0.4  # 40% messages with hashtags
        }
    
    def _load_template_phrases(self) -> List[str]:
        """Load common template phrases used by bots"""
        return [
            "contact for details",
            "dm for info",
            "available now",
            "best quality",
            "discrete delivery",
            "trusted supplier",
            "no questions asked",
            "cash only",
            "bitcoin accepted",
            "upi payment",
            "delivery available",
            "pickup service",
            "meet and greet",
            "quality guaranteed",
            "pure stuff",
            "premium quality",
            "discrete packaging",
            "fast delivery",
            "reliable service",
            "trusted dealer"
        ]
    
    def detect_bot_behavior(self, messages: List[Dict[str, Any]], platform: str = "unknown") -> Dict[str, Any]:
        """
        Detect bot behavior from a list of messages
        
        Args:
            messages: List of message dictionaries with text, timestamp, etc.
            platform: Platform where messages were found
            
        Returns:
            Bot detection results with confidence and indicators
        """
        if not messages:
            return self._empty_detection_result()
        
        # Initialize detection results
        detection = {
            "is_bot": False,
            "confidence": 0.0,
            "indicators": [],
            "behavior_patterns": {},
            "risk_score": 0,
            "timestamp": datetime.now().isoformat()
        }
        
        # Extract text content
        texts = [msg.get("text", "") for msg in messages]
        timestamps = [msg.get("timestamp", datetime.now()) for msg in messages]
        
        # 1. Content Analysis
        content_analysis = self._analyze_content_patterns(texts)
        detection["behavior_patterns"]["content"] = content_analysis
        
        # 2. Timing Analysis
        timing_analysis = self._analyze_timing_patterns(timestamps, texts)
        detection["behavior_patterns"]["timing"] = timing_analysis
        
        # 3. Language Analysis
        language_analysis = self._analyze_language_patterns(texts)
        detection["behavior_patterns"]["language"] = language_analysis
        
        # 4. Platform-specific Analysis
        platform_analysis = self._analyze_platform_patterns(texts, platform)
        detection["behavior_patterns"]["platform"] = platform_analysis
        
        # 5. Calculate overall bot probability
        bot_probability = self._calculate_bot_probability(detection["behavior_patterns"])
        detection["confidence"] = bot_probability
        
        # 6. Determine if it's a bot
        detection["is_bot"] = bot_probability > 0.7
        
        # 7. Calculate risk score
        detection["risk_score"] = int(bot_probability * 100)
        
        # 8. Generate indicators
        detection["indicators"] = self._generate_indicators(detection["behavior_patterns"])
        
        return detection
    
    def _analyze_content_patterns(self, texts: List[str]) -> Dict[str, Any]:
        """Analyze content for repetitive patterns"""
        analysis = {
            "repetitive_content": 0.0,
            "template_usage": 0.0,
            "emoji_density": 0.0,
            "identical_messages": 0.0,
            "url_density": 0.0,
            "hashtag_density": 0.0
        }
        
        if not texts:
            return analysis
        
        # Repetitive content
        repetitive_count = 0
        for text in texts:
            if self._is_repetitive_content(text):
                repetitive_count += 1
        analysis["repetitive_content"] = repetitive_count / len(texts)
        
        # Template usage
        template_count = 0
        for text in texts:
            if self._contains_template_phrases(text):
                template_count += 1
        analysis["template_usage"] = template_count / len(texts)
        
        # Emoji density
        total_emojis = sum(self._count_emojis(text) for text in texts)
        total_chars = sum(len(text) for text in texts)
        analysis["emoji_density"] = total_emojis / total_chars if total_chars > 0 else 0.0
        
        # Identical messages
        text_counter = Counter(texts)
        identical_count = sum(count - 1 for count in text_counter.values() if count > 1)
        analysis["identical_messages"] = identical_count / len(texts)
        
        # URL density
        url_count = sum(1 for text in texts if self._contains_urls(text))
        analysis["url_density"] = url_count / len(texts)
        
        # Hashtag density
        hashtag_count = sum(1 for text in texts if self._contains_hashtags(text))
        analysis["hashtag_density"] = hashtag_count / len(texts)
        
        return analysis
    
    def _analyze_timing_patterns(self, timestamps: List[datetime], texts: List[str]) -> Dict[str, Any]:
        """Analyze timing patterns for bot behavior"""
        analysis = {
            "message_frequency": 0.0,
            "response_time": 0.0,
            "regular_posting": False,
            "burst_posting": False
        }
        
        if len(timestamps) < 2:
            return analysis
        
        # Sort by timestamp
        sorted_data = sorted(zip(timestamps, texts), key=lambda x: x[0])
        timestamps = [t for t, _ in sorted_data]
        
        # Calculate message frequency (messages per hour)
        time_span = (timestamps[-1] - timestamps[0]).total_seconds() / 3600
        analysis["message_frequency"] = len(timestamps) / time_span if time_span > 0 else 0.0
        
        # Calculate average response time
        response_times = []
        for i in range(1, len(timestamps)):
            response_time = (timestamps[i] - timestamps[i-1]).total_seconds()
            response_times.append(response_time)
        
        if response_times:
            analysis["response_time"] = sum(response_times) / len(response_times)
        
        # Check for regular posting patterns
        analysis["regular_posting"] = self._is_regular_posting(timestamps)
        
        # Check for burst posting
        analysis["burst_posting"] = self._is_burst_posting(timestamps)
        
        return analysis
    
    def _analyze_language_patterns(self, texts: List[str]) -> Dict[str, Any]:
        """Analyze language patterns for bot indicators"""
        analysis = {
            "formal_language": 0.0,
            "casual_language": 0.0,
            "mixed_language": 0.0,
            "spelling_errors": 0.0,
            "capitalization": 0.0
        }
        
        if not texts:
            return analysis
        
        for text in texts:
            # Check language style
            if self._is_formal_language(text):
                analysis["formal_language"] += 1
            elif self._is_casual_language(text):
                analysis["casual_language"] += 1
            else:
                analysis["mixed_language"] += 1
            
            # Check spelling errors
            if self._has_spelling_errors(text):
                analysis["spelling_errors"] += 1
            
            # Check excessive capitalization
            if self._has_excessive_capitalization(text):
                analysis["capitalization"] += 1
        
        # Normalize counts
        total = len(texts)
        for key in analysis:
            analysis[key] = analysis[key] / total
        
        return analysis
    
    def _analyze_platform_patterns(self, texts: List[str], platform: str) -> Dict[str, Any]:
        """Analyze platform-specific patterns"""
        analysis = {
            "bot_commands": 0.0,
            "platform_specific": 0.0,
            "cross_platform": 0.0
        }
        
        if not texts:
            return analysis
        
        for text in texts:
            # Check for bot commands
            if self._contains_bot_commands(text, platform):
                analysis["bot_commands"] += 1
            
            # Check for platform-specific patterns
            if self._is_platform_specific(text, platform):
                analysis["platform_specific"] += 1
            
            # Check for cross-platform content
            if self._is_cross_platform_content(text):
                analysis["cross_platform"] += 1
        
        # Normalize counts
        total = len(texts)
        for key in analysis:
            analysis[key] = analysis[key] / total
        
        return analysis
    
    def _is_repetitive_content(self, text: str) -> bool:
        """Check if text contains repetitive patterns"""
        for pattern in self.bot_patterns["repetitive_content"]:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False
    
    def _contains_template_phrases(self, text: str) -> bool:
        """Check if text contains template phrases"""
        text_lower = text.lower()
        return any(phrase in text_lower for phrase in self.template_phrases)
    
    def _count_emojis(self, text: str) -> int:
        """Count emoji characters in text"""
        return sum(1 for char in text if ord(char) > 127)
    
    def _contains_urls(self, text: str) -> bool:
        """Check if text contains URLs"""
        url_pattern = r'https?://\S+|www\.\S+'
        return bool(re.search(url_pattern, text))
    
    def _contains_hashtags(self, text: str) -> bool:
        """Check if text contains hashtags"""
        hashtag_pattern = r'#\w+'
        return bool(re.search(hashtag_pattern, text))
    
    def _is_regular_posting(self, timestamps: List[datetime]) -> bool:
        """Check if posting follows a regular pattern"""
        if len(timestamps) < 3:
            return False
        
        intervals = []
        for i in range(1, len(timestamps)):
            interval = (timestamps[i] - timestamps[i-1]).total_seconds()
            intervals.append(interval)
        
        # Check if intervals are consistent (within 20% variation)
        if len(intervals) < 2:
            return False
        
        avg_interval = sum(intervals) / len(intervals)
        variations = [abs(interval - avg_interval) / avg_interval for interval in intervals]
        
        return all(variation < 0.2 for variation in variations)
    
    def _is_burst_posting(self, timestamps: List[datetime]) -> bool:
        """Check if posting shows burst patterns"""
        if len(timestamps) < 3:
            return False
        
        # Check for multiple posts within short time intervals
        short_intervals = 0
        for i in range(1, len(timestamps)):
            interval = (timestamps[i] - timestamps[i-1]).total_seconds()
            if interval < 60:  # Less than 1 minute
                short_intervals += 1
        
        return short_intervals >= len(timestamps) * 0.3
    
    def _is_formal_language(self, text: str) -> bool:
        """Check if text uses formal language"""
        formal_indicators = [
            "please", "kindly", "regards", "sincerely", "thank you",
            "would you", "could you", "may i", "shall we"
        ]
        text_lower = text.lower()
        return any(indicator in text_lower for indicator in formal_indicators)
    
    def _is_casual_language(self, text: str) -> bool:
        """Check if text uses casual language"""
        casual_indicators = [
            "hey", "hi", "yo", "what's up", "cool", "awesome",
            "lol", "omg", "wtf", "btw", "imo", "tbh"
        ]
        text_lower = text.lower()
        return any(indicator in text_lower for indicator in casual_indicators)
    
    def _has_spelling_errors(self, text: str) -> bool:
        """Check for obvious spelling errors"""
        # Simple heuristic - check for repeated characters
        repeated_chars = re.findall(r'(.)\1{2,}', text)
        return len(repeated_chars) > 0
    
    def _has_excessive_capitalization(self, text: str) -> bool:
        """Check for excessive capitalization"""
        if len(text) < 10:
            return False
        
        upper_count = sum(1 for char in text if char.isupper())
        return upper_count / len(text) > 0.7
    
    def _contains_bot_commands(self, text: str, platform: str) -> bool:
        """Check for bot commands"""
        if platform.lower() == "telegram":
            for pattern in self.bot_patterns["bot_commands"]:
                if re.search(pattern, text, re.IGNORECASE):
                    return True
        return False
    
    def _is_platform_specific(self, text: str, platform: str) -> bool:
        """Check for platform-specific content"""
        platform_indicators = {
            "telegram": ["@", "t.me", "/start", "/help"],
            "whatsapp": ["wa.me", "whatsapp", "group"],
            "instagram": ["#", "@", "instagram", "ig", "story"]
        }
        
        indicators = platform_indicators.get(platform.lower(), [])
        text_lower = text.lower()
        return any(indicator in text_lower for indicator in indicators)
    
    def _is_cross_platform_content(self, text: str) -> bool:
        """Check if content is generic enough for cross-platform use"""
        generic_phrases = [
            "contact for details", "dm for info", "available now",
            "best quality", "delivery available", "cash only"
        ]
        text_lower = text.lower()
        return any(phrase in text_lower for phrase in generic_phrases)
    
    def _calculate_bot_probability(self, behavior_patterns: Dict[str, Any]) -> float:
        """Calculate overall bot probability from behavior patterns"""
        probability = 0.0
        weights = {
            "content": 0.4,
            "timing": 0.3,
            "language": 0.2,
            "platform": 0.1
        }
        
        # Content analysis weight
        content = behavior_patterns.get("content", {})
        content_score = (
            content.get("repetitive_content", 0) * 0.3 +
            content.get("template_usage", 0) * 0.3 +
            content.get("emoji_density", 0) * 0.2 +
            content.get("identical_messages", 0) * 0.2
        )
        probability += content_score * weights["content"]
        
        # Timing analysis weight
        timing = behavior_patterns.get("timing", {})
        timing_score = 0.0
        if timing.get("message_frequency", 0) > self.behavior_thresholds["message_frequency"]:
            timing_score += 0.5
        if timing.get("response_time", 0) < self.behavior_thresholds["response_time"]:
            timing_score += 0.3
        if timing.get("regular_posting", False):
            timing_score += 0.2
        probability += timing_score * weights["timing"]
        
        # Language analysis weight
        language = behavior_patterns.get("language", {})
        language_score = (
            language.get("formal_language", 0) * 0.4 +
            language.get("spelling_errors", 0) * 0.3 +
            language.get("capitalization", 0) * 0.3
        )
        probability += language_score * weights["language"]
        
        # Platform analysis weight
        platform = behavior_patterns.get("platform", {})
        platform_score = (
            platform.get("bot_commands", 0) * 0.6 +
            platform.get("cross_platform", 0) * 0.4
        )
        probability += platform_score * weights["platform"]
        
        return min(1.0, probability)
    
    def _generate_indicators(self, behavior_patterns: Dict[str, Any]) -> List[str]:
        """Generate human-readable indicators"""
        indicators = []
        
        content = behavior_patterns.get("content", {})
        timing = behavior_patterns.get("timing", {})
        language = behavior_patterns.get("language", {})
        platform = behavior_patterns.get("platform", {})
        
        # Content indicators
        if content.get("repetitive_content", 0) > 0.3:
            indicators.append("High repetitive content")
        if content.get("template_usage", 0) > 0.5:
            indicators.append("Frequent template phrases")
        if content.get("emoji_density", 0) > 0.4:
            indicators.append("Excessive emoji usage")
        if content.get("identical_messages", 0) > 0.2:
            indicators.append("Duplicate messages detected")
        
        # Timing indicators
        if timing.get("message_frequency", 0) > 10:
            indicators.append("Unusually high posting frequency")
        if timing.get("response_time", 0) < 2:
            indicators.append("Suspiciously fast response times")
        if timing.get("regular_posting", False):
            indicators.append("Mechanical posting schedule")
        if timing.get("burst_posting", False):
            indicators.append("Burst posting patterns")
        
        # Language indicators
        if language.get("formal_language", 0) > 0.7:
            indicators.append("Overly formal language")
        if language.get("spelling_errors", 0) > 0.3:
            indicators.append("Frequent spelling errors")
        if language.get("capitalization", 0) > 0.5:
            indicators.append("Excessive capitalization")
        
        # Platform indicators
        if platform.get("bot_commands", 0) > 0.3:
            indicators.append("Bot command usage")
        if platform.get("cross_platform", 0) > 0.6:
            indicators.append("Generic cross-platform content")
        
        return indicators
    
    def _empty_detection_result(self) -> Dict[str, Any]:
        """Return empty detection result"""
        return {
            "is_bot": False,
            "confidence": 0.0,
            "indicators": [],
            "behavior_patterns": {},
            "risk_score": 0,
            "timestamp": datetime.now().isoformat()
        } 