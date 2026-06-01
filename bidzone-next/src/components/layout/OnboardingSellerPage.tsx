'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { SellerKycWizard } from '@/components/layout/SellerKycWizard'

export function OnboardingSellerPage() {
  const { canAccessSellerTools } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (canAccessSellerTools) router.replace('/dashboard')
  }, [canAccessSellerTools, router])

  if (canAccessSellerTools) return null

  return <SellerKycWizard mode="new" />
}
