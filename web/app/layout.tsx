import { SpeedInsights } from '@vercel/speed-insights/next'
import { getLocaleOnServer } from '@/i18n/server'
import type { Metadata } from 'next'

import './styles/globals.css'
import './styles/markdown.scss'

export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: '/thumbnail.png',
        width: 1200,
        height: 630,
        alt: 'PolyU EEE Programme Advisor',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/thumbnail.png'],
  },
}

const LocaleLayout = async ({
  children,
}: {
  children: React.ReactNode
}) => {
  const locale = await getLocaleOnServer()
  return (
    <html lang={locale ?? 'en'} className="h-full" suppressHydrationWarning>
      <body className="h-full bg-white dark:bg-gray-950" suppressHydrationWarning>
        <div className="w-full h-full min-w-[300px]">
          {children}
        </div>
        <SpeedInsights />
      </body>
    </html>
  )
}

export default LocaleLayout
