'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { CheckoutPaymentPage } from '@/components/layout/CheckoutPaymentPage'

export default function CheckoutPaymentRoute() {
  const { authReady, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authReady) return
    if (!isAuthenticated) {
      router.replace('/')
    }
  }, [authReady, isAuthenticated, router])

  if (!authReady) return null
  if (!isAuthenticated) return null

  return <CheckoutPaymentPage />
}
