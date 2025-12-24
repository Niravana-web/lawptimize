"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Sidebar } from "@/components/sidebar"
import { AIChatBar } from "@/components/ai-chat-bar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  MapPin,
  Users,
  Gavel,
  FileText,
  ArrowUpDown,
} from "lucide-react"

interface CauselistItem {
  id: string
  sNo: number
  caseNumber: string
  caseType: string
  party: {
    petitioner: string
    respondent: string
  }
  petitionerAdvocate: string
  respondentAdvocate: string
  district: string
  remarks?: string
  courtNo: number
  judges: string[]
  hearingType:
    | "FOR ORDERS"
    | "INTERLOCUTORY"
    | "FOR HEARING"
    | "FOR ADMISSION"
    | "FINAL HEARING"
    | "OLD MATTERS"
    | "SPECIALLY MENTIONED"
  iaDetails?: string[]
}

interface CourtSection {
  courtNo: number
  judges: string[]
  date: string
  time: string
  mode: string
  notes?: string[]
  items: CauselistItem[]
}

// Mock data based on the AP High Court causelist format
const causelistData: CourtSection[] = [
  {
    courtNo: 11,
    judges: ["THE HONOURABLE SRI JUSTICE R RAGHUNANDAN RAO", "THE HONOURABLE SRI JUSTICE T.C.D.SEKHAR"],
    date: "Monday, 16th December 2025",
    time: "10:30 AM",
    mode: "HYBRID MODE",
    items: [
      {
        id: "1",
        sNo: 24,
        caseNumber: "WP/26311/2024",
        caseType: "Writ Petition",
        party: { petitioner: "PARVATHINA SIVA KUMAR", respondent: "THE STATE OF AP" },
        petitionerAdvocate: "T V S PRABHAKARA RAO",
        respondentAdvocate: "GP FOR LAW LEGISLATIVE AFFAIRS",
        district: "EAST GODAVARI",
        remarks: "R2 R4 UNSERVED",
        courtNo: 11,
        judges: ["R RAGHUNANDAN RAO", "T.C.D.SEKHAR"],
        hearingType: "FOR ORDERS",
        iaDetails: ["IA 1/2024 - Stay Petition"],
      },
      {
        id: "2",
        sNo: 204,
        caseNumber: "CMA/535/2014",
        caseType: "Civil Miscellaneous Appeal",
        party: { petitioner: "GUDEY RATAYYA", respondent: "GUNNAM RAMABABU" },
        petitionerAdvocate: "T V S PRABHAKARA RAO",
        respondentAdvocate: "KADIYAM NEELAKANTESWARA RAO",
        district: "EAST GODAVARI",
        courtNo: 11,
        judges: ["R RAGHUNANDAN RAO", "T.C.D.SEKHAR"],
        hearingType: "INTERLOCUTORY",
        iaDetails: ["IA 2/2014 - Receive Docs Petition", "ARISING FROM (OP/350/2011)"],
      },
      {
        id: "3",
        sNo: 218,
        caseNumber: "WP/6759/2023",
        caseType: "Writ Petition",
        party: { petitioner: "ADABALA VENKATA SUBBA RAO", respondent: "THE STATE OF ANDHRA PRADESH" },
        petitionerAdvocate: "T V S PRABHAKARA RAO",
        respondentAdvocate: "GP FOR HOME",
        district: "WEST GODAVARI",
        remarks: "R3 R4 R5 UNSERVED",
        courtNo: 11,
        judges: ["R RAGHUNANDAN RAO", "T.C.D.SEKHAR"],
        hearingType: "INTERLOCUTORY",
        iaDetails: ["IA 1/2023 - Suspension Petition"],
      },
      {
        id: "4",
        sNo: 292,
        caseNumber: "WP/6398/2017",
        caseType: "Writ Petition",
        party: {
          petitioner: "THE CONVENTION OF BAPTIST CHURCHES OF THE NORTHERN CIRCARS",
          respondent: "STATE OF ANDHRA PRADESH REVENUE STAMPS & REGISTRATION",
        },
        petitionerAdvocate: "T V S PRABHAKARA RAO",
        respondentAdvocate: "GP FOR REVENUE (AP)",
        district: "EAST GODAVARI",
        courtNo: 11,
        judges: ["R RAGHUNANDAN RAO", "T.C.D.SEKHAR"],
        hearingType: "FOR HEARING",
        iaDetails: ["IA 1/2017 - Direction Petition", "IA 1/2022 - Amendment Petition"],
      },
    ],
  },
  {
    courtNo: 15,
    judges: ["THE HONOURABLE SRI JUSTICE VENKATESWARLU NIMMAGADDA"],
    date: "Monday, 16th December 2025",
    time: "10:30 AM",
    mode: "HYBRID MODE",
    items: [
      {
        id: "5",
        sNo: 25,
        caseNumber: "CC/1242/2025",
        caseType: "Contempt Case",
        party: { petitioner: "PALLI KUMAR RAJA", respondent: "MVV KISHORE" },
        petitionerAdvocate: "T V S PRABHAKARA RAO",
        respondentAdvocate: "VENKATA SAI KRISHNA PONNURU",
        district: "EAST GODAVARI",
        courtNo: 15,
        judges: ["VENKATESWARLU NIMMAGADDA"],
        hearingType: "FOR ADMISSION",
        iaDetails: ["ARISING FROM (WP/18929/2023)"],
      },
      {
        id: "6",
        sNo: 103,
        caseNumber: "CMA/50/2025",
        caseType: "Civil Miscellaneous Appeal",
        party: { petitioner: "VIYYAPU TATA RAO", respondent: "AKULA VARAHA SATYAVATHI" },
        petitionerAdvocate: "KALEEMULLA S",
        respondentAdvocate: "T V S PRABHAKARA RAO",
        district: "VISAKHAPATNAM",
        remarks: "MEMO PROOF OF SERVICE FILED. TRIAL COURT RECORD RECEIVED",
        courtNo: 15,
        judges: ["VENKATESWARLU NIMMAGADDA"],
        hearingType: "INTERLOCUTORY",
        iaDetails: ["IA 1/2025 - Suspension Petition", "IA 2/2025 - Vacate Stay Petition"],
      },
    ],
  },
  {
    courtNo: 16,
    judges: ["THE HONOURABLE SRI JUSTICE TARLADA RAJASEKHAR RAO"],
    date: "Monday, 16th December 2025",
    time: "After Motion List",
    mode: "HYBRID MODE",
    items: [
      {
        id: "7",
        sNo: 74,
        caseNumber: "WP/20649/2023",
        caseType: "Writ Petition",
        party: { petitioner: "AMBALAL PATEL", respondent: "THE STATE OF ANDHRA PRADESH" },
        petitionerAdvocate: "T V S PRABHAKARA RAO",
        respondentAdvocate: "GP FOR REVENUE",
        district: "VISAKHAPATNAM",
        remarks: "HCJ NOTE CASE",
        courtNo: 16,
        judges: ["TARLADA RAJASEKHAR RAO"],
        hearingType: "FOR HEARING",
        iaDetails: ["IA 1/2023 - Suspension Petition", "IA 1/2024 - Leave Petition", "IA 2/2024 - Fix an Early Date"],
      },
      {
        id: "8",
        sNo: 75,
        caseNumber: "WP/17286/2022",
        caseType: "Writ Petition",
        party: { petitioner: "AMBALAL PATEL", respondent: "THE STATE OF ANDHRA PRADESH" },
        petitionerAdvocate: "T V S PRABHAKARA RAO",
        respondentAdvocate: "GP FOR REVENUE, GP FOR REGISTRATION AND STAMPS",
        district: "VISAKHAPATNAM",
        courtNo: 16,
        judges: ["TARLADA RAJASEKHAR RAO"],
        hearingType: "FOR HEARING",
        iaDetails: ["IA 1/2022 - Direction Petition", "IA 2/2022 - Direction Petition"],
      },
    ],
  },
  {
    courtNo: 18,
    judges: ["THE HONOURABLE SRI JUSTICE D RAMESH"],
    date: "Monday, 16th December 2025",
    time: "After Motion List",
    mode: "HYBRID MODE",
    items: [
      {
        id: "9",
        sNo: 127,
        caseNumber: "CRP/3235/2025",
        caseType: "Civil Revision Petition",
        party: { petitioner: "KALEPU @ VEDA PAVANI", respondent: "KALEPU SATISH" },
        petitionerAdvocate: "T V S PRABHAKARA RAO",
        respondentAdvocate: "-",
        district: "WEST GODAVARI",
        courtNo: 18,
        judges: ["D RAMESH"],
        hearingType: "FOR ADMISSION",
        iaDetails: ["IA 1/2025 - Suspension Petition", "ARISING FROM (H.M.O.P/37/2024)"],
      },
    ],
  },
  {
    courtNo: 22,
    judges: ["THE HONOURABLE SRI JUSTICE RAVI NATH TILHARI", "THE HONOURABLE SRI JUSTICE B V L N CHAKRAVARTHI"],
    date: "Monday, 16th December 2025",
    time: "10:30 AM",
    mode: "HYBRID MODE",
    notes: [
      "THE PASSOVER MATTERS IN THE LIST WILL BE TAKEN UP AFTER THE COMPLETION OF THIS LIST",
      "ANY MENTIONS FROM OUT OF THE LIST CASES SHALL NOT BE ENTERTAINED IF THE MENTION SLIP DOES NOT CONTAIN THE NATURE OF URGENCY",
      "AFTER MOTION LIST - WEEKLY LIST WILL BE TAKEN UP",
      "THE OLD MATTERS MAY NOT BE ADJOURNED AND THEY WILL BE TAKEN UP AT 03:30PM",
    ],
    items: [
      {
        id: "10",
        sNo: 3,
        caseNumber: "WA/514/2022",
        caseType: "Writ Appeal",
        party: { petitioner: "THE COMMISSIONER", respondent: "V.MURALI MOHAN" },
        petitionerAdvocate: "GP FOR ENDOWMENTS (AP)",
        respondentAdvocate: "T V S PRABHAKARA RAO",
        district: "VIZIANAGARAM",
        remarks: "HCJ NOTE",
        courtNo: 22,
        judges: ["RAVI NATH TILHARI", "B V L N CHAKRAVARTHI"],
        hearingType: "SPECIALLY MENTIONED",
        iaDetails: ["IA 1/2022 - Suspension Petition"],
      },
    ],
  },
  {
    courtNo: 6,
    judges: ["THE HONOURABLE SRI JUSTICE T MALLIKARJUNA RAO"],
    date: "Monday, 16th December 2025",
    time: "10:30 AM",
    mode: "HYBRID MODE",
    items: [
      {
        id: "11",
        sNo: 56,
        caseNumber: "CRLRC/3529/2018",
        caseType: "Criminal Revision Case",
        party: { petitioner: "SUNKU SURENDRA", respondent: "VALLURU BHASKAR REDDY" },
        petitionerAdvocate: "GVVSR SUBRAHMANYAM",
        respondentAdvocate: "T V S PRABHAKARA RAO, PUBLIC PROSECUTOR",
        district: "SPS NELLORE",
        remarks: "TRIAL COURT RECORD NOT RECEIVED",
        courtNo: 6,
        judges: ["T MALLIKARJUNA RAO"],
        hearingType: "FINAL HEARING",
        iaDetails: ["IA 1/2019 - Vacate Stay Petition"],
      },
    ],
  },
  {
    courtNo: 9,
    judges: ["THE HONOURABLE SRI JUSTICE V SRINIVAS"],
    date: "Monday, 16th December 2025",
    time: "10:30 AM",
    mode: "HYBRID MODE",
    items: [
      {
        id: "12",
        sNo: 3,
        caseNumber: "AS/132/2009",
        caseType: "Appeal Suit",
        party: { petitioner: "MANCHIRAJU MANGARAJU", respondent: "MANCHIRAJU SUBBARAO" },
        petitionerAdvocate: "G SUBASH",
        respondentAdvocate: "T V S PRABHAKARA RAO, M S R SASHI BHUSHAN",
        district: "EAST GODAVARI",
        remarks: "PAPER BOOK NOT AVAILABLE",
        courtNo: 9,
        judges: ["V SRINIVAS"],
        hearingType: "OLD MATTERS",
        iaDetails: [
          "IA 1/2018 - Condone Delay Petition",
          "IA 2/2018 - Set Aside Abatement",
          "IA 3/2018 - L R Petition",
        ],
      },
    ],
  },
]

