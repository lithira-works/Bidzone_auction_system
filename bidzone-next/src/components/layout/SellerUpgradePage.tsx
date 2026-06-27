'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { SellerKycWizard } from '@/components/layout/SellerKycWizard'

export function SellerUpgradePage() {
  const { isAuthenticated, canAccessSellerTools, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/')
    } else if (canAccessSellerTools) {
      router.replace('/dashboard')
    } else if (user.role === 'admin') {
      router.replace('/admin')
    }
  }, [isAuthenticated, canAccessSellerTools, user, router])

  if (!isAuthenticated || !user) return null
  if (canAccessSellerTools) return null
  if (user.role === 'admin') return null

  return <SellerKycWizard mode="upgrade" bidder={user} />
}
