import { useState, useRef, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import axios from "axios"
import { getCookie } from "@/utils/cookies"
import { UploadCloud, FileSpreadsheet, CheckCircle2, Download, ArrowRight, Table as TableIcon, Info } from "lucide-react"
import { API } from "@/config/api"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import * as XLSX from "xlsx"

export default function NewLeadUpload() {
    const { setBreadcrumbs } = useBreadcrumb()
    const navigate = useNavigate()
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [previewData, setPreviewData] = useState<any[][]>([])
    const [headers, setHeaders] = useState<string[]>([])
    const [mappings, setMappings] = useState<Record<number, string>>({})
    const [hasHeader, setHasHeader] = useState(true)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setBreadcrumbs([
            { label: "Settings", href: "/settings" },
            { label: "Import Leads", href: "/setting/import_leads" },
            { label: "Bulk Upload" }
        ])
    }, [setBreadcrumbs])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            await parseFile(selectedFile)
            setShowPreview(true)
        }
    }

    const parseFile = (file: File) => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const data = new Uint8Array(e.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: "array" })
                const firstSheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[firstSheetName]
                
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][]
                
                if (json.length > 0) {
                    const previewRows = json.slice(0, 11)
                    setPreviewData(previewRows)
                    
                    const initialHeaders = json[0].map(h => String(h || ""))
                    setHeaders(initialHeaders)
                    
                    const initialMappings: Record<number, string> = {}
                    initialHeaders.forEach((header, idx) => {
                        const normalized = header.toLowerCase().trim()
                        if (normalized.includes("name")) initialMappings[idx] = "name"
                        else if (normalized.includes("phone") || normalized.includes("mobile")) initialMappings[idx] = "phone"
                        else if (normalized.includes("email")) initialMappings[idx] = "email"
                        else if (normalized.includes("location") || normalized.includes("city")) initialMappings[idx] = "location"
                        else if (normalized.includes("campaign")) initialMappings[idx] = "campaign"
                        else if (normalized.includes("source")) initialMappings[idx] = "source"
                        else if (normalized.includes("sub") && normalized.includes("source")) initialMappings[idx] = "sub_source"
                        else if (normalized.includes("medium")) initialMappings[idx] = "medium"
                        else initialMappings[idx] = "skip"
                    })
                    setMappings(initialMappings)
                }
                resolve(true)
            }
            reader.readAsArrayBuffer(file)
        })
    }

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0]
            setFile(droppedFile)
            await parseFile(droppedFile)
            setShowPreview(true)
        }
    }

    const handleSubmit = async () => {
        if (!file) return

        const organization = getCookie("organization")
        const token = getCookie("token")
        
        if (!organization || !token) {
            toast.error("Session expired. Please log in again.")
            return
        }

        const mappedValues = Object.values(mappings)
        if (!mappedValues.includes("name")) {
            toast.error("The file must contain a 'Name' column.")
            return
        }
        if (!mappedValues.includes("phone")) {
            toast.error("The file must contain a 'Phone' column.")
            return
        }

        setIsUploading(true)

        const formData = new FormData()
        formData.append("file", file)
        formData.append("organization", organization)
        formData.append("hasHeader", String(hasHeader))
        formData.append("mappings", JSON.stringify(mappings))

        try {
            const endpoint = `${API.LEADS}/bulk-upload`
            const response = await axios.post(endpoint, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${token}`
                }
            })

            const { successCount, errorCount, errors } = response.data.data
            if (errorCount > 0) {
                toast.warning(`Uploaded ${successCount} leads. Failed to process ${errorCount} rows.`)
                console.log("Upload Errors:", errors)
            } else {
                toast.success(`Successfully uploaded ${successCount} leads!`)
            }
            
            setFile(null)
            setPreviewData([])
            setShowPreview(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
            
            // Redirect to Import Leads listing page
            setTimeout(() => navigate("/setting/import_leads"), 1500)
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to upload file")
        } finally {
            setIsUploading(false)
        }
    }

    const tableDisplayData = useMemo(() => {
        if (previewData.length === 0) return []
        return hasHeader ? previewData.slice(1, 6) : previewData.slice(0, 5)
    }, [previewData, hasHeader])

    return (
        <div className="min-h-screen p-6 md:p-8 flex justify-center items-start">
            <Card className="w-full max-w-4xl shadow-lg border-primary-200 pt-0 overflow-hidden">
                <CardHeader className="border-b pb-6 dark:bg-neutral-900 bg-white pt-8 px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                                Import Leads Data
                            </CardTitle>
                            <CardDescription className="mt-2 text-base">
                                Accelerate your workflow by bringing in multiple leads at once.
                            </CardDescription>
                        </div>
                        <a href="/sample_leads.xlsx" download>
                            <Button variant="outline" className="gap-2 shadow-sm hover:bg-primary/5 transition-colors">
                                <Download size={16} />
                                Download Template
                            </Button>
                        </a>
                    </div>
                </CardHeader>
                <CardContent className="p-0 bg-slate-50/50 dark:bg-neutral-950/20">
                    <div className="px-8 py-8 space-y-8">
                        {/* Guidelines Section */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Formatting Guidelines</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    "Ensure columns like Name and Phone are present.",
                                    "Use standard CSV or valid Excel spreadsheet format.",
                                    "Add country codes directly into the phone column.",
                                    "Maximum limit per upload batch is 10,000 rows."
                                ].map((text, i) => (
                                    <div key={i} className="flex gap-3 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-neutral-800 transition-all hover:shadow-md">
                                        <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={20} />
                                        <div className="text-sm text-slate-600 dark:text-slate-300">{text}</div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <Separator className="bg-slate-200 dark:bg-neutral-800" />

                        {/* File Upload Section */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50"></span>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">File Upload</h3>
                            </div>
                            
                            <div 
                                className={`relative overflow-hidden border-dashed border-2 rounded-2xl p-12 flex flex-col items-center justify-center transition-all ${
                                    isDragging ? "border-primary bg-primary/10 scale-[1.01]" : file ? "border-emerald-500 bg-emerald-500/5" : "border-slate-300 dark:border-slate-700 hover:border-primary/50 bg-white dark:bg-neutral-900"
                                }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-sm transition-colors ${
                                    file ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40" : "bg-primary/10 text-primary"
                                }`}>
                                    {file ? <FileSpreadsheet className="w-10 h-10" /> : <UploadCloud className="w-10 h-10" />}
                                </div>
                                <h4 className="text-xl font-semibold mb-2 tracking-tight text-slate-800 dark:text-slate-100">
                                    {file ? file.name : "Drag & drop your file here"}
                                </h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-sm text-center">
                                    {file ? `File ready. Size: ${(file.size / 1024).toFixed(2)} KB` : "Or click the button below to browse your local directory."}
                                </p>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls, .csv" className="hidden" />
                                <div className="flex gap-4">
                                    <Button variant={file ? "outline" : "default"} onClick={handleUploadClick} className="rounded-full px-8">
                                        {file ? "Change File" : "Browse Files"}
                                    </Button>
                                    {file && <Button onClick={() => setShowPreview(true)} className="rounded-full px-8 bg-emerald-600 hover:bg-emerald-700 text-white">Preview & Map</Button>}
                                </div>
                            </div>
                        </section>
                    </div>
                </CardContent>
            </Card>

            {/* Preview & Mapping Modal */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="sm:max-w-screen-2xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden border-slate-200 dark:border-neutral-800 shadow-2xl rounded-2xl">
                    <DialogHeader className="p-8 border-b bg-slate-50/50 dark:bg-neutral-900/50 shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <TableIcon size={24} />
                                    </div>
                                    Data Preview & Mapping
                                </DialogTitle>
                                <DialogDescription className="mt-1 text-sm">
                                    Verify your data and map columns to CRM fields for {file?.name}
                                </DialogDescription>
                            </div>
                            <div className="flex items-center gap-3 bg-white dark:bg-neutral-800 px-5 py-2.5 rounded-full border border-slate-200 dark:border-neutral-700 shadow-sm mr-6">
                                <Checkbox id="hasHeaderModal" checked={hasHeader} onCheckedChange={(val) => setHasHeader(!!val)} />
                                <label htmlFor="hasHeaderModal" className="text-sm font-semibold tracking-tight cursor-pointer select-none">
                                    File contains header row
                                </label>
                            </div>
                        </div>
                    </DialogHeader>

                    <CardContent className="flex-1 overflow-auto p-8 bg-white dark:bg-black/20">
                        <div className="border border-slate-100 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-neutral-900 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        {headers.map((header, idx) => (
                                            <th key={idx} className="p-5 border-b border-r border-slate-200 dark:border-neutral-800 min-w-[220px]">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate" title={header}>
                                                    {hasHeader ? header : `Column ${idx + 1}`}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableDisplayData.map((row, rowIdx) => (
                                        <tr key={rowIdx} className="hover:bg-slate-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                                            {headers.map((_, colIdx) => (
                                                <td key={colIdx} className="p-5 border-b border-r border-slate-100 dark:border-neutral-900/50 text-slate-600 dark:text-slate-400 truncate max-w-[220px] font-medium">
                                                    {String(row[colIdx] || "-")}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    {[...Array(Math.max(0, 5 - tableDisplayData.length))].map((_, i) => (
                                        <tr key={`empty-${i}`} className="h-16">
                                            {headers.map((_, j) => (
                                                <td key={`empty-td-${j}`} className="border-b border-r border-slate-50 dark:border-neutral-900/20"></td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-slate-400 italic">
                            <Info size={14} />
                            <span className="text-[11px]">Showing up to 5 sample rows for data verification purposes.</span>
                        </div>
                    </CardContent>

                    <DialogFooter className="p-8 border-t bg-slate-50/50 dark:bg-neutral-900/50 flex items-center justify-end shrink-0">
                        <div className="flex gap-4">
                            <Button variant="ghost" onClick={() => setShowPreview(false)} className="rounded-full px-8 font-semibold">
                                Back to Upload
                            </Button>
                            <Button 
                                disabled={isUploading} 
                                onClick={handleSubmit} 
                                className="rounded-full px-12 bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all gap-2 font-bold"
                            >
                                {isUploading ? "Importing Leads..." : (
                                    <>
                                        Complete Import
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
