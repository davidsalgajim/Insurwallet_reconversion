import { COMPANY } from '@/lib/legal/company'
import type {
  LegalDocumentContent,
  LegalLocale,
} from '@/lib/legal/content/types'

const privacyEs: LegalDocumentContent = {
  title: 'Política de Privacidad',
  intro: `${COMPANY.legalName} (en adelante, «${COMPANY.tradeName}» o «nosotros») trata datos personales conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 (Habeas Data — Colombia), al Reglamento General de Protección de Datos (RGPD/GDPR) cuando corresponda a titulares en la Unión Europea, a la Lei Geral de Proteção de Dados (LGPD — Brasil), a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (México), a la Ley 25.326 de Protección de Datos Personales (Argentina) y a la Ley 19.628 sobre protección de la vida privada (Chile), según el país de residencia del titular.`,
  counselNote:
    'Documento informativo redactado con criterios de cumplimiento LATAM y estándares internacionales. Recomendamos revisión por abogado local antes de producción.',
  sections: [
    {
      title: '1. Responsable del tratamiento y contacto',
      paragraphs: [
        `Responsable: ${COMPANY.legalName}, NIT ${COMPANY.nit}, domicilio en ${COMPANY.address}.`,
        `Oficial de Privacidad / DPO: ${COMPANY.emails.privacy} — canal para ejercer derechos, revocar autorizaciones y consultas sobre tratamiento.`,
        'Registro de tratamiento: mantenemos inventario interno de actividades de tratamiento conforme al artículo 14 de la Ley 1581 de 2012.',
      ],
    },
    {
      title: '2. Datos personales que recopilamos',
      items: [
        'Cuenta: correo electrónico, nombre, foto de perfil, idioma preferido, identificador Firebase Auth (uid).',
        'Pólizas y seguros: números de póliza, aseguradora, vigencias, primas, coberturas, beneficiarios y contactos que ingreses o confirmes tras extracción asistida.',
        'Documentos: PDFs e imágenes de pólizas, endosos y anexos que subes; texto extraído y metadatos de procesamiento (estado del job, confianza por campo).',
        'MarIAna (chat): historial de conversación, preguntas, resúmenes de sesión y citas a fragmentos de documentos indexados.',
        'Pagos: identificador de transacción, plan, estado de suscripción y referencias de Mercado Pago o Wompi (no almacenamos números completos de tarjeta).',
        'Técnicos y seguridad: logs de acceso, dirección IP hasheada en auditoría de consentimientos, tokens FCM, preferencias de notificación, errores agregados (Sentry sin PII en producción).',
        'Compartir pólizas: correo del destinatario, token de invitación hasheado, permisos otorgados y registro de aceptación.',
      ],
    },
    {
      title: '3. Finalidades del tratamiento',
      items: [
        'Prestar el servicio de organización y consulta de pólizas de seguro.',
        'Procesar documentos con tu consentimiento explícito para funciones de IA en nube.',
        'Operar MarIAna en modo lectura sobre tus pólizas y documentos autorizados.',
        'Gestionar suscripciones, facturación y comunicaciones transaccionales (Resend).',
        'Enviar recordatorios de vencimiento por correo y/o notificación push (FCM), según tus preferencias.',
        'Cumplir obligaciones legales, responder autoridades competentes y prevenir fraude o abuso.',
        'Mejorar seguridad, estabilidad y experiencia del producto mediante analítica agregada y no identificable.',
      ],
    },
    {
      title: '4. Bases legales',
      paragraphs: [
        'Colombia (Ley 1581/2012): autorización del titular para datos sensibles o tratamientos no cubiertos por la relación contractual; ejecución del contrato de servicios; interés legítimo en seguridad, con balance de derechos documentado.',
        'GDPR (UE/EEE): artículos 6.1.b (contrato), 6.1.a (consentimiento — IA en nube, cookies no esenciales), 6.1.f (interés legítimo en seguridad) y 6.1.c (obligación legal cuando aplique).',
        `LGPD (Brasil): bases equivalentes conforme artículos 7 y 11; DPO contactable en ${COMPANY.emails.privacy}.`,
        'México, Argentina y Chile: consentimiento informado, finalidad determinada, proporcionalidad y derechos de acceso, rectificación, cancelación y oposición (ARCO u homólogos).',
      ],
    },
    {
      title: '5. Tratamiento con inteligencia artificial en la nube',
      paragraphs: [
        'Las funciones de extracción de PDF y MarIAna avanzada envían contenido de documentos o consultas a proveedores de IA (Anthropic Claude) únicamente con tu consentimiento explícito, revocable en Configuración → Legal.',
        'Se transmiten: texto extraído o sanitizado del documento, metadatos mínimos de contexto (idioma, tipo de póliza) y tu pregunta en el chat. No enviamos contraseñas ni datos de pago.',
        'Anthropic procesa datos bajo acuerdos de subprocesamiento; según sus políticas comerciales, los datos enviados vía API no se utilizan para entrenar modelos generales sin configuración expresa distinta a la ofrecida en InsurWallet.',
        'Retención en proveedor: conforme a políticas de Anthropic y nuestras instrucciones de borrado; en InsurWallet conservamos resultados e historial mientras mantengas la cuenta, salvo solicitud de supresión.',
        'Sin consentimiento: puedes usar entrada manual de pólizas y MarIAna Tier 0 (respuestas locales sin envío a nube).',
      ],
    },
    {
      title: '6. Subprocesadores y transferencias internacionales',
      items: [
        'Google Firebase / Google Cloud (Auth, Firestore, Storage, Functions, FCM) — infraestructura principal.',
        'Anthropic (Claude) — procesamiento de IA con consentimiento.',
        'Mercado Pago y/o Wompi — pagos en Colombia y LATAM.',
        'Resend — correo transaccional.',
        'Sentry — monitoreo de errores (sin contenido de documentos ni PII en producción).',
      ],
      paragraphs: [
        'Algunos subprocesadores operan fuera de Colombia (p. ej. Estados Unidos). Aplicamos cláusulas contractuales estándar, evaluaciones de impacto cuando corresponda y medidas técnicas (cifrado TLS, controles de acceso por uid).',
        `Titulares en la UE pueden solicitar información sobre garantías de transferencia escribiendo a ${COMPANY.emails.privacy}.`,
      ],
    },
    {
      title: '7. Derechos del titular (ARCO y homólogos)',
      paragraphs: [
        `Puedes acceder, actualizar, rectificar, suprimir, oponerte, revocar consentimiento y solicitar portabilidad desde Configuración → Exportar mis datos / Eliminar cuenta, o por correo a ${COMPANY.emails.privacy}.`,
        'Responderemos en los plazos legales aplicables (p. ej. 10 días hábiles en Colombia para consultas, prorrogables según ley).',
        'Titulares en la UE pueden presentar reclamación ante su autoridad de control. En Brasil, ante la ANPD.',
      ],
    },
    {
      title: '8. Retención',
      paragraphs: [
        'Conservamos datos mientras mantengas cuenta activa y el tiempo necesario para obligaciones legales, disputas o auditoría (habitualmente hasta 5 años tras cierre de cuenta para registros de consentimiento y facturación, salvo plazo distinto exigido por ley).',
        'Tras eliminación de cuenta: borrado en cascada de pólizas, documentos en Storage, chats e índices asociados, con registro en audit log de la operación.',
      ],
    },
    {
      title: '9. Seguridad',
      paragraphs: [
        'Cifrado en tránsito (HTTPS/TLS), reglas de seguridad Firestore y Storage por propietario, App Check, validación Zod, sanitización anti inyección en textos de PDF, sesiones mediante cookie httpOnly y verificación server-side del uid en Functions y APIs.',
        `Ningún sistema es 100 % seguro; notifica incidentes sospechosos a ${COMPANY.emails.privacy}.`,
      ],
    },
    {
      title: '10. Menores de edad',
      paragraphs: [
        'InsurWallet no está dirigido a menores de 18 años. Si detectamos registro de un menor sin autorización parental verificable, eliminaremos la cuenta y los datos asociados.',
      ],
    },
    {
      title: '11. Cookies y tecnologías similares',
      paragraphs: [
        'Usamos cookies y almacenamiento local estrictamente necesarios para sesión, preferencias, seguridad y App Check. Consulta la Política de Cookies en /legal/cookies.',
      ],
    },
    {
      title: '12. Cambios a esta política',
      paragraphs: [
        'Publicaremos la versión actualizada con fecha de vigencia. Si el cambio es sustancial, solicitaremos nueva aceptación o consentimiento según corresponda.',
        'Versión actual referenciada en tu perfil: campo consents.privacyVersion.',
      ],
    },
  ],
}

