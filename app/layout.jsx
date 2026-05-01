import './globals.css'

export const metadata = {
  title: 'Stackr — AI Tolerance Stackup Analysis',
  description: 'Upload any engineering drawing and get instant tolerance stackup analysis. MMC, LMC, GD&T, RSS, Worst Case, and Vector methods.',
  keywords: 'tolerance stackup analysis, GD&T, MMC, LMC, RSS, worst case, engineering, manufacturing',
  openGraph: {
    title: 'Stackr — AI Tolerance Stackup Analysis',
    description: 'Tolerance stackup analysis in seconds, not hours.',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
