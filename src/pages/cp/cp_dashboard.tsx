import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { getCookie } from "@/utils/cookies"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
    Search, 
    Calendar, 
    Target, 
    Users, 
    Settings2, 
    Loader2, 
    ChevronRight,
    ClipboardIcon,
    RefreshCcw,
    Plus
} from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { API } from "@/config/api"
import axios from "axios"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function CpDashboard() {
    const navigate = useNavigate()
    const [forms, setForms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const currentUserId = getCookie('user_id')

    useEffect(() => {
        fetchForms()
    }, [])

    const fetchForms = async () => {
        setLoading(true)
        try {
            const org = getCookie('organization')
            const userId = getCookie('user_id')
            const token = getCookie('token')
            
            // Build query params, excluding 'undefined' or empty values
            const params = new URLSearchParams()
            if (org && org !== 'undefined' && org !== 'null') {
                params.append('organization', org)
            }
            if (userId && userId !== 'undefined' && userId !== 'null') {
                params.append('userId', userId)
            }
            
            const res = await axios.get(`${API.LEAD_CAPTURE_CONFIGS}?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setForms(res.data.data || [])
        } catch (error) {
            console.error("Failed to fetch forms:", error)
            setForms([])
        } finally {
            setLoading(false)
        }
    }

    const columns: ColumnDef<any>[] = useMemo(() => [
        {
            accessorKey: "name",
            header: "FORM NAME & SOURCE",
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/30 shadow-sm">
                        <ClipboardIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm leading-tight">{row.original.name || 'Manual Lead Form'}</div>
                        <div className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500 mt-1">{row.original.source || 'MANUAL'}</div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "project_id.name",
            header: "TARGET PROJECT",
            cell: ({ row }) => (
                <div className="inline-flex items-center gap-2 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/50 px-3 py-1.5 rounded-xl">
                    <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center">
                        <Target className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{row.original.project_id?.name || 'All Projects'}</span>
                </div>
            )
        },
        {
            accessorKey: "createdAt",
            header: "CREATED AT",
            cell: ({ row }) => (
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-bold ">
                    <Calendar className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                    {row.original.createdAt ? format(new Date(row.original.createdAt), "MMM dd, yyyy") : 'Recently'}
                </div>
            )
        },
        {
            accessorKey: "status",
            header: "STATUS",
            cell: ({ row }) => (
                <Badge className={cn("px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-none border-none", row.original.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50' : 'bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-600 hover:bg-slate-200 dark:hover:bg-zinc-800')}>
                    {row.original.status || 'Active'}
                </Badge>
            )
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => {
                const assigned = row.original.assigned_people || []
                const isAssigned = assigned.some((p: any) => p.id === currentUserId)
                
                return (
                    <div className="flex items-center justify-end pr-4">
                        <Button 
                            variant={isAssigned ? "default" : "secondary"} 
                            className={cn(
                                "h-10 px-6 rounded-xl font-bold text-xs uppercase shadow-md transition-all",
                                isAssigned ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100" : "bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-600 cursor-not-allowed opacity-70"
                            )}
                            onClick={() => isAssigned && navigate(`/cp/lead-entry?id=${row.original._id}`)}
                            disabled={!isAssigned}
                        >
                            {isAssigned ? "Fill Form" : "Locked"}
                        </Button>
                    </div>
                )
            }
        }
    ], [navigate, currentUserId])

    return (
        <div className="flex flex-1 flex-col gap-10 px-10 py-10 max-w-[1500px] mx-auto w-full bg-slate-50/50 dark:bg-zinc-950/50 min-h-screen">
           
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-8">
                            <div className="relative">
                                <Loader2 className="h-16 w-16 animate-spin text-zinc-900 dark:text-zinc-100" />
                                <Settings2 className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600 animate-pulse" />
                            </div>
                            <p className="text-sm font-bold text-slate-300 dark:text-slate-600 uppercase">Authenticating configurations...</p>
                        </div>
                    ) : forms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-40 px-10 text-center">
                            <div className="h-28 w-28 rounded-4xl bg-slate-50 dark:bg-zinc-900 flex items-center justify-center mb-10 border-2 border-dashed border-slate-200 dark:border-zinc-800 shadow-inner">
                                <Users className="h-12 w-12 text-slate-200 dark:text-zinc-700" />
                            </div>
                            <h3 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">No Access</h3>
                            <p className="text-slate-400 dark:text-zinc-500 font-medium max-w-sm leading-relaxed ">
                                You don't have any lead capture configurations assigned yet. Contact your administrator to get started.
                            </p>
                        </div>
                    ) : (
                        <DataTable 
                            columns={columns} 
                            data={forms} 
                            filterPlaceholder="Search configurations..."
                            topRightContent={
                                <div className="flex items-center gap-3">
                                    <Button 
                                        variant="outline" 
                                        className="h-8 w-8 p-0 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 bg-white/50 dark:bg-zinc-900/50"
                                        onClick={fetchForms}
                                    >
                                        <RefreshCcw className={cn("h-4 w-4 text-slate-400 dark:text-stone-600", loading && "animate-spin")} />
                                    </Button>
                                </div>
                            }
                        />
                    )}
                </CardContent>
          
        </div>
    )
}

