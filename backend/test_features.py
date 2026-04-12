import numpy as np
import re
from scipy.sparse import csr_matrix
from sklearn.base import BaseEstimator, TransformerMixin

class HandcraftedFeatures(BaseEstimator, TransformerMixin):
    """Extracts numerical heuristic features from raw text."""

    URL_RE    = re.compile(r"https?://\S+|www\.\S+", re.I)
    IP_RE     = re.compile(r"\b\d{1,3}(\.\d{1,3}){3}\b")
    MONEY_RE  = re.compile(r"[\$£₹€]\s?\d+|(?:rs\.?|rupees|dollars?)\s?\d+|\d+\s?(?:rs\.?|rupees|dollars?)", re.I)
    URGENT_RE = re.compile(r"urgent|asap|immediately|act now|limited time|expire|last chance|final notice|warning|hurry", re.I)
    PRIZE_RE  = re.compile(r"winner|prize|lottery|reward|congrat|won|selected|free|gift", re.I)
    OTP_RE    = re.compile(r"\botp\b|\bpin\b|\bpassword\b|share.*code|don.t share", re.I)
    SUSPICIOUS_TLDS = re.compile(r"\.(xyz|tk|ml|ga|cf|gq|click|link|online|site|top|pw|cc|work)\b", re.I)
    
    _SUSPICIOUS_KEYWORDS = re.compile(
        r"verify|kyc|suspend|blocked|compromised|hack|illegal|arrest|"
        r"warrant|irs|tax|refund|inheritance|prince|nigerian|soldier|"
        r"stranded|western union|moneygram|bitcoin|crypto|wallet|"
        r"claim|redeem|activate|confirm|limited|urgent|asap", re.I
    )

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        feats = []
        for text in X:
            t = str(text)
            urls    = self.URL_RE.findall(t)
            n_urls  = len(urls)
            has_ip  = int(bool(self.IP_RE.search(t)))
            n_money = len(self.MONEY_RE.findall(t))
            has_urgent = int(bool(self.URGENT_RE.search(t)))
            has_prize  = int(bool(self.PRIZE_RE.search(t)))
            has_otp    = int(bool(self.OTP_RE.search(t)))
            n_suspicious_kw = len(self._SUSPICIOUS_KEYWORDS.findall(t))
            has_bad_tld     = int(bool(self.SUSPICIOUS_TLDS.search(t)))

            # URL-specific
            url_len    = len(urls[0]) if urls else 0
            n_subdomains = (urls[0].count(".") - 1) if urls else 0
            has_http_not_s = int(any(u.startswith("http://") for u in urls))
            
            # New URL features
            n_special_url = sum(1 for c in (urls[0] if urls else "") if c in "@-#_?=")
            has_port      = int(":" in (urls[0].split("//")[-1] if urls else ""))

            # Text features
            n_caps      = sum(1 for c in t if c.isupper())
            text_len    = len(t)
            caps_ratio  = n_caps / max(text_len, 1)
            n_exclaim   = t.count("!")
            n_question  = t.count("?")
            n_digits    = sum(1 for c in t if c.isdigit())
            digits_ratio = n_digits / max(text_len, 1)

            feats.append([
                n_urls, has_ip, n_money, has_urgent, has_prize, has_otp,
                n_suspicious_kw, has_bad_tld, url_len, n_subdomains,
                has_http_not_s, caps_ratio, n_exclaim, n_question, text_len,
                n_special_url, has_port, digits_ratio
            ])
        return csr_matrix(np.array(feats, dtype=np.float32))

hf = HandcraftedFeatures()
test_text = "Free prize! Click http://secure.xyz/login?id=123"
res = hf.transform([test_text])
print(f"Features: {res.toarray()}")
print("Success!")
