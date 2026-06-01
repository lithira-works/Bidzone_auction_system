'use client'
import type { ReactNode } from 'react'
import { I18nProvider } from '@/context/I18nContext'
import { AuthProvider } from '@/context/AuthContext'
import { HelpProvider } from '@/context/HelpContext'
import { CartProvider } from '@/context/CartContext'
import { WishlistProvider } from '@/context/WishlistContext'
import { NotificationsProvider } from '@/context/NotificationsContext'
import { ListingsProvider } from '@/context/ListingsContext'
import { SavedCardsProvider } from '@/context/SavedCardsContext'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <NotificationsProvider>
          <ListingsProvider>
            <CartProvider>
              <WishlistProvider>
                <SavedCardsProvider>
                  <HelpProvider>
                    {children}
                  </HelpProvider>
                </SavedCardsProvider>
              </WishlistProvider>
            </CartProvider>
          </ListingsProvider>
        </NotificationsProvider>
      </AuthProvider>
    </I18nProvider>
  )
}
