import { COMPANY } from '@/lib/legal/company'
import type {
  LegalDocumentContent,
  LegalLocale,
} from '@/lib/legal/content/types'

const cookiesEs: LegalDocumentContent = {
  title: 'Política de Cookies',
  intro: `Esta política describe las cookies y tecnologías similares que utiliza ${COMPANY.tradeName} en la web app y cómo puedes gestionarlas.`,
  counselNote:
    'Documento informativo. Recomendamos revisión por abogado local antes de producción.',
  sections: [
    {
      title: '1. ¿Qué son las cookies?',
      paragraphs: [
        'Las cookies son archivos pequeños que el navegador almacena en tu dispositivo. También usamos almacenamiento local (localStorage) para preferencias equivalentes.',
      ],
    },
    {
      title: '2. Cookies que utilizamos',
      items: [
        'Sesión (esencial): cookie httpOnly de sesión Firebase/InsurWallet para mantener tu autenticación de forma segura.',
        'Preferencias (esencial): idioma de interfaz y consentimiento de cookies almacenado localmente (iw_cookie_consent).',
        'Seguridad (esencial): tokens de App Check / reCAPTCHA v3 para proteger Firestore, Storage y Functions.',
        'Funcionalidad (esencial): estado de UI no sensible necesario para el servicio.',
      ],
    },
    {
      title: '3. Cookies que no utilizamos sin consentimiento',
      paragraphs: [
        'No desplegamos cookies de publicidad ni de seguimiento comportamental de terceros en la app autenticada.',
        'Sentry y analítica de producto (cuando se activen) usarán configuración que minimice identificación personal, conforme a la Política de Privacidad.',
      ],
    },
    {
      title: '4. Base legal',
      paragraphs: [
        'Cookies estrictamente necesarias: interés legítimo y ejecución del contrato (no requieren consentimiento previo en la mayoría de jurisdicciones).',
        'Cookies no esenciales futuras: solo con tu consentimiento explícito vía banner o configuración.',
      ],
    },
    {
      title: '5. Gestión y eliminación',
      paragraphs: [
        'Puedes bloquear o eliminar cookies desde la configuración de tu navegador; ello puede impedir iniciar sesión o usar funciones que dependen de sesión.',
        'El banner de cookies permite aceptar el uso de cookies esenciales y de preferencia descritas aquí.',
      ],
    },
    {
      title: '6. Más información',
      paragraphs: [
        `Consulta la Política de Privacidad para finalidades de tratamiento y derechos. Contacto: ${COMPANY.emails.privacy}.`,
      ],
    },
  ],
}

const cookiesEn: LegalDocumentContent = {
  title: 'Cookie Policy',
  intro: `This policy describes cookies and similar technologies used by ${COMPANY.tradeName}.`,
  counselNote:
    'Informational document. We recommend review by local counsel before production.',
  sections: [
    {
      title: '1. What are cookies?',
      paragraphs: [
        'Small files stored by your browser. We also use localStorage for equivalent preferences.',
      ],
    },
    {
      title: '2. Cookies we use',
      items: [
        'Session (essential): httpOnly session cookie for authentication.',
        'Preferences (essential): locale and cookie consent flag (iw_cookie_consent).',
        'Security (essential): App Check / reCAPTCHA v3 tokens.',
        'Functionality (essential): non-sensitive UI state required for the service.',
      ],
    },
    {
      title: '3. What we do not use without consent',
      paragraphs: [
        'No third-party advertising or behavioral tracking cookies in the authenticated app.',
      ],
    },
    {
      title: '4. Legal basis',
      paragraphs: [
        'Strictly necessary cookies: contract and legitimate interest.',
        'Non-essential cookies: explicit consent only.',
      ],
    },
    {
      title: '5. Management',
      paragraphs: [
        'You may block cookies in browser settings; login may be affected.',
      ],
    },
    {
      title: '6. More information',
      paragraphs: [`See Privacy Policy. Contact: ${COMPANY.emails.privacy}.`],
    },
  ],
}

const cookiesPt: LegalDocumentContent = {
  ...cookiesEn,
  title: 'Política de Cookies',
  intro: `Esta política descreve cookies e tecnologias similares usadas pela ${COMPANY.tradeName}.`,
  counselNote:
    'Documento informativo. Recomendamos revisão por advogado local antes de produção.',
}

const byLocale = { es: cookiesEs, en: cookiesEn, pt: cookiesPt } as const

export function getCookiesContent(locale: LegalLocale): LegalDocumentContent {
  return byLocale[locale] ?? cookiesEs
}
