/**
 * Datos legales del titular del servicio InsurWallet.
 *
 * Completar campos `PENDIENTE_*` antes de go-live.
 * Checklist: docs/PRODUCTION-LEGAL-CHECKLIST.md
 */
export const COMPANY = {
  tradeName: 'InsurWallet',
  legalName: 'InsurWallet S.A.S.',
  /** TODO: NIT real de la sociedad (no inventar). */
  nit: 'PENDIENTE_NIT',
  /** TODO: Dirección fiscal completa (calle, número, barrio). */
  address: 'Bogotá D.C., Colombia',
  /** TODO: Nombre del representante legal con facultades de vinculación. */
  legalRepresentative: 'PENDIENTE_REPRESENTANTE_LEGAL',
  country: 'Colombia',
  city: 'Bogotá D.C.',
  jurisdictionCity: 'Bogotá D.C.',
  jurisdictionCountry: 'República de Colombia',
  website: 'https://app.insurwallet.com',
  emails: {
    contact: 'hola@insurwallet.com',
    legal: 'legal@insurwallet.com',
    privacy: 'privacidad@insurwallet.com',
    support: 'soporte@insurwallet.com',
  },
} as const

export type CompanyEmails = keyof typeof COMPANY.emails
