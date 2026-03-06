import { useState, useEffect } from 'react'
import axios from 'axios'
import { API } from '@/config/api'
import { toast } from 'sonner'
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import LoaderScreen from '@/components/ui/loader-screen'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus, Building2, Layers, DoorOpen, X, Copy, Edit2, Info, Ban } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { getCookie, getPermissions } from '@/utils/cookies'

// Types
interface Unit {
    unitId: string
    unitNumber: string
    bhk: number
    bathrooms: number
    size: number
    unitType: string
    facing: string
    status: 'available' | 'booked' | 'sold'
    position: { row: number; col: number }
}

// Unit type configuration
interface UnitTypeConfig {
    name: string       // e.g., "Type A", "Type B"
    bhk: number
    bathrooms: number
    size: number
    count: number      // How many of this type per floor
}

interface Floor {
    floorNumber: number
    floorName: string
    units: Unit[]
}

interface Block {
    blockId: string
    blockName: string
    totalFloors: number
    floorPlanImages: string[]
    floors: Floor[]
}

interface ProjectFormData {
    name: string
    property: string
    location: string
    preferred: string[]
    img_location: {
        logo: string
        banner: string
        brochure: string
        post: string
        videos: string
    }
    blocks: Block[]
    // Plots specific fields
    plots?: Plot[]
    plotNumberPattern?: 'numeric' | 'alpha' | 'custom'
    layoutImages?: string[]
}

// Plot interface for plots property type
interface Plot {
    plotId: string
    plotNumber: string
    size: number
    facing?: string
    status: 'available' | 'booked' | 'sold'
}

const initialFormData: ProjectFormData = {
    name: '',
    property: 'apartments',
    location: '',
    preferred: [],
    img_location: {
        logo: '',
        banner: '',
        brochure: '',
        post: '',
        videos: '',
    },
    blocks: [],
    plots: [],
    plotNumberPattern: 'numeric',
    layoutImages: []
}

// Generate floor name from number
const getFloorName = (num: number): string => {
    if (num === 0) return 'Ground Floor'
    const suffix = ['th', 'st', 'nd', 'rd']
    const v = num % 100
    return num + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]) + ' Floor'
}

// Generate units for a floor based on unit types
const generateUnitsFromTypes = (floorNumber: number, unitTypes: UnitTypeConfig[], pattern: string): Unit[] => {
    const units: Unit[] = []
    let unitIndex = 1

    unitTypes.forEach(unitType => {
        for (let i = 0; i < unitType.count; i++) {
            let unitNumber = ''
            if (pattern === 'numeric') {
                unitNumber = `${floorNumber}${String(unitIndex).padStart(2, '0')}`
            } else if (pattern === 'alpha') {
                unitNumber = `${floorNumber}${String.fromCharCode(64 + unitIndex)}`
            } else {
                unitNumber = `${floorNumber}-${unitIndex}`
            }
            units.push({
                unitId: unitNumber,
                unitNumber: unitNumber,
                bhk: unitType.bhk,
                bathrooms: unitType.bathrooms,
                size: unitType.size,
                unitType: unitType.name,
                facing: 'East',
                status: 'available',
                position: { row: Math.floor((unitIndex - 1) / 4), col: (unitIndex - 1) % 4 }
            })
            unitIndex++
        }
    })
    return units
}

// Block configuration state type
interface BlockConfig {
    floors: number
    pattern: string
    unitTypes: UnitTypeConfig[]
}

