import { COMPANY } from '@/lib/legal/company'
import type {
  LegalDocumentContent,
  LegalLocale,
} from '@/lib/legal/content/types'

const noticeEs: LegalDocumentContent = {
  title: 'Aviso Legal',
  intro:
    'Información general sobre el titular del sitio y condiciones de uso del contenido publicado.',
  counselNote:
    'Documento informativo. Recomendamos revisión por abogado local antes de producción.',
  sections: [
    {
      title: '1. Titular del sitio',
      paragraphs: [
        `Denominación: ${COMPANY.legalName}`,
        `NIT: ${COMPANY.nit}`,
        `Domicilio: ${COMPANY.address}`,
        `Representante legal: ${COMPANY.legalRepresentative}`,
        `Correo de contacto: ${COMPANY.emails.contact}`,
        `Sitio web: ${COMPANY.website} (aplicación web SaaS).`,
      ],
    },
    {
      title: '2. Objeto',
      paragraphs: [
        'Este aviso regula el acceso a la información institucional y páginas legales públicas. El uso del producto se rige por los Términos y Condiciones y la Política de Privacidad.',
      ],
    },
    {
      title: '3. Propiedad intelectual',
      paragraphs: [
        'Los contenidos, marcas, logotipos y diseño son propiedad de InsurWallet o de terceros licenciantes. Queda prohibida su reproducción sin autorización.',
      ],
    },
    {
      title: '4. Enlaces externos',
      paragraphs: [
        'Enlaces a sitios de terceros (aseguradoras, documentación) se ofrecen por conveniencia. InsurWallet no controla ni respalda su contenido.',
      ],
    },
    {
      title: '5. Ley aplicable',
      paragraphs: [
        'Leyes de la República de Colombia, sin perjuicio de normas imperativas del usuario.',
      ],
    },
  ],
}

const noticeEn: LegalDocumentContent = {
  title: 'Legal Notice',
  intro: 'General information about the site owner and published content.',
  counselNote:
    'Informational document. We recommend review by local counsel before production.',
  sections: [
    {
      title: '1. Site owner',
      paragraphs: [
        `${COMPANY.legalName}, ${COMPANY.address}. Tax ID: ${COMPANY.nit}.`,
        `Legal representative: ${COMPANY.legalRepresentative}.`,
        `Contact: ${COMPANY.emails.contact}`,
        `Website: ${COMPANY.website}`,
      ],
    },
    {
      title: '2. Purpose',
      paragraphs: [
        'This notice covers public legal pages. Product use is governed by Terms and Privacy Policy.',
      ],
    },
    {
      title: '3. Intellectual property',
      paragraphs: [
        'Content and trademarks are owned by InsurWallet or licensors.',
      ],
    },
    {
      title: '4. External links',
      paragraphs: [
        'Third-party links are provided for convenience without endorsement.',
      ],
    },
    {
      title: '5. Governing law',
      paragraphs: ['Colombian law applies.'],
    },
  ],
}

const noticePt: LegalDocumentContent = {
  ...noticeEn,
  title: 'Aviso Legal',
  intro: 'Informações gerais sobre o titular do site.',
  counselNote:
    'Documento informativo. Recomendamos revisão por advogado local antes de produção.',
}

const byLocale = { es: noticeEs, en: noticeEn, pt: noticePt } as const

export function getLegalNoticeContent(
  locale: LegalLocale
): LegalDocumentContent {
  return byLocale[locale] ?? noticeEs
}
