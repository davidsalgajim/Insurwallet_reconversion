import type { LegalDocumentContent } from '@/lib/legal/content/types'

type LegalDocumentBodyProps = {
  document: LegalDocumentContent
}

export function LegalDocumentBody({ document }: LegalDocumentBodyProps) {
  return (
    <>
      <p>{document.intro}</p>
      {document.sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
          {section.items ? (
            <ul>
              {section.items.map((item) => (
                <li key={item.slice(0, 48)}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
      <footer className="border-t border-border/60 pt-6">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {document.counselNote}
        </p>
      </footer>
    </>
  )
}
