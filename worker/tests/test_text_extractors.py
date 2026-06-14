"""Tests for PDF text extraction guards."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from pipeline.errors import PdfEncryptedError
from pipeline.text_extractors import _assert_pdf_not_encrypted


@patch("pypdf.PdfReader")
def test_assert_pdf_not_encrypted_raises_for_locked_pdf(mock_reader_cls):
    reader = MagicMock()
    reader.is_encrypted = True
    mock_reader_cls.return_value = reader

    with pytest.raises(PdfEncryptedError):
        _assert_pdf_not_encrypted(b"%PDF-1.4 encrypted")


@patch("pypdf.PdfReader")
def test_assert_pdf_not_encrypted_allows_open_pdf(mock_reader_cls):
    reader = MagicMock()
    reader.is_encrypted = False
    mock_reader_cls.return_value = reader

    _assert_pdf_not_encrypted(b"%PDF-1.4 open")