const privacyEn: LegalDocumentContent = {
  title: 'Privacy Policy',
  intro: `${COMPANY.legalName} («${COMPANY.tradeName}», «we») processes personal data in accordance with Colombia's Law 1581 of 2012 (Habeas Data), the EU General Data Protection Regulation (GDPR) where applicable, Brazil's LGPD, Mexico's LFPDPPP, Argentina's Personal Data Protection Act, and Chile's Law 19.628, depending on the user's country of residence. The Spanish version is the legally authoritative text for Colombia-based operations.`,
  counselNote:
    'Informational document drafted for LATAM and global compliance. We recommend review by local counsel before production use.',
  sections: privacyEs.sections.map((section) => ({
    ...section,
    title: section.title.replace('Política', 'Policy'),
  })),
}

// EN sections - provide proper English translations for key sections
privacyEn.sections = [
  {
    title: '1. Data controller and contact',
    paragraphs: [
      `Controller: ${COMPANY.legalName}, Tax ID ${COMPANY.nit}, ${COMPANY.address}.`,
      `Privacy / DPO: ${COMPANY.emails.privacy} — channel to exercise rights and withdraw consent.`,
      'Processing register: internal inventory per Colombia Law 1581 art. 14.',
    ],
  },
  {
    title: '2. Personal data we collect',
    items: [
      'Account: email, name, profile photo, language, Firebase Auth uid.',
      'Policies: policy numbers, insurer, dates, premiums, coverages, beneficiaries and contacts you enter or confirm.',
      'Documents: PDFs/images uploaded; extracted text and processing metadata.',
      'MarIAna chat: conversation history, questions, session summaries and document citations.',
      'Payments: transaction id, plan, subscription status, Mercado Pago/Wompi references (no full card numbers).',
      'Technical: access logs, hashed IP in consent audit, FCM tokens, notification prefs, aggregated errors (Sentry, no PII in production).',
      'Sharing: recipient email, hashed invite token, permissions and acceptance log.',
    ],
  },
  {
    title: '3. Purposes',
    items: [
      'Provide insurance policy organization and inquiry services.',
      'Process documents with your explicit consent for cloud AI features.',
      'Operate read-only MarIAna over your authorized policies and documents.',
      'Manage subscriptions, billing and transactional email (Resend).',
      'Send renewal reminders per your channel preferences.',
      'Legal compliance, fraud prevention and security.',
      'Aggregated, non-identifying product improvement.',
    ],
  },
  {
    title: '4. Legal bases',
    paragraphs: [
      'Colombia: authorization, contract performance, legitimate interest in security.',
      'GDPR: contract (Art. 6.1.b), consent for cloud AI and non-essential cookies (Art. 6.1.a), legitimate interest (Art. 6.1.f).',
      'LGPD, Mexico, Argentina, Chile: equivalent consent, purpose limitation and ARCO-style rights.',
    ],
  },
  {
    title: '5. Cloud artificial intelligence',
    paragraphs: [
      'PDF extraction and advanced MarIAna send document content or queries to Anthropic Claude only with your explicit, revocable consent.',
      'Transmitted: sanitized document text, minimal context metadata, and chat questions. No passwords or payment data.',
      "API data is not used to train general models under Anthropic's standard commercial API terms as configured for InsurWallet.",
      'Without consent: manual policy entry and MarIAna Tier 0 (local responses) remain available.',
    ],
  },
  {
    title: '6. Sub-processors and international transfers',
    items: [
      'Google Firebase / Google Cloud',
      'Anthropic (Claude)',
      'Mercado Pago and/or Wompi',
      'Resend',
      'Sentry',
    ],
    paragraphs: [
      'Some processors operate outside Colombia. We use contractual safeguards and encryption.',
    ],
  },
  {
    title: '7. Your rights',
    paragraphs: [
      `Access, rectify, delete, object, withdraw consent and portability via Settings → Export / Delete account or ${COMPANY.emails.privacy}.`,
    ],
  },
  {
    title: '8. Retention',
    paragraphs: [
      'Data retained while your account is active and as required by law. Cascade deletion on account removal.',
    ],
  },
  {
    title: '9. Security',
    paragraphs: [
      'TLS, Firestore/Storage rules, App Check, Zod validation, prompt-injection sanitization, httpOnly sessions, server-side uid verification.',
    ],
  },
  {
    title: '10. Minors',
    paragraphs: ['Service not directed to users under 18.'],
  },
  {
    title: '11. Cookies',
    paragraphs: ['See Cookie Policy at /legal/cookies.'],
  },
  {
    title: '12. Changes',
    paragraphs: [
      'Material changes may require renewed acceptance. Current version stored in consents.privacyVersion.',
    ],
  },
]

