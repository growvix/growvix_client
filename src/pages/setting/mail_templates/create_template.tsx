import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import {
    ArrowLeft,
    Image as ImageIcon,
    Plus,
    Trash2,
    Minus,
    RectangleHorizontal,
    Type,
    AlignLeft,
    AlignCenter,
    AlignRight,
    GripVertical,
    Upload,
    X,
    Paperclip,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { getCookie } from "@/utils/cookies"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { API } from "@/config/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

// dnd-kit imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// ─── Types ───────────────────────────────────────────────
type DesignBlockType = "text" | "image" | "divider" | "button" | "spacer"

interface DesignBlock {
    id: string
    type: DesignBlockType
    content: string
    styles: Record<string, string>
}

// ─── Button Controls (Label + Link + Alignment) ───────────
function ButtonControls({
    block,
    onUpdate,
}: {
    block: DesignBlock
    onUpdate: (block: DesignBlock) => void
}) {
    const currentAlign = block.styles.align || "center"

    return (
        <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-md border flex-wrap">
                <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Label</Label>
                    <Input
                        value={block.content || ""}
                        onChange={(e) => onUpdate({ ...block, content: e.target.value })}
                        placeholder="Click me"
                        className="h-7 w-32 text-xs"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Link URL</Label>
                    <Input
                        value={block.styles.href || ""}
                        onChange={(e) => onUpdate({ ...block, styles: { ...block.styles, href: e.target.value } })}
                        placeholder="https://..."
                        className="h-7 w-48 text-xs"
                    />
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Align</Label>
                    <div className="flex gap-1">
                        {[
                            { value: "left", icon: AlignLeft, label: "Left" },
                            { value: "center", icon: AlignCenter, label: "Center" },
                            { value: "right", icon: AlignRight, label: "Right" },
                        ].map(({ value, icon: Icon, label }) => (
                            <Button
                                key={value}
                                type="button"
                                variant={currentAlign === value ? "default" : "outline"}
                                size="sm"
                                className="h-6 w-8 p-0"
                                title={label}
                                onClick={() =>
                                    onUpdate({
                                        ...block,
                                        styles: { ...block.styles, align: value },
                                    })
                                }
                            >
                                <Icon className="h-3.5 w-3.5" />
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Size</Label>
                    <Select
                        value={block.styles.size || "md"}
                        onValueChange={(val) => onUpdate({ ...block, styles: { ...block.styles, size: val } })}
                    >
                        <SelectTrigger className="h-7 w-20 text-xs">
                            <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sm">Small</SelectItem>
                            <SelectItem value="md">Medium</SelectItem>
                            <SelectItem value="lg">Large</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center gap-4 p-2 bg-muted/50 rounded-md border flex-wrap">
                <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Text Color</Label>
                    <div className="flex items-center gap-1">
                        <input
                            type="color"
                            value={block.styles.color || "#ffffff"}
                            onChange={(e) => onUpdate({ ...block, styles: { ...block.styles, color: e.target.value } })}
                            className="h-7 w-12 p-0.5 cursor-pointer bg-background border rounded"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Background Color</Label>
                    <div className="flex items-center gap-1">
                        <input
                            type="color"
                            value={block.styles.backgroundColor || "#0f172a"}
                            onChange={(e) => onUpdate({ ...block, styles: { ...block.styles, backgroundColor: e.target.value } })}
                            className="h-7 w-12 p-0.5 cursor-pointer bg-background border rounded"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Image Controls (Resize + Alignment) ────────────────
function ImageControls({
    block,
    onUpdate,
}: {
    block: DesignBlock
    onUpdate: (block: DesignBlock) => void
}) {
    const currentWidth = block.styles.width || "100"
    const currentAlign = block.styles.align || "center"

    return (
        <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-2 p-1.5 bg-muted/50 rounded-md border">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Align</Label>
                <div className="flex gap-1">
                    {[
                        { value: "left", icon: AlignLeft, label: "Left" },
                        { value: "center", icon: AlignCenter, label: "Center" },
                        { value: "right", icon: AlignRight, label: "Right" },
                    ].map(({ value, icon: Icon, label }) => (
                        <Button
                            key={value}
                            type="button"
                            variant={currentAlign === value ? "default" : "outline"}
                            size="sm"
                            className="h-6 w-8"
                            title={label}
                            onClick={() =>
                                onUpdate({
                                    ...block,
                                    styles: { ...block.styles, align: value },
                                })
                            }
                        >
                            <Icon className="h-3.5 w-3.5" />
                        </Button>
                    ))}
                </div>

                <Separator orientation="vertical" className="h-5 mx-1" />

                <Label className="text-xs text-muted-foreground whitespace-nowrap">Width</Label>
                <Input
                    type="number"
                    min="10"
                    max="100"
                    value={currentWidth}
                    onChange={(e) => {
                        const val = Math.min(100, Math.max(10, parseInt(e.target.value) || 100))
                        onUpdate({
                            ...block,
                            styles: { ...block.styles, width: String(val) },
                        })
                    }}
                    className="h-7 w-16 text-xs"
                />
                <div className="flex gap-1">
                    {[25, 50, 75, 100].map((w) => (
                        <Button
                            key={w}
                            type="button"
                            variant={currentWidth === String(w) ? "default" : "outline"}
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() =>
                                onUpdate({
                                    ...block,
                                    styles: { ...block.styles, width: String(w) },
                                })
                            }
                        >
                            {w}%
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─── Sortable Design Block Component ──────────────────── 
function SortableDesignBlockItem({
    block,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
}: {
    block: DesignBlock
    isSelected: boolean
    onSelect: () => void
    onUpdate: (block: DesignBlock) => void
    onDelete: () => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto" as const,
    }

    const imgWidth = block.styles.width || "100"
    const imgAlign = block.styles.align || "center"
    const alignClass = imgAlign === "left" ? "mr-auto" : imgAlign === "right" ? "ml-auto" : "mx-auto"

    const renderBlock = () => {
        switch (block.type) {
            case "text":
                return (
                    <div className="w-full relative z-10">
                        <RichTextEditor
                            value={block.content}
                            onChange={(val) => onUpdate({ ...block, content: val })}
                            minHeight="100px"
                        />
                    </div>
                )
            case "image":
                return block.content ? (
                    <div style={{ width: `${imgWidth}%` }} className={alignClass}>
                        <img
                            src={block.content}
                            alt="Template image"
                            className="w-full h-auto rounded"
                        />
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                            Click to upload image
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                    const reader = new FileReader()
                                    reader.onload = (ev) => {
                                        onUpdate({
                                            ...block,
                                            content: ev.target?.result as string,
                                        })
                                    }
                                    reader.readAsDataURL(file)
                                }
                            }}
                        />
                    </label>
                )
            case "divider":
                return <hr className="border-t border-gray-300 my-2" />
            case "button": {
                const align = block.styles.align || "center"
                const alignClass = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center"
                const href = block.styles.href || "#"
                const btnColor = block.styles.color || "#ffffff"
                const btnBg = block.styles.backgroundColor || "#0f172a"
                const btnSize = block.styles.size || "md"
                const sizeClasses = {
                    sm: "px-3 py-1.5 text-xs",
                    md: "px-4 py-2 text-sm",
                    lg: "px-6 py-3 text-base"
                }[btnSize] || "px-4 py-2 text-sm"

                return (
                    <div className={alignClass}>
                        <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className={cn("inline-block rounded-md font-medium transition-colors opacity-90 hover:opacity-100", sizeClasses)}
                            style={{ backgroundColor: btnBg, color: btnColor }}
                        >
                            {block.content || "Click me"}
                        </a>
                    </div>
                )
            }
            case "spacer":
                return <div className="h-8" />
            default:
                return null
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            data-block-id={block.id}
            onClick={onSelect}
            className={cn(
                "group relative p-3 rounded-lg border transition-all",
                isDragging && "shadow-lg",
                isSelected
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                    : "border-transparent hover:border-muted-foreground/20 hover:bg-muted/30"
            )}
        >
            <div className="flex items-start gap-2">
                <div
                    {...attributes}
                    {...listeners}
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1 cursor-grab active:cursor-grabbing"
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                    {renderBlock()}
                    {/* Show button controls when button is selected */}
                    {isSelected && block.type === "button" && (
                        <ButtonControls block={block} onUpdate={onUpdate} />
                    )}
                    {/* Show image controls when image is selected */}
                    {isSelected && block.type === "image" && block.content && (
                        <ImageControls block={block} onUpdate={onUpdate} />
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                    }}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    )
}

// ─── Main Component ────────────────────────────────────────
export default function CreateTemplate() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEditing = Boolean(id)
    const { setBreadcrumbs } = useBreadcrumb()

    // ── Metadata state ──
    const [templateName, setTemplateName] = useState("")
    const [projectId, setProjectId] = useState<string>("none")
    const [projects, setProjects] = useState<any[]>([])
    const [description, setDescription] = useState("")
    const [subject, setSubject] = useState("")
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(false)

    // ── Design editor state ──
    const [designBlocks, setDesignBlocks] = useState<DesignBlock[]>([])
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [existingAttachments, setExistingAttachments] = useState<any[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    // ── dnd-kit sensors ──
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    useEffect(() => {
        setBreadcrumbs([
            { label: "Settings", href: "/settings" },
            { label: "Mail Templates", href: "/setting/mail_templates" },
            { label: isEditing ? "Edit Template" : "Create Template" },
        ])
    }, [setBreadcrumbs, isEditing])

    // ── Load available projects ──
    useEffect(() => {
        const org = getCookie("organization")
        const token = getCookie("token")
        if (org && token) {
            axios.get(`${API.PROJECTS}?organization=${org}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then((res) => setProjects(res.data.data || []))
                .catch((err) => console.error("Failed to load projects", err))
        }
    }, [])

    // ── Load template for editing ──
    useEffect(() => {
        if (isEditing && id) {
            setLoading(true)
            const org = getCookie("organization")
            const token = getCookie("token")
            axios
                .get(`${API.getMailTemplate(id)}?organization=${org}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then((res) => {
                    const t = res.data.data
                    setTemplateName(t.templateName)
                    setProjectId(t.projectId?._id || t.projectId || "none")
                    setDescription(t.description || "")
                    setSubject(t.subject)
                    if (t.attachments && Array.isArray(t.attachments)) {
                        setExistingAttachments(t.attachments)
                    }
                    try {
                        const parsed = JSON.parse(t.body)
                        if (Array.isArray(parsed)) {
                            setDesignBlocks(parsed)
                        } else {
                            // If coming from old simple editor, put it in a text block
                            if (t.body) {
                                setDesignBlocks([{
                                    id: `block-${Date.now()}`,
                                    type: "text",
                                    content: t.body,
                                    styles: {},
                                }])
                            }
                        }
                    } catch {
                        // Not JSON, assume older simple editor HTML content
                        if (t.body) {
                            setDesignBlocks([{
                                id: `block-${Date.now()}`,
                                type: "text",
                                content: t.body,
                                styles: {},
                            }])
                        }
                    }
                })
                .catch((err) => {
                    toast.error(
                        err.response?.data?.message || "Failed to load template"
                    )
                    navigate("/setting/mail_templates")
                })
                .finally(() => setLoading(false))
        }
    }, [id, isEditing, navigate])

    // ── Drag end handler ──
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            setDesignBlocks((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    // ── Add design block ──
    const addBlock = (type: DesignBlock["type"]) => {
        const newBlock: DesignBlock = {
            id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            type,
            content:
                type === "text"
                    ? "Type your text here..."
                    : type === "button"
                        ? "Click me"
                        : "",
            styles: {},
        }
        setDesignBlocks((prev) => [...prev, newBlock])
        setSelectedBlockId(newBlock.id)
    }

    // ── File upload ──
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        setUploadedFiles((prev) => [...prev, ...files])
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const removeFile = (index: number) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
    }

    // ── Submit ──
    const handleSubmit = async () => {
        if (!templateName.trim() || !subject.trim()) {
            toast.error("Template name and subject are required")
            return
        }

        setSaving(true)
        try {
            const token = getCookie("token")
            const org = getCookie("organization")

            const body = JSON.stringify(designBlocks)

            const formData = new FormData()
            formData.append("templateName", templateName)
            if (projectId && projectId !== "none") {
                formData.append("projectId", projectId)
            }
            formData.append("description", description)
            formData.append("subject", subject)
            formData.append("editorType", "design") // Always save as design
            formData.append("body", body)
            formData.append("organization", org || "")

            uploadedFiles.forEach((file) => {
                formData.append("attachments", file)
            })

            if (isEditing && id) {
                await axios.put(API.getMailTemplate(id), formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                })
                toast.success("Template updated successfully")
            } else {
                await axios.post(API.MAIL_TEMPLATES, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                })
                toast.success("Template created successfully")
            }

            navigate("/setting/mail_templates")
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(
                    error.response.data.message ||
                    (isEditing ? "Failed to update" : "Failed to create")
                )
            } else {
                toast.error("An unexpected error occurred")
            }
        } finally {
            setSaving(false)
        }
    }

    const renderPreviewHTML = () => {
        let html = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">`
        designBlocks.forEach((block) => {
            const align = block.styles.align || "left"
            const textAlign = `text-align: ${align};`

            if (block.type === "text") {
                html += `<div style="margin-bottom: 16px;">${block.content}</div>`
            } else if (block.type === "image") {
                const width = block.styles.width || 100
                html += `<div style="margin-bottom: 16px; ${textAlign}"><img src="${block.content}" style="max-width: ${width}%; height: auto;" /></div>`
            } else if (block.type === "divider") {
                html += `<hr style="margin: 24px 0; border: none; border-top: 1px solid #eaeaea;" />`
            } else if (block.type === "spacer") {
                html += `<div style="height: 32px;"></div>`
            } else if (block.type === "button") {
                const href = block.styles.href || "#"
                const btnColor = block.styles.color || "#ffffff"
                const btnBg = block.styles.backgroundColor || "#0f172a"
                const btnSize = block.styles.size || "md"
                const sizeStyles = {
                    sm: "padding: 6px 12px; font-size: 12px;",
                    md: "padding: 10px 20px; font-size: 14px;",
                    lg: "padding: 14px 28px; font-size: 16px;"
                }[btnSize] || "padding: 10px 20px; font-size: 14px;"

                html += `<div style="margin-bottom: 16px; ${textAlign}"><a href="${href}" style="display: inline-block; ${sizeStyles} background-color: ${btnBg}; color: ${btnColor}; text-decoration: none; border-radius: 6px; font-weight: 500;">${block.content || "Click"}</a></div>`
            }
        })
        html += `</div>`
        return html
    }

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-6 px-6 py-4 max-w-[1400px] mx-auto w-full">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background/95 backdrop-blur z-20 sticky top-0 py-2 border-b">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/setting/mail_templates")}
                        className="h-8 w-8"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            {isEditing ? "Edit Template" : "Create Template"}
                        </h2>
                        {isEditing && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {templateName}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                        <DialogTrigger asChild>
                            <Button variant="secondary">Preview</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Email Preview</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 overflow-auto border rounded-md p-4 bg-white mt-4">
                                <iframe
                                    srcDoc={renderPreviewHTML()}
                                    className="w-full h-full border-none"
                                    title="Email Preview"
                                />
                            </div>

                            {/* Gmail-Style Attachments Preview */}
                            {(uploadedFiles.length > 0 || existingAttachments.length > 0) && (
                                <div className="mt-4 pt-4 border-t border-muted">
                                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground flex items-center gap-2">
                                        <Paperclip className="h-4 w-4" /> {(uploadedFiles.length + existingAttachments.length)} Attachments
                                    </h4>
                                    <div className="flex flex-wrap gap-3">
                                        {existingAttachments.map((f, i) => (
                                            <div key={`exist-${i}`} className="flex items-center gap-3 border rounded-md p-2 w-[220px] bg-muted/10 hover:bg-muted/30 transition-colors shadow-sm cursor-default group">
                                                <div className="bg-red-100/80 p-3 rounded text-red-600">
                                                    <Paperclip className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-sm font-medium truncate" title={f.filename}>{f.filename}</span>
                                                    <span className="text-xs text-muted-foreground">Attached</span>
                                                </div>
                                            </div>
                                        ))}
                                        {uploadedFiles.map((f, i) => (
                                            <div key={`new-${i}`} className="flex items-center gap-3 border rounded-md p-2 w-[220px] bg-muted/10 hover:bg-muted/30 transition-colors shadow-sm cursor-default group">
                                                <div className="bg-red-100/80 p-3 rounded text-red-600">
                                                    <Paperclip className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-sm font-medium truncate" title={f.name}>{f.name}</span>
                                                    <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </DialogContent>
                    </Dialog>
                    <Button
                        variant="outline"
                        onClick={() => navigate("/setting/mail_templates")}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                        {saving ? "Saving..." : isEditing ? "Update Template" : "Save Template"}
                    </Button>
                </div>
            </div>

            {/* ── Metadata Form ── */}
            <div className="grid gap-6 md:grid-cols-2 p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
                <div className="grid gap-2">
                    <Label htmlFor="templateName">
                        Template Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="templateName"
                        placeholder="e.g. Welcome Email"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        required
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="subject">
                        Subject <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="subject"
                        placeholder="Email subject line..."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="projectId">Project (Optional)</Label>
                    <Select value={projectId} onValueChange={setProjectId}>
                        <SelectTrigger id="projectId">
                            <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            <SelectItem value="none">No Project Linked</SelectItem>
                            {projects.map((project) => (
                                <SelectItem key={project._id} value={project._id}>
                                    {project.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                        id="description"
                        placeholder="Brief description of this template..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                    />
                </div>
            </div>

            {/* ── Design Editor ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-[600px]">
                {/* Left: Block Toolbar */}
                <div className="xl:col-span-1">
                    <Card className="sticky top-24">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Add Blocks</CardTitle>
                            <CardDescription className="text-xs">
                                Click to add, drag to reorder
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                className="h-auto py-3 flex flex-col gap-1.5"
                                onClick={() => addBlock("text")}
                            >
                                <Type className="h-5 w-5" />
                                <span className="text-xs">Rich Text</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-auto py-3 flex flex-col gap-1.5"
                                onClick={() => addBlock("image")}
                            >
                                <ImageIcon className="h-5 w-5" />
                                <span className="text-xs">Image</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-auto py-3 flex flex-col gap-1.5"
                                onClick={() => addBlock("button")}
                            >
                                <RectangleHorizontal className="h-5 w-5" />
                                <span className="text-xs">Button</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-auto py-3 flex flex-col gap-1.5"
                                onClick={() => addBlock("divider")}
                            >
                                <Minus className="h-5 w-5" />
                                <span className="text-xs">Divider</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-auto py-3 flex flex-col gap-1.5 col-span-2"
                                onClick={() => addBlock("spacer")}
                            >
                                <RectangleHorizontal className="h-5 w-5 rotate-90" />
                                <span className="text-xs">Spacer</span>
                            </Button>

                        </CardContent>

                        <Separator />

                        <CardContent className="pt-4">
                            {/* file uploads for design editor */}
                            <div className="mt-3">
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Attachments
                                </Label>
                                <div
                                    className="border-2 border-dashed rounded-lg p-3 text-center mt-1.5 hover:bg-muted/30 transition-colors cursor-pointer"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                >
                                    <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                    <p className="text-xs text-muted-foreground">
                                        Upload files
                                    </p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                {uploadedFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {uploadedFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
                                            >
                                                <span className="max-w-[80px] truncate">
                                                    {file.name}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        removeFile(index)
                                                    }
                                                    className="text-muted-foreground hover:text-destructive"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Canvas */}
                <div className="xl:col-span-2">
                    <Card className="min-h-[600px]">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">
                                    Template Canvas
                                </CardTitle>
                                <Badge variant="secondary" className="text-xs">
                                    {designBlocks.length} block
                                    {designBlocks.length !== 1 ? "s" : ""}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-white dark:bg-gray-950 border rounded-lg p-6 min-h-[500px]">
                                {designBlocks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-[400px] text-center">
                                        <div className="bg-muted p-4 rounded-2xl mb-4">
                                            <Plus className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-medium mb-1">
                                            Start building your template
                                        </p>
                                        <p className="text-xs text-muted-foreground max-w-xs">
                                            Click the buttons on the left
                                            panel to add text, images,
                                            buttons, and more. Drag the grip
                                            handle to reorder blocks.
                                        </p>
                                    </div>
                                ) : (
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext
                                            items={designBlocks.map((b) => b.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div className="flex flex-col gap-1">
                                                {designBlocks.map((block) => (
                                                    <SortableDesignBlockItem
                                                        key={block.id}
                                                        block={block}
                                                        isSelected={
                                                            selectedBlockId ===
                                                            block.id
                                                        }
                                                        onSelect={() =>
                                                            setSelectedBlockId(
                                                                block.id
                                                            )
                                                        }
                                                        onUpdate={(updated) =>
                                                            setDesignBlocks(
                                                                (prev) =>
                                                                    prev.map(
                                                                        (b) =>
                                                                            b.id ===
                                                                                updated.id
                                                                                ? updated
                                                                                : b
                                                                    )
                                                            )
                                                        }
                                                        onDelete={() =>
                                                            setDesignBlocks(
                                                                (prev) =>
                                                                    prev.filter(
                                                                        (b) =>
                                                                            b.id !==
                                                                            block.id
                                                                    )
                                                            )
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </DndContext>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
