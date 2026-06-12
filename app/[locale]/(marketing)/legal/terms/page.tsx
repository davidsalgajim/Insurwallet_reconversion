import { setRequestLocale } from 'next-intl/server'

import { LegalDocumentLayout } from '@/components/legal/legal-document-layout'

type Props = { params: Promise<{ locale: string }> }

export default async function TermsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <LegalDocumentLayout
      title="Términos y Condiciones"
      lastUpdated="12 de junio de 2026"
    >
      <p>
        Este documento es un borrador placeholder para InsurWallet. Será
        reemplazado por términos legales revisados por asesoría jurídica antes
        del lanzamiento público.
      </p>

      <h2>1. Aceptación</h2>
      <p>
        Al usar InsurWallet aceptas estos términos. Si no estás de acuerdo, no
        utilices el servicio.
      </p>

      <h2>2. Descripción del servicio</h2>
      <p>
        InsurWallet es una plataforma para organizar pólizas de seguro,
        documentos asociados y asistencia con IA (MarIAna). No somos una
        aseguradora ni intermediamos la contratación de pólizas.
      </p>

      <h2>3. Cuentas y suscripciones</h2>
      <p>
        El plan gratuito permite hasta 3 pólizas. Las funciones premium
        (ilimitadas, IA en nube) requieren suscripción de pago. Los precios y
        condiciones de facturación se publicarán en la app.
      </p>

      <h2>4. Uso de inteligencia artificial</h2>
      <p>
        Las funciones de IA en nube procesan documentos y consultas bajo tu
        consentimiento explícito. Los resultados son orientativos y no
        constituyen asesoría legal, financiera ni de seguros.
      </p>

      <h2>5. Limitación de responsabilidad</h2>
      <p>
        InsurWallet se proporciona &quot;tal cual&quot;. Verifica siempre la
        información de tus pólizas con tu aseguradora.
      </p>

      <h2>6. Contacto</h2>
      <p>
        Para consultas sobre estos términos:{' '}
        <a href="mailto:legal@insurwallet.com">legal@insurwallet.com</a>
      </p>
    </LegalDocumentLayout>
  )
}
