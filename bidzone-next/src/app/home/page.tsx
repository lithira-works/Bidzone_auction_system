'use client'
import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { HomePage } from '@/components/layout/HomePage'

function HomePageRouteInner() {
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

  return <HomePage />
}

export default function HomePageRoute() {
  return (
    <Suspense fallback={null}>
      <HomePageRouteInner />
    </Suspense>
  )
}
