import { getTranslations, setRequestLocale } from 'next-intl/server'

import { MarianaChat } from '@/components/mariana/mariana-chat'
import { AppTopbar } from '@/components/layout/app-topbar'

type Props = { params: Promise<{ locale: string }> }

export default async function MarianaPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('mariana')

  const suggestedQuestions = [
    t('suggested1'),
    t('suggested2'),
    t('suggested3'),
    t('suggested4'),
  ] as const

  return (
    <div className="animate-fade-up mx-auto flex w-full max-w-4xl flex-col">
      <AppTopbar title={t('title')} subtitle={t('subtitle')} />
      <MarianaChat suggestedQuestions={suggestedQuestions} />
    </div>
  )
}
