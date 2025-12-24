"use client"

import type React from "react"

import { useState } from "react"
import { Mic, Send, Sparkles, CheckCircle, XCircle } from "lucide-react"
import { useTaskStore } from "@/lib/task-store"

export function AIChatBar() {
  const [query, setQuery] = useState("")
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const { addTask } = useTaskStore()

  const handleSubmit = () => {
    if (!query.trim()) return

    // Check if the query is about adding a task
    const taskPatterns = [
      /add (?:a )?task[:\s]+(.+)/i,
      /create (?:a )?task[:\s]+(.+)/i,
      /new task[:\s]+(.+)/i,
      /add to (?:my )?(?:todo|tasks?)[:\s]+(.+)/i,
      /remind me to (.+)/i,
    ]

    let matched = false
    for (const pattern of taskPatterns) {
      const match = query.match(pattern)
      if (match) {
        const taskTitle = match[1].trim()

        // Parse priority if mentioned
        let priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM"
        if (/urgent/i.test(query)) priority = "URGENT"
        else if (/high priority/i.test(query)) priority = "HIGH"
        else if (/low priority/i.test(query)) priority = "LOW"

        // Parse case if mentioned
        let caseName = "General Task"
        const caseMatch = query.match(/(?:for|regarding|about|case:?)\s+([^,]+)/i)
        if (caseMatch) {
          caseName = caseMatch[1].trim()
        }

        // Parse due date if mentioned
        const dueDate = new Date()
        if (/tomorrow/i.test(query)) {
          dueDate.setDate(dueDate.getDate() + 1)
        } else if (/next week/i.test(query)) {
          dueDate.setDate(dueDate.getDate() + 7)
        } else if (/today/i.test(query)) {
          // Keep as today
        } else {
          // Default to 3 days from now
          dueDate.setDate(dueDate.getDate() + 3)
        }

        addTask({
          title:
            taskTitle.replace(/(?:urgent|high priority|low priority|tomorrow|today|next week|for .+)/gi, "").trim() ||
            taskTitle,
          description: `Task created via AI assistant: "${query}"`,
          case: caseName,
          assignee: "Vikram Tantravahi",
          assigneeEmail: "vikram@lawptimize.com",
          dueDate: dueDate.toLocaleDateString("en-US"),
          priority,
          status: "todo",
        })

        setFeedback({ type: "success", message: `Task "${taskTitle}" added to your board!` })
        matched = true
        break
      }
    }

    if (!matched) {
      setFeedback({ type: "success", message: "Processing your request..." })
    }

    setQuery("")

    // Clear feedback after 3 seconds
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      {/* Feedback toast */}
      {feedback && (
        <div
          className={`absolute -top-14 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium whitespace-nowrap animate-in slide-in-from-bottom-2 fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-green/20 text-green border border-green/30"
              : "bg-red/20 text-red border border-red/30"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {feedback.message}
        </div>
      )}

      <div className="gradient-border">
        <div className="gradient-border-inner flex items-center gap-3 px-5 py-3.5">
          <Sparkles className="h-5 w-5 text-cyan" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Lawptimize AI to draft, research, or summarize... (Try: 'Add task: Review contract')"
            className="w-[480px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Mic className="h-5 w-5" />
          </button>
          <button
            onClick={handleSubmit}
            className="h-8 w-8 rounded-full bg-cyan/10 flex items-center justify-center text-cyan hover:bg-cyan/20 transition-all duration-300"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
