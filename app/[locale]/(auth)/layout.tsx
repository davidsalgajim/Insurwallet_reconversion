import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark-surface relative flex min-h-dvh items-center justify-center bg-navy px-6 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, #407AFF44 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  )
}
