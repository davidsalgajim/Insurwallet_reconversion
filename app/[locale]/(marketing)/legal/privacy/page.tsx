import { setRequestLocale } from 'next-intl/server'

import { LegalDocumentLayout } from '@/components/legal/legal-document-layout'

type Props = { params: Promise<{ locale: string }> }

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <LegalDocumentLayout
      title="Política de Privacidad"
      lastUpdated="12 de junio de 2026"
    >
      <p>
        Este documento es un borrador placeholder alineado con la Ley 1581 de
        2012 (Habeas Data — Colombia) y principios GDPR. Será revisado por
        asesoría jurídica antes del lanzamiento.
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        InsurWallet, con domicilio en Colombia, es responsable del tratamiento
        de tus datos personales. Contacto:{' '}
        <a href="mailto:privacidad@insurwallet.com">
          privacidad@insurwallet.com
        </a>
      </p>

      <h2>2. Datos que recopilamos</h2>
      <ul>
        <li>Datos de cuenta: correo, nombre, preferencias de idioma.</li>
        <li>
          Datos de pólizas: información que ingresas o extraes de documentos.
        </li>
        <li>
          Documentos PDF/imágenes que subes para procesamiento (con tu
          consentimiento para IA en nube).
        </li>
        <li>Datos técnicos: logs de uso, identificadores de dispositivo.</li>
      </ul>

      <h2>3. Finalidades</h2>
      <p>
        Prestación del servicio, recordatorios de vencimiento, procesamiento de
        documentos, asistencia MarIAna, cumplimiento legal y mejora del
        producto.
      </p>

      <h2>4. Base legal y consentimiento</h2>
      <p>
        El tratamiento se basa en la ejecución del contrato, consentimiento
        (especialmente para IA en nube y cookies no esenciales) e interés
        legítimo en seguridad y prevención de fraude.
      </p>

      <h2>5. Tus derechos</h2>
      <p>
        Puedes acceder, rectificar, suprimir, oponerte, revocar consentimiento y
        solicitar portabilidad de tus datos desde Configuración → Exportar mis
        datos / Eliminar cuenta.
      </p>

      <h2>6. Retención y seguridad</h2>
      <p>
        Conservamos los datos mientras mantengas tu cuenta. Aplicamos cifrado en
        tránsito, reglas de acceso por usuario y auditoría de acciones
        sensibles.
      </p>

      <h2>7. Transferencias internacionales</h2>
      <p>
        Algunos proveedores (p. ej. infraestructura cloud, IA) pueden procesar
        datos fuera de Colombia con salvaguardas contractuales adecuadas.
      </p>
    </LegalDocumentLayout>
  )
}
