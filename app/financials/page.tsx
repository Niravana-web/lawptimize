"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { AIChatBar } from "@/components/ai-chat-bar"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  DollarSign,
  TrendingUp,
  CreditCard,
  MoreHorizontal,
  Receipt,
  FileText,
  Pencil,
  Trash2,
  Eye,
  Send,
  Download,
  IndianRupee,
} from "lucide-react"

type Invoice = {
  id: string
  client: string
  date: string
  dueDate: string
  amount: number
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE"
  items: { description: string; amount: number }[]
  notes?: string
}

type Expense = {
  id: string
  description: string
  category: string
  date: string
  amount: number
  case?: string
  client?: string
  billable: boolean
  invoiced: boolean
  invoiceId?: string
}

const initialInvoices: Invoice[] = [
  {
    id: "INV-2024-103",
    client: "Amit Patil",
    date: "12/11/2025",
    dueDate: "12/25/2025",
    amount: 50000,
    status: "OVERDUE",
    items: [
      { description: "Legal Consultation - Property Dispute", amount: 30000 },
      { description: "Document Drafting", amount: 20000 },
    ],
  },
  {
    id: "INV-2024-102",
    client: "Rajesh Sharma",
    date: "12/11/2025",
    dueDate: "12/30/2025",
    amount: 25000,
    status: "SENT",
    items: [
      { description: "Bail Application Drafting", amount: 15000 },
      { description: "Court Appearance Fee", amount: 10000 },
    ],
  },
  {
    id: "INV-2024-101",
    client: "TechCorp India Ltd",
    date: "12/11/2025",
    dueDate: "12/20/2025",
    amount: 150000,
    status: "PAID",
    items: [
      { description: "Merger & Acquisition Consultation", amount: 100000 },
      { description: "Due Diligence Review", amount: 50000 },
    ],
  },
]

const initialExpenses: Expense[] = [
  {
    id: "EXP-001",
    description: "Court Filing Fee - Sharma vs State",
    category: "Court Fees",
    date: "12/10/2025",
    amount: 5000,
    case: "Sharma vs. State of Maharashtra",
    client: "Rajesh Sharma",
    billable: true,
    invoiced: false,
  },
  {
    id: "EXP-002",
    description: "Document Notarization",
    category: "Legal Services",
    date: "12/09/2025",
    amount: 1500,
    case: "Patil Estate Dispute",
    client: "Amit Patil",
    billable: true,
    invoiced: false,
  },
  {
    id: "EXP-003",
    description: "Travel to High Court",
    category: "Travel",
    date: "12/08/2025",
    amount: 2500,
    case: "TechCorp Merger",
    client: "TechCorp India Ltd",
    billable: true,
    invoiced: true,
    invoiceId: "INV-2024-101",
  },
  {
    id: "EXP-004",
    description: "Legal Research Database Subscription",
    category: "Subscriptions",
    date: "12/01/2025",
    amount: 8000,
    billable: false,
    invoiced: false,
  },
  {
    id: "EXP-005",
    description: "Stamp Paper Purchase",
    category: "Court Fees",
    date: "12/07/2025",
    amount: 3000,
    case: "Mehta Divorce Petition",
    client: "Sita Mehta",
    billable: true,
    invoiced: false,
  },
  {
    id: "EXP-006",
    description: "Expert Witness Consultation",
    category: "Professional Services",
    date: "12/05/2025",
    amount: 15000,
    case: "GreenField Land Acquisition",
    client: "GreenField Developers",
    billable: true,
    invoiced: false,
  },
]

const expenseCategories = [
  "Court Fees",
  "Travel",
  "Legal Services",
  "Professional Services",
  "Subscriptions",
  "Office Supplies",
  "Communication",
  "Other",
]

const clients = ["Amit Patil", "Rajesh Sharma", "TechCorp India Ltd", "Sita Mehta", "GreenField Developers"]

