'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { AdminDashboardPage } from '@/components/admin/AdminDashboardPage'

export default function AdminRoute() {
  const { authReady, isAuthenticated, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authReady) return
    if (!isAuthenticated) {
      router.replace('/')
    } else if (!isAdmin) {
      router.replace('/home')
    }
  }, [authReady, isAuthenticated, isAdmin, router])

  if (!authReady) {
    return (
      <div className="adm__boot" aria-busy="true" aria-label="Loading admin console">
        <div className="adm__boot-spinner" />
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin) return null

  return <AdminDashboardPage />
}
