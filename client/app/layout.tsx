import { Geist, JetBrains_Mono } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { Nav } from "@/components/nav"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(fontSans.variable, jetbrainsMono.variable)}>
      <body className="antialiased">
        <ThemeProvider>
          <div className="flex min-h-svh">
            <Nav />
            <main className="flex-1 p-6">{children}</main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
