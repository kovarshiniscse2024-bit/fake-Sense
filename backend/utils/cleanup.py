import os
import logging
from typing import List

logger = logging.getLogger("fakesense.cleanup")


def safe_remove_files(filepaths: List[str]) -> None:
    for path in filepaths:
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except Exception as e:
                logger.warning(f"Could not remove temp file {path}: {e}")