export default function NewProject() {
    const [formData, setFormData] = useState<ProjectFormData>(initialFormData)
    const [loading, setLoading] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)
    const [expandedBlocks, setExpandedBlocks] = useState<string[]>([])
    const [blockConfigs, setBlockConfigs] = useState<Record<string, BlockConfig>>({})
    const { setBreadcrumbs } = useBreadcrumb()

    const userPermissions = getPermissions()
    const canCreateProject = userPermissions.includes("create_project")

    // Floor editor modal state
    const [floorEditorOpen, setFloorEditorOpen] = useState(false)
    const [editingFloor, setEditingFloor] = useState<{ blockId: string; floorNumber: number } | null>(null)
    const [copyToFloors, setCopyToFloors] = useState<number[]>([])

    // Plots config state
    const [plotsConfig, setPlotsConfig] = useState<{
        totalPlots: number
        defaultSize: number
    }>({ totalPlots: 10, defaultSize: 1200 })

    // Plots pagination - show 20 plots per page to avoid lag
    const [plotPage, setPlotPage] = useState(0)
    const PLOTS_PER_PAGE = 50

    // Generate plot number based on pattern
    const generatePlotNumber = (index: number, pattern: string): string => {
        if (pattern === 'alpha') {
            // A, B, C... AA, AB for > 26
            if (index < 26) return String.fromCharCode(65 + index)
            return String.fromCharCode(65 + Math.floor(index / 26) - 1) + String.fromCharCode(65 + (index % 26))
        }
        return String(index + 1) // numeric: 1, 2, 3...
    }

    // Update single plot
    const updatePlot = (plotId: string, updates: Partial<Plot>) => {
        setFormData(prev => ({
            ...prev,
            plots: prev.plots?.map(p => p.plotId === plotId ? { ...p, ...updates } : p)
        }))
    }

    // Generate plots
    const generatePlots = () => {
        const plots: Plot[] = []
        for (let i = 0; i < plotsConfig.totalPlots; i++) {
            const plotNum = generatePlotNumber(i, formData.plotNumberPattern || 'numeric')
            plots.push({
                plotId: `plot-${plotNum}`,
                plotNumber: plotNum,
                size: plotsConfig.defaultSize,
                facing: 'East',
                status: 'available'
            })
        }
        setFormData(prev => ({ ...prev, plots }))
        setPlotPage(0) // Reset to first page
        toast.success(`Generated ${plotsConfig.totalPlots} plots`)
    }

    // Get or initialize block config
    const getBlockConfig = (blockId: string): BlockConfig => {
        return blockConfigs[blockId] || {
            floors: 10,
            pattern: 'numeric',
            unitTypes: [{ name: 'Type A', bhk: 2, bathrooms: 2, size: 1200, count: 4 }]
        }
    }

    // Update block config
    const updateBlockConfig = (blockId: string, updates: Partial<BlockConfig>) => {
        setBlockConfigs(prev => ({
            ...prev,
            [blockId]: { ...getBlockConfig(blockId), ...updates }
        }))
    }

    // Add unit type to block
    const addUnitType = (blockId: string) => {
        const config = getBlockConfig(blockId)
        const newTypeName = `Type ${String.fromCharCode(65 + config.unitTypes.length)}`
        updateBlockConfig(blockId, {
            unitTypes: [...config.unitTypes, { name: newTypeName, bhk: 2, bathrooms: 2, size: 1200, count: 2 }]
        })
    }

    // Update unit type in block
    const updateUnitType = (blockId: string, index: number, updates: Partial<UnitTypeConfig>) => {
        const config = getBlockConfig(blockId)
        const newTypes = [...config.unitTypes]
        newTypes[index] = { ...newTypes[index], ...updates }
        updateBlockConfig(blockId, { unitTypes: newTypes })
    }

    // Remove unit type from block and resequence names
    const removeUnitType = (blockId: string, index: number) => {
        const config = getBlockConfig(blockId)
        const filteredTypes = config.unitTypes.filter((_, i) => i !== index)
        // Resequence names: Type A, Type B, Type C, etc.
        const resequencedTypes = filteredTypes.map((type, i) => ({
            ...type,
            name: `Type ${String.fromCharCode(65 + i)}`
        }))
        updateBlockConfig(blockId, { unitTypes: resequencedTypes })
    }

    useEffect(() => {
        setBreadcrumbs([
            { label: "Project Listing", href: "/project_listing" },
            { label: "New Project" },
            {
                label: (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4.5 w-4.5" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                                <p className="font-medium">Create Project</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            },
        ])
    }, [setBreadcrumbs])

    useEffect(() => {
        const timer = setTimeout(() => setPageLoading(false), 500)
        return () => clearTimeout(timer)
    }, [])

    // Add a new block
    const addBlock = () => {
        const blockId = String.fromCharCode(65 + formData.blocks.length) // A, B, C...
        const newBlock: Block = {
            blockId,
            blockName: `Block ${blockId}`,
            totalFloors: 5,
            floorPlanImages: [],
            floors: []
        }
        setFormData(prev => ({
            ...prev,
            blocks: [...prev.blocks, newBlock]
        }))
        setExpandedBlocks(prev => [...prev, blockId])
    }

    // Remove a block and re-index remaining blocks
    const removeBlock = (blockIdToRemove: string) => {
        setFormData(prev => {
            const filteredBlocks = prev.blocks.filter(b => b.blockId !== blockIdToRemove)
            // Re-index remaining blocks (A, B, C...)
            const reindexedBlocks = filteredBlocks.map((block, index) => {
                const newBlockId = String.fromCharCode(65 + index) // A, B, C...
                return {
                    ...block,
                    blockId: newBlockId,
                    blockName: `Block ${newBlockId}`
                }
            })
            return { ...prev, blocks: reindexedBlocks }
        })
        // Update expanded blocks with new IDs
        setExpandedBlocks(prev => {
            const index = formData.blocks.findIndex(b => b.blockId === blockIdToRemove)
            if (index === -1) return prev
            // Remove the deleted block and shift remaining expanded states
            return prev
                .filter(id => id !== blockIdToRemove)
                .map(id => {
                    const oldIndex = formData.blocks.findIndex(b => b.blockId === id)
                    if (oldIndex > index) {
                        return String.fromCharCode(65 + oldIndex - 1)
                    }
                    return id
                })
        })
    }

    // Update block field
    const updateBlock = (blockId: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            blocks: prev.blocks.map(b =>
                b.blockId === blockId ? { ...b, [field]: value } : b
            )
        }))
    }

    // Generate floors for a block (creates floors with default config initially)
    const generateFloors = (blockId: string) => {
        const config = getBlockConfig(blockId)
        const floors: Floor[] = []
        for (let i = 1; i <= config.floors; i++) {
            floors.push({
                floorNumber: i,
                floorName: getFloorName(i),
                units: generateUnitsFromTypes(i, config.unitTypes, config.pattern)
            })
        }
        updateBlock(blockId, 'floors', floors)
        updateBlock(blockId, 'totalFloors', config.floors)
        toast.success(`Generated ${config.floors} floors. Click any floor to customize its units.`)
    }

    // Open floor editor modal
    const openFloorEditor = (blockId: string, floorNumber: number) => {
        setEditingFloor({ blockId, floorNumber })
        setCopyToFloors([])
        setFloorEditorOpen(true)
    }

    // Copy floor config to other floors
    const copyFloorToOthers = (sourceBlockId: string, sourceFloorNum: number, targetFloorNums: number[]) => {
        const block = formData.blocks.find(b => b.blockId === sourceBlockId)
        const sourceFloor = block?.floors.find(f => f.floorNumber === sourceFloorNum)
        if (!block || !sourceFloor) return

        const config = getBlockConfig(sourceBlockId)
        // Get unit types from source floor units
        const unitTypesMap = new Map<string, UnitTypeConfig>()
        sourceFloor.units.forEach(unit => {
            const key = `${unit.bhk}-${unit.bathrooms}-${unit.size}`
            if (!unitTypesMap.has(key)) {
                unitTypesMap.set(key, {
                    name: unit.unitType || `${unit.bhk}BHK`,
                    bhk: unit.bhk,
                    bathrooms: unit.bathrooms,
                    size: unit.size,
                    count: 0
                })
            }
            unitTypesMap.get(key)!.count++
        })
        const unitTypes = Array.from(unitTypesMap.values())

        setFormData(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => {
                if (b.blockId !== sourceBlockId) return b
                return {
                    ...b,
                    floors: b.floors.map(f => {
                        if (!targetFloorNums.includes(f.floorNumber)) return f
                        return {
                            ...f,
                            units: generateUnitsFromTypes(f.floorNumber, unitTypes, config.pattern)
                        }
                    })
                }
            })
        }))
        toast.success(`Copied to ${targetFloorNums.length} floors`)
        setFloorEditorOpen(false)
    }

    // Update a single unit's properties
    const updateSingleUnit = (blockId: string, floorNumber: number, unitId: string, updates: Partial<Unit>) => {
        setFormData(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => {
                if (b.blockId !== blockId) return b
                return {
                    ...b,
                    floors: b.floors.map(f => {
                        if (f.floorNumber !== floorNumber) return f
                        return {
                            ...f,
                            units: f.units.map(u => {
                                if (u.unitId !== unitId) return u
                                return { ...u, ...updates }
                            })
                        }
                    })
                }
            })
        }))
    }

    // Add a new unit to a floor
    const addUnitToFloor = (blockId: string, floorNumber: number) => {
        const config = getBlockConfig(blockId)
        const block = formData.blocks.find(b => b.blockId === blockId)
        const floor = block?.floors.find(f => f.floorNumber === floorNumber)
        if (!floor) return

        const nextNum = floor.units.length + 1
        let unitNumber = ''
        if (config.pattern === 'numeric') {
            unitNumber = `${floorNumber}${String(nextNum).padStart(2, '0')}`
        } else if (config.pattern === 'alpha') {
            unitNumber = `${floorNumber}${String.fromCharCode(64 + nextNum)}`
        } else {
            unitNumber = `${floorNumber}-${nextNum}`
        }

        const newUnit: Unit = {
            unitId: unitNumber,
            unitNumber: unitNumber,
            bhk: 2,
            bathrooms: 2,
            size: 1200,
            unitType: 'Type A',
            facing: 'East',
            status: 'available',
            position: { row: Math.floor((nextNum - 1) / 4), col: (nextNum - 1) % 4 }
        }

        setFormData(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => {
                if (b.blockId !== blockId) return b
                return {
                    ...b,
                    floors: b.floors.map(f => {
                        if (f.floorNumber !== floorNumber) return f
                        return { ...f, units: [...f.units, newUnit] }
                    })
                }
            })
        }))
    }

    // Remove a unit from a floor
    const removeUnitFromFloor = (blockId: string, floorNumber: number, unitId: string) => {
        setFormData(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => {
                if (b.blockId !== blockId) return b
                return {
                    ...b,
                    floors: b.floors.map(f => {
                        if (f.floorNumber !== floorNumber) return f
                        return { ...f, units: f.units.filter(u => u.unitId !== unitId) }
                    })
                }
            })
        }))
    }

    // Handle floor plan image upload
    const handleImageUpload = async (blockId: string, files: FileList | null) => {
        if (!files || files.length === 0) return

        // Check max 5 images limit
        const block = formData.blocks.find(b => b.blockId === blockId)
        const currentCount = block?.floorPlanImages?.length || 0
        if (currentCount + files.length > 5) {
            toast.error('Maximum 5 images allowed per block')
            return
        }

        const formDataUpload = new FormData()
        Array.from(files).forEach(file => {
            formDataUpload.append('images', file)
        })

        try {
            const response = await axios.post(API.UPLOAD.FLOOR_PLANS, formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            const newUrls = response.data.data.urls
            updateBlock(blockId, 'floorPlanImages', [...(block?.floorPlanImages || []), ...newUrls].slice(0, 5))
            toast.success(`${newUrls.length} image(s) uploaded successfully`)
        } catch (error: any) {
            console.error('Failed to upload images:', error)
            toast.error(error.response?.data?.message || 'Failed to upload images')
        }
    }

    // Handle plot layout image upload
    const handleLayoutImageUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return

        // Check max 5 images limit
        const currentCount = formData.layoutImages?.length || 0
        if (currentCount + files.length > 5) {
            toast.error('Maximum 5 layout images allowed')
            return
        }

        const formDataUpload = new FormData()
        Array.from(files).forEach(file => {
            formDataUpload.append('images', file)
        })

        try {
            const response = await axios.post(API.UPLOAD.FLOOR_PLANS, formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            const newUrls = response.data.data.urls
            setFormData(prev => ({
                ...prev,
                layoutImages: [...(prev.layoutImages || []), ...newUrls].slice(0, 5)
            }))
            toast.success(`${newUrls.length} layout image(s) uploaded successfully`)
        } catch (error: any) {
            console.error('Failed to upload layout images:', error)
            toast.error(error.response?.data?.message || 'Failed to upload layout images')
        }
    }

    // Remove a floor plan image
    const removeFloorPlanImage = (blockId: string, imageUrl: string) => {
        const block = formData.blocks.find(b => b.blockId === blockId)
        if (block) {
            const updatedImages = block.floorPlanImages.filter(url => url !== imageUrl)
            updateBlock(blockId, 'floorPlanImages', updatedImages)
        }
    }

    // Remove a layout image
    const removeLayoutImage = (imageUrl: string) => {
        setFormData(prev => ({
            ...prev,
            layoutImages: prev.layoutImages?.filter(url => url !== imageUrl) || []
        }))
    }

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation based on property type
        if (formData.property === 'plots') {
            if (!formData.plots || formData.plots.length === 0) {
                toast.error('Please generate plots first')
                return
            }
        } else {
            if (formData.blocks.length === 0) {
                toast.error('Please add at least one block')
                return
            }
        }

        setLoading(true)
        const organization = getCookie('organization')
        if (!organization) {
            toast.error('Organization not found. Please login again.')
            setLoading(false)
            return
        }

        try {
            const payload = { ...formData, organization }
            const response = await axios.post(API.PROJECTS, payload)
            toast.success(response.data.message || 'Project added successfully!')
            setFormData(initialFormData)
        } catch (error: any) {
            console.error('Failed to add project:', error)
            toast.error(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to add project')
        } finally {
            setLoading(false)
        }
    }

    if (pageLoading) {
        return <LoaderScreen />
    }

    if (!canCreateProject) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center py-20 px-4 mt-20">
                <div className="flex flex-col items-center justify-center max-w-3xl w-full p-20 border border-dashed rounded-2xl bg-card min-h-[400px]">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted/30 border mb-8">
                        <Ban className="h-10 w-10 text-muted-foreground/70" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight mb-4">Access Denied</h2>
                    <p className="text-base text-muted-foreground text-center leading-relaxed max-w-md gap-4">
                        This page is restricted. You don't have permission to create projects.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4">
            <div className="mx-7">
                <form onSubmit={handleSubmit}>
                    <div className='grid grid-cols-3 gap-4'>
                        <div className="grid col-span-2">
                            {formData.property === 'plots' && (
                                <Card className="mb-4">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Layers className="h-5 w-5" />
                                                    Plots Configuration
                                                </CardTitle>
                                                <CardDescription>Configure your plots inventory and layout images</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Layout Image Upload */}
                                        <div className="mb-6 p-4 border rounded-lg bg-muted/20">
                                            <Label className="mb-2 block">Site Layout / Master Plan Images</Label>
                                            <div className="flex items-center gap-4">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="max-w-xs"
                                                    onChange={(e) => {
                                                        handleLayoutImageUpload(e.target.files)
                                                        e.target.value = ''
                                                    }}
                                                />
                                                <p className="text-xs text-muted-foreground">Upload up to 5 images</p>
                                            </div>
                                            {/* Layout Images Preview */}
                                            {formData.layoutImages && formData.layoutImages.length > 0 && (
                                                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                                                    {formData.layoutImages.map((url, idx) => (
                                                        <div key={idx} className="relative w-24 h-24 shrink-0 border rounded overflow-hidden group">
                                                            <img src={url} alt={`Layout ${idx + 1}`} className="w-full h-full object-cover" />
                                                            <Button
                                                                type="button"
                                                                onClick={() => removeLayoutImage(url)}
                                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Generation Controls */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
                                            <div className="space-y-2">
                                                <Label>Total Plots</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="1000"
                                                    value={plotsConfig.totalPlots}
                                                    onChange={e => setPlotsConfig(prev => ({ ...prev, totalPlots: Math.min(1000, parseInt(e.target.value) || 1) }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Numbering Pattern</Label>
                                                <Select
                                                    value={formData.plotNumberPattern || 'numeric'}
                                                    onValueChange={v => setFormData(prev => ({ ...prev, plotNumberPattern: v as 'numeric' | 'alpha' | 'custom' }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="numeric">Numeric (1, 2, 3...)</SelectItem>
                                                        <SelectItem value="alpha">Alphabetic (A, B, C...)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Plot Size (sqft)</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={plotsConfig.defaultSize}
                                                    onChange={e => setPlotsConfig(prev => ({ ...prev, defaultSize: parseInt(e.target.value) || 1000 }))}
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <Button type="button" onClick={generatePlots} className="w-full">
                                                    {formData.plots && formData.plots.length > 0 ? 'Regenerate' : 'Generate'} Plots
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Paginated Plots Editor - 20 plots per page */}
                                        {formData.plots && formData.plots.length > 0 ? (
                                            <div>
                                                {/* Summary Stats */}
                                                <div className="flex items-center justify-between mb-3 p-3 bg-muted/30 rounded-lg">
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-center">
                                                            <p className="text-2xl font-bold">{formData.plots.length}</p>
                                                            <p className="text-xs text-muted-foreground">Total Plots</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-lg font-semibold">{formData.plots.reduce((sum, p) => sum + p.size, 0).toLocaleString()}</p>
                                                            <p className="text-xs text-muted-foreground">Total Sqft</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={plotPage === 0}
                                                            onClick={() => setPlotPage(p => p - 1)}
                                                        >
                                                            Previous
                                                        </Button>
                                                        <span className="text-sm px-2">
                                                            Page {plotPage + 1} of {Math.ceil(formData.plots.length / PLOTS_PER_PAGE)}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={(plotPage + 1) * PLOTS_PER_PAGE >= formData.plots.length}
                                                            onClick={() => setPlotPage(p => p + 1)}
                                                        >
                                                            Next
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Header */}
                                                <div className="grid grid-cols-4 gap-3 px-3 py-2 bg-muted/50 rounded-t-lg text-sm font-medium">
                                                    <div>Plot No.</div>
                                                    <div>Size (sqft)</div>
                                                    <div>Facing</div>
                                                    <div>Status</div>
                                                </div>

                                                {/* Plots Grid - Only current page */}
                                                <div className="space-y-1 max-h-[70vh] overflow-auto">
                                                    {formData.plots
                                                        .slice(plotPage * PLOTS_PER_PAGE, (plotPage + 1) * PLOTS_PER_PAGE)
                                                        .map((plot) => (
                                                            <div key={plot.plotId} className="grid grid-cols-4 gap-3 px-3 py-2 items-center border-b hover:bg-muted/20">
                                                                <div className="font-medium">{plot.plotNumber}</div>
                                                                <Input
                                                                    type="number"
                                                                    className="h-8"
                                                                    value={plot.size}
                                                                    onChange={e => updatePlot(plot.plotId, { size: parseInt(e.target.value) || 0 })}
                                                                />
                                                                <Select
                                                                    value={plot.facing || 'East'}
                                                                    onValueChange={v => updatePlot(plot.plotId, { facing: v })}
                                                                >
                                                                    <SelectTrigger className="h-8">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="East">East</SelectItem>
                                                                        <SelectItem value="West">West</SelectItem>
                                                                        <SelectItem value="North">North</SelectItem>
                                                                        <SelectItem value="South">South</SelectItem>
                                                                        <SelectItem value="North-East">NE</SelectItem>
                                                                        <SelectItem value="South-East">SE</SelectItem>
                                                                        <SelectItem value="North-West">NW</SelectItem>
                                                                        <SelectItem value="South-West">SW</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <Select
                                                                    value={plot.status}
                                                                    onValueChange={v => updatePlot(plot.plotId, { status: v as 'available' | 'booked' | 'sold' })}
                                                                >
                                                                    <SelectTrigger className="h-8">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="available">Available</SelectItem>
                                                                        <SelectItem value="booked">Booked</SelectItem>
                                                                        <SelectItem value="sold">Sold</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        ))}
                                                </div>

                                                <p className="text-xs text-muted-foreground text-center mt-2">
                                                    Showing plots {plotPage * PLOTS_PER_PAGE + 1} - {Math.min((plotPage + 1) * PLOTS_PER_PAGE, formData.plots.length)} of {formData.plots.length}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                                <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                <p>No plots generated yet</p>
                                                <p className="text-sm">Set total count, numbering pattern, and size, then click "Generate Plots"</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}


                            {formData.property !== 'plots' && (
                                <Card>
                                    <CardHeader className="pb-1">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Layers className="h-5 w-5" />
                                                    Blocks / Towers
                                                </CardTitle>
                                                <CardDescription>Add blocks with floors and units</CardDescription>
                                            </div>
                                            <Button type="button" onClick={addBlock} variant="outline" size="sm">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Block
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {formData.blocks.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                                <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                <p>No blocks added yet</p>
                                                <p className="text-sm">Click "Add Block" to get started</p>
                                            </div>
                                        ) : (
                                            <ScrollArea className="h-[74vh] pr-4">
                                                <Accordion type="multiple" value={expandedBlocks} onValueChange={setExpandedBlocks}>
                                                    {formData.blocks.map((block) => (
                                                        <AccordionItem key={block.blockId} value={block.blockId} className="border-2 active:border-primary focus:border-primary rounded-lg mb-3 px-4">
                                                            <AccordionTrigger className="hover:no-underline">
                                                                <div className="flex items-center gap-3">
                                                                    <Building2 className="h-5 w-5 text-primary" />
                                                                    <span className="font-medium">{block.blockName}</span>
                                                                    <span className="text-sm text-muted-foreground">
                                                                        ({block.totalFloors} floors, {block.floors.reduce((acc, f) => acc + f.units.length, 0)} units)
                                                                    </span>
                                                                </div>
                                                            </AccordionTrigger>
                                                            <AccordionContent className="pt-4">
                                                                <div className="space-y-4">
                                                                    {/* Block Configuration */}
                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                        <div className="space-y-2">
                                                                            <Label>Block Name</Label>
                                                                            <Input
                                                                                value={block.blockName}
                                                                                onChange={e => updateBlock(block.blockId, 'blockName', e.target.value)}
                                                                                placeholder="e.g., Block A, Tower 1"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2 col-span-2">
                                                                            <Label>Floor Plan Images (Max 5)</Label>
                                                                            <div className="flex gap-2">
                                                                                <Input
                                                                                    type="file"
                                                                                    accept="image/*"
                                                                                    multiple
                                                                                    onChange={e => handleImageUpload(block.blockId, e.target.files)}
                                                                                    className="flex-1"
                                                                                />
                                                                            </div>
                                                                            {block.floorPlanImages.length > 0 && (
                                                                                <ScrollArea className="h-20 mt-2">
                                                                                    <div className="flex gap-2">
                                                                                        {block.floorPlanImages.map((url, idx) => (
                                                                                            <div key={idx} className="relative group">
                                                                                                <img
                                                                                                    src={url}
                                                                                                    alt={`Floor plan ${idx + 1}`}
                                                                                                    className="h-16 w-16 object-cover rounded border"
                                                                                                />
                                                                                                <Button
                                                                                                    type="button"
                                                                                                    onClick={() => removeFloorPlanImage(block.blockId, url)}
                                                                                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                                >
                                                                                                    <X className="h-3 w-3" />
                                                                                                </Button>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </ScrollArea>
                                                                            )}
                                                                            <p className="text-xs text-muted-foreground">{block.floorPlanImages.length}/5 images</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex justify-end mt-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant="destructive"
                                                                            size="sm"
                                                                            onClick={() => removeBlock(block.blockId)}
                                                                        >
                                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                                            Remove Block
                                                                        </Button>
                                                                    </div>

                                                                    <Separator />

                                                                    {/* Floor Generation */}
                                                                    <div className="bg-muted/80 p-4 rounded-lg">
                                                                        <h4 className="font-medium mb-3 flex items-center gap-2">
                                                                            <DoorOpen className="h-4 w-4" />
                                                                            Generate Floors & Units
                                                                        </h4>

                                                                        {/* Basic Settings */}
                                                                        <div className="grid grid-cols-3 gap-3 mb-4">
                                                                            <div className="space-y-1">
                                                                                <Label className="text-xs">Number of Floors</Label>
                                                                                <Input
                                                                                    type="number"
                                                                                    className='bg-background dark:bg-background'
                                                                                    min="1"
                                                                                    max="100"
                                                                                    value={getBlockConfig(block.blockId).floors}
                                                                                    onChange={e => updateBlockConfig(block.blockId, { floors: parseInt(e.target.value) || 10 })}
                                                                                />
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <Label className="text-xs">Numbering</Label>
                                                                                <Select
                                                                                    value={getBlockConfig(block.blockId).pattern}
                                                                                    onValueChange={v => updateBlockConfig(block.blockId, { pattern: v })}
                                                                                >
                                                                                    <SelectTrigger className='bg-background dark:bg-background w-full'>
                                                                                        <SelectValue />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="numeric">101, 102...</SelectItem>
                                                                                        <SelectItem value="alpha">1A, 1B...</SelectItem>
                                                                                        <SelectItem value="dash">1-1, 1-2...</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>
                                                                            <div className="flex items-end">
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="default"
                                                                                    className="w-full mb-1"
                                                                                    onClick={() => generateFloors(block.blockId)}
                                                                                >
                                                                                    Generate Floors
                                                                                </Button>
                                                                            </div>
                                                                        </div>

                                                                        {/* Unit Types */}
                                                                        <div className="border rounded-lg p-3 bg-background">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <Label className="text-xs font-medium">Unit Types (per floor)</Label>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    onClick={() => addUnitType(block.blockId)}
                                                                                >
                                                                                    <Plus className="h-3 w-3 mr-1" />
                                                                                    Add Type
                                                                                </Button>
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                {getBlockConfig(block.blockId).unitTypes.map((unitType, idx) => (
                                                                                    <div key={idx} className="grid grid-cols-6 gap-2 items-center bg-muted/50 p-2 rounded">
                                                                                        <div className="text-xs font-medium text-center">{unitType.name}</div>
                                                                                        <Select
                                                                                            value={String(unitType.bhk)}
                                                                                            onValueChange={v => updateUnitType(block.blockId, idx, { bhk: parseInt(v) })}
                                                                                        >
                                                                                            <SelectTrigger className="h-8 text-xs">
                                                                                                <SelectValue />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                {[1, 2, 3, 4, 5].map(n => (
                                                                                                    <SelectItem key={n} value={String(n)}>{n} BHK</SelectItem>
                                                                                                ))}
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                        <Select
                                                                                            value={String(unitType.bathrooms)}
                                                                                            onValueChange={v => updateUnitType(block.blockId, idx, { bathrooms: parseInt(v) })}
                                                                                        >
                                                                                            <SelectTrigger className="h-8 text-xs">
                                                                                                <SelectValue />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                {[1, 2, 3, 4].map(n => (
                                                                                                    <SelectItem key={n} value={String(n)}>{n} Bath</SelectItem>
                                                                                                ))}
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                        <Input
                                                                                            type="number"
                                                                                            className="h-8 text-xs"
                                                                                            placeholder="sqft"
                                                                                            value={unitType.size}
                                                                                            onChange={e => updateUnitType(block.blockId, idx, { size: parseInt(e.target.value) || 1000 })}
                                                                                        />
                                                                                        <Input
                                                                                            type="number"
                                                                                            className="h-8 text-xs"
                                                                                            placeholder="Count"
                                                                                            min="1"
                                                                                            value={unitType.count}
                                                                                            onChange={e => updateUnitType(block.blockId, idx, { count: parseInt(e.target.value) || 1 })}
                                                                                        />
                                                                                        {getBlockConfig(block.blockId).unitTypes.length > 1 && (
                                                                                            <Button
                                                                                                type="button"
                                                                                                variant="ghost"
                                                                                                size="icon"
                                                                                                className="h-8 w-8"
                                                                                                onClick={() => removeUnitType(block.blockId, idx)}
                                                                                            >
                                                                                                <X className="h-3 w-3" />
                                                                                            </Button>
                                                                                        )}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                            <div className="mt-2 text-xs text-muted-foreground text-right">
                                                                                Total: {getBlockConfig(block.blockId).unitTypes.reduce((s, t) => s + t.count, 0)} units/floor
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Floor Preview - Clickable */}
                                                                    {block.floors.length > 0 && (
                                                                        <div className="mt-4">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <h4 className="font-medium">Floors ({block.floors.length}) - Click to edit</h4>
                                                                                <span className="text-xs text-muted-foreground">Each floor can have different units</span>
                                                                            </div>
                                                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[250px] overflow-auto p-1">
                                                                                {block.floors.map(floor => {
                                                                                    // Summarize units by BHK
                                                                                    const bhkSummary = floor.units.reduce((acc, u) => {
                                                                                        acc[u.bhk] = (acc[u.bhk] || 0) + 1
                                                                                        return acc
                                                                                    }, {} as Record<number, number>)
                                                                                    const summaryText = Object.entries(bhkSummary)
                                                                                        .map(([bhk, count]) => `${count}×${bhk}BHK`)
                                                                                        .join(', ')

                                                                                    return (
                                                                                        <div
                                                                                            key={floor.floorNumber}
                                                                                            className="border rounded p-2 text-center text-sm cursor-pointer hover:bg-accent hover:border-primary transition-colors"
                                                                                            onClick={() => openFloorEditor(block.blockId, floor.floorNumber)}
                                                                                        >
                                                                                            <div className="font-medium flex items-center justify-center gap-1">
                                                                                                {floor.floorName}
                                                                                                <Edit2 className="h-3 w-3 opacity-50" />
                                                                                            </div>
                                                                                            <div className="text-muted-foreground text-xs">{floor.units.length} units</div>
                                                                                            <div className="text-xs text-primary mt-1 truncate" title={summaryText}>
                                                                                                {summaryText || 'No units'}
                                                                                            </div>
                                                                                        </div>
                                                                                    )
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    ))}
                                                </Accordion>
                                            </ScrollArea>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <div className="grid col-span-1">
                            <Card className="h-fit mb-4">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        Project Details
                                    </CardTitle>
                                    <CardDescription>Basic information about the project</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Project Name *</Label>
                                            <Input
                                                id="name"
                                                placeholder="Enter project name"
                                                value={formData.name}
                                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="property">Property Type</Label>
                                            <Select value={formData.property} onValueChange={v => setFormData(prev => ({ ...prev, property: v }))}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="apartments">Apartments</SelectItem>
                                                    <SelectItem value="villas">Villas</SelectItem>
                                                    <SelectItem value="plots">Plots</SelectItem>
                                                    <SelectItem value="commercial">Commercial</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="location">Location</Label>
                                            <Input
                                                id="location"
                                                placeholder="Enter project location"
                                                value={formData.location}
                                                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Project Logo</Label>
                                            {formData.img_location.logo ? (
                                                <div className="relative w-20 h-20 border rounded-lg overflow-hidden group">
                                                    <img
                                                        src={formData.img_location.logo}
                                                        alt="Project Logo"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({
                                                            ...prev,
                                                            img_location: { ...prev.img_location, logo: '' }
                                                        }))}
                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        const files = e.target.files
                                                        if (!files || files.length === 0) return
                                                        const formDataUpload = new FormData()
                                                        formDataUpload.append('images', files[0])
                                                        try {
                                                            const response = await axios.post(API.UPLOAD.FLOOR_PLANS, formDataUpload, {
                                                                headers: { 'Content-Type': 'multipart/form-data' }
                                                            })
                                                            const url = response.data.data.urls[0]
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                img_location: { ...prev.img_location, logo: url }
                                                            }))
                                                            toast.success('Logo uploaded successfully')
                                                        } catch (error: any) {
                                                            console.error('Failed to upload logo:', error)
                                                            toast.error(error.response?.data?.message || 'Failed to upload logo')
                                                        }
                                                        e.target.value = ''
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end gap-3">
                                    <Button type="button" variant="outline" onClick={() => setFormData(initialFormData)}>
                                        Reset
                                    </Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? 'Creating Project...' : 'Create Project'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>

                    </div>

                    {/* Submit Button */}

                </form>
            </div>

            {/* Floor Editor Modal */}
            <Dialog open={floorEditorOpen} onOpenChange={setFloorEditorOpen}>
                <DialogContent className="min-w-4xl">
                    <DialogHeader>
                        <DialogTitle>
                            Edit Floor {editingFloor?.floorNumber} - {getFloorName(editingFloor?.floorNumber || 0)}
                        </DialogTitle>
                    </DialogHeader>

                    {editingFloor && (() => {
                        const block = formData.blocks.find(b => b.blockId === editingFloor.blockId)
                        const floor = block?.floors.find(f => f.floorNumber === editingFloor.floorNumber)
                        if (!block || !floor) return null

                        // Extract unit types from current floor
                        const unitTypesMap = new Map<string, UnitTypeConfig>()
                        floor.units.forEach(unit => {
                            const key = `${unit.bhk}-${unit.bathrooms}-${unit.size}`
                            if (!unitTypesMap.has(key)) {
                                unitTypesMap.set(key, {
                                    name: unit.unitType || `${unit.bhk}BHK`,
                                    bhk: unit.bhk,
                                    bathrooms: unit.bathrooms,
                                    size: unit.size,
                                    count: 0
                                })
                            }
                            unitTypesMap.get(key)!.count++
                        })
                        const currentUnitTypes = Array.from(unitTypesMap.values())

                        return (
                            <div className="space-y-4 max-h-[50vh] overflow-auto">
                                <div className="text-sm text-muted-foreground">
                                    Current: {floor.units.length} units - {currentUnitTypes.map(t => `${t.count}×${t.bhk}BHK`).join(', ')}
                                </div>

                                {/* Individual Units Editor */}
                                <div className="border rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-sm font-medium">Individual Units (Door Numbers)</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addUnitToFloor(editingFloor.blockId, editingFloor.floorNumber)}
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add Unit
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground mb-1 px-2">
                                        <div>Door No.</div>
                                        <div>BHK</div>
                                        <div>Bathrooms</div>
                                        <div>Size (sqft)</div>
                                        <div>Facing</div>
                                        <div></div>
                                    </div>
                                    <div className="space-y-1 max-h-[200px] overflow-auto">
                                        {floor.units.map((unit) => (
                                            <div key={unit.unitId} className="grid grid-cols-6 gap-2 items-center bg-muted/20 p-2 rounded">
                                                <Input
                                                    className="h-8 text-xs font-medium"
                                                    value={unit.unitNumber}
                                                    onChange={e => {
                                                        const newNumber = e.target.value
                                                        updateSingleUnit(editingFloor.blockId, editingFloor.floorNumber, unit.unitId, {
                                                            unitNumber: newNumber,
                                                            unitId: newNumber
                                                        })
                                                    }}
                                                    placeholder="e.g. 1A"
                                                />
                                                <Select
                                                    value={String(unit.bhk)}
                                                    onValueChange={v => updateSingleUnit(editingFloor.blockId, editingFloor.floorNumber, unit.unitId, { bhk: parseInt(v) })}
                                                >
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[1, 2, 3, 4, 5].map(n => (
                                                            <SelectItem key={n} value={String(n)}>{n} BHK</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Select
                                                    value={String(unit.bathrooms)}
                                                    onValueChange={v => updateSingleUnit(editingFloor.blockId, editingFloor.floorNumber, unit.unitId, { bathrooms: parseInt(v) })}
                                                >
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[1, 2, 3, 4].map(n => (
                                                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    type="number"
                                                    className="h-8 text-xs"
                                                    value={unit.size}
                                                    onChange={e => updateSingleUnit(editingFloor.blockId, editingFloor.floorNumber, unit.unitId, { size: parseInt(e.target.value) || 1000 })}
                                                />
                                                <Select
                                                    value={unit.facing}
                                                    onValueChange={v => updateSingleUnit(editingFloor.blockId, editingFloor.floorNumber, unit.unitId, { facing: v })}
                                                >
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="East">East</SelectItem>
                                                        <SelectItem value="West">West</SelectItem>
                                                        <SelectItem value="North">North</SelectItem>
                                                        <SelectItem value="South">South</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => removeUnitFromFloor(editingFloor.blockId, editingFloor.floorNumber, unit.unitId)}
                                                    disabled={floor.units.length <= 1}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Done Button & Auto-save notice */}
                                <div className="flex items-center justify-between border-t pt-4">
                                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                        ✓ Changes are saved automatically
                                    </span>
                                    <Button onClick={() => setFloorEditorOpen(false)}>
                                        Done
                                    </Button>
                                </div>

                                {/* Copy to Other Floors - Collapsible */}
                                <details className="border rounded-lg p-3">
                                    <summary className="cursor-pointer text-sm font-medium">Copy this floor's units to other floors</summary>
                                    <div className="mt-3 space-y-2">
                                        <div className="flex flex-wrap gap-1 max-h-[100px] overflow-auto">
                                            {block.floors
                                                .filter(f => f.floorNumber !== editingFloor.floorNumber)
                                                .map(f => (
                                                    <label
                                                        key={f.floorNumber}
                                                        className={`px-2 py-1 border rounded text-xs cursor-pointer transition-colors ${copyToFloors.includes(f.floorNumber)
                                                            ? 'bg-primary text-primary-foreground border-primary'
                                                            : 'hover:bg-accent'
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={copyToFloors.includes(f.floorNumber)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setCopyToFloors([...copyToFloors, f.floorNumber])
                                                                } else {
                                                                    setCopyToFloors(copyToFloors.filter(n => n !== f.floorNumber))
                                                                }
                                                            }}
                                                        />
                                                        Floor {f.floorNumber}
                                                    </label>
                                                ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCopyToFloors(block.floors.filter(f => f.floorNumber !== editingFloor.floorNumber).map(f => f.floorNumber))}
                                            >
                                                Select All
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCopyToFloors([])}
                                            >
                                                Clear
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                disabled={copyToFloors.length === 0}
                                                onClick={() => copyFloorToOthers(editingFloor.blockId, editingFloor.floorNumber, copyToFloors)}
                                            >
                                                <Copy className="h-3 w-3 mr-1" />
                                                Copy to {copyToFloors.length} Floors
                                            </Button>
                                        </div>
                                    </div>
                                </details>
                            </div>
                        )
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    )
}
