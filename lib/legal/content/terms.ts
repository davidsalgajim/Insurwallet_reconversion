import { COMPANY } from '@/lib/legal/company'
import type {
  LegalDocumentContent,
  LegalLocale,
} from '@/lib/legal/content/types'

const termsEs: LegalDocumentContent = {
  title: 'Términos y Condiciones de Uso',
  intro: `Estos Términos regulan el acceso y uso de ${COMPANY.tradeName}, plataforma SaaS de gestión de pólizas de seguro con asistencia de inteligencia artificial. Al crear cuenta o usar el servicio aceptas estos Términos y nuestra Política de Privacidad.`,
  counselNote:
    'Documento informativo. Recomendamos revisión por abogado local antes de producción.',
  sections: [
    {
      title: '1. Aceptación y elegibilidad',
      paragraphs: [
        'Debes ser mayor de 18 años y tener capacidad legal para contratar. Si aceptas en nombre de una empresa, declaras tener facultades para obligarla.',
        'Al registrarte autorizas el tratamiento de datos personales conforme a la Ley 1581 de 2012 y la Política de Privacidad vigente.',
      ],
    },
    {
      title: '2. Naturaleza del servicio — no somos aseguradora',
      paragraphs: [
        'InsurWallet es una herramienta de organización, recordatorio y consulta de información de pólizas que tú cargas o confirmas.',
        'No somos compañía de seguros, corredor, agente ni intermediario regulado. No emitimos, renovamos, cancelamos ni negociamos pólizas en tu nombre.',
        'Nada en la app constituye asesoría legal, financiera, actuarial ni de seguros. Para decisiones de cobertura, reclamaciones o contratación consulta a tu aseguradora o un profesional licenciado.',
      ],
    },
    {
      title: '3. Inteligencia artificial y extracción de documentos',
      paragraphs: [
        'La extracción automática de PDF propone campos que debes revisar y confirmar antes de guardar. Eres responsable de la exactitud de los datos persistidos.',
        'MarIAna opera en modo lectura sobre tus pólizas autorizadas; no ejecuta transacciones ni modifica pólizas sin tu acción.',
        'Las respuestas de IA son orientativas, pueden contener errores y no sustituyen los condicionados de la póliza ni documentos oficiales de la aseguradora.',
        'Funciones de IA en nube requieren consentimiento explícito aparte, revocable en cualquier momento.',
      ],
    },
    {
      title: '4. Cuentas y seguridad',
      paragraphs: [
        'Eres responsable de la confidencialidad de tus credenciales y de toda actividad en tu cuenta.',
        `Notifica de inmediato accesos no autorizados a ${COMPANY.emails.support}.`,
        'Podemos suspender cuentas ante uso fraudulento, abuso o incumplimiento de estos Términos.',
      ],
    },
    {
      title: '5. Uso aceptable',
      items: [
        'No subir malware, contenido ilegal ni documentos ajenos sin autorización.',
        'No intentar acceder a datos de otros usuarios, eludir controles de seguridad ni realizar ingeniería inversa del servicio.',
        'No usar MarIAna para temas ajenos a seguros ni para generar asesoría profesional automatizada a terceros sin licencia.',
        'No sobrecargar intencionalmente la infraestructura (scraping masivo, bots no autorizados).',
      ],
    },
    {
      title: '6. Planes, pagos y cancelación',
      paragraphs: [
        'Plan gratuito: hasta 3 pólizas, sin IA en nube. Plan Premium: pólizas ilimitadas, MarIAna avanzada y extracción en nube, según descripción vigente en la app.',
        'Pagos procesados por Mercado Pago y/o Wompi según disponibilidad regional. Al suscribirte autorizas cargos recurrentes según el ciclo elegido hasta cancelación.',
        'Puedes cancelar en Configuración → Suscripción. El acceso Premium continúa hasta el fin del período pagado salvo disposición legal distinta.',
        'Reembolsos: conforme a la Ley 1480 de 2011 (Estatuto del Consumidor — Colombia) y políticas del procesador de pagos para cargos no autorizados o fallas imputables a InsurWallet. No hay reembolso prorrateado por cancelación voluntaria mid-cycle salvo que la ley lo exija.',
        'Precios y funciones pueden actualizarse con aviso previo razonable.',
      ],
    },
    {
      title: '7. Contenido del usuario y propiedad intelectual',
      paragraphs: [
        'Conservas la titularidad de tus documentos y datos. Otorgas a InsurWallet licencia limitada, revocable y no exclusiva para alojar, procesar y mostrar ese contenido únicamente para prestar el servicio.',
        'Marcas, software, diseño y documentación de InsurWallet son nuestra propiedad o de nuestros licenciantes. No adquieres derechos sobre ellos salvo uso permitido.',
      ],
    },
    {
      title: '8. Compartir pólizas',
      paragraphs: [
        'Puedes generar enlaces o invitaciones con permisos view o view_download. Eres responsable de compartir solo con destinatarios autorizados y de revocar accesos cuando corresponda.',
        'Los tokens tienen expiración y pueden revocarse. InsurWallet no responde por uso indebido del enlace por parte del destinatario.',
      ],
    },
    {
      title: '9. Limitación de responsabilidad',
      paragraphs: [
        'El servicio se presta «tal cual» y «según disponibilidad», dentro de los límites permitidos por la ley colombiana.',
        'No garantizamos que la extracción IA o MarIAna sean exactas, completas o aptas para un fin particular.',
        'En la medida permitida por ley, nuestra responsabilidad agregada por daños directos derivados del servicio se limita al monto pagado por ti a InsurWallet en los 12 meses anteriores al hecho, o a cero si usas el plan gratuito.',
        'No respondemos por lucro cesante, pérdida de datos por causas ajenas a nuestra negligencia grave, ni decisiones de seguros tomadas con base en la app.',
      ],
    },
    {
      title: '10. Indemnización',
      paragraphs: [
        'Te comprometes a mantener indemne a InsurWallet frente a reclamaciones de terceros derivadas de tu uso ilícito del servicio, contenido que subas sin derecho o incumplimiento de estos Términos, en la medida permitida por ley.',
      ],
    },
    {
      title: '11. Modificaciones y terminación',
      paragraphs: [
        'Podemos modificar estos Términos publicando la nueva versión. El uso continuado tras la vigencia implica aceptación, salvo que la ley exija consentimiento expreso adicional.',
        'Puedes cerrar tu cuenta en cualquier momento. Podemos terminar el servicio con aviso cuando sea razonable, salvo incumplimiento grave que justifique terminación inmediata.',
      ],
    },
    {
      title: '12. Ley aplicable y jurisdicción',
      paragraphs: [
        `Estos Términos se rigen por las leyes de la ${COMPANY.jurisdictionCountry}.`,
        `Salvo normas imperativas de protección al consumidor en tu país de residencia, las controversias se someterán a los jueces competentes de ${COMPANY.jurisdictionCity}, sin perjuicio de que las partes puedan acordar arbitraje de derecho ante centro reconocido en ${COMPANY.country}.`,
      ],
    },
    {
      title: '13. Contacto',
      paragraphs: [`Consultas sobre estos Términos: ${COMPANY.emails.legal}`],
    },
  ],
}

