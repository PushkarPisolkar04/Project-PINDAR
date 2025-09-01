import re
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
try:
    import pytesseract
    from PIL import Image
    import io
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

class MetadataExtractor:
    """
    Metadata extraction system for identifying contact information and identifiers
    """
    
    def __init__(self):
        self.patterns = self._load_extraction_patterns()
        self.ocr_enabled = OCR_AVAILABLE and self._check_ocr_availability()
        
    def _load_extraction_patterns(self) -> Dict[str, str]:
        """Load regex patterns for different types of metadata"""
        return {
            # Phone numbers (Indian format)
            "phone_india": r'\+?91[-\s]?\d{5}[-\s]?\d{5}',
            "phone_international": r'\+?[1-9]\d{1,14}',
            "phone_local": r'\b\d{10}\b',
            
            # Email addresses
            "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            
            # UPI IDs
            "upi": r'\b[A-Za-z0-9._%+-]+@[A-Za-z]{2,}\b',
            
            # Bitcoin addresses
            "bitcoin": r'\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b',
            "bitcoin_segwit": r'\b(bc1)[a-z0-9]{25,39}\b',
            
            # Ethereum addresses
            "ethereum": r'\b0x[a-fA-F0-9]{40}\b',
            
            # Social media handles
            "telegram": r'@[A-Za-z0-9_]{5,32}',
            "instagram": r'@[A-Za-z0-9_.]{1,30}',
            "twitter": r'@[A-Za-z0-9_]{1,15}',
            
            # Hashtags
            "hashtags": r'#\w+',
            
            # URLs
            "urls": r'https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?',
            
            # Bank account numbers (Indian format)
            "bank_account": r'\b\d{9,18}\b',
            
            # IFSC codes
            "ifsc": r'\b[A-Z]{4}0[A-Z0-9]{6}\b',
            
            # PAN numbers
            "pan": r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b',
            
            # Aadhaar numbers (masked)
            "aadhaar": r'\b\d{4}\s?\d{4}\s?\d{4}\b',
            
            # Location indicators
            "location": r'\b(Mumbai|Delhi|Bangalore|Chennai|Kolkata|Hyderabad|Pune|Ahmedabad|Jaipur|Lucknow)\b',
            
            # Time indicators
            "time": r'\b(24/7|always|available|ready|immediate|instant)\b',
            
            # Payment methods
            "payment_methods": r'\b(cash|upi|bitcoin|crypto|bank\s+transfer|paytm|gpay|phonepe)\b'
        }
    
    def _check_ocr_availability(self) -> bool:
        """Check if OCR is available"""
        try:
            import pytesseract
            pytesseract.get_tesseract_version()
            return True
        except:
            return False
    
    def extract_metadata(self, text: str, images: List[bytes] = None) -> Dict[str, Any]:
        """
        Extract metadata from text and images
        
        Args:
            text: Text content to analyze
            images: List of image bytes for OCR analysis
            
        Returns:
            Dictionary containing extracted metadata
        """
        metadata = {
            "phone_numbers": [],
            "email_addresses": [],
            "upi_ids": [],
            "cryptocurrency_addresses": [],
            "social_media_handles": [],
            "hashtags": [],
            "urls": [],
            "bank_details": [],
            "location_indicators": [],
            "time_indicators": [],
            "payment_methods": [],
            "ocr_extracted": [],
            "confidence_scores": {},
            "timestamp": datetime.now().isoformat()
        }
        
        # Extract from text
        text_metadata = self._extract_from_text(text)
        for key, value in text_metadata.items():
            if key in metadata and value:
                metadata[key].extend(value)
        
        # Extract from images using OCR
        if images and self.ocr_enabled:
            ocr_metadata = self._extract_from_images(images)
            metadata["ocr_extracted"] = ocr_metadata
        
        # Calculate confidence scores
        metadata["confidence_scores"] = self._calculate_confidence_scores(metadata)
        
        # Remove duplicates and clean data
        metadata = self._clean_metadata(metadata)
        
        return metadata
    
    def _extract_from_text(self, text: str) -> Dict[str, List[str]]:
        """Extract metadata from text content"""
        extracted = {}
        
        for metadata_type, pattern in self.patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                extracted[metadata_type] = list(set(matches))  # Remove duplicates
        
        # Categorize extracted data
        categorized = {
            "phone_numbers": [],
            "email_addresses": [],
            "upi_ids": [],
            "cryptocurrency_addresses": [],
            "social_media_handles": [],
            "hashtags": [],
            "urls": [],
            "bank_details": [],
            "location_indicators": [],
            "time_indicators": [],
            "payment_methods": []
        }
        
        # Phone numbers
        for phone_type in ["phone_india", "phone_international", "phone_local"]:
            if phone_type in extracted:
                categorized["phone_numbers"].extend(extracted[phone_type])
        
        # Email addresses
        if "email" in extracted:
            categorized["email_addresses"] = extracted["email"]
        
        # UPI IDs
        if "upi" in extracted:
            # Filter out regular emails from UPI matches
            upi_matches = []
            for match in extracted["upi"]:
                if '@' in match and '.' not in match.split('@')[1]:
                    upi_matches.append(match)
            categorized["upi_ids"] = upi_matches
        
        # Cryptocurrency addresses
        for crypto_type in ["bitcoin", "bitcoin_segwit", "ethereum"]:
            if crypto_type in extracted:
                categorized["cryptocurrency_addresses"].extend(extracted[crypto_type])
        
        # Social media handles
        for social_type in ["telegram", "instagram", "twitter"]:
            if social_type in extracted:
                categorized["social_media_handles"].extend(extracted[social_type])
        
        # Hashtags
        if "hashtags" in extracted:
            categorized["hashtags"] = extracted["hashtags"]
        
        # URLs
        if "urls" in extracted:
            categorized["urls"] = extracted["urls"]
        
        # Bank details
        bank_details = []
        if "bank_account" in extracted:
            bank_details.extend(extracted["bank_account"])
        if "ifsc" in extracted:
            bank_details.extend(extracted["ifsc"])
        if "pan" in extracted:
            bank_details.extend(extracted["pan"])
        if "aadhaar" in extracted:
            bank_details.extend(extracted["aadhaar"])
        categorized["bank_details"] = bank_details
        
        # Location indicators
        if "location" in extracted:
            categorized["location_indicators"] = extracted["location"]
        
        # Time indicators
        if "time" in extracted:
            categorized["time_indicators"] = extracted["time"]
        
        # Payment methods
        if "payment_methods" in extracted:
            categorized["payment_methods"] = extracted["payment_methods"]
        
        return categorized
    
    def _extract_from_images(self, images: List[bytes]) -> List[Dict[str, Any]]:
        """Extract metadata from images using OCR"""
        ocr_results = []
        
        for i, image_bytes in enumerate(images):
            try:
                # Convert bytes to PIL Image
                image = Image.open(io.BytesIO(image_bytes))
                
                # Extract text using OCR
                ocr_text = pytesseract.image_to_string(image)
                
                # Extract metadata from OCR text
                ocr_metadata = self._extract_from_text(ocr_text)
                
                ocr_results.append({
                    "image_index": i,
                    "extracted_text": ocr_text,
                    "metadata": ocr_metadata,
                    "confidence": self._calculate_ocr_confidence(ocr_text)
                })
                
            except Exception as e:
                ocr_results.append({
                    "image_index": i,
                    "error": str(e),
                    "metadata": {},
                    "confidence": 0.0
                })
        
        return ocr_results
    
    def _calculate_ocr_confidence(self, ocr_text: str) -> float:
        """Calculate confidence in OCR extraction"""
        if not ocr_text.strip():
            return 0.0
        
        # Simple heuristic based on text length and character types
        text_length = len(ocr_text)
        alpha_count = sum(1 for char in ocr_text if char.isalpha())
        digit_count = sum(1 for char in ocr_text if char.isdigit())
        
        if text_length == 0:
            return 0.0
        
        # Higher confidence for longer texts with good character distribution
        confidence = min(1.0, text_length / 100)  # Base confidence
        confidence += (alpha_count + digit_count) / text_length * 0.3  # Character quality
        
        return min(1.0, confidence)
    
    def _calculate_confidence_scores(self, metadata: Dict[str, Any]) -> Dict[str, float]:
        """Calculate confidence scores for extracted metadata"""
        confidence_scores = {}
        
        # Phone number confidence
        phone_confidence = 0.0
        if metadata["phone_numbers"]:
            valid_phones = sum(1 for phone in metadata["phone_numbers"] 
                             if self._is_valid_phone(phone))
            phone_confidence = valid_phones / len(metadata["phone_numbers"])
        confidence_scores["phone_numbers"] = phone_confidence
        
        # Email confidence
        email_confidence = 0.0
        if metadata["email_addresses"]:
            valid_emails = sum(1 for email in metadata["email_addresses"] 
                             if self._is_valid_email(email))
            email_confidence = valid_emails / len(metadata["email_addresses"])
        confidence_scores["email_addresses"] = email_confidence
        
        # UPI confidence
        upi_confidence = 0.0
        if metadata["upi_ids"]:
            valid_upis = sum(1 for upi in metadata["upi_ids"] 
                           if self._is_valid_upi(upi))
            upi_confidence = valid_upis / len(metadata["upi_ids"])
        confidence_scores["upi_ids"] = upi_confidence
        
        # Cryptocurrency confidence
        crypto_confidence = 0.0
        if metadata["cryptocurrency_addresses"]:
            valid_cryptos = sum(1 for crypto in metadata["cryptocurrency_addresses"] 
                              if self._is_valid_crypto_address(crypto))
            crypto_confidence = valid_cryptos / len(metadata["cryptocurrency_addresses"])
        confidence_scores["cryptocurrency_addresses"] = crypto_confidence
        
        # Overall confidence
        total_items = sum(len(v) for v in metadata.values() if isinstance(v, list))
        if total_items > 0:
            overall_confidence = sum(confidence_scores.values()) / len(confidence_scores)
        else:
            overall_confidence = 0.0
        
        confidence_scores["overall"] = overall_confidence
        
        return confidence_scores
    
    def _is_valid_phone(self, phone: str) -> bool:
        """Validate phone number format"""
        # Remove common separators
        clean_phone = re.sub(r'[-\s]', '', phone)
        
        # Check Indian format
        if clean_phone.startswith('91') and len(clean_phone) == 12:
            return True
        
        # Check international format
        if clean_phone.startswith('+') and 7 <= len(clean_phone) <= 15:
            return True
        
        # Check local format (10 digits)
        if len(clean_phone) == 10 and clean_phone.isdigit():
            return True
        
        return False
    
    def _is_valid_email(self, email: str) -> bool:
        """Validate email format"""
        email_pattern = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
        return bool(re.match(email_pattern, email))
    
    def _is_valid_upi(self, upi: str) -> bool:
        """Validate UPI ID format"""
        # UPI format: username@bank
        if '@' not in upi:
            return False
        
        username, bank = upi.split('@', 1)
        
        # Username should be alphanumeric and 3-50 characters
        if not re.match(r'^[A-Za-z0-9._-]{3,50}$', username):
            return False
        
        # Bank should be 2-10 characters, no dots
        if not re.match(r'^[A-Za-z]{2,10}$', bank):
            return False
        
        return True
    
    def _is_valid_crypto_address(self, address: str) -> bool:
        """Validate cryptocurrency address format"""
        # Bitcoin address
        if re.match(r'^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$', address):
            return True
        
        # Bitcoin SegWit address
        if re.match(r'^bc1[a-z0-9]{25,39}$', address):
            return True
        
        # Ethereum address
        if re.match(r'^0x[a-fA-F0-9]{40}$', address):
            return True
        
        return False
    
    def _clean_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Clean and deduplicate metadata"""
        cleaned = {}
        
        for key, value in metadata.items():
            if isinstance(value, list):
                # Remove duplicates while preserving order
                seen = set()
                cleaned_list = []
                for item in value:
                    if item not in seen:
                        seen.add(item)
                        cleaned_list.append(item)
                cleaned[key] = cleaned_list
            else:
                cleaned[key] = value
        
        return cleaned
    
    def generate_metadata_summary(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a summary of extracted metadata"""
        summary = {
            "total_phone_numbers": len(metadata.get("phone_numbers", [])),
            "total_emails": len(metadata.get("email_addresses", [])),
            "total_upi_ids": len(metadata.get("upi_ids", [])),
            "total_crypto_addresses": len(metadata.get("cryptocurrency_addresses", [])),
            "total_social_handles": len(metadata.get("social_media_handles", [])),
            "total_hashtags": len(metadata.get("hashtags", [])),
            "total_urls": len(metadata.get("urls", [])),
            "total_bank_details": len(metadata.get("bank_details", [])),
            "ocr_images_processed": len(metadata.get("ocr_extracted", [])),
            "overall_confidence": metadata.get("confidence_scores", {}).get("overall", 0.0),
            "high_confidence_items": [],
            "suspicious_patterns": []
        }
        
        # Identify high confidence items
        confidence_scores = metadata.get("confidence_scores", {})
        for item_type, confidence in confidence_scores.items():
            if confidence > 0.8:
                summary["high_confidence_items"].append({
                    "type": item_type,
                    "confidence": confidence,
                    "count": len(metadata.get(item_type, []))
                })
        
        # Identify suspicious patterns
        suspicious_patterns = self._identify_suspicious_patterns(metadata)
        summary["suspicious_patterns"] = suspicious_patterns
        
        return summary
    
    def _identify_suspicious_patterns(self, metadata: Dict[str, Any]) -> List[str]:
        """Identify suspicious patterns in metadata"""
        patterns = []
        
        # Multiple payment methods
        payment_methods = metadata.get("payment_methods", [])
        if len(payment_methods) > 2:
            patterns.append(f"Multiple payment methods: {', '.join(payment_methods)}")
        
        # Cryptocurrency addresses
        crypto_addresses = metadata.get("cryptocurrency_addresses", [])
        if crypto_addresses:
            patterns.append(f"Cryptocurrency addresses found: {len(crypto_addresses)}")
        
        # Multiple phone numbers
        phone_numbers = metadata.get("phone_numbers", [])
        if len(phone_numbers) > 3:
            patterns.append(f"Multiple phone numbers: {len(phone_numbers)}")
        
        # Anonymous email providers
        emails = metadata.get("email_addresses", [])
        anonymous_providers = ["protonmail.com", "tutanota.com", "tutanota.de", "mail.com"]
        anonymous_emails = [email for email in emails 
                          if any(provider in email.lower() for provider in anonymous_providers)]
        if anonymous_emails:
            patterns.append(f"Anonymous email providers: {', '.join(anonymous_emails)}")
        
        # 24/7 availability
        time_indicators = metadata.get("time_indicators", [])
        if "24/7" in time_indicators or "always" in time_indicators:
            patterns.append("24/7 availability indicated")
        
        return patterns 