const privacyPt: LegalDocumentContent = {
  title: 'Política de Privacidade',
  intro: `A ${COMPANY.legalName} trata dados pessoais conforme a Lei 1581 de 2012 (Habeas Data — Colômbia), o GDPR quando aplicável, a LGPD (Brasil), a LFPDPPP (México), a Lei 25.326 (Argentina) e a Lei 19.628 (Chile). A versão em espanhol é o texto juridicamente vinculante para operações na Colômbia.`,
  counselNote:
    'Documento informativo. Recomendamos revisão por advogado local antes de produção.',
  sections: privacyEn.sections.map((s) => ({
    ...s,
    title: s.title
      .replace('Data controller', 'Controlador de dados')
      .replace('Personal data', 'Dados pessoais')
      .replace('Purposes', 'Finalidades')
      .replace('Legal bases', 'Bases legais')
      .replace(
        'Cloud artificial intelligence',
        'Inteligência artificial em nuvem'
      )
      .replace('Sub-processors', 'Subprocessadores')
      .replace('Your rights', 'Seus direitos')
      .replace('Retention', 'Retenção')
      .replace('Security', 'Segurança')
      .replace('Minors', 'Menores')
      .replace('Cookies', 'Cookies')
      .replace('Changes', 'Alterações'),
  })),
}

const byLocale = {
  es: privacyEs,
  en: privacyEn,
  pt: privacyPt,
} as const

export function getPrivacyContent(locale: LegalLocale): LegalDocumentContent {
  return byLocale[locale] ?? privacyEs
}
