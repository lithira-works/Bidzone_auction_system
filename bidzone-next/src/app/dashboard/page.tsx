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
    } else if (user && user.role !== 'seller' && user.role !== 'admin') {
      /* bidders without an application go to onboarding */
      router.replace('/onboarding/seller-upgrade')
    } else if (user?.role === 'admin') {
      router.replace('/admin')
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated) return null
  if (!user) return null
  if (user.role === 'admin') return null
  /* allow any seller role — the dashboard itself handles approved/pending/rejected UI */
  if (user.role !== 'seller') return null

  return (
    <Suspense fallback={null}>
      <SellerDashboardPage />
    </Suspense>
  )
}
