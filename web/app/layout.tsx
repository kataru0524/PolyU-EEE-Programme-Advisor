import { SpeedInsights } from '@vercel/speed-insights/next'
import { getLocaleOnServer } from '@/i18n/server'

import './styles/globals.css'
import './styles/markdown.scss'

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
