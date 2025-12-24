"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface Task {
  id: string
  title: string
  description?: string
  case: string
  assignee: string
  assigneeEmail?: string
  dueDate: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  status: "todo" | "inProgress" | "completed"
  createdAt: string
}

const initialTasks: Task[] = [
  {
    id: "1",
    title: "File Vakalatnama",
    description:
      "File the vakalatnama for the Mehta Divorce Petition case at the Family Court. Ensure all documents are properly signed and stamped.",
    case: "Mehta Divorce Petition",
    assignee: "Vikram Tantravahi",
    assigneeEmail: "vikram@lawptimize.com",
    dueDate: "12/15/2024",
    priority: "LOW",
    status: "todo",
    createdAt: "12/10/2024",
  },
  {
    id: "2",
    title: "Review Property Documents",
    description:
      "Review all property documents including title deeds, encumbrance certificates, and previous sale deeds for the Patil Estate Dispute.",
    case: "Patil Estate Dispute",
    assignee: "Vikram Tantravahi",
    assigneeEmail: "vikram@lawptimize.com",
    dueDate: "12/11/2024",
    priority: "HIGH",
    status: "todo",
    createdAt: "12/08/2024",
  },
  {
    id: "3",
    title: "Draft Bail Application",
    description:
      "Prepare and draft the bail application for Sharma vs. State of Maharashtra. Include all relevant grounds and case precedents.",
    case: "Sharma vs. State of Maharashtra",
    assignee: "Vikram Tantravahi",
    assigneeEmail: "vikram@lawptimize.com",
    dueDate: "12/10/2024",
    priority: "URGENT",
    status: "inProgress",
    createdAt: "12/05/2024",
  },
  {
    id: "4",
    title: "Client Meeting: TechCorp",
    description:
      "Meeting with TechCorp India Ltd regarding the merger agreement. Discuss terms and conditions, due diligence findings.",
    case: "TechCorp Merger",
    assignee: "Vikram Tantravahi",
    assigneeEmail: "vikram@lawptimize.com",
    dueDate: "12/8/2024",
    priority: "MEDIUM",
    status: "completed",
    createdAt: "12/01/2024",
  },
  {
    id: "5",
    title: "Prepare Written Arguments",
    description:
      "Draft comprehensive written arguments for the GreenField Land Acquisition case citing relevant High Court precedents.",
    case: "GreenField Land Acquisition",
    assignee: "Priya Sharma",
    assigneeEmail: "priya@lawptimize.com",
    dueDate: "12/18/2024",
    priority: "HIGH",
    status: "todo",
    createdAt: "12/09/2024",
  },
  {
    id: "6",
    title: "File Counter Affidavit",
    description: "Prepare and file counter affidavit in response to the writ petition in the High Court.",
    case: "Sharma vs. State of Maharashtra",
    assignee: "Amit Desai",
    assigneeEmail: "amit@lawptimize.com",
    dueDate: "12/13/2024",
    priority: "URGENT",
    status: "todo",
    createdAt: "12/10/2024",
  },
  {
    id: "7",
    title: "Legal Research: IPC 420",
    description:
      "Conduct comprehensive legal research on recent Supreme Court judgments related to IPC Section 420 for client defense strategy.",
    case: "State vs. Reddy",
    assignee: "Vikram Tantravahi",
    assigneeEmail: "vikram@lawptimize.com",
    dueDate: "12/14/2024",
    priority: "MEDIUM",
    status: "inProgress",
    createdAt: "12/07/2024",
  },
  {
    id: "8",
    title: "Draft Settlement Agreement",
    description:
      "Prepare draft settlement agreement between parties for the property dispute case. Include all terms discussed in mediation.",
    case: "Patil Estate Dispute",
    assignee: "Priya Sharma",
    assigneeEmail: "priya@lawptimize.com",
    dueDate: "12/16/2024",
    priority: "MEDIUM",
    status: "inProgress",
    createdAt: "12/08/2024",
  },
  {
    id: "9",
    title: "Court Filing Completed",
    description: "Successfully filed all necessary documents for the divorce petition at Family Court Bandra.",
    case: "Mehta Divorce Petition",
    assignee: "Vikram Tantravahi",
    assigneeEmail: "vikram@lawptimize.com",
    dueDate: "12/05/2024",
    priority: "LOW",
    status: "completed",
    createdAt: "12/01/2024",
  },
  {
    id: "10",
    title: "Client Consultation",
    description: "Initial consultation with new client regarding intellectual property dispute.",
    case: "IPR Infringement - Tech Solutions",
    assignee: "Amit Desai",
    assigneeEmail: "amit@lawptimize.com",
    dueDate: "12/06/2024",
    priority: "LOW",
    status: "completed",
    createdAt: "12/02/2024",
  },
  {
    id: "11",
    title: "Review Contract Terms",
    description: "Review and analyze the merger contract terms for potential legal issues and negotiation points.",
    case: "TechCorp Merger",
    assignee: "Priya Sharma",
    assigneeEmail: "priya@lawptimize.com",
    dueDate: "12/07/2024",
    priority: "HIGH",
    status: "completed",
    createdAt: "12/03/2024",
  },
]

interface TaskContextType {
  tasks: Task[]
  addTask: (task: Omit<Task, "id" | "createdAt">) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  const addTask = (task: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toLocaleDateString("en-US"),
    }
    setTasks((prev) => [newTask, ...prev])
  }

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...updates } : task)))
  }

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  return <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask }}>{children}</TaskContext.Provider>
}

export function useTaskStore() {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error("useTaskStore must be used within a TaskProvider")
  }
  return context
}
