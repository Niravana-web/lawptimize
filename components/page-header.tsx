import type React from "react"
import { ThemeToggle } from "./theme-toggle"

interface PageHeaderProps {
  title: string
  description: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

export function PageHeader({ title, description, action, icon }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <div className="flex items-center gap-3">
          {icon}
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-1">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {action}
      </div>
    </div>
  )
}
