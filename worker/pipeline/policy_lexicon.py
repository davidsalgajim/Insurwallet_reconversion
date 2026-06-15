"""Multilingual policy field labels and insurance vocabulary (ES / EN / PT, LATAM).

Aligned with InsurWallet UI labels in messages/es.json, en.json, pt.json and
common carrier wording in Colombia, Mexico, Brazil, Chile, Argentina, Peru, etc.
"""

from __future__ import annotations

# Synonyms carriers use on policy PDFs → extraction schema field
FIELD_LABEL_SYNONYMS: dict[str, tuple[str, ...]] = {
    "insurerName": (
        # ES — LATAM
        "aseguradora",
        "compañía de seguros",
        "compania de seguros",
        "compañía aseguradora",
        "entidad aseguradora",
        "seguros de",
        "seguro de",
        # EN
        "insurer",
        "insurance company",
        "insurance carrier",
        "underwriter",
        "issued by",
        # PT — Brazil
        "seguradora",
        "companhia seguradora",
        "seguradora:",
        "cia seguradora",
    ),
    "policyNumber": (
        # ES
        "póliza",
        "poliza",
        "número de póliza",
        "numero de poliza",
        "no. de póliza",
        "no de poliza",
        "certificado",
        "no. certificado",
        "contrato",
        "referencia",
        "póliza no",
        "poliza no",
        # EN
        "policy number",
        "policy no",
        "policy #",
        "certificate number",
        "certificate no",
        "contract number",
        "reference",
        # PT
        "apólice",
        "apolice",
        "número da apólice",
        "numero da apolice",
        "certificado",
        "proposta",
        "apólice nº",
    ),
    "holderName": (
        # ES — tomador ≠ beneficiario (deudor)
        "tomador",
        "asegurado",
        "contratante",
        "titular",
        "nombre del asegurado",
        "nombre del tomador",
        "propietario de la póliza",
        "cliente",
        # EN
        "policyholder",
        "policy holder",
        "insured",
        "insured name",
        "named insured",
        "contract holder",
        "member name",
        # PT
        "tomador",
        "segurado",
        "proponente",
        "estipulante",
        "nome do segurado",
        "nome do tomador",
    ),
    "premium": (
        # ES
        "prima",
        "valor prima",
        "prima comercial",
        "prima neta",
        "prima total",
        "monto prima",
        "valor del seguro",
        "costo del seguro",
        # EN
        "premium",
        "premium amount",
        "policy premium",
        "installment",
        "payment amount",
        # PT
        "prêmio",
        "premio",
        "valor do prêmio",
        "prêmio comercial",
        "contribuição",
    ),
    "currency": (
        "cop",
        "usd",
        "mxn",
        "brl",
        "pen",
        "clp",
        "ars",
        "moneda",
        "currency",
        "moeda",
        "divisa",
    ),
    "paymentFrequency": (
        # ES
        "frecuencia de pago",
        "periodicidad",
        "forma de pago",
        "periodicidad de pago",
        "mensual",
        "anual",
        "trimestral",
        "semestral",
        "único",
        "unico",
        # EN
        "payment frequency",
        "billing frequency",
        "monthly",
        "annual",
        "quarterly",
        "semi-annual",
        "single premium",
        # PT
        "frequência de pagamento",
        "periodicidade",
        "mensal",
        "anual",
        "trimestral",
        "semestral",
    ),
    "startDate": (
        # ES
        "inicio de vigencia",
        "inicio vigencia",
        "vigencia desde",
        "vigente desde",
        "fecha inicio",
        "desde",
        "effective",
        # EN
        "effective date",
        "start date",
        "inception date",
        "from",
        "coverage begins",
        # PT
        "início de vigência",
        "inicio de vigencia",
        "vigência desde",
        "vigencia desde",
        "data de início",
        "início",
    ),
    "endDate": (
        # ES
        "fin de vigencia",
        "fin vigencia",
        "vigencia hasta",
        "vigente hasta",
        "fecha fin",
        "vencimiento",
        "hasta",
        "renovación",
        # EN
        "expiration date",
        "expiry date",
        "end date",
        "to",
        "coverage ends",
        # PT
        "fim de vigência",
        "término",
        "vigência até",
        "vencimento",
        "até",
    ),
    "coverages": (
        # ES
        "coberturas",
        "amparos",
        "riesgos cubiertos",
        "suma asegurada",
        "capital asegurado",
        "cobertura básica",
        "coberturas contratadas",
        # EN
        "coverages",
        "coverage",
        "benefits",
        "insured amount",
        "sum insured",
        "plan benefits",
        # PT
        "coberturas",
        "garantias",
        "capitais segurados",
        "importância segurada",
    ),
    "exclusions": (
        "exclusiones",
        "exclusiones generales",
        "no cubre",
        "exclusions",
        "general exclusions",
        "exclusões",
        "exclusoes",
        "não cobre",
        "nao cobre",
    ),
    "waitingPeriods": (
        "periodos de carencia",
        "periodo de carencia",
        "carencia",
        "período de espera",
        "periodo de espera",
        "waiting period",
        "waiting periods",
        "elimination period",
        "períodos de carência",
        "periodos de carencia",
        "carência",
        "carencia",
    ),
    "beneficiaries": (
        "beneficiario",
        "beneficiarios",
        "beneficiary",
        "beneficiaries",
        "beneficiário",
        "beneficiários",
        "beneficiario designado",
        "favorecido",
        "herederos legales",
    ),
    "agent": (
        # ES
        "asesor",
        "asesor comercial",
        "agente",
        "agente de seguros",
        "intermediario",
        "intermediario de seguros",
        "corredor",
        "corredor de seguros",
        "servicio al cliente",
        "servicio al cliente",
        "línea de atención",
        "linea de atencion",
        # EN
        "agent",
        "broker",
        "producer",
        "customer service",
        "advisor",
        # PT
        "corretor",
        "agente",
        "atendimento",
        "sac",
        "consultor",
    ),
    "policyType": (
        # life / deudor
        "vida",
        "seguro de vida",
        "vida deudores",
        "seguro deudor",
        "deudores",
        "crédito",
        "credito",
        "hipotecario",
        "life",
        "group life",
        "credit life",
        "mortgage",
        # health
        "salud",
        "health",
        "medical",
        "saúde",
        "saude",
        # auto
        "auto",
        "automóvil",
        "automovil",
        "vehículo",
        "veiculo",
        # home
        "hogar",
        "incendio",
        "home",
        "property",
        "residencial",
        # travel
        "viaje",
        "travel",
        "viagem",
        # pet
        "mascota",
        "mascotas",
        "pet",
        "pets",
        "animal",
        # funeral
        "funerario",
        "funeraria",
        "exequial",
        "funeral",
        "sepelio",
        # dental
        "dental",
        "odontológico",
        "odontologico",
        "odonto",
        # business
        "empresarial",
        "comercial",
        "pyme",
        "business",
        "commercial",
        "rc empresas",
    ),
}

