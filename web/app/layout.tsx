import { SpeedInsights } from '@vercel/speed-insights/next'
import { getLocaleOnServer } from '@/i18n/server'
import type { Metadata } from 'next'
import { Inter, Noto_Sans_SC } from 'next/font/google'
import LanguageTransitionWrapper from '@/app/components/language-transition-wrapper'

import './styles/globals.css'
import './styles/markdown.scss'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-latin',
})

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
  variable: '--font-cjk',
})

const resolveSiteUrl = () => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured)
    return configured.replace(/\/+$/, '')

  const vercelProdDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (vercelProdDomain)
    return `https://${vercelProdDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`

  const vercelDomain = process.env.VERCEL_URL?.trim()
  if (vercelDomain)
    return `https://${vercelDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`

  return 'https://polyu-eee-advisor.vercel.app'
}

const SITE_URL = resolveSiteUrl()
const THUMBNAIL_URL = `${SITE_URL}/thumbnail.png`

const META_TITLE = 'PolyU EEE Programme Advisor'
const META_DESCRIPTION = 'An intelligent chatbot advisor for the PolyU Department of Electrical and Electronic Engineering programme.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: META_TITLE,
  description: META_DESCRIPTION,
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/appicon.png', type: 'image/png' },
    ],
    apple: '/appicon.png',
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    siteName: META_TITLE,
    url: SITE_URL,
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: [
      {
        url: THUMBNAIL_URL,
        secureUrl: THUMBNAIL_URL,
        width: 1280,
        height: 640,
        type: 'image/png',
        alt: META_TITLE,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: [THUMBNAIL_URL],
  },
}

const LocaleLayout = async ({
  children,
}: {
  children: React.ReactNode
}) => {
  let locale = 'en'
  try {
    locale = await getLocaleOnServer()
  }
  catch {
    locale = 'en'
  }
  return (
    <html lang={locale} className={`h-full ${inter.variable} ${notoSansSC.variable}`} suppressHydrationWarning>
      <body className={`h-full bg-white dark:bg-gray-950 ${inter.className}`} suppressHydrationWarning>
        <div className="w-full h-full min-w-[300px]">
          <LanguageTransitionWrapper>
            {children}
          </LanguageTransitionWrapper>
        </div>
        <SpeedInsights />
      </body>
    </html>
  )
}

export default LocaleLayout
