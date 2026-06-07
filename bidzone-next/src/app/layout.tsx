import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { getGoogleClientId } from '@/lib/env'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'BidZone — Premium Auction Platform',
  description: 'Bid on premium items in real-time auctions.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const googleClientId = getGoogleClientId()
  const bootConfig = JSON.stringify({ googleClientId })

  return (
    <html lang="en">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__BZ_CONFIG__=${bootConfig}`,
          }}
        />
        <Providers googleClientId={googleClientId}>{children}</Providers>
      </body>
    </html>
  )
}
