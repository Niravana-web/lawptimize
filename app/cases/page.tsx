"use client"

import { useState, useMemo, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { AIChatBar } from "@/components/ai-chat-bar"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Search,
  Filter,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building,
  FileText,
  Clock,
  Loader2,
} from "lucide-react"

interface CaseData {
  id: string
  title: string
  caseNumber: string
  court: string
  client: string
  description: string
  stage: "FILING" | "HEARING" | "ARGUMENTS" | "JUDGMENT"
  stageProgress: number
  priority: "LOW" | "MEDIUM" | "HIGH"
  nextDate: string
  filedDate: string
  status: string
}

const priorityClasses: Record<string, string> = {
  LOW: "priority-low",
  MEDIUM: "priority-medium",
  HIGH: "priority-high",
}

const stageGradients: Record<string, string> = {
  FILING: "stage-gradient-cyan",
  HEARING: "stage-gradient-purple",
  ARGUMENTS: "stage-gradient-green",
  JUDGMENT: "stage-gradient-purple",
}

type SortKey = "title" | "client" | "court" | "nextDate" | "stage" | "priority"
type SortDirection = "asc" | "desc" | null

const ITEMS_PER_PAGE = 8

const initialFormState = {
  title: "",
  caseNumber: "",
  court: "",
  client: "",
  description: "",
  stage: "FILING" as const,
  priority: "MEDIUM" as const,
  nextDate: "",
  filedDate: "",
}