type SortField = "sNo" | "caseNumber" | "petitioner" | "district" | "hearingType"
type SortDirection = "asc" | "desc"

const hearingTypeBadgeColor: Record<CauselistItem["hearingType"], string> = {
  "FOR ORDERS": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  INTERLOCUTORY: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "FOR HEARING": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "FOR ADMISSION": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "FINAL HEARING": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "OLD MATTERS": "bg-gray-500/20 text-gray-400 border-gray-500/30",
  "SPECIALLY MENTIONED": "bg-rose-500/20 text-rose-400 border-rose-500/30",
}

export default function CauselistPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCourts, setExpandedCourts] = useState<number[]>(causelistData.map((c) => c.courtNo))
  const [selectedItem, setSelectedItem] = useState<CauselistItem | null>(null)
  const [sortField, setSortField] = useState<SortField>("sNo")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowFormatted = tomorrow.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const toggleCourt = (courtNo: number) => {
    setExpandedCourts((prev) => (prev.includes(courtNo) ? prev.filter((c) => c !== courtNo) : [...prev, courtNo]))
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredData = useMemo(() => {
    return causelistData
      .map((court) => ({
        ...court,
        items: court.items
          .filter((item) => {
            const query = searchQuery.toLowerCase()
            return (
              item.caseNumber.toLowerCase().includes(query) ||
              item.party.petitioner.toLowerCase().includes(query) ||
              item.party.respondent.toLowerCase().includes(query) ||
              item.petitionerAdvocate.toLowerCase().includes(query) ||
              item.respondentAdvocate.toLowerCase().includes(query) ||
              item.district.toLowerCase().includes(query)
            )
          })
          .sort((a, b) => {
            let comparison = 0
            switch (sortField) {
              case "sNo":
                comparison = a.sNo - b.sNo
                break
              case "caseNumber":
                comparison = a.caseNumber.localeCompare(b.caseNumber)
                break
              case "petitioner":
                comparison = a.party.petitioner.localeCompare(b.party.petitioner)
                break
              case "district":
                comparison = a.district.localeCompare(b.district)
                break
              case "hearingType":
                comparison = a.hearingType.localeCompare(b.hearingType)
                break
            }
            return sortDirection === "asc" ? comparison : -comparison
          }),
      }))
      .filter((court) => court.items.length > 0)
  }, [searchQuery, sortField, sortDirection])

  const totalCases = filteredData.reduce((sum, court) => sum + court.items.length, 0)

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer hover:bg-card-hover transition-colors text-foreground"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? "text-cyan" : "text-muted-foreground"}`} />
        {sortField === field &&
          (sortDirection === "asc" ? (
            <ChevronUp className="h-3 w-3 text-cyan" />
          ) : (
            <ChevronDown className="h-3 w-3 text-cyan" />
          ))}
      </div>
    </TableHead>
  )

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Sidebar />
      <div className="flex-1 ml-16 flex flex-col">
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-foreground">Causelist</h1>
                <Badge variant="outline" className="bg-cyan/10 text-cyan border-cyan/30">
                  {totalCases} Cases Tomorrow
                </Badge>
              </div>
              <p className="text-muted-foreground">Cases scheduled for {tomorrowFormatted}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search cases, parties, advocates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80 bg-input border-input-border"
                />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(hearingTypeBadgeColor).map(([type, className]) => (
              <Badge key={type} variant="outline" className={`${className} text-xs`}>
                {type}
              </Badge>
            ))}
          </div>
        </div>

        {/* Court Sections */}
        <div className="flex-1 overflow-auto px-6 pb-24 custom-scrollbar">
          <div className="space-y-4">
            {filteredData.map((court) => (
              <div key={court.courtNo} className="rounded-lg border border-card-border bg-card overflow-hidden">
                {/* Court Header */}
                <button
                  onClick={() => toggleCourt(court.courtNo)}
                  className="w-full flex items-center justify-between p-4 bg-card-hover hover:bg-sidebar-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-cyan/20 text-cyan font-bold">
                      {court.courtNo}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">Court No. {court.courtNo}</h3>
                        <Badge variant="outline" className="bg-card text-muted-foreground border-card-border text-xs">
                          {court.items.length} {court.items.length === 1 ? "case" : "cases"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {court.judges.map((j) => j.replace("THE HONOURABLE SRI JUSTICE ", "Justice ")).join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {court.time}
                      </span>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                        {court.mode}
                      </Badge>
                    </div>
                    {expandedCourts.includes(court.courtNo) ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Court Notes */}
                {expandedCourts.includes(court.courtNo) && court.notes && (
                  <div className="px-4 py-2 bg-amber-500/5 border-b border-card-border">
                    <ul className="text-xs text-amber-400 space-y-1">
                      {court.notes.map((note, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-500">•</span>
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cases Table */}
                {expandedCourts.includes(court.courtNo) && (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-card-border hover:bg-transparent">
                        <SortHeader field="sNo">S.No</SortHeader>
                        <SortHeader field="caseNumber">Case Number</SortHeader>
                        <SortHeader field="petitioner">Parties</SortHeader>
                        <TableHead className="text-foreground">Petitioner Advocate</TableHead>
                        <TableHead className="text-foreground">Respondent Advocate</TableHead>
                        <SortHeader field="district">District</SortHeader>
                        <SortHeader field="hearingType">Type</SortHeader>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {court.items.map((item) => (
                        <TableRow
                          key={item.id}
                          className="border-card-border cursor-pointer hover:bg-card-hover transition-colors"
                          onClick={() => setSelectedItem(item)}
                        >
                          <TableCell className="font-medium text-foreground">{item.sNo}</TableCell>
                          <TableCell>
                            <div>
                              <span className="font-medium text-cyan">{item.caseNumber}</span>
                              {item.iaDetails && item.iaDetails.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.iaDetails[0]}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px]">
                              <p className="font-medium text-foreground truncate">{item.party.petitioner}</p>
                              <p className="text-xs text-muted-foreground">vs</p>
                              <p className="text-sm text-muted-foreground truncate">{item.party.respondent}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-foreground max-w-[150px] truncate">
                            {item.petitionerAdvocate}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[150px] truncate">
                            {item.respondentAdvocate}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-card border-card-border text-foreground">
                              {item.district}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={hearingTypeBadgeColor[item.hearingType]}>
                              {item.hearingType}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ))}

            {filteredData.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No cases found</p>
                <p className="text-sm">Try adjusting your search query</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AIChatBar />

      {/* Case Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl bg-card border-card-border text-foreground">
          {selectedItem && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-cyan/20">
                    <Gavel className="h-5 w-5 text-cyan" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl text-foreground">{selectedItem.caseNumber}</DialogTitle>
                    <p className="text-sm text-muted-foreground">{selectedItem.caseType}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Hearing Info */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-card-hover">
                  <Badge variant="outline" className={hearingTypeBadgeColor[selectedItem.hearingType]}>
                    {selectedItem.hearingType}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Court No. {selectedItem.courtNo}
                  </span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedItem.district}
                  </span>
                </div>

                {/* Parties */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4 text-cyan" />
                    Parties
                  </h4>
                  <div className="grid gap-3 p-4 rounded-lg bg-card-hover">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Petitioner</p>
                      <p className="font-medium text-foreground">{selectedItem.party.petitioner}</p>
                    </div>
                    <div className="text-center text-muted-foreground text-sm">vs</div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Respondent</p>
                      <p className="font-medium text-foreground">{selectedItem.party.respondent}</p>
                    </div>
                  </div>
                </div>

                {/* Advocates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-card-hover">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Petitioner Advocate</p>
                    <p className="font-medium text-foreground">{selectedItem.petitionerAdvocate}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card-hover">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Respondent Advocate</p>
                    <p className="font-medium text-foreground">{selectedItem.respondentAdvocate}</p>
                  </div>
                </div>

                {/* IA Details */}
                {selectedItem.iaDetails && selectedItem.iaDetails.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-cyan" />
                      Interlocutory Applications / Related Cases
                    </h4>
                    <div className="space-y-2">
                      {selectedItem.iaDetails.map((ia, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded bg-card-hover text-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                          <span className="text-foreground">{ia}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Remarks */}
                {selectedItem.remarks && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-400 uppercase tracking-wide mb-1">Remarks</p>
                    <p className="text-sm text-amber-300">{selectedItem.remarks}</p>
                  </div>
                )}

                {/* Judges */}
                <div className="p-4 rounded-lg bg-card-hover">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Bench</p>
                  <div className="space-y-1">
                    {selectedItem.judges.map((judge, idx) => (
                      <p key={idx} className="font-medium text-foreground">
                        Justice {judge}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
