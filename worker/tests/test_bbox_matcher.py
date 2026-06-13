"""Tests for bbox matching from OpenDataLoader elements."""

from pipeline.bbox_matcher import match_field_bboxes
from pipeline.odl_extract import OdlElement


def test_match_field_bboxes_finds_policy_number():
    elements = (
        OdlElement(
            page=1,
            content="Póliza No. POL-12345678",
            bbox=(72.0, 700.0, 300.0, 720.0),
        ),
        OdlElement(
            page=1,
            content="Aseguradora: Sura Colombia",
            bbox=(72.0, 650.0, 350.0, 670.0),
        ),
    )
    fields = {
        "policyNumber": "POL-12345678",
        "insurerName": "Sura Colombia",
    }

    matched = match_field_bboxes(fields, elements)

    assert "policyNumber" in matched
    assert matched["policyNumber"]["page"] == 1
    assert 0 <= matched["policyNumber"]["left"] <= 1
    assert "insurerName" in matched
