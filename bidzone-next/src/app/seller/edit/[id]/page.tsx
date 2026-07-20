'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { SellerNewListingPage } from '@/components/layout/SellerNewListingPage'

export default function SellerEditRoute() {
  const { authReady, isAuthenticated, canAccessSellerTools } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authReady) return
    if (!isAuthenticated) {
      router.replace('/')
    } else if (!canAccessSellerTools) {
      router.replace('/home')
    }
  }, [authReady, isAuthenticated, canAccessSellerTools, router])

  if (!authReady) return null
  if (!isAuthenticated || !canAccessSellerTools) return null

  return <SellerNewListingPage />
}
