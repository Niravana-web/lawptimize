"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface FeedItem {
  id: string
  title: string
  time: string
  timestamp: number
  isNew?: boolean
}

const mockFeedItems: Omit<FeedItem, "id" | "timestamp" | "time">[] = [
  { title: "Bail Application Drafted" },
  { title: "Hearing Reminder: Sharma vs State" },
  { title: "Invoice #INV-003 Paid" },
  { title: "New Case Filed: Patel vs Municipal Corp" },
  { title: "Document Review Completed" },
  { title: "Client Meeting Scheduled: TechCorp" },
  { title: "Court Order Received: Mehta Case" },
  { title: "Legal Research: Section 498A Updated" },
  { title: "Deadline Alert: Property Dispute Filing" },
  { title: "AI Summary Generated: Land Acquisition" },
  { title: "Payment Received: INV-2024-105" },
  { title: "Witness Statement Uploaded" },
  { title: "Hearing Postponed: Greenfield Case" },
  { title: "Contract Draft Approved" },
  { title: "New Client Inquiry: Corporate Law" },
]

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? "s" : ""} ago`
}

export function IntelligenceFeed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [isConnected, setIsConnected] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initialItems: FeedItem[] = [
      {
        id: "1",
        title: "Bail Application Drafted",
        time: "2 mins ago",
        timestamp: Date.now() - 2 * 60 * 1000,
      },
      {
        id: "2",
        title: "Hearing Reminder: Sharma vs State",
        time: "1 hour ago",
        timestamp: Date.now() - 60 * 60 * 1000,
      },
      {
        id: "3",
        title: "Invoice #INV-003 Paid",
        time: "3 hours ago",
        timestamp: Date.now() - 3 * 60 * 60 * 1000,
      },
    ]
    setFeedItems(initialItems)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setFeedItems((items) =>
        items.map((item) => ({
          ...item,
          time: getTimeAgo(item.timestamp),
        })),
      )
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const addNewItem = () => {
      const randomItem = mockFeedItems[Math.floor(Math.random() * mockFeedItems.length)]
      const newItem: FeedItem = {
        id: Date.now().toString(),
        title: randomItem.title,
        time: "Just now",
        timestamp: Date.now(),
        isNew: true,
      }

      setFeedItems((items) => {
        const updated = [newItem, ...items.slice(0, 19)] // Keep max 20 items
        return updated
      })

      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" })
        }
      }, 100)

      setTimeout(() => {
        setFeedItems((items) => items.map((item) => (item.id === newItem.id ? { ...item, isNew: false } : item)))
      }, 1000)
    }

    const initialTimeout = setTimeout(addNewItem, 3000)
    const interval = setInterval(
      () => {
        addNewItem()
      },
      5000 + Math.random() * 5000,
    )

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(false)
      setTimeout(() => setIsConnected(true), 200)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-6 rounded-xl bg-card border border-border/50 card-glow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-colors duration-300",
                isConnected ? "bg-cyan" : "bg-muted",
              )}
            />
            <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-cyan animate-ping opacity-75" />
            <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-cyan blur-sm animate-pulse" />
          </div>
          <h2 className="font-semibold text-foreground">Intelligence Feed</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Live</span>
          <div className="flex gap-0.5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-cyan rounded-full animate-pulse"
                style={{
                  height: `${8 + (i % 3) * 4}px`,
                  animationDelay: `${i * 150}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="space-y-3 overflow-y-auto max-h-[280px] pr-2 scrollbar-thin scrollbar-thumb-cyan/20 scrollbar-track-transparent hover:scrollbar-thumb-cyan/40 transition-colors"
        >
          {feedItems.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 p-2 -mx-2 rounded-lg transition-all duration-500",
                item.isNew ? "animate-slide-in bg-cyan/10 border border-cyan/20" : "hover:bg-secondary/30",
                index === 0 && !item.isNew && "border-l-2 border-l-cyan/50 pl-3",
              )}
              style={{
                animationDelay: item.isNew ? "0ms" : `${index * 50}ms`,
              }}
            >
              <div className="relative mt-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full transition-all duration-300",
                    item.isNew
                      ? "bg-cyan shadow-[0_0_12px_oklch(0.72_0.17_195)]"
                      : "bg-purple shadow-[0_0_8px_oklch(0.6_0.25_295)]",
                  )}
                />
                {item.isNew && <div className="absolute inset-0 h-2 w-2 rounded-full bg-cyan animate-ping" />}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-medium text-foreground truncate transition-colors duration-300",
                    item.isNew && "text-cyan",
                  )}
                >
                  {item.title}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  {item.time}
                  {item.isNew && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-cyan/20 text-cyan uppercase tracking-wider ml-1">
                      New
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute top-0 left-0 right-2 h-4 bg-gradient-to-b from-card to-transparent pointer-events-none opacity-0 transition-opacity" />
        <div className="absolute bottom-0 left-0 right-2 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />
      </div>

      <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{feedItems.length} updates today</span>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full bg-green animate-pulse" />
          <span>Connected to AI Agents</span>
        </div>
      </div>
    </div>
  )
}
