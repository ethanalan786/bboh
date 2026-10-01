import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function requireAdminRole() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  if (session.user?.role !== 'ADMIN') {
    redirect('/dashboard/front-desk-role')
  }

  return session
}

export async function requireFrontDeskRole() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  if (session.user?.role === 'ADMIN') {
    redirect('/dashboard/admin')
  }

  return session
}
