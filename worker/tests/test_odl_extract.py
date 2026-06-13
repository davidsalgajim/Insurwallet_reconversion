"""Tests for OpenDataLoader JSON parsing."""

from pipeline.odl_extract import _parse_odl_json


def test_parse_odl_json_extracts_elements_and_text():
    payload = [
        {
            "type": "heading",
            "page number": 1,
            "bounding box": [72.0, 700.0, 540.0, 730.0],
            "content": "Póliza de Vida",
        },
        {
            "type": "paragraph",
            "page number": 1,
            "bounding box": [72.0, 650.0, 400.0, 670.0],
            "content": "No. POL-12345678",
        },
    ]

    text, elements = _parse_odl_json(payload)

    assert "Póliza de Vida" in text
    assert len(elements) == 2
    assert elements[0].content == "Póliza de Vida"
    assert elements[1].content == "No. POL-12345678"