# Flat vocabulary for quality gate / OCR heuristics (lowercase for substring match)
_EXTRA_DOCUMENT_KEYWORDS: tuple[str, ...] = (
    "seguro",
    "insurance",
    "clausulado",
    "endoso",
    "endorsement",
    "siniestro",
    "claim",
    "reclamación",
    "reclamacion",
    "deducible",
    "deductible",
    "franquia",
    "franquicia",
    "nit",
    "cédula",
    "cedula",
    "cpf",
    "cnpj",
    "rfc",
    "apólice",
    "apolice",
)

POLICY_DOCUMENT_KEYWORDS: tuple[str, ...] = tuple(
    dict.fromkeys(
        [
            *(term.lower() for terms in FIELD_LABEL_SYNONYMS.values() for term in terms),
            *_EXTRA_DOCUMENT_KEYWORDS,
        ]
    )
)


def format_field_label_hints() -> str:
    """Compact label→field map for Claude system/user prompts."""
    lines: list[str] = []
    for field, labels in FIELD_LABEL_SYNONYMS.items():
        sample = ", ".join(labels[:10])
        if len(labels) > 10:
            sample += ", …"
        lines.append(f"- {field}: {sample}")
    return "\n".join(lines)


def format_regional_extraction_rules() -> str:
    """Business rules for LATAM policy layouts (all locales)."""
    return """Regional extraction rules (Colombia, Mexico, Brazil, Chile, Argentina, Peru, etc.):
- Documents may use Spanish, English, or Portuguese labels (or mixed). Map synonyms to schema fields.
- holderName = natural person (Tomador / Asegurado / Policyholder / Segurado). Never the beneficiary bank.
- Seguro deudor / credit life / vida deudores: bank or lender → beneficiaryEntries.name; NIT/CC/CNPJ in notes.
- policyType: map vida/deudores/credit life → life; salud/saúde → health; auto/vehículo → auto; hogar/residencial → home; viaje/viagem → travel; mascota/pet → pet; funerario/exequial → funeral; dental/odonto → dental; empresarial/comercial/pyme → business.
- paymentFrequency: mensual/monthly/mensal → monthly; anual/annual/anual → annual; trimestral/quarterly → quarterly; semestral/semi-annual → semi_annual; único/single → single.
- Currency: infer ISO 4217 from context (COP Colombia, MXN Mexico, BRL Brazil, USD, PEN Peru, CLP Chile, ARS Argentina).
- If no end/expiration date is shown, set hasNoExpiration=true and omit endDate.
- NEVER copy startDate into endDate. If only one vigencia date appears (common in seguro deudor / vida deudores), use it as startDate only and set hasNoExpiration=true.
- endDate must be a distinct expiration/renovación date visible on the document — not the same as inicio de vigencia.
- coverages: summarize main amparos/coberturas/garantias (e.g. Muerte, ITP, incapacidad).
- agent: tiered extraction — (1) named asesor/agente/corredor with phone/email in agent; (2) SAC/servicio al cliente and other assistance lines in insurerContacts[] with label+phone/email; (3) firma autorizada person name in agent.name only when clearly a natural person. Colombia phones: +57 mobile 3xx or Bogotá (601)/(60-1) landline with ext when shown. NEVER put policy/certificate/voucher numbers in agent.phone or insurerContacts.phone.
- insurerContacts: ALL assistance lines on the document (any policy type): SAC, línea nacional/internacional, regional hotlines, WhatsApp. For travel/e-voucher/Assist Card: EACH region (América Latina, Europa, Asia, Colombia) as separate entry with label+phone. agent.phone only for named asesor/intermediario.
- travel/voucher and all other policies: multiple phones → insurerContacts[]; policy/certificate number stays in policyNumber only.
- Omit fields not clearly visible; do not invent values."""


def format_vision_user_preamble(page_count: int) -> str:
    """Opening lines for vision extraction user message."""
    return (
        "Extract insurance policy fields from the attached policy document images. "
        f"The PDF has {page_count} page(s). "
        "Labels may appear in Spanish, English, or Portuguese — use the synonym hints below.\n\n"
        f"Field label synonyms:\n{format_field_label_hints()}\n\n"
        f"{format_regional_extraction_rules()}"
    )


def format_text_extraction_preamble() -> str:
    """Hint block appended to text-based extraction (optional prefix in user message)."""
    return (
        "The document may use Spanish, English, or Portuguese insurance labels. "
        "Map regional synonyms to schema fields.\n"
        f"{format_regional_extraction_rules()}"
    )
