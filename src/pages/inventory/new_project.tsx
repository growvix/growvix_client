import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { API } from '@/config/api'
import { toast } from 'sonner'
import { useBreadcrumb } from "@/context/breadcrumb-context"
import LoaderScreen from '@/components/ui/loader-screen'
import { useNavigate } from 'react-router-dom'
import { compressImage, compressImages } from '@/utils/imageCompression'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus, Building2, Layers, DoorOpen, X, Copy, Edit2, ImagePlus, ChevronLeft, ChevronRight } from 'lucide-react'
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
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from '@/components/ui/drawer'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

// Helper function to get cookie value
const getCookie = (name: string): string => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || ''
    return ''
}

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
    unitPlanImages?: string[]
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
    floorChartImages?: string[]
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
    const navigate = useNavigate()
    const [expandedBlocks, setExpandedBlocks] = useState<string[]>([])
    const [blockConfigs, setBlockConfigs] = useState<Record<string, BlockConfig>>({})
    const { setBreadcrumbs } = useBreadcrumb()

    // Floor editor modal state
    const [floorEditorOpen, setFloorEditorOpen] = useState(false)
    const [editingFloor, setEditingFloor] = useState<{ blockId: string; floorNumber: number } | null>(null)
    const [copyToFloors, setCopyToFloors] = useState<number[]>([])
    const [floorImageUploading, setFloorImageUploading] = useState(false)
    const [unitImageUploading, setUnitImageUploading] = useState<string | null>(null) // Stores unitId being uploaded
    const floorImageInputRef = useRef<HTMLInputElement>(null)
    const [lightboxImageIndex, setLightboxImageIndex] = useState<number | null>(null)

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
            { label: "New Project" }
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
                            units: generateUnitsFromTypes(f.floorNumber, unitTypes, config.pattern),
                            floorChartImages: sourceFloor.floorChartImages ? [...sourceFloor.floorChartImages] : []
                        }
                    })
                }
            })
        }))
        toast.success(`Copied to ${targetFloorNums.length} floors`)
        setFloorEditorOpen(false)
    }

    // Handle floor chart image upload for individual floor (multiple images, max 5)
    const handleFloorChartImageUpload = async (blockId: string, floorNumber: number, files: FileList | null) => {
        if (!files || files.length === 0) return

        const fileArray = Array.from(files)
        // Allow common image formats
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
        const invalidFile = fileArray.find(f => !allowedTypes.includes(f.type))
        if (invalidFile) {
            toast.error('Only PNG, JPG, SVG, and WebP images are allowed')
            return
        }

        // Check max 5 images limit
        const block = formData.blocks.find(b => b.blockId === blockId)
        const floor = block?.floors.find(f => f.floorNumber === floorNumber)
        const currentCount = floor?.floorChartImages?.length || 0
        if (currentCount + fileArray.length > 5) {
            toast.error(`Maximum 5 images allowed. You can add ${5 - currentCount} more.`)
            return
        }

        setFloorImageUploading(true)
        const compressedFiles = await compressImages(fileArray, { quality: 0.7, maxWidth: 1920 })
        const formDataUpload = new FormData()
        compressedFiles.forEach(file => formDataUpload.append('images', file))

        try {
            const response = await axios.post(API.UPLOAD.FLOOR_PLANS, formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            const newUrls = response.data.data.urls
            setFormData(prev => ({
                ...prev,
                blocks: prev.blocks.map(b => {
                    if (b.blockId !== blockId) return b
                    return {
                        ...b,
                        floors: b.floors.map(f => {
                            if (f.floorNumber !== floorNumber) return f
                            return { ...f, floorChartImages: [...(f.floorChartImages || []), ...newUrls].slice(0, 5) }
                        })
                    }
                })
            }))
            toast.success(`${newUrls.length} image(s) uploaded successfully`)
        } catch (error: any) {
            console.error('Failed to upload floor chart image:', error)
            toast.error(error.response?.data?.message || 'Failed to upload floor chart image')
        } finally {
            setFloorImageUploading(false)
        }
    }

    // Remove a single floor chart image by URL
    const removeFloorChartImage = (blockId: string, floorNumber: number, imageUrl: string) => {
        setFormData(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => {
                if (b.blockId !== blockId) return b
                return {
                    ...b,
                    floors: b.floors.map(f => {
                        if (f.floorNumber !== floorNumber) return f
                        return { ...f, floorChartImages: (f.floorChartImages || []).filter(url => url !== imageUrl) }
                    })
                }
            })
        }))
        toast.success('Image removed')
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

    // Handle unit plan image upload (multiple images, max 5)
    const handleUnitImageUpload = async (blockId: string, floorNumber: number, unitId: string, files: FileList | null) => {
        if (!files || files.length === 0) return

        const fileArray = Array.from(files)
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
        const invalidFile = fileArray.find(f => !allowedTypes.includes(f.type))
        if (invalidFile) {
            toast.error('Only PNG, JPG, SVG, and WebP images are allowed')
            return
        }

        const block = formData.blocks.find(b => b.blockId === blockId)
        const floor = block?.floors.find(f => f.floorNumber === floorNumber)
        const unit = floor?.units.find(u => u.unitId === unitId)
        const currentCount = unit?.unitPlanImages?.length || 0

        if (currentCount + fileArray.length > 5) {
            toast.error(`Maximum 5 images allowed for each unit. You can add ${5 - currentCount} more.`)
            return
        }

        setUnitImageUploading(unitId)
        const compressedFiles = await compressImages(fileArray, { quality: 0.7, maxWidth: 1600 })
        const formDataUpload = new FormData()
        compressedFiles.forEach(file => formDataUpload.append('images', file))

        try {
            const response = await axios.post(API.UPLOAD.FLOOR_PLANS, formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            const newUrls = response.data.data.urls
            updateSingleUnit(blockId, floorNumber, unitId, {
                unitPlanImages: [...(unit?.unitPlanImages || []), ...newUrls].slice(0, 5)
            })
            toast.success(`${newUrls.length} unit image(s) uploaded successfully`)
        } catch (error: any) {
            console.error('Failed to upload unit images:', error)
            toast.error(error.response?.data?.message || 'Failed to upload unit images')
        } finally {
            setUnitImageUploading(null)
        }
    }

    // Remove a single unit image by URL
    const removeUnitImage = (blockId: string, floorNumber: number, unitId: string, imageUrl: string) => {
        const block = formData.blocks.find(b => b.blockId === blockId)
        const floor = block?.floors.find(f => f.floorNumber === floorNumber)
        const unit = floor?.units.find(u => u.unitId === unitId)
        if (!unit) return

        updateSingleUnit(blockId, floorNumber, unitId, {
            unitPlanImages: (unit.unitPlanImages || []).filter(url => url !== imageUrl)
        })
        toast.success('Unit image removed')
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

        const fileArray = Array.from(files)

        // Allow common image formats
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
        const invalidFile = fileArray.find(
            file => !allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith(".svg")
        )

        if (invalidFile) {
            toast.error("Only image files are allowed (JPEG, PNG, GIF, WebP, SVG)")
            return
        }

        // Check max 5 images limit
        const block = formData.blocks.find(b => b.blockId === blockId)
        const currentCount = block?.floorPlanImages?.length || 0
        if (currentCount + fileArray.length > 5) {
            toast.error('Maximum 5 images allowed per block')
            return
        }

        const compressedFiles = await compressImages(fileArray, { quality: 0.7, maxWidth: 1920 })
        const formDataUpload = new FormData()
        compressedFiles.forEach(file => {
            formDataUpload.append('images', file)
        })

        try {
            const response = await axios.post(API.UPLOAD.FLOOR_PLANS, formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            const newUrls = response.data.data.urls
            updateBlock(
                blockId,
                'floorPlanImages',
                [...(block?.floorPlanImages || []), ...newUrls].slice(0, 5)
            )

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

        const compressedFiles = await compressImages(Array.from(files), { quality: 0.7, maxWidth: 1920 })
        const formDataUpload = new FormData()
        compressedFiles.forEach(file => {
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

    // Handle project asset upload (logo, brochure)
    const handleProjectAssetUpload = async (type: 'logo' | 'brochure', file: File) => {
        // Frontend validation
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

        if (type === 'logo') {
            if (!allowedImageTypes.includes(file.type)) {
                toast.error('Only image files are allowed for the logo (JPEG, PNG, GIF, WebP)')
                return
            }
        } else if (type === 'brochure') {
            if (!allowedImageTypes.includes(file.type) && !allowedDocTypes.includes(file.type)) {
                toast.error('Only identity documents (PDF/DOC) and images are allowed for the brochure')
                return
            }
        }

        const compressedFile = await compressImage(file, { quality: 0.8, maxWidth: 1200 })
        const formDataUpload = new FormData()
        formDataUpload.append('images', compressedFile)

        try {
            const response = await axios.post(API.UPLOAD.FLOOR_PLANS, formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            const newUrl = response.data.data.urls[0]
            setFormData(prev => ({
                ...prev,
                img_location: {
                    ...prev.img_location,
                    [type]: newUrl
                }
            }))
            toast.success(`${type} uploaded successfully`)
        } catch (error: any) {
            console.error(`Failed to upload ${type}:`, error)
            toast.error(error.response?.data?.message || `Failed to upload ${type}`)
        }
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
            navigate('/project_listing')
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
                                                    className="bg-background"
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
                                                    className="bg-background"
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
                                <Card className="mb-4">
                                    <CardHeader className="pb-3">
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
                                            <ScrollArea className="h-[70vh] pr-4">
                                                <Accordion type="multiple" value={expandedBlocks} onValueChange={setExpandedBlocks}>
                                                    {formData.blocks.map((block) => (
                                                        <AccordionItem key={block.blockId} value={block.blockId} className="border rounded-lg mb-3 px-4">
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
                                                                                className=" text-xs bg-background dark:bg-[#09090b]"
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
                                                                                    className="flex-1  text-xs bg-background dark:bg-[#09090b]"
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
                                                                                    className='bg-background/100 dark:bg-background/100'
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
                                                                                    <SelectTrigger className='bg-background/100 dark:bg-background/100 w-full'>
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
                                                                                            className="h-8 text-xs bg-background dark:bg-[#09090b]"
                                                                                            placeholder="sqft"
                                                                                            value={unitType.size}
                                                                                            onChange={e => updateUnitType(block.blockId, idx, { size: parseInt(e.target.value) || 1000 })}
                                                                                        />
                                                                                        <Input
                                                                                            type="number"
                                                                                            className="h-8 text-xs bg-background dark:bg-[#09090b]"
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
                                                className="bg-background dark:bg-[#09090b]"
                                                placeholder="Enter project name"
                                                value={formData.name}
                                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="property">Property Type</Label>
                                            <Select value={formData.property} onValueChange={v => setFormData(prev => ({ ...prev, property: v }))}>
                                                <SelectTrigger className="w-full dark:bg-[#09090b]">
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
                                                className="bg-background dark:bg-[#09090b]"
                                                placeholder="Enter project location"
                                                value={formData.location}
                                                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="logo">Project Logo</Label>
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    id="logo"
                                                    type="file"
                                                    accept="image/*"
                                                    className="bg-background dark:bg-[#09090b]"
                                                    onChange={e => {
                                                        const file = e.target.files?.[0]
                                                        if (file) handleProjectAssetUpload('logo', file)
                                                        e.target.value = ''
                                                    }}
                                                />
                                                {formData.img_location?.logo && (
                                                    <div className="relative group shrink-0">
                                                        <img src={formData.img_location.logo} alt="Logo preview" className="h-10 w-10 object-contain border rounded" />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => setFormData(prev => ({ ...prev, img_location: { ...prev.img_location, logo: '' } }))}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="brochure">Project Brochure (PDF/DOC)</Label>
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    id="brochure"
                                                    type="file"
                                                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                    className="bg-background dark:bg-[#09090b]"
                                                    onChange={e => {
                                                        const file = e.target.files?.[0]
                                                        if (file) handleProjectAssetUpload('brochure', file)
                                                        e.target.value = ''
                                                    }}
                                                />
                                                {formData.img_location?.brochure && (
                                                    <div className="relative group shrink-0">
                                                        <a href={formData.img_location.brochure} target="_blank" rel="noreferrer" className="text-xs text-primary underline truncate max-w-[100px] block">View PDF</a>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            className="absolute -top-1 -right-4 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => setFormData(prev => ({ ...prev, img_location: { ...prev.img_location, brochure: '' } }))}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
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

            {/* Floor Editor Drawer */}
            <Drawer open={floorEditorOpen} onOpenChange={setFloorEditorOpen}>
                <DrawerContent className="max-h-[85vh]">
                    <DrawerHeader className="border-b pb-4">
                        <DrawerTitle className="flex items-center gap-2">
                            <DoorOpen className="h-5 w-5 text-primary" />
                            Edit {getFloorName(editingFloor?.floorNumber || 0)}
                        </DrawerTitle>
                        <DrawerDescription>
                            Customize units, upload floor chart, and copy settings to other floors
                        </DrawerDescription>
                    </DrawerHeader>

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
                            <div className="overflow-y-auto px-4 pb-4">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">

                                    {/* Left Column: Floor Chart Images Upload/Preview */}
                                    <div className="lg:col-span-1 space-y-4">
                                        <div className="border rounded-lg p-4 bg-muted/20">
                                            <div className="flex items-center justify-between mb-3">
                                                <Label className="text-sm font-semibold flex items-center gap-2">
                                                    <ImagePlus className="h-4 w-4 text-primary" />
                                                    Floor Chart Images
                                                </Label>
                                                <span className="text-xs text-muted-foreground">{(floor.floorChartImages || []).length}/5</span>
                                            </div>

                                            {/* Image Grid Preview */}
                                            {(floor.floorChartImages || []).length > 0 && (
                                                <div className="grid grid-cols-2 gap-2 mb-3">
                                                    {(floor.floorChartImages || []).map((url, idx) => (
                                                        <div key={idx} className="relative group rounded-lg overflow-hidden border bg-white dark:bg-zinc-900 cursor-pointer" onClick={() => setLightboxImageIndex(idx)}>
                                                            <img
                                                                src={url}
                                                                alt={`${floor.floorName} chart ${idx + 1}`}
                                                                className="w-full h-24 object-cover"
                                                            />
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="destructive"
                                                                className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                                onClick={(e) => { e.stopPropagation(); removeFloorChartImage(editingFloor.blockId, editingFloor.floorNumber, url) }}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Upload Area - show when under 5 images */}
                                            {(floor.floorChartImages || []).length < 5 && (
                                                <div
                                                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
                                                    onClick={() => floorImageInputRef.current?.click()}
                                                >
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                            <ImagePlus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                {(floor.floorChartImages || []).length === 0 ? 'Upload Floor Chart Images' : 'Add More Images'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, SVG, or WebP (max 5)</p>
                                                        </div>
                                                        {floorImageUploading && (
                                                            <div className="flex items-center gap-2 text-xs text-primary">
                                                                <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                                Uploading...
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Hidden file input */}
                                            <input
                                                ref={floorImageInputRef}
                                                type="file"
                                                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                                                multiple
                                                className="hidden"
                                                onChange={(e) => {
                                                    handleFloorChartImageUpload(editingFloor.blockId, editingFloor.floorNumber, e.target.files)
                                                    e.target.value = ''
                                                }}
                                            />
                                        </div>

                                        {/* Floor Summary Card */}
                                        <div className="border rounded-lg p-4 bg-gradient-to-br from-primary/5 to-primary/10">
                                            <h5 className="text-sm font-semibold mb-2">Floor Summary</h5>
                                            <div className="space-y-1.5 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Total Units</span>
                                                    <span className="font-medium">{floor.units.length}</span>
                                                </div>
                                                <Separator />
                                                {currentUnitTypes.map((t, i) => (
                                                    <div key={i} className="flex justify-between">
                                                        <span className="text-muted-foreground">{t.name} ({t.bhk}BHK)</span>
                                                        <span className="font-medium">{t.count} units</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Units Editor + Copy */}
                                    <div className="lg:col-span-2 space-y-4">
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
                                            <div className="grid grid-cols-7 gap-2 text-xs font-medium text-muted-foreground mb-1 px-2">
                                                <div>Door No.</div>
                                                <div>BHK</div>
                                                <div>Bathrooms</div>
                                                <div>Size (sqft)</div>
                                                <div>Facing</div>
                                                <div className="text-center">Plan Images</div>
                                                <div></div>
                                            </div>
                                            <div className="space-y-1 max-h-[250px] overflow-auto">
                                                {floor.units.map((unit) => (
                                                    <div key={unit.unitId} className="grid grid-cols-7 gap-2 items-center bg-muted/20 p-2 rounded">
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
                                                                {[1, 2, 3, 4, 5, 6].map(n => (
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
                                                                {[1, 2, 3, 4, 5].map(n => (
                                                                    <SelectItem key={n} value={String(n)}>{n} Bath</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <Input
                                                            type="number"
                                                            className="h-8 text-xs"
                                                            value={unit.size}
                                                            onChange={e => updateSingleUnit(editingFloor.blockId, editingFloor.floorNumber, unit.unitId, { size: parseInt(e.target.value) || 0 })}
                                                        />
                                                        <Select
                                                            value={unit.facing}
                                                            onValueChange={v => updateSingleUnit(editingFloor.blockId, editingFloor.floorNumber, unit.unitId, { facing: v })}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {['East', 'West', 'North', 'South', 'North-East', 'South-East', 'North-West', 'South-West'].map(d => (
                                                                    <SelectItem key={d} value={d}>
                                                                        {d.length > 5 ? d.split('-').map(s => s[0]).join('') : d}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>

                                                        {/* Unit Plan Images Column */}
                                                        <div className="flex justify-center">
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="icon"
                                                                        className="h-8 w-8 relative group"
                                                                        title="Manage Floor Plan Images"
                                                                    >
                                                                        <ImagePlus className="h-4 w-4" />
                                                                        {unit.unitPlanImages && unit.unitPlanImages.length > 0 && (
                                                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold border-2 border-background">
                                                                                {unit.unitPlanImages.length}
                                                                            </span>
                                                                        )}
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-80 p-4" side="top" align="center">
                                                                    <div className="space-y-4">
                                                                        <div className="flex items-center justify-between">
                                                                            <h4 className="text-sm font-semibold">Unit Floor Plan Images</h4>
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {(unit.unitPlanImages || []).length}/5
                                                                            </span>
                                                                        </div>

                                                                        {/* Previews */}
                                                                        {(unit.unitPlanImages || []).length > 0 && (
                                                                            <div className="grid grid-cols-3 gap-2">
                                                                                {unit.unitPlanImages?.map((url, idx) => (
                                                                                    <div key={idx} className="relative group aspect-square rounded-md overflow-hidden border bg-muted">
                                                                                        <img src={url} alt={`Unit image ${idx + 1}`} className="w-full h-full object-cover" />
                                                                                        <Button
                                                                                            type="button"
                                                                                            size="icon"
                                                                                            variant="destructive"
                                                                                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                            onClick={() => removeUnitImage(editingFloor.blockId, editingFloor.floorNumber, unit.unitId, url)}
                                                                                        >
                                                                                            <X className="h-2 w-2" />
                                                                                        </Button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}

                                                                        {/* Upload Action */}
                                                                        {(unit.unitPlanImages || []).length < 5 && (
                                                                            <div className="relative">
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="outline"
                                                                                    className="w-full h-20 border-dashed flex flex-col gap-1 text-xs"
                                                                                    disabled={unitImageUploading === unit.unitId}
                                                                                    onClick={() => {
                                                                                        const input = document.getElementById(`unit-img-${unit.unitId}`) as HTMLInputElement
                                                                                        if (input) input.click()
                                                                                    }}
                                                                                >
                                                                                    {unitImageUploading === unit.unitId ? (
                                                                                        <>
                                                                                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                                                            <span>Uploading...</span>
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <Plus className="h-4 w-4 text-muted-foreground" />
                                                                                            <span>Add {(unit.unitPlanImages || []).length === 0 ? 'Images' : 'More'}</span>
                                                                                        </>
                                                                                    )}
                                                                                </Button>
                                                                                <input
                                                                                    id={`unit-img-${unit.unitId}`}
                                                                                    type="file"
                                                                                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                                                                                    multiple
                                                                                    className="hidden"
                                                                                    onChange={(e) => {
                                                                                        handleUnitImageUpload(editingFloor.blockId, editingFloor.floorNumber, unit.unitId, e.target.files)
                                                                                        e.target.value = ''
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>

                                                        <div className="flex justify-end pr-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => removeUnitFromFloor(editingFloor.blockId, editingFloor.floorNumber, unit.unitId)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Copy to Other Floors */}
                                        <details className="border rounded-lg p-3">
                                            <summary className="cursor-pointer text-sm font-medium flex items-center gap-2">
                                                <Copy className="h-4 w-4 text-muted-foreground" />
                                                Copy this floor's units to other floors
                                            </summary>
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
                                </div>
                            </div>
                        )
                    })()}

                    <DrawerFooter className="border-t pt-4">
                        <div className="flex items-center justify-between w-full">
                            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                ✓ Changes are saved automatically
                            </span>
                            <DrawerClose asChild>
                                <Button>Done</Button>
                            </DrawerClose>
                        </div>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
            {/* Image Lightbox Overlay (Task 2: Using Dialog for proper portaling to prevent Drawer closing) */}
            <Dialog open={lightboxImageIndex !== null} onOpenChange={(open) => !open && setLightboxImageIndex(null)}>
                <DialogContent
                    className="max-w-none sm:max-w-none w-screen h-screen bg-black/95 border-none p-0 flex flex-col items-center justify-center rounded-none z-[99999] shadow-none outline-none"
                    showCloseButton={false}
                    onKeyDown={(e) => {
                        if (!editingFloor) return;
                        const block = formData.blocks.find(b => b.blockId === editingFloor.blockId);
                        const floor = block?.floors.find(f => f.floorNumber === editingFloor.floorNumber);
                        const images = floor?.floorChartImages || [];
                        if (images.length === 0) return;
                        const currentIndex = lightboxImageIndex ?? 0;
                        if (e.key === 'ArrowLeft' && currentIndex > 0) setLightboxImageIndex(currentIndex - 1);
                        if (e.key === 'ArrowRight' && currentIndex < images.length - 1) setLightboxImageIndex(currentIndex + 1);
                    }}
                >
                    {lightboxImageIndex !== null && editingFloor && (() => {
                        const block = formData.blocks.find(b => b.blockId === editingFloor.blockId);
                        const floor = block?.floors.find(f => f.floorNumber === editingFloor.floorNumber);
                        const images = floor?.floorChartImages || [];
                        if (images.length === 0) return null;
                        const currentIndex = Math.min(lightboxImageIndex, images.length - 1);

                        return (
                            <div className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-8" onClick={() => setLightboxImageIndex(null)}>
                                {/* Close Button */}
                                <button
                                    className="absolute top-6 right-6 z-[100] h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-200 border border-white/10 group"
                                    onClick={(e) => { e.stopPropagation(); setLightboxImageIndex(null); }}
                                >
                                    <X className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                                </button>

                                {/* Previous Arrow (Task 1: Navigation Fixed) */}
                                {currentIndex > 0 && (
                                    <button
                                        className="absolute left-6 top-1/2 -translate-y-1/2 z-[100] h-14 w-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-200 border border-white/10 group shadow-2xl"
                                        onClick={(e) => { e.stopPropagation(); setLightboxImageIndex(currentIndex - 1); }}
                                    >
                                        <ChevronLeft className="h-8 w-8 text-white group-hover:-translate-x-1 transition-transform" />
                                    </button>
                                )}

                                {/* Next Arrow (Task 1: Navigation Fixed) */}
                                {currentIndex < images.length - 1 && (
                                    <button
                                        className="absolute right-6 top-1/2 -translate-y-1/2 z-[100] h-14 w-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-200 border border-white/10 group shadow-2xl"
                                        onClick={(e) => { e.stopPropagation(); setLightboxImageIndex(currentIndex + 1); }}
                                    >
                                        <ChevronRight className="h-8 w-8 text-white group-hover:translate-x-1 transition-transform" />
                                    </button>
                                )}

                                {/* Main Image Container (Task 3: Reduced dimensions for better UI) */}
                                <div className="flex-1 flex items-center justify-center w-full min-h-0" onClick={(e) => e.stopPropagation()}>
                                    <img
                                        src={images[currentIndex]}
                                        alt={`Floor chart ${currentIndex + 1}`}
                                        className="max-w-[75vw] max-h-[60vh] object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 animate-in fade-in zoom-in-95 duration-300"
                                    />
                                </div>

                                {/* Bottom Thumbnails Strip */}
                                {images.length > 1 && (
                                    <div className="flex items-center gap-3 pb-4 pt-8" onClick={(e) => e.stopPropagation()}>
                                        {images.map((url, idx) => (
                                            <button
                                                key={idx}
                                                className={`h-16 w-16 rounded-lg overflow-hidden border-2 transition-all duration-300 ${idx === currentIndex
                                                    ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-110'
                                                    : 'border-white/20 opacity-40 hover:opacity-100 hover:border-white/50'
                                                    }`}
                                                onClick={() => setLightboxImageIndex(idx)}
                                            >
                                                <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    )
}
