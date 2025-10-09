'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-2xl font-semibold">Произошла ошибка</h2>
          <p className="text-sm text-muted-foreground">{error.message || 'Попробуйте ещё раз.'}</p>
          <Button onClick={() => reset()}>Повторить</Button>
        </div>
      </body>
    </html>
  )
}
