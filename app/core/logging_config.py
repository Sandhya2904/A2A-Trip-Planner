from __future__ import annotations

import logging
import sys


def configure_logging() -> None:
    """
    Configure application logging.

    This gives the backend clean terminal logs without adding external logging
    dependencies. Later, this can be extended to JSON logs, file logs, or cloud
    logging providers.
    """

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
        ],
    )


def get_logger(name: str) -> logging.Logger:
    """
    Return a named logger for application modules.
    """

    return logging.getLogger(name)