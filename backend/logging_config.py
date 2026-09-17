import logging
import json
import re
from datetime import datetime

class HealthcareJSONFormatter(logging.Formatter):
    """
    Structured JSON Logger adhering to PDPA and Healthcare Compliance.
    Automatically masks potential PII (Thai National ID, Phone numbers).
    """
    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "log_level": record.levelname,
            "logger": record.name,
            "message": self._mask_pii(record.getMessage()),
            "module": record.module,
            "func_name": record.funcName,
            "line_no": record.lineno,
        }
        if hasattr(record, "trace_id"):
            log_obj["trace_id"] = getattr(record, "trace_id")
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj, ensure_ascii=False)

    @staticmethod
    def _mask_pii(text: str) -> str:
        if not isinstance(text, str):
            return text
        # Mask 13-digit Thai National ID: X-XXXX-XXXXX-XX-X -> X-XXXX-XXXXX-XX-*
        text = re.sub(r'\b(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})\b', r'\1-\2-\3-\4-*', text)
        # Mask Phone numbers
        text = re.sub(r'\b(0\d{8,9})\b', r'0**-***-***', text)
        return text

def setup_logger(name: str = "donated_medicine_backend"):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(HealthcareJSONFormatter())
        logger.addHandler(handler)
    return logger

logger = setup_logger()
