'use client'

import { useSession } from 'next-auth/react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center dark:bg-black dark:text-neutral-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
