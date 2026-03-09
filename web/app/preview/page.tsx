import type { Metadata } from 'next'
import RedirectClient from './redirect-client'

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
  alternates: {
    canonical: `${SITE_URL}/preview`,
  },
  openGraph: {
    type: 'website',
    siteName: META_TITLE,
    url: `${SITE_URL}/preview`,
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

export default function PreviewPage() {
  return (
    <main className='min-h-screen flex items-center justify-center p-6 text-center text-sm text-gray-600'>
      <RedirectClient href={SITE_URL} />
      <p>
        Redirecting to PolyU EEE Programme Advisor...{' '}
        <a href={SITE_URL} className='text-primary-600 underline'>Click here if not redirected</a>
      </p>
    </main>
  )
}
