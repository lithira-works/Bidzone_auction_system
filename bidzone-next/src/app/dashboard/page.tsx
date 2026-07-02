'use client'
import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { SellerDashboardPage } from '@/components/layout/SellerDashboardPage'

export default function DashboardRoute() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/')
    } else if (user?.role === 'admin') {
      router.replace('/admin')
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated) return null
  if (!user) return null
  if (user.role === 'admin') return null

  /* All authenticated non-admin users can view the unified dashboard */
  return (
    <Suspense fallback={null}>
      <SellerDashboardPage />
    </Suspense>
  )
}
