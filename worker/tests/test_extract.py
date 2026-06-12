"""Tests for extract pipeline stub."""

from pipeline.extract import extract_document


def test_extract_document_stub_returns_sanitized_empty_result():
    result = extract_document(
        "users/owner/policies/p1/docs/d1/policy.pdf",
        mime_type="application/pdf",
    )

    assert result.text == ""
    assert result.method == "odl"
    assert result.word_count == 0
    assert result.sanitized.has_suspicious_content is False
