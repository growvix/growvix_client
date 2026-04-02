import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
    ArrowLeft,
    Beaker,
    Loader2,
    Check,
    Radio,
    ArrowRight,
    Copy,
    ShieldCheck,
    AlertTriangle
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { googleAdsService } from "@/services/googleAds.service"
import { useBreadcrumb } from "@/context/breadcrumb-context"

// CRM Lead fields available for mapping
const CRM_FIELDS = [
    { value: "profile.name", label: "Full Name", required: true },
    { value: "profile.email", label: "Email" },
    { value: "profile.phone", label: "Phone Number", required: true },
    { value: "profile.location", label: "Location" },
    { value: "requirement", label: "⚙️ Store as Requirement" },
]

export default function GoogleAdsIntegrationTest() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { setBreadcrumbs } = useBreadcrumb()

    const [integration, setIntegration] = useState<any>(null)
    const [testData, setTestData] = useState<any>(null)
    const [testReceivedAt, setTestReceivedAt] = useState<string | null>(null)
    const [existingMapping, setExistingMapping] = useState<any[]>([])
    const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({})
    const [polling, setPolling] = useState(true)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        setBreadcrumbs([
            { label: "General Settings", href: "/settings" },
            { label: "Third-Party Integration", href: "/tools/third_party_integration" },
            { label: "Google Ads", href: "/tools/third_party_integration/google_ads" },
            { label: "Test Connection" },
        ])
    }, [setBreadcrumbs])

    // Fetch integration details
    useEffect(() => {
        if (!id) return
        const fetchIntegration = async () => {
            try {
                const res = await googleAdsService.getIntegrationById(id)
                setIntegration(res.data)
            } catch {
                toast.error("Failed to load integration details")
            } finally {
                setLoading(false)
            }
        }
        fetchIntegration()
    }, [id])

    // Poll for test data
    useEffect(() => {
        if (!id || !polling) return

        const poll = async () => {
            try {
                const res = await googleAdsService.getTestData(id)
                const data = res.data
                console.log(res.data);


                if (data.test_data) {
                    setTestData(data.test_data)
                    setTestReceivedAt(data.test_received_at)
                    setExistingMapping(data.field_mapping || [])
                    setPolling(false) // Stop polling once data arrives

                    // Initialize mapping from existing or auto-detect
                    const googleFields = data.test_data.user_column_data || []
                    const initialMap: Record<string, string> = {}

                    for (const f of googleFields) {
                        // Check existing mapping first
                        const existing = (data.field_mapping || []).find(
                            (m: any) => m.google_field === f.column_id
                        )
                        if (existing) {
                            initialMap[f.column_id] = existing.crm_field
                        } else {
                            // Auto-detect common fields
                            switch (f.column_id) {
                                case 'FULL_NAME': initialMap[f.column_id] = 'profile.name'; break
                                case 'EMAIL': initialMap[f.column_id] = 'profile.email'; break
                                case 'PHONE_NUMBER': initialMap[f.column_id] = 'profile.phone'; break
                                case 'CITY': initialMap[f.column_id] = 'profile.location'; break
                                default: initialMap[f.column_id] = 'requirement'; break
                            }
                        }
                    }
                    setFieldMapping(initialMap)

                    toast.success("Test data received!")
                }
            } catch {
                // Silent — keep polling
            }
        }

        poll() // Initial fetch
        pollRef.current = setInterval(poll, 3000)

        return () => {
            if (pollRef.current) clearInterval(pollRef.current)
        }
    }, [id, polling])

    const handleMappingChange = (googleField: string, crmField: string) => {
        setFieldMapping(prev => ({ ...prev, [googleField]: crmField }))
    }

    const handleSaveMapping = async () => {
        if (!id) return

        // Validate required CRM fields are mapped
        const mappedCrmFields = Object.values(fieldMapping)
        if (!mappedCrmFields.includes('profile.name')) {
            toast.error("Please map a field to 'Full Name'")
            return
        }
        if (!mappedCrmFields.includes('profile.phone')) {
            toast.error("Please map a field to 'Phone Number'")
            return
        }

        const googleFields = testData?.user_column_data || []
        const mappingArray = googleFields.map((f: any) => ({
            google_field: f.column_id,
            google_label: f.column_id.replace(/_/g, ' '),
            crm_field: fieldMapping[f.column_id] || 'requirement',
        }))

        setSaving(true)
        try {
            await googleAdsService.saveMapping(id, mappingArray)
            toast.success("Mapping saved! Integration is now active.")
            navigate("/tools/third_party_integration/google_ads")
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save mapping")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-6 px-8 py-6 max-w-[1200px] mx-auto w-full">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/tools/third_party_integration/google_ads")}
                    className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Test Connection</h1>
                    <p className="text-muted-foreground text-sm">
                        Verify and map incoming Google Ads lead form data
                    </p>
                </div>
            </div>

            {/* Integration Info */}
            {integration && (
                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardContent className="py-4 px-6">
                        <div className="flex items-center gap-6 flex-wrap">
                            <div>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Campaign</p>
                                <p className="font-semibold text-sm">{integration.campaign_id?.campaignName || 'N/A'}</p>
                            </div>
                            <Separator orientation="vertical" className="h-8" />
                            <div>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Form Name</p>
                                <p className="font-semibold text-sm">{integration.sub_source}</p>
                            </div>
                            <Separator orientation="vertical" className="h-8" />
                            <div>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Form ID</p>
                                <p className="font-mono text-xs text-muted-foreground">{integration.form_id}</p>
                            </div>
                            <Separator orientation="vertical" className="h-8" />
                            <div>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Secret Key</p>
                                <div className="flex items-center gap-1.5">
                                    <p className="font-mono text-xs text-blue-600 truncate max-w-[200px]">{integration.secret_key}</p>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(integration.secret_key)
                                            toast.success("Copied!")
                                        }}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        <Copy className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                            <div className="ml-auto">
                                <Badge variant={integration.status ? "default" : "secondary"}
                                    className={integration.status ? "bg-green-500" : ""}
                                >
                                    {integration.status ? "Active" : "Test Mode"}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Waiting / Data Received */}
            {!testData ? (
                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                <Radio className="h-5 w-5 text-amber-600 animate-pulse" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Waiting for Test Data...</CardTitle>
                                <CardDescription>
                                    Send a test lead from Google Ads or use POST to <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">/api/webhooks/google</code>
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary/40" />
                            <p className="text-sm text-muted-foreground font-medium">
                                Polling every 3 seconds...
                            </p>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 max-w-md w-full mt-4 border">
                                <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Example test payload</p>
                                <pre className="text-[11px] font-mono text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-pre">
                                    {`POST /api/webhooks/google
{
  "google_key": "${integration?.secret_key || 'YOUR_SECRET'}",
  "form_id": "${integration?.form_id || 'FORM_ID'}",
  "user_column_data": [
    { "column_id": "FULL_NAME", "string_value": "John Doe" },
    { "column_id": "EMAIL", "string_value": "john@email.com" },
    { "column_id": "PHONE_NUMBER", "string_value": "+91..." }
  ]
}`}
                                </pre>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Test Data Received — Field Mapping */}
                    <Card className="shadow-sm border-green-200 dark:border-green-900/30">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <Check className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-lg">Test Data Received</CardTitle>
                                    <CardDescription>
                                        Map each Google field to its corresponding CRM field. Unmapped fields will be stored as requirements.
                                    </CardDescription>
                                </div>
                                {testReceivedAt && (
                                    <p className="text-xs text-muted-foreground">
                                        Received: {new Date(testReceivedAt).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            {/* Mapping Header */}
                            <div className="grid grid-cols-[1fr_40px_1fr] gap-4 py-3 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-t-lg border-b">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Google Ads Field</p>
                                <div />
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CRM Field</p>
                            </div>

                            {/* Mapping Rows */}
                            {(testData.user_column_data || []).map((field: any, idx: number) => (
                                <div
                                    key={field.column_id}
                                    className={`grid grid-cols-[1fr_40px_1fr] gap-4 items-center py-3 px-4 transition-colors
                                        ${idx % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/50 dark:bg-slate-900/20'}
                                        hover:bg-blue-50/50 dark:hover:bg-blue-900/10`}
                                >
                                    {/* Google Field */}
                                    <div className="space-y-1">
                                        <p className="font-semibold text-sm">{field.column_id.replace(/_/g, ' ')}</p>
                                        <p className="text-xs text-muted-foreground font-mono truncate">
                                            {field.string_value || <span className="italic text-slate-400">empty</span>}
                                        </p>
                                    </div>

                                    {/* Arrow */}
                                    <div className="flex justify-center">
                                        <ArrowRight className="h-4 w-4 text-slate-400" />
                                    </div>

                                    {/* CRM Field Select */}
                                    <Select
                                        value={fieldMapping[field.column_id] || 'requirement'}
                                        onValueChange={(v) => handleMappingChange(field.column_id, v)}
                                    >
                                        <SelectTrigger className="h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CRM_FIELDS.map((crm) => (
                                                <SelectItem key={crm.value} value={crm.value}>
                                                    {crm.label}
                                                    {crm.required && <span className="text-destructive ml-1">*</span>}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}

                            {/* Validation Warning */}
                            {(!Object.values(fieldMapping).includes('profile.name') ||
                                !Object.values(fieldMapping).includes('profile.phone')) && (
                                    <div className="flex items-center gap-2 p-3 mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
                                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                                            You must map at least <strong>Full Name</strong> and <strong>Phone Number</strong> to activate.
                                        </p>
                                    </div>
                                )}
                        </CardContent>
                    </Card>

                    {/* Save & Activate */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                                <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Ready to activate?</p>
                                <p className="text-xs text-muted-foreground">Saving the mapping will activate this integration. Future leads will auto-sync.</p>
                            </div>
                        </div>
                        <Button
                            onClick={handleSaveMapping}
                            disabled={saving}
                            className="gap-2 font-bold px-6 bg-primary hover:bg-primary/90"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Save Mapping & Activate
                                    <Check className="h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}
