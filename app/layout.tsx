import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { TaskProvider } from "@/lib/task-store"
import { UserProvider } from "@/lib/user-context"
import { Toaster } from "sonner"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Lawptimize - AI Productivity for Lawyers",
  description: "AI-powered legal productivity platform for modern law practices",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="font-sans antialiased">
          <ThemeProvider>
            <TaskProvider>
              <UserProvider>{children}</UserProvider>
            </TaskProvider>
          </ThemeProvider>
          <Toaster richColors position="top-right" />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
