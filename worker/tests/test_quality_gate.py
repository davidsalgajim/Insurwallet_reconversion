"""Tests for quality gate heuristics."""

from pipeline.quality_gate import is_low_signal_text


def test_is_low_signal_text_detects_image_placeholders() -> None:
    text = "\n".join(f"![image {index}]" for index in range(1, 40))
    assert is_low_signal_text(text) is True


def test_is_low_signal_text_accepts_real_policy_text() -> None:
    text = (
        "Póliza GRD-482 Seguros Alfa Tomador David Salgado Prima mensual COP "
        "Cobertura Muerte Beneficiario Banco de Occidente vigencia seguro asegurado "
        "certificado prima deducible beneficiario tomador aseguradora cobertura póliza "
    ) * 8
    assert is_low_signal_text(text) is False
