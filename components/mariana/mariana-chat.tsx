'use client'

import { ExternalLink, MessageSquareText, Send } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useRef, useState } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import { Link } from '@/i18n/navigation'
import { incrementMarianaQueryCount } from '@/lib/utils/mariana-stats'
import type { MarianaCitation } from '@/mariana/types'
import { cn } from '@/lib/utils/cn'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: MarianaCitation[]
}

type MarianaChatProps = {
  suggestedQuestions: readonly string[]
}

type StreamChunk = {
  type: 'delta' | 'done' | 'error' | 'citation'
  content?: string
  citation?: MarianaCitation
  citations?: MarianaCitation[]
}

function CitationLinks({
  citations,
  t,
}: {
  citations: MarianaCitation[]
  t: ReturnType<typeof useTranslations<'mariana'>>
}) {
  if (citations.length === 0) {
    return null
  }

  return (
    <ul className="mt-3 flex flex-wrap gap-2 border-t border-border/50 pt-3">
      {citations.map((citation) => (
        <li
          key={`${citation.policyId}-${citation.documentId}-${citation.page}`}
        >
          <Link
            href={`/policies/${citation.policyId}/review`}
            className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-accent/10 px-2.5 py-1 text-xs font-medium text-[#0a6b66] transition hover:bg-accent/20"
          >
            <ExternalLink className="size-3" strokeWidth={1.5} />
            {t('citationLabel', {
              label: citation.label,
              page: citation.page ?? 1,
            })}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function MarianaChat({ suggestedQuestions }: MarianaChatProps) {
  const t = useTranslations('mariana')
  const locale = useLocale()
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isStreaming) {
        return
      }

      setError(null)
      setInput('')
      setIsStreaming(true)

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
      }
      const assistantId = crypto.randomUUID()

      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantId, role: 'assistant', content: '', citations: [] },
      ])

      try {
        const response = await fetch('/api/mariana/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, locale }),
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string
          } | null
          throw new Error(payload?.error ?? t('errorGeneric'))
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error(t('errorGeneric'))
        }

        const decoder = new TextDecoder()
        let assistantText = ''
        let citations: MarianaCitation[] = []
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) {
              continue
            }

            const chunk = JSON.parse(line.slice(6)) as StreamChunk
            if (chunk.type === 'delta' && chunk.content) {
              assistantText += chunk.content
            }
            if (chunk.type === 'citation' && chunk.citation) {
              citations = [...citations, chunk.citation]
            }
            if (chunk.type === 'done' && chunk.citations) {
              citations = chunk.citations
            }

            if (
              chunk.type === 'delta' ||
              chunk.type === 'citation' ||
              chunk.type === 'done'
            ) {
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantId
                    ? {
                        ...message,
                        content: assistantText,
                        citations,
                      }
                    : message
                )
              )
            }
          }
        }

        if (!assistantText) {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? { ...message, content: t('errorEmpty') }
                : message
            )
          )
        } else if (user) {
          incrementMarianaQueryCount(user.uid)
        }
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : t('errorGeneric')
        setError(message)
        setMessages((prev) => prev.filter((entry) => entry.id !== assistantId))
      } finally {
        setIsStreaming(false)
        scrollToBottom()
      }
    },
    [isStreaming, locale, scrollToBottom, t, user]
  )

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendMessage(input)
  }

  const hasMessages = messages.length > 0

  return (
    <div className="glass-panel flex min-h-[min(480px,calc(100dvh-12rem))] flex-col overflow-hidden sm:min-h-[min(560px,calc(100dvh-14rem))]">
      <div
        ref={listRef}
        className="flex flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-6"
      >
        {!hasMessages ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="icon-circle mb-5 size-16 stat-icon-accent border-0">
              <MessageSquareText className="size-7" strokeWidth={1.5} />
            </div>
            <span className="pill-badge mb-3 bg-accent/10 text-[#0a6b66]">
              {t('badge')}
            </span>
            <h2 className="text-balance text-xl font-semibold tracking-tight">
              {t('emptyTitle')}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {t('emptyDescription')}
            </p>

            <div className="mt-8 flex max-w-xl flex-wrap justify-center gap-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  disabled={isStreaming}
                  onClick={() => void sendMessage(question)}
                  className="glass-panel rounded-[var(--radius-pill)] px-4 py-2.5 text-sm font-medium text-foreground transition-[box-shadow,transform] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-4" aria-live="polite">
            {messages.map((message) => (
              <li
                key={message.id}
                className={cn(
                  'max-w-[85%] rounded-[var(--radius-card)] px-4 py-3 text-sm leading-relaxed',
                  message.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'mr-auto border border-border/60 bg-white/70 text-foreground'
                )}
              >
                <span className="sr-only">
                  {message.role === 'user'
                    ? t('userLabel')
                    : t('assistantLabel')}
                </span>
                <div className="whitespace-pre-wrap">
                  {message.content || (isStreaming ? t('streaming') : '')}
                </div>
                {message.role === 'assistant' && message.citations ? (
                  <CitationLinks citations={message.citations} t={t} />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border/60 bg-white/40 p-4 backdrop-blur-sm">
        {error ? (
          <p className="mb-2 text-center text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <form className="flex items-end gap-3" onSubmit={handleSubmit}>
          <label htmlFor="mariana-input" className="sr-only">
            {t('inputLabel')}
          </label>
          <textarea
            id="mariana-input"
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('inputPlaceholder')}
            disabled={isStreaming}
            className="min-h-11 flex-1 resize-none rounded-[var(--radius-pill)] border border-border bg-white/80 px-4 py-3 text-sm shadow-[var(--shadow-soft)] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
          />
          <button
            type="submit"
            aria-label={t('sendAria')}
            disabled={isStreaming || !input.trim()}
            className={cn(
              'icon-circle icon-circle-active size-11 shrink-0',
              'disabled:opacity-50'
            )}
          >
            <Send className="size-4" strokeWidth={1.5} />
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {t('disclaimer')}
        </p>
      </div>
    </div>
  )
}