const invoiceStatusStyles: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground border border-border",
  OVERDUE: "bg-red/15 text-red border border-red/30",
  SENT: "bg-yellow/15 text-yellow border border-yellow/30",
  PAID: "bg-green/15 text-green border border-green/30",
}

export default function FinancialsPage() {
  const [activeTab, setActiveTab] = useState<"invoices" | "expenses">("invoices")
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([])

  // Invoice dialogs
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null)

  // Expense dialogs
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null)

  // Create invoice from expenses dialog
  const [showCreateInvoiceFromExpenses, setShowCreateInvoiceFromExpenses] = useState(false)

  // Form state for new/edit expense
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    case: "",
    client: "",
    billable: true,
  })

  // Form state for new/edit invoice
  const [invoiceForm, setInvoiceForm] = useState({
    client: "",
    dueDate: "",
    notes: "",
    items: [{ description: "", amount: "" }],
  })

  // Calculate totals
  const totalRevenue = invoices.filter((inv) => inv.status === "PAID").reduce((sum, inv) => sum + inv.amount, 0)
  const pendingPayments = invoices
    .filter((inv) => inv.status === "SENT" || inv.status === "OVERDUE")
    .reduce((sum, inv) => sum + inv.amount, 0)
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const billableExpenses = expenses
    .filter((exp) => exp.billable && !exp.invoiced)
    .reduce((sum, exp) => sum + exp.amount, 0)

  // Expense CRUD
  const handleAddExpense = () => {
    setEditingExpense(null)
    setExpenseForm({
      description: "",
      category: "",
      date: new Date().toISOString().split("T")[0],
      amount: "",
      case: "",
      client: "",
      billable: true,
    })
    setShowExpenseDialog(true)
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setExpenseForm({
      description: expense.description,
      category: expense.category,
      date: expense.date.split("/").reverse().join("-"),
      amount: expense.amount.toString(),
      case: expense.case || "",
      client: expense.client || "",
      billable: expense.billable,
    })
    setShowExpenseDialog(true)
  }

  const handleSaveExpense = () => {
    const formattedDate = expenseForm.date.split("-").reverse().join("/")
    if (editingExpense) {
      setExpenses(
        expenses.map((exp) =>
          exp.id === editingExpense.id
            ? {
                ...exp,
                description: expenseForm.description,
                category: expenseForm.category,
                date: formattedDate,
                amount: Number.parseFloat(expenseForm.amount) || 0,
                case: expenseForm.case || undefined,
                client: expenseForm.client || undefined,
                billable: expenseForm.billable,
              }
            : exp,
        ),
      )
    } else {
      const newExpense: Expense = {
        id: `EXP-${String(expenses.length + 1).padStart(3, "0")}`,
        description: expenseForm.description,
        category: expenseForm.category,
        date: formattedDate,
        amount: Number.parseFloat(expenseForm.amount) || 0,
        case: expenseForm.case || undefined,
        client: expenseForm.client || undefined,
        billable: expenseForm.billable,
        invoiced: false,
      }
      setExpenses([newExpense, ...expenses])
    }
    setShowExpenseDialog(false)
  }

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((exp) => exp.id !== id))
    setSelectedExpenses(selectedExpenses.filter((expId) => expId !== id))
    setDeleteExpenseId(null)
  }

  // Invoice CRUD
  const handleAddInvoice = () => {
    setEditingInvoice(null)
    setInvoiceForm({
      client: "",
      dueDate: "",
      notes: "",
      items: [{ description: "", amount: "" }],
    })
    setShowInvoiceDialog(true)
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setInvoiceForm({
      client: invoice.client,
      dueDate: invoice.dueDate.split("/").reverse().join("-"),
      notes: invoice.notes || "",
      items: invoice.items.map((item) => ({
        description: item.description,
        amount: item.amount.toString(),
      })),
    })
    setShowInvoiceDialog(true)
  }

  const handleSaveInvoice = () => {
    const formattedDueDate = invoiceForm.dueDate.split("-").reverse().join("/")
    const today = new Date().toLocaleDateString("en-GB")
    const items = invoiceForm.items
      .filter((item) => item.description && item.amount)
      .map((item) => ({
        description: item.description,
        amount: Number.parseFloat(item.amount) || 0,
      }))
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

    if (editingInvoice) {
      setInvoices(
        invoices.map((inv) =>
          inv.id === editingInvoice.id
            ? {
                ...inv,
                client: invoiceForm.client,
                dueDate: formattedDueDate,
                notes: invoiceForm.notes || undefined,
                items,
                amount: totalAmount,
              }
            : inv,
        ),
      )
    } else {
      const newInvoice: Invoice = {
        id: `INV-2024-${String(invoices.length + 100 + 1)}`,
        client: invoiceForm.client,
        date: today,
        dueDate: formattedDueDate,
        amount: totalAmount,
        status: "DRAFT",
        items,
        notes: invoiceForm.notes || undefined,
      }
      setInvoices([newInvoice, ...invoices])
    }
    setShowInvoiceDialog(false)
  }

  const handleDeleteInvoice = (id: string) => {
    // Unmark expenses that were tied to this invoice
    setExpenses(expenses.map((exp) => (exp.invoiceId === id ? { ...exp, invoiced: false, invoiceId: undefined } : exp)))
    setInvoices(invoices.filter((inv) => inv.id !== id))
    setDeleteInvoiceId(null)
  }

  const handleUpdateInvoiceStatus = (id: string, status: Invoice["status"]) => {
    setInvoices(invoices.map((inv) => (inv.id === id ? { ...inv, status } : inv)))
  }

  // Create invoice from selected expenses
  const handleCreateInvoiceFromExpenses = () => {
    const selected = expenses.filter((exp) => selectedExpenses.includes(exp.id))
    if (selected.length === 0) return

    // Get client from first expense or set to empty
    const client = selected[0].client || ""

    setInvoiceForm({
      client,
      dueDate: "",
      notes: "",
      items: selected.map((exp) => ({
        description: exp.description,
        amount: exp.amount.toString(),
      })),
    })
    setShowCreateInvoiceFromExpenses(true)
  }

  const handleConfirmCreateInvoiceFromExpenses = () => {
    const formattedDueDate = invoiceForm.dueDate.split("-").reverse().join("/")
    const today = new Date().toLocaleDateString("en-GB")
    const items = invoiceForm.items
      .filter((item) => item.description && item.amount)
      .map((item) => ({
        description: item.description,
        amount: Number.parseFloat(item.amount) || 0,
      }))
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

    const newInvoiceId = `INV-2024-${String(invoices.length + 100 + 1)}`
    const newInvoice: Invoice = {
      id: newInvoiceId,
      client: invoiceForm.client,
      date: today,
      dueDate: formattedDueDate,
      amount: totalAmount,
      status: "DRAFT",
      items,
      notes: invoiceForm.notes || undefined,
    }

    // Mark selected expenses as invoiced
    setExpenses(
      expenses.map((exp) =>
        selectedExpenses.includes(exp.id) ? { ...exp, invoiced: true, invoiceId: newInvoiceId } : exp,
      ),
    )

    setInvoices([newInvoice, ...invoices])
    setSelectedExpenses([])
    setShowCreateInvoiceFromExpenses(false)
    setActiveTab("invoices")
  }

  const addInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { description: "", amount: "" }],
    })
  }

  const removeInvoiceItem = (index: number) => {
    setInvoiceForm({
      ...invoiceForm,
      items: invoiceForm.items.filter((_, i) => i !== index),
    })
  }

  const updateInvoiceItem = (index: number, field: "description" | "amount", value: string) => {
    setInvoiceForm({
      ...invoiceForm,
      items: invoiceForm.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    })
  }

  const toggleExpenseSelection = (id: string) => {
    setSelectedExpenses((prev) => (prev.includes(id) ? prev.filter((expId) => expId !== id) : [...prev, id]))
  }

  const selectAllBillableExpenses = () => {
    const billableIds = expenses.filter((exp) => exp.billable && !exp.invoiced).map((exp) => exp.id)
    setSelectedExpenses(billableIds)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="ml-16 flex-1 p-8 pb-24">
        <PageHeader
          title="Financials"
          description="Track revenue, expenses, and billing"
          action={
            <div className="flex items-center gap-3">
              {activeTab === "expenses" && selectedExpenses.length > 0 && (
                <Button
                  onClick={handleCreateInvoiceFromExpenses}
                  className="bg-gradient-to-r from-cyan to-teal text-primary-foreground hover:opacity-90"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Invoice ({selectedExpenses.length})
                </Button>
              )}
              <Button
                onClick={activeTab === "invoices" ? handleAddInvoice : handleAddExpense}
                className="bg-cyan text-primary-foreground hover:bg-cyan/90 shadow-[0_0_20px_oklch(0.72_0.17_195_/_0.3)]"
              >
                <Plus className="h-4 w-4 mr-2" />
                {activeTab === "invoices" ? "New Invoice" : "New Expense"}
              </Button>
            </div>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-5 rounded-xl bg-card border border-border/50 card-glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">₹ {totalRevenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1 text-green text-xs">
                  <TrendingUp className="h-3 w-3" />
                  <span>+12.5% from last month</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan/20 to-teal/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-cyan" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border/50 card-glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Pending Payments</p>
                <p className="text-2xl font-bold text-foreground">₹ {pendingPayments.toLocaleString()}</p>
                <p className="text-xs text-orange mt-1">
                  {invoices.filter((i) => i.status === "SENT" || i.status === "OVERDUE").length} invoices pending
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-cyan/5 flex items-center justify-center border-2 border-dashed border-cyan/30">
                <CreditCard className="h-6 w-6 text-cyan/60" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border/50 card-glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-foreground">₹ {totalExpenses.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{expenses.length} expenses logged</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-red/10 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-red" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border/50 card-glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Billable (Uninvoiced)</p>
                <p className="text-2xl font-bold text-foreground">₹ {billableExpenses.toLocaleString()}</p>
                <p className="text-xs text-cyan mt-1">
                  {expenses.filter((e) => e.billable && !e.invoiced).length} items to invoice
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-cyan/10 flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-cyan" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 p-1 bg-secondary/50 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "invoices"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Invoices
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "expenses"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Receipt className="h-4 w-4 inline mr-2" />
            Expenses
          </button>
        </div>

        {/* Invoices Table */}
        {activeTab === "invoices" && (
          <div className="rounded-xl bg-card border border-border/50 overflow-hidden card-glow">
            <div className="p-4 border-b border-border/50">
              <h2 className="font-semibold text-foreground">Recent Invoices</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 text-left">
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Invoice ID</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Client</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Due Date</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-border/30 last:border-b-0 hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedInvoice(invoice)
                        setShowInvoiceDetail(true)
                      }}
                    >
                      <td className="px-4 py-3 text-sm text-foreground font-mono">{invoice.id}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{invoice.client}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.date}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.dueDate}</td>
                      <td className="px-4 py-3 text-sm text-foreground font-medium">
                        ₹ {invoice.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded ${invoiceStatusStyles[invoice.status]}`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-secondary">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedInvoice(invoice)
                                setShowInvoiceDetail(true)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {invoice.status === "DRAFT" && (
                              <DropdownMenuItem onClick={() => handleUpdateInvoiceStatus(invoice.id, "SENT")}>
                                <Send className="h-4 w-4 mr-2" />
                                Send Invoice
                              </DropdownMenuItem>
                            )}
                            {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
                              <DropdownMenuItem onClick={() => handleUpdateInvoiceStatus(invoice.id, "PAID")}>
                                <DollarSign className="h-4 w-4 mr-2" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red" onClick={() => setDeleteInvoiceId(invoice.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expenses Table */}
        {activeTab === "expenses" && (
          <div className="rounded-xl bg-card border border-border/50 overflow-hidden card-glow">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Expenses</h2>
              <Button variant="ghost" size="sm" onClick={selectAllBillableExpenses}>
                Select All Billable
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 text-left">
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground w-10"></th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">ID</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Description</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Client</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className={`border-b border-border/30 last:border-b-0 hover:bg-secondary/30 transition-colors ${
                        selectedExpenses.includes(expense.id) ? "bg-cyan/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        {expense.billable && !expense.invoiced && (
                          <Checkbox
                            checked={selectedExpenses.includes(expense.id)}
                            onCheckedChange={() => toggleExpenseSelection(expense.id)}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground font-mono">{expense.id}</td>
                      <td className="px-4 py-3 text-sm text-foreground max-w-[200px] truncate">
                        {expense.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{expense.category}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{expense.date}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{expense.client || "-"}</td>
                      <td className="px-4 py-3 text-sm text-foreground font-medium">
                        ₹ {expense.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {expense.invoiced ? (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-green/15 text-green border border-green/30">
                            INVOICED
                          </span>
                        ) : expense.billable ? (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-cyan/15 text-cyan border border-cyan/30">
                            BILLABLE
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-muted text-muted-foreground border border-border">
                            NON-BILLABLE
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-secondary">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red" onClick={() => setDeleteExpenseId(expense.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
            <DialogDescription>{editingExpense ? "Update expense details" : "Record a new expense"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                placeholder="e.g., Court Filing Fee"
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={expenseForm.category}
                  onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="0"
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select
                  value={expenseForm.client}
                  onValueChange={(value) => setExpenseForm({ ...expenseForm, client: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="case">Related Case (Optional)</Label>
              <Input
                id="case"
                value={expenseForm.case}
                onChange={(e) => setExpenseForm({ ...expenseForm, case: e.target.value })}
                placeholder="e.g., Sharma vs State"
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="billable"
                checked={expenseForm.billable}
                onCheckedChange={(checked) => setExpenseForm({ ...expenseForm, billable: checked as boolean })}
              />
              <Label htmlFor="billable" className="text-sm cursor-pointer">
                Billable to client
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExpenseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveExpense} className="bg-cyan text-primary-foreground hover:bg-cyan/90">
              {editingExpense ? "Save Changes" : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
            <DialogDescription>
              {editingInvoice ? "Update invoice details" : "Create a new invoice for your client"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-client">Client</Label>
                <Select
                  value={invoiceForm.client}
                  onValueChange={(value) => setInvoiceForm({ ...invoiceForm, client: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-due">Due Date</Label>
                <Input
                  id="inv-due"
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button variant="ghost" size="sm" onClick={addInvoiceItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              {invoiceForm.items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateInvoiceItem(index, "description", e.target.value)}
                    className="bg-secondary border-border flex-1"
                  />
                  <Input
                    placeholder="Amount"
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateInvoiceItem(index, "amount", e.target.value)}
                    className="bg-secondary border-border w-32"
                  />
                  {invoiceForm.items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeInvoiceItem(index)}
                      className="text-red hover:text-red"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex justify-end text-sm">
                <span className="text-muted-foreground mr-2">Total:</span>
                <span className="font-medium text-foreground">
                  ₹{" "}
                  {invoiceForm.items
                    .reduce((sum, item) => sum + (Number.parseFloat(item.amount) || 0), 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inv-notes">Notes (Optional)</Label>
              <Textarea
                id="inv-notes"
                value={invoiceForm.notes}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                placeholder="Additional notes for the client..."
                className="bg-secondary border-border"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveInvoice} className="bg-cyan text-primary-foreground hover:bg-cyan/90">
              {editingInvoice ? "Save Changes" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invoice from Expenses Dialog */}
      <Dialog open={showCreateInvoiceFromExpenses} onOpenChange={setShowCreateInvoiceFromExpenses}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice from Expenses</DialogTitle>
            <DialogDescription>Creating invoice from {selectedExpenses.length} selected expense(s)</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exp-inv-client">Client</Label>
                <Select
                  value={invoiceForm.client}
                  onValueChange={(value) => setInvoiceForm({ ...invoiceForm, client: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-inv-due">Due Date</Label>
                <Input
                  id="exp-inv-due"
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Line Items (from expenses)</Label>
              {invoiceForm.items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item.description}
                    onChange={(e) => updateInvoiceItem(index, "description", e.target.value)}
                    className="bg-secondary border-border flex-1"
                  />
                  <Input
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateInvoiceItem(index, "amount", e.target.value)}
                    className="bg-secondary border-border w-32"
                  />
                </div>
              ))}
              <div className="flex justify-end text-sm">
                <span className="text-muted-foreground mr-2">Total:</span>
                <span className="font-medium text-foreground">
                  ₹{" "}
                  {invoiceForm.items
                    .reduce((sum, item) => sum + (Number.parseFloat(item.amount) || 0), 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-inv-notes">Notes (Optional)</Label>
              <Textarea
                id="exp-inv-notes"
                value={invoiceForm.notes}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                placeholder="Additional notes..."
                className="bg-secondary border-border"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateInvoiceFromExpenses(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCreateInvoiceFromExpenses}
              className="bg-cyan text-primary-foreground hover:bg-cyan/90"
            >
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Dialog */}
      <Dialog open={showInvoiceDetail} onOpenChange={setShowInvoiceDetail}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedInvoice?.id}
              {selectedInvoice && (
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded ${invoiceStatusStyles[selectedInvoice.status]}`}
                >
                  {selectedInvoice.status}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium text-foreground">{selectedInvoice.client}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium text-foreground text-lg">₹ {selectedInvoice.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Date</p>
                  <p className="text-foreground">{selectedInvoice.date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="text-foreground">{selectedInvoice.dueDate}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted-foreground mb-2">Line Items</p>
                <div className="space-y-2">
                  {selectedInvoice.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-foreground">{item.description}</span>
                      <span className="text-foreground font-medium">₹ {item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                    <span className="font-medium text-foreground">Total</span>
                    <span className="font-bold text-foreground">₹ {selectedInvoice.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm text-foreground">{selectedInvoice.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => handleEditInvoice(selectedInvoice)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                {selectedInvoice.status === "DRAFT" && (
                  <Button
                    onClick={() => {
                      handleUpdateInvoiceStatus(selectedInvoice.id, "SENT")
                      setShowInvoiceDetail(false)
                    }}
                    className="bg-cyan text-primary-foreground hover:bg-cyan/90"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Invoice
                  </Button>
                )}
                {(selectedInvoice.status === "SENT" || selectedInvoice.status === "OVERDUE") && (
                  <Button
                    onClick={() => {
                      handleUpdateInvoiceStatus(selectedInvoice.id, "PAID")
                      setShowInvoiceDetail(false)
                    }}
                    className="bg-green text-primary-foreground hover:bg-green/90"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Invoice Confirmation */}
      <AlertDialog open={!!deleteInvoiceId} onOpenChange={() => setDeleteInvoiceId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red text-white hover:bg-red/90"
              onClick={() => deleteInvoiceId && handleDeleteInvoice(deleteInvoiceId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Expense Confirmation */}
      <AlertDialog open={!!deleteExpenseId} onOpenChange={() => setDeleteExpenseId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red text-white hover:bg-red/90"
              onClick={() => deleteExpenseId && handleDeleteExpense(deleteExpenseId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AIChatBar />
    </div>
  )
}
