'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { SellerNewListingPage } from '@/components/layout/SellerNewListingPage'

export default function SellerNewRoute() {
  const { isAuthenticated, canAccessSellerTools } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/')
    } else if (!canAccessSellerTools) {
      router.replace('/home')
    }
  }, [isAuthenticated, canAccessSellerTools, router])

  if (!isAuthenticated || !canAccessSellerTools) return null

  return <SellerNewListingPage />
}
