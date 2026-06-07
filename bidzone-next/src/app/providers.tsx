'use client'

import type { ReactNode } from 'react'
import { GoogleAuthShell } from '@/components/auth/GoogleAuthShell'
import { GoogleConfigProvider } from '@/context/GoogleConfigContext'
import { I18nProvider } from '@/context/I18nContext'
import { AuthProvider } from '@/context/AuthContext'
import { HelpProvider } from '@/context/HelpContext'
import { CartProvider } from '@/context/CartContext'
import { WishlistProvider } from '@/context/WishlistContext'
import { NotificationsProvider } from '@/context/NotificationsContext'
import { ListingsProvider } from '@/context/ListingsContext'
import { SavedCardsProvider } from '@/context/SavedCardsContext'

type Props = {
  children: ReactNode
  /** Passed from server layout so Vercel runtime env is available in the browser. */
  googleClientId: string
}

export function Providers({ children, googleClientId }: Props) {
  return (
    <GoogleConfigProvider clientId={googleClientId}>
      <GoogleAuthShell>
        <I18nProvider>
          <AuthProvider>
            <NotificationsProvider>
              <ListingsProvider>
                <CartProvider>
                  <WishlistProvider>
                    <SavedCardsProvider>
                      <HelpProvider>{children}</HelpProvider>
                    </SavedCardsProvider>
                  </WishlistProvider>
                </CartProvider>
              </ListingsProvider>
            </NotificationsProvider>
          </AuthProvider>
        </I18nProvider>
      </GoogleAuthShell>
    </GoogleConfigProvider>
  )
}
