
import { useState, useEffect, useCallback, useMemo } from "react"
import axios from "axios"
import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Info, Mail as MailIcon, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCookie, getPermissions } from "@/utils/cookies"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { API } from "@/config/api"
import { DataTable } from "@/components/ui/data-table"
import { toast } from "sonner"

// ─── Types ───────────────────────────────────────────────
interface MailTemplateData {
    _id: string
    email: string
    smtpCode: string
    mailServer: string
    organization: string
    createdAt?: string
}

// ─── Column factory ────────────
const getColumns = (
    onDelete: (template: MailTemplateData) => void,
    onEdit: (template: MailTemplateData) => void
): ColumnDef<MailTemplateData>[] => [
        {
            accessorKey: "mailServer",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Mail Server
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            meta: {
                label: "Mail Server",
            },
            cell: ({ row }) => (
                <div className="font-medium">
                    {row.getValue("mailServer")}
                </div>
            ),
        },
        {
            accessorKey: "email",
            header: "Email",
            meta: {
                label: "Email",
            },
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    <MailIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{row.getValue("email")}</span>
                </div>
            ),
        },
        {
            accessorKey: "smtpCode",
            header: "SMTP Code",
            meta: {
                label: "SMTP Code",
            },
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    <span>{row.getValue("smtpCode") || "—"}</span>
                </div>
            ),
        },

        {
            accessorKey: "createdAt",
            header: "Created",
            meta: {
                label: "Created",
            },
            cell: ({ row }) => {
                const date = row.getValue("createdAt") as string
                return <div>{date ? new Date(date).toLocaleDateString() : "—"}</div>
            },
        },
        {
            id: "actions",
            enableHiding: false,
            meta: {
                label: "Actions",
            },  
            cell: ({ row }) => {
                const template = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(String(template._id))}
                            >
                                Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onEdit(template)}
                            >
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600"
                            onClick={() => onDelete(template)}
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]



// ─── Page Component ──────────────────────────────────────
export default function MailSettings() {
    const { setBreadcrumbs } = useBreadcrumb()


    useEffect(() => {
        setBreadcrumbs([
            { label: "Settings", href: "/settings" },
            { label: "Mail" },
            {
                label: (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4.5 w-4.5" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                                <p className="font-medium">Email Management</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            },
        ])
    }, [setBreadcrumbs])

   
    // ── Table data state ──
    const [mails, setMails] = useState<MailTemplateData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const [open, setOpen] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        smtpCode: "",
        mailServer: "",
    })

    const [editingMailId, setEditingMailId] = useState<string | null>(null)
    const [isViewOnly, setIsViewOnly] = useState(false)

    // Fetch templates
    const fetchMails = useCallback(async () => {
        try {
            const org = getCookie("organization")
            const token = getCookie("token")
            if (!org) {
                setError("Organization not found")
                setLoading(false)
                return
            }
            // Fetch Mail Servers
            const responseMails = await axios.get(
                `${API.MAIL}?organization=${org}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setMails(responseMails.data.data || [])
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch emails")
        } finally {
            setLoading(false)
        }
    }, [])


    useEffect(() => {
        fetchMails()
    }, [fetchMails])

    const handleDeleteMail = async (template: MailTemplateData) => {
        if (!confirm(`Are you sure you want to delete email "${template.mailServer}"?`)) return
        try {
            const token = getCookie("token")
            await axios.delete(`${API.MAIL}/${template._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            toast.success("Email deleted successfully")
            fetchMails()
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete email")
        }
    }


    
    const handleEditMail = (mail: MailTemplateData) => {
        setFormData({
            email: mail.email,
            smtpCode: mail.smtpCode,
            mailServer: mail.mailServer
        })
        setEditingMailId(mail._id)
        setIsViewOnly(false)
        setOpen(true)
    }



   

    const columns = useMemo(() => getColumns(handleDeleteMail, handleEditMail), [handleDeleteMail])

    // ── Form handlers ──
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target
        setFormData((prev) => ({ ...prev, [id]: value }))
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const token = getCookie("token")
            const org = getCookie("organization")
            
            const dataToSubmit = {
                ...formData,
                organization: org
            }

            if (editingMailId) {
                await axios.put(
                    `${API.MAIL}/${editingMailId}`,
                    dataToSubmit,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                toast.success("Mail server updated successfully")
            } else {
                await axios.post(
                    API.MAIL,
                    dataToSubmit,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                toast.success("Mail server created successfully")
            }
            
            setOpen(false)
            setEditingMailId(null)
            setFormData({ email: "", smtpCode: "", mailServer: "" })
            fetchMails()
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.message || (editingMailId ? "Failed to update" : "Failed to create"))
            }
        }
    }

 

           
       

    // ── Loading / Error ──
    if (loading) {
        return (
            <div className="w-full flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (error) {
        return <div className="w-full text-center py-10 text-red-500">{error}</div>
    }

    const userPermissions = getPermissions()
    const canCreateMail = userPermissions.includes("create_mail") || userPermissions.includes("admin") || userPermissions.includes("create_team")

    // ── Render ──
    return (
        <div className="flex flex-1 flex-col gap-4 px-6 py-4">
                    <DataTable
                        columns={columns}
                        data={mails}
                        initialPageSize={10}
                        filterColumn="mailServer"
                        filterPlaceholder="Filter by Mail Server..."
                        topRightContent={
                             canCreateMail && (
                        <>
                            <Sheet open={open} onOpenChange={(val) => {
                                setOpen(val)
                                if (!val) {
                                    setEditingMailId(null)
                                    setFormData({ email: "", smtpCode: "", mailServer: "" })
                                }
                            }}>
                                <SheetTrigger asChild>
                                    <Button onClick={() => {
                                        setEditingMailId(null)
                                        setFormData({ email: "", smtpCode: "", mailServer: "" })
                                    }} size="sm" className="text-xs">Create Mail</Button>
                                </SheetTrigger>
                                <SheetContent className="w-xl px-5 sm:max-w-md">
                                    <SheetHeader>
                                        <SheetTitle>
                                            {editingMailId ? "Edit Mail" : "Create New Mail"}
                                        </SheetTitle>
                                        <SheetDescription>
                                            {editingMailId 
                                                    ? "Update your email and SMTP settings below." 
                                                    : "Configure your email and SMTP settings below."
                                            }   
                                        </SheetDescription>
                                    </SheetHeader>
                                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Mail</Label>
                                            <Input 
                                                type="email" 
                                                id="email" 
                                                placeholder="Enter Mail... " 
                                                value={formData.email} 
                                                onChange={handleInputChange} 
                                                required 
                                             
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="smtpCode">SMTP Code </Label>
                                            <Input 
                                                type="text" 
                                                id="smtpCode" 
                                                placeholder="Enter Code..." 
                                                value={formData.smtpCode} 
                                                onChange={handleInputChange} 
                                               
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="mailServer">Mail Server</Label>
                                            <Input 
                                                id="mailServer" 
                                                placeholder="Enter Mail Server... " 
                                                value={formData.mailServer} 
                                                onChange={handleInputChange} 
                                                required 
                                               
                                            />
                                        </div>

                                         
                                            <Button type="submit" className="mt-4 w-full">
                                                {editingMailId ? "Update Mail" : "Create Mail"}
                                            </Button>
                                        
                                    </form>
                                </SheetContent>
                            </Sheet>

                      
                        </>
                    )}
                    />
                    </div>
                    )
}