const termsEn: LegalDocumentContent = {
  title: 'Terms of Service',
  intro: `These Terms govern access to ${COMPANY.tradeName}, a SaaS platform for insurance policy management with AI assistance. By creating an account you accept these Terms and our Privacy Policy. The Spanish version is authoritative for Colombia-based operations.`,
  counselNote:
    'Informational document. We recommend review by local counsel before production.',
  sections: [
    {
      title: '1. Acceptance and eligibility',
      paragraphs: [
        'You must be 18+ and legally able to contract.',
        'Registration constitutes authorization for personal data processing per our Privacy Policy.',
      ],
    },
    {
      title: '2. Service nature — we are not an insurer',
      paragraphs: [
        'InsurWallet organizes and surfaces policy information you provide or confirm.',
        'We are not an insurer, broker or licensed intermediary.',
        'Nothing in the app is legal, financial or insurance advice.',
      ],
    },
    {
      title: '3. AI and document extraction',
      paragraphs: [
        'PDF extraction proposes fields you must review before saving.',
        'MarIAna is read-only over your policies.',
        'AI answers are informational and may contain errors.',
        'Cloud AI requires separate explicit consent.',
      ],
    },
    {
      title: '4. Accounts and security',
      paragraphs: [
        'You are responsible for credential confidentiality and account activity.',
        'Report unauthorized access promptly.',
      ],
    },
    {
      title: '5. Acceptable use',
      items: [
        'No malware, illegal content or unauthorized documents.',
        "No bypassing security or accessing other users' data.",
        'No off-topic MarIAna use or unlicensed professional advice to third parties.',
        'No intentional infrastructure abuse.',
      ],
    },
    {
      title: '6. Plans, payments and cancellation',
      paragraphs: [
        'Free: up to 3 policies, no cloud AI. Premium: unlimited policies and cloud features.',
        'Payments via Mercado Pago and/or Wompi. Recurring billing until cancellation.',
        'Cancel in Settings → Subscription; access until paid period ends.',
        'Refunds per Colombian consumer law and payment processor policies where applicable.',
      ],
    },
    {
      title: '7. User content and IP',
      paragraphs: [
        'You retain ownership of your documents. Limited license to InsurWallet to host and process for service delivery.',
        'InsurWallet brand and software remain our property.',
      ],
    },
    {
      title: '8. Policy sharing',
      paragraphs: [
        'You are responsible for share links and revoking access.',
        'Tokens expire and are revocable.',
      ],
    },
    {
      title: '9. Limitation of liability',
      paragraphs: [
        'Service provided as-is to the extent permitted by law.',
        'Aggregate liability capped at fees paid in the prior 12 months, or zero on free plan.',
      ],
    },
    {
      title: '10. Indemnity',
      paragraphs: [
        'You indemnify InsurWallet for third-party claims from your misuse, within legal limits.',
      ],
    },
    {
      title: '11. Changes and termination',
      paragraphs: [
        'We may update Terms with notice. Continued use constitutes acceptance where permitted.',
        'You may close your account at any time.',
      ],
    },
    {
      title: '12. Governing law',
      paragraphs: [
        `${COMPANY.jurisdictionCountry} law governs. Courts of ${COMPANY.jurisdictionCity} unless mandatory consumer rules apply elsewhere.`,
      ],
    },
    {
      title: '13. Contact',
      paragraphs: [COMPANY.emails.legal],
    },
  ],
}

const termsPt: LegalDocumentContent = {
  ...termsEn,
  title: 'Termos de Uso',
  intro: `Estes Termos regem o uso da ${COMPANY.tradeName}. Ao criar conta você aceita estes Termos e a Política de Privacidade. A versão em espanhol é vinculante para operações na Colômbia.`,
  counselNote:
    'Documento informativo. Recomendamos revisão por advogado local antes de produção.',
}

const byLocale = { es: termsEs, en: termsEn, pt: termsPt } as const

export function getTermsContent(locale: LegalLocale): LegalDocumentContent {
  return byLocale[locale] ?? termsEs
}
