import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
    Plus, 
    MoreHorizontal, 
    Trash2, 
    FileEdit, 
    ArrowLeft, 
    Calendar,
    Users,
    Target,
    RefreshCcw,
    Loader2,
    Settings2,
    ClipboardIcon,
    Info
} from "lucide-react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { API, getSanitizedAvatarUrl } from "@/config/api"
import axios from "axios"
import { toast } from "sonner"
import { format } from "date-fns"
import { type ColumnDef } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const getCookie = (name: string): string => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || ''
    return ''
}

export default function LeadCapture() {
    const navigate = useNavigate()
    const { setBreadcrumbs } = useBreadcrumb()
    const [forms, setForms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [formToDelete, setFormToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const currentUserId = getCookie('user_id')

    useEffect(() => {
        setBreadcrumbs([
            { label: "Automation", href: "/tools/automation" },
            { label: "Lead Capture" },
            {label: (<Tooltip><TooltipTrigger><Info size={16}/></TooltipTrigger><TooltipContent><p>Lead Capture</p></TooltipContent></Tooltip>)}
        ])
        fetchForms()
    }, [setBreadcrumbs])

    const fetchForms = async () => {
        setLoading(true)
        try {
            const org = getCookie('organization')
            const token = getCookie('token')
            
            // Build query params, excluding 'undefined' or empty orgs
            const params = new URLSearchParams()
            if (org && org !== 'undefined' && org !== 'null') {
                params.append('organization', org)
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

    const confirmDelete = async () => {
        if (!formToDelete) return
        setIsDeleting(true)
        try {
            const token = getCookie('token')
            await axios.delete(`${API.LEAD_CAPTURE_CONFIGS}/${formToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success("Configuration deleted")
            fetchForms()
        } catch (error) {
            toast.error("Failed to delete configuration")
        } finally {
            setIsDeleting(false)
            setFormToDelete(null)
        }
    }

    const columns: ColumnDef<any>[] = useMemo(() => [
        {
            accessorKey: "name",
            header: "FORM NAME & SOURCE",
            meta: {
               label: "FORM NAME & SOURCE"
            },
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/30 shadow-sm">
                        <ClipboardIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                    <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm leading-tight">{row.original.name || 'Manual Lead Form'}</div>
                        <div className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500 mt-1">{row.original.source || 'MANUAL'}</div>
                    </div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "project_id.name",
            meta: {
               label: "TARGET PROJECT"
            },
            header: "TARGET PROJECT",
            cell: ({ row }) => (
                <div className="inline-flex items-center gap-2 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/50 px-3 py-1.5 rounded-xl">
                    <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Target className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{row.original.project_id?.name || 'All Projects'}</span>
                </div>
            )
        },
        {
            accessorKey: "assigned_people",
            meta: {
               label: "ASSIGNED"
            },
            header: "ASSIGNED",
            cell: ({ row }) => {
                const assigned = row.original.assigned_people || []
                return (
                    <div className="flex -space-x-1.5 items-center">
                        {assigned.slice(0, 3).map((p: any, i: number) => (
                            <Popover key={i}>
                                <PopoverTrigger asChild>
                                    <Avatar className="h-7 w-7 border-2 border-white dark:border-zinc-900 cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-sm">
                                        {p.image && (
                                            <AvatarImage src={getSanitizedAvatarUrl(p.image)} alt={p.name} />
                                        )}
                                        <AvatarFallback 
                                            className={cn(
                                                "text-[9px] font-bold uppercase", 
                                                i === 0 ? "bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400" : i === 1 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
                                            )}
                                        >
                                            {p.name[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                </PopoverTrigger>
                                <PopoverContent side="bottom" align="start" className="w-80 p-0 rounded-3xl overflow-hidden border-slate-100 dark:border-zinc-800 shadow-2xl shadow-zinc-200 dark:shadow-none">
                                    <div className="bg-zinc-900 dark:bg-zinc-100 p-6">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12 rounded-2xl border-none ring-offset-zinc-900 ring-white/10 ring-2">
                                                {p.image && (
                                                    <AvatarImage src={getSanitizedAvatarUrl(p.image)} alt={p.name} />
                                                )}
                                                <AvatarFallback className="bg-white/10 dark:bg-zinc-900/10 text-lg font-bold text-white dark:text-zinc-900">
                                                    {p.name[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="text-white dark:text-zinc-900 font-bold text-base leading-tight">{p.name}</div>
                                                <div className="text-emerald-400 dark:text-emerald-600 text-[10px] font-black uppercase tracking-widest mt-1">{p.category || 'EXECUTIVE'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        ))}
                        {assigned.length === 0 && <span className="text-[11px] text-slate-300 dark:text-slate-600 font-bold tracking-tight uppercase">Unassigned</span>}
                        {assigned.length > 3 && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="h-7 w-7 rounded-full border-2 border-white dark:border-zinc-900 bg-slate-50 dark:bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors">
                                        +{assigned.length - 3}
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-3 rounded-2xl border-slate-100 dark:border-zinc-800 shadow-xl overflow-y-auto max-h-60">
                                    <div className="space-y-2">
                                        {assigned.slice(3).map((p: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-xl transition-all group">
                                                <div className="h-8 w-8 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-white dark:text-zinc-900 group-hover:scale-105 transition-transform">
                                                    {p.name[0]}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{p.name}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase truncate">{p.category}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                )
            }
        },
        {
            accessorKey: "status",
            meta: {
               label: "STATUS"
            },
            header: "STATUS",
            cell: ({ row }) => (
                <Badge className={cn("px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-none border-none", row.original.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50' : 'bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-600 hover:bg-slate-200 dark:hover:bg-zinc-800')}>
                    {row.original.status || 'Active'}
                </Badge>
            )
        },
        {
            accessorKey: "createdAt",
            meta: {
               label: "CREATED AT"
            },
            header: "CREATED AT",
            cell: ({ row }) => (
                <div className="text-xs text-slate-500 flex items-center gap-1.5 font-bold ">
                    <Calendar className="h-3.5 w-3.5 text-slate-300" />
                    {row.original.createdAt ? format(new Date(row.original.createdAt), "MMM dd, yyyy") : 'Recently'}
                </div>
            )
        },
        {
            id: "actions",
            meta: {
               label: "ACTIONS"
            },
            header: "",
            cell: ({ row }) => {
                const assigned = row.original.assigned_people || []
                const isAssigned = assigned.some((p: any) => p.id === currentUserId)
                
                return (
                    <div className="flex items-center justify-end gap-3 pr-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 w-10 p-0 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-200 dark:text-zinc-600 group">
                                    <MoreHorizontal className="h-5 w-5 group-hover:text-zinc-600 dark:group-hover:text-zinc-100 transition-colors" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-3xl border-slate-100 dark:border-zinc-800 shadow-2xl p-2.5">
                                <DropdownMenuItem className="font-bold text-slate-600 cursor-pointer rounded-2xl py-3.5 px-5 hover:bg-purple-50 hover:text-purple-600 transition-all" onClick={() => navigate(`/automation/leadcapture/leadcaptureform?id=${row.original._id}`)}>
                                    <FileEdit className="h-4 w-4 mr-3 text-purple-500" /> Configure Fields
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-500 font-bold focus:bg-red-50 focus:text-red-600 cursor-pointer rounded-2xl py-3.5 px-5 transition-all mt-1" onClick={() => setFormToDelete(row.original._id)}>
                                    <Trash2 className="h-4 w-4 mr-3" /> Delete Config
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            }
        }
    ], [navigate, currentUserId])

    return (
        <div className="flex flex-1 flex-col gap-10 px-10 py-10 max-w-[1500px] mx-auto w-full bg-slate-50/50 dark:bg-zinc-950/50 min-h-screen">

            <AlertDialog open={!!formToDelete} onOpenChange={(open) => !open && setFormToDelete(null)}>
                <AlertDialogContent className="rounded-3xl border-slate-100 dark:border-zinc-800 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Delete Configuration?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 dark:text-slate-400 font-medium pt-2">
                            This action cannot be undone. This will permanently delete the form configuration and disable all active entry points.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-6">
                        <AlertDialogCancel className="rounded-xl font-bold h-12 px-6 border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            className="rounded-xl font-bold h-12 px-8 bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-100 dark:shadow-none"
                            onClick={confirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Yes, Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-8">
                            <div className="relative">
                                <Loader2 className="h-16 w-16 animate-spin text-zinc-900 dark:text-zinc-100" />
                                <Settings2 className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600 animate-pulse" />
                            </div>
                            <p className="text-sm font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">Synchronizing repository...</p>
                        </div>
                    ) : forms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-40 px-10 text-center">
                            <div className="h-28 w-28 rounded-4xl bg-slate-50 dark:bg-zinc-900 flex items-center justify-center mb-10 border-2 border-dashed border-slate-200 dark:border-zinc-800 shadow-inner">
                                <ClipboardIcon className="h-12 w-12 text-slate-200 dark:text-zinc-700" />
                            </div>
                            <h3 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">Repository Empty</h3>
                            <p className="text-slate-400 dark:text-zinc-500 font-medium max-w-sm mb-12 leading-relaxed ">
                                No lead capture forms have been configured for your organization yet.
                            </p>
                            <Button 
                                onClick={() => navigate("/automation/leadcapture/leadcaptureform")}
                                className="font-bold px-12 h-16 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl shadow-zinc-300 dark:shadow-none hover:scale-105 active:scale-95 transition-all outline-none"
                            >
                                <Plus className="h-5 w-5 mr-3 text-emerald-400" /> SETUP FIRST FORM
                            </Button>
                        </div>
                    ) : (
                        <DataTable 
                            columns={columns} 
                            data={forms} 
                            filterPlaceholder="Search configurations..."
                            topRightContent={
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        className="h-10 w-10 p-0 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-sm hover:bg-white dark:hover:bg-zinc-900 bg-white/50 dark:bg-zinc-900/50"
                                        onClick={fetchForms}
                                    >
                                        <RefreshCcw className={cn("h-4 w-4 text-slate-400 dark:text-zinc-600", loading && "animate-spin")} />
                                    </Button>
                                    <Button 
                                        className="h-10 px-4 font-bold uppercase bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all border-b-2 border-zinc-950 dark:border-zinc-300"
                                        onClick={() => navigate("/automation/leadcapture/leadcaptureform")}
                                    >
                                        <Plus className="h-4 w-4 mr-2 text-emerald-400" /> New Form
                                    </Button>
                                </div>
                            }
                        />
                    )}
                </CardContent>
            
        </div>
    )
}
