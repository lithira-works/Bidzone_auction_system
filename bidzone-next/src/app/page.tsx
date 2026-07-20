'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { LoginPage } from '@/components/layout/LoginPage'

export default function RootPage() {
  const { authReady, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authReady) return
    if (isAuthenticated) {
      router.replace('/home')
    }
  }, [authReady, isAuthenticated, router])

  if (!authReady) return null
  if (isAuthenticated) return null

  return <LoginPage />
}