export default function CasesPage() {
  const [cases, setCases] = useState<CaseData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null)

  // New case dialog state
  const [isNewCaseDialogOpen, setIsNewCaseDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState(initialFormState)
  const [formError, setFormError] = useState<string | null>(null)

  // Fetch cases on mount
  useEffect(() => {
    fetchCases()
  }, [])

  const fetchCases = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch("/api/cases")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch cases")
      }

      setCases(data.cases || [])
    } catch (err: any) {
      setError(err.message)
      setCases([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.title || !formData.caseNumber || !formData.court || !formData.client) {
      setFormError("Please fill in all required fields")
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          nextDate: formData.nextDate || undefined,
          filedDate: formData.filedDate || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create case")
      }

      // Add new case to the list
      setCases((prev) => [data.case, ...prev])
      setIsNewCaseDialogOpen(false)
      setFormData(initialFormState)
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredAndSortedCases = useMemo(() => {
    let result = [...cases]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.client.toLowerCase().includes(query) ||
          c.court.toLowerCase().includes(query) ||
          c.id.toLowerCase().includes(query) ||
          c.caseNumber.toLowerCase().includes(query),
      )
    }

    // Sort
    if (sortKey && sortDirection) {
      result.sort((a, b) => {
        let aVal: string | number = a[sortKey]
        let bVal: string | number = b[sortKey]

        // Priority sorting order
        if (sortKey === "priority") {
          const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
          aVal = priorityOrder[aVal as keyof typeof priorityOrder] || 0
          bVal = priorityOrder[bVal as keyof typeof priorityOrder] || 0
        }

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
        return 0
      })
    }

    return result
  }, [cases, searchQuery, sortKey, sortDirection])

  const totalPages = Math.ceil(filteredAndSortedCases.length / ITEMS_PER_PAGE)
  const paginatedCases = filteredAndSortedCases.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDirection === "asc") setSortDirection("desc")
      else if (sortDirection === "desc") {
        setSortKey(null)
        setSortDirection(null)
      }
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
    setCurrentPage(1)
  }

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
    if (sortDirection === "asc") return <ArrowUp className="h-4 w-4 ml-1 text-cyan" />
    return <ArrowDown className="h-4 w-4 ml-1 text-cyan" />
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="ml-16 flex-1 flex flex-col p-8 pb-24 overflow-hidden">
        <PageHeader
          title="Case Files"
          description="Manage and track your active legal matters"
          action={
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cases..."
                  className="pl-9 w-56 bg-secondary/50 border-border"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>
              <Button variant="outline" size="icon" className="border-border bg-card hover:bg-secondary">
                <Filter className="h-4 w-4" />
              </Button>
              <Button
                className="bg-cyan text-white hover:bg-cyan/90 shadow-lg"
                onClick={() => setIsNewCaseDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Case
              </Button>
            </div>
          }
        />

        <div className="flex-1 flex flex-col rounded-xl border border-border bg-card overflow-hidden min-h-0">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-cyan" />
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={fetchCases} variant="outline">
                Retry
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-medium">
                        <button
                          className="flex items-center hover:text-foreground transition-colors"
                          onClick={() => handleSort("title")}
                        >
                          Case Title {getSortIcon("title")}
                        </button>
                      </TableHead>
                      <TableHead className="text-muted-foreground font-medium">
                        <button
                          className="flex items-center hover:text-foreground transition-colors"
                          onClick={() => handleSort("client")}
                        >
                          Client {getSortIcon("client")}
                        </button>
                      </TableHead>
                      <TableHead className="text-muted-foreground font-medium">
                        <button
                          className="flex items-center hover:text-foreground transition-colors"
                          onClick={() => handleSort("court")}
                        >
                          Court {getSortIcon("court")}
                        </button>
                      </TableHead>
                      <TableHead className="text-muted-foreground font-medium">
                        <button
                          className="flex items-center hover:text-foreground transition-colors"
                          onClick={() => handleSort("nextDate")}
                        >
                          Next Date {getSortIcon("nextDate")}
                        </button>
                      </TableHead>
                      <TableHead className="text-muted-foreground font-medium">
                        <button
                          className="flex items-center hover:text-foreground transition-colors"
                          onClick={() => handleSort("stage")}
                        >
                          Stage {getSortIcon("stage")}
                        </button>
                      </TableHead>
                      <TableHead className="text-muted-foreground font-medium">
                        <button
                          className="flex items-center hover:text-foreground transition-colors"
                          onClick={() => handleSort("priority")}
                        >
                          Priority {getSortIcon("priority")}
                        </button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCases.map((caseItem) => (
                      <TableRow
                        key={caseItem.id}
                        className="border-border cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={() => setSelectedCase(caseItem)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{caseItem.title}</p>
                            <p className="text-xs text-muted-foreground font-mono">{caseItem.caseNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{caseItem.client}</TableCell>
                        <TableCell className="text-muted-foreground">{caseItem.court}</TableCell>
                        <TableCell className="text-muted-foreground">{caseItem.nextDate}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">{caseItem.stage}</span>
                            <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div
                                className={`h-full ${stageGradients[caseItem.stage] || "bg-cyan"} rounded-full`}
                                style={{ width: `${caseItem.stageProgress}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2.5 py-1 text-xs font-medium rounded ${priorityClasses[caseItem.priority]}`}>
                            {caseItem.priority}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {paginatedCases.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {cases.length === 0 ? "No cases yet. Create your first case!" : "No cases found matching your search."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card shrink-0">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedCases.length)} of{" "}
                    {filteredAndSortedCases.length} cases
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="border-border bg-card hover:bg-secondary"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={
                            currentPage === page
                              ? "bg-cyan text-white hover:bg-cyan/90"
                              : "border-border bg-card hover:bg-secondary"
                          }
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="border-border bg-card hover:bg-secondary"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* View Case Dialog */}
        <Dialog open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
          <DialogContent className="bg-card border-border text-foreground max-w-2xl">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-xl font-semibold text-foreground">{selectedCase?.title}</DialogTitle>
                  <p className="text-sm text-muted-foreground font-mono mt-1">{selectedCase?.caseNumber}</p>
                </div>
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded ${
                    priorityClasses[selectedCase?.priority || "LOW"]
                  }`}
                >
                  {selectedCase?.priority} Priority
                </span>
              </div>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              <p className="text-muted-foreground">{selectedCase?.description || "No description provided."}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Client</span>
                  </div>
                  <p className="font-medium text-foreground">{selectedCase?.client}</p>
                </div>

                <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Building className="h-4 w-4" />
                    <span className="text-sm">Court</span>
                  </div>
                  <p className="font-medium text-foreground">{selectedCase?.court}</p>
                </div>

                <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Next Hearing</span>
                  </div>
                  <p className="font-medium text-foreground">{selectedCase?.nextDate}</p>
                </div>

                <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Filed Date</span>
                  </div>
                  <p className="font-medium text-foreground">{selectedCase?.filedDate || "N/A"}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Case Stage</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">{selectedCase?.stage}</p>
                  <span className="text-sm text-muted-foreground">{selectedCase?.stageProgress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full ${stageGradients[selectedCase?.stage || "FILING"]} rounded-full transition-all duration-500`}
                    style={{ width: `${selectedCase?.stageProgress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Filing</span>
                  <span>Hearing</span>
                  <span>Arguments</span>
                  <span>Judgment</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button className="flex-1 bg-cyan text-white hover:bg-cyan/90">
                  <FileText className="h-4 w-4 mr-2" />
                  View Documents
                </Button>
                <Button variant="outline" className="flex-1 border-border bg-card hover:bg-secondary">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Hearing
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* New Case Dialog */}
        <Dialog open={isNewCaseDialogOpen} onOpenChange={setIsNewCaseDialogOpen}>
          <DialogContent className="bg-card border-border text-foreground max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-foreground">Create New Case</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateCase} className="space-y-4 mt-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Case Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter case title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-secondary/50 border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caseNumber">Case Number *</Label>
                  <Input
                    id="caseNumber"
                    placeholder="e.g., HC/CIV/2024/1234"
                    value={formData.caseNumber}
                    onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                    className="bg-secondary/50 border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="court">Court *</Label>
                  <Input
                    id="court"
                    placeholder="Enter court name"
                    value={formData.court}
                    onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                    className="bg-secondary/50 border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Input
                    id="client"
                    placeholder="Enter client name"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    className="bg-secondary/50 border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stage">Case Stage</Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(value) => setFormData({ ...formData, stage: value as typeof formData.stage })}
                  >
                    <SelectTrigger className="bg-secondary/50 border-border w-full">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FILING">Filing</SelectItem>
                      <SelectItem value="HEARING">Hearing</SelectItem>
                      <SelectItem value="ARGUMENTS">Arguments</SelectItem>
                      <SelectItem value="JUDGMENT">Judgment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as typeof formData.priority })}
                  >
                    <SelectTrigger className="bg-secondary/50 border-border w-full">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filedDate">Filed Date</Label>
                  <Input
                    id="filedDate"
                    type="date"
                    value={formData.filedDate}
                    onChange={(e) => setFormData({ ...formData, filedDate: e.target.value })}
                    className="bg-secondary/50 border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextDate">Next Hearing Date</Label>
                  <Input
                    id="nextDate"
                    type="date"
                    value={formData.nextDate}
                    onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })}
                    className="bg-secondary/50 border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter case description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-secondary/50 border-border min-h-[100px]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-border bg-card hover:bg-secondary"
                  onClick={() => {
                    setIsNewCaseDialogOpen(false)
                    setFormData(initialFormState)
                    setFormError(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-cyan text-white hover:bg-cyan/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Case
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
      <AIChatBar />
    </div>
  )
}
