import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useLocation } from "react-router-dom"
import axios from "axios"
import { API, API_URL } from "@/config/api"
import { getCookie } from "@/utils/cookies"
import { decodeProjectId } from "@/utils/idEncoder"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import LoaderScreen from "@/components/ui/loader-screen"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, DoorOpen, ImageIcon, X, Maximize2, ChevronLeft, ChevronRight, Layers, Info, User, CalendarClock, CalendarCheck, ExternalLink, Download } from "lucide-react"
import { BookingDialog } from "@/components/booking-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
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
    bookedBy?: {
        leadName: string;
        profileId?: number;
        leadUuid?: string;
        phone?: string;
        userName?: string;
        bookedAt?: string;
    }
}

interface Plot {
    plotId: string
    plotNumber: string
    size: number
    facing: string
    status: 'available' | 'booked' | 'sold'
    bookedBy?: {
        leadName: string;
        profileId?: number;
        leadUuid?: string;
        phone?: string;
        userName?: string;
        bookedAt?: string;
    }
}

interface Floor {
    floorNumber: number
    floorName: string
    floorChartImages?: string[]
    units: Unit[]
}

interface Block {
    blockId: string
    blockName: string
    totalFloors: number
    floorPlanImages: string[]
    floors: Floor[]
}

interface Project {
    product_id: number
    name: string
    property: string
    location: string
    img_location?: {
        logo: string
        banner: string
        brochure: string
        post: string
        videos: string
    }
    blocks: Block[]
    plots?: Plot[]
    layoutImages?: string[]
}

// View mode: what level of image to display
type ViewMode = 'block' | 'floor' | 'unit'

export default function ProjectShowcase() {
    const [searchParams] = useSearchParams()
    const location = useLocation()
    const projectId = searchParams.get('id')
    const urlUnitId = searchParams.get('unitId')
    const urlPlotId = searchParams.get('plotId')

    // Lead context from navigation state (passed from lead detail page)
    const bookingLead = (location.state as any)?.bookingLead || null

    const [loading, setLoading] = useState(true)
    const [project, setProject] = useState<Project | null>(null)
    const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)
    const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null)
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
    const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null)
    const [viewMode, setViewMode] = useState<ViewMode>('block')
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isGalleryOpen, setIsGalleryOpen] = useState(false)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [dragStart, setDragStart] = useState<number | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [brochureConfirmOpen, setBrochureConfirmOpen] = useState(false)

    useEffect(() => {
        setUserRole(getCookie("role"))
    }, [])

    // Booking dialog state
    const [bookingOpen, setBookingOpen] = useState(false)
    const [bookingTarget, setBookingTarget] = useState<{
        unitId?: string
        plotId?: string
        blockId?: string
        label: string
        bookedBy?: Unit['bookedBy']
    } | null>(null)

    // Get current images based on view mode
    const getCurrentImages = useCallback((): string[] => {
        if (project?.property === 'plots') {
            return project.layoutImages || []
        }
        switch (viewMode) {
            case 'unit': {
                const unitImages = selectedUnit?.unitPlanImages || []
                if (unitImages.length > 0) return unitImages
                // Fallback to floor images if no unit images
                return selectedFloor?.floorChartImages || []
            }
            case 'floor':
                return selectedFloor?.floorChartImages || []
            case 'block':
            default:
                return selectedBlock?.floorPlanImages || []
        }
    }, [viewMode, selectedUnit, selectedFloor, selectedBlock, project])

    const galleryImages = getCurrentImages()

    // Keyboard navigation for gallery
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isGalleryOpen) return
            const images = getCurrentImages()
            if (images.length === 0) return

            const imageCount = images.length
            if (e.key === 'ArrowLeft') {
                setCurrentImageIndex(prev => prev === 0 ? imageCount - 1 : prev - 1)
            } else if (e.key === 'ArrowRight') {
                setCurrentImageIndex(prev => prev === imageCount - 1 ? 0 : prev + 1)
            } else if (e.key === 'Escape') {
                setIsGalleryOpen(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isGalleryOpen, getCurrentImages])

    const { setBreadcrumbs } = useBreadcrumb()

    useEffect(() => {
        setBreadcrumbs([
            { label: "Project Listing", href: "/project_listing" },
            { label: project?.name || "Project Showcase" },
            {
                label: (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4.5 w-4.5" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                                <p className="font-medium">Project Details</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            },
        ])
    }, [setBreadcrumbs, project?.name])

    const fetchProject = useCallback(async () => {
        if (!projectId) {
            setLoading(false)
            return
        }

        // Decode the encoded project ID
        const decodedId = decodeProjectId(projectId)
        if (!decodedId) {
            console.error('Invalid project ID')
            setLoading(false)
            return
        }

        const organization = getCookie('organization')
        try {
            const response = await axios.get(API.getProject(decodedId), {
                params: { organization, t: Date.now() }
            })
            const projectData = response.data.data
            // Update selected block/floor/unit/plot from incoming data if already selected
            setProject(projectData)

            if (projectData.property === 'plots') {
                // Keep selected plot updated if one was already selected
                if (urlPlotId) {
                    const matchedPlot = projectData.plots?.find((p: Plot) => p.plotId === urlPlotId)
                    if (matchedPlot) setSelectedPlot(matchedPlot)
                } else if (selectedPlot) {
                    const matchedPlot = projectData.plots?.find((p: Plot) => p.plotId === selectedPlot.plotId)
                    if (matchedPlot) setSelectedPlot(matchedPlot)
                }
            } else {
                // Apartments/Villas - Keep block/floor/unit updated
                if (urlUnitId) {
                    let found = false;
                    for (const block of projectData.blocks || []) {
                        for (const floor of (block.floors || [])) {
                            const matchedUnit = floor.units?.find((u: Unit) => u.unitId === urlUnitId)
                            if (matchedUnit) {
                                setSelectedBlock(block)
                                setSelectedFloor(floor)
                                setSelectedUnit(matchedUnit)
                                setViewMode('unit')
                                found = true;
                                break;
                            }
                        }
                        if (found) break;
                    }
                } else if (selectedBlock) {
                    // Refresh current selection from new data
                    const newBlock = projectData.blocks?.find((b: Block) => b.blockId === selectedBlock.blockId)
                    if (newBlock) {
                        setSelectedBlock(newBlock)
                        if (selectedFloor) {
                            const newFloor = newBlock.floors?.find((f: Floor) => f.floorNumber === selectedFloor.floorNumber)
                            if (newFloor) {
                                setSelectedFloor(newFloor)
                                if (selectedUnit) {
                                    const newUnit = newFloor.units?.find((u: Unit) => u.unitId === selectedUnit.unitId)
                                    if (newUnit) setSelectedUnit(newUnit)
                                }
                            }
                        }
                    }
                } else if (projectData.blocks && projectData.blocks.length > 0) {
                    // Initial load - select first block
                    setSelectedBlock(projectData.blocks[0])
                    if (projectData.blocks[0].floors?.length > 0) {
                        setSelectedFloor(projectData.blocks[0].floors[0])
                    }
                    setViewMode('block')
                }
            }
        } catch (error) {
            console.error('Failed to fetch project:', error)
        } finally {
            setLoading(false)
        }
    }, [projectId, selectedBlock?.blockId, selectedFloor?.floorNumber, selectedUnit?.unitId, selectedPlot?.plotId, urlPlotId, urlUnitId])

    useEffect(() => {
        fetchProject()
    }, [fetchProject])

    // Handle booking dialog open
    const handleOpenBooking = useCallback((target: { unitId?: string; plotId?: string; blockId?: string; label: string, bookedBy?: Unit['bookedBy'] }) => {
        setBookingTarget(target)
        setBookingOpen(true)
    }, [])

    // Refetch project after a booking is completed
    const handleBookingComplete = useCallback(() => {
        fetchProject()
    }, [fetchProject])

    // Handle block click - show block images
    const handleBlockClick = (block: Block) => {
        setSelectedBlock(block)
        setSelectedFloor(null)
        setSelectedUnit(null)
        setViewMode('block')
        setCurrentImageIndex(0)
    }

    // Handle floor click - show floor images and unit numbers
    const handleFloorClick = (floor: Floor) => {
        setSelectedFloor(floor)
        setSelectedUnit(null)
        setViewMode('floor')
        setCurrentImageIndex(0)
    }

    // Handle unit click - show unit images
    const handleUnitClick = (unit: Unit) => {
        setSelectedUnit(unit)
        setViewMode('unit')
        setCurrentImageIndex(0)
    }

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-500/20 text-green-600 border-green-500 hover:bg-green-500/30'
            case 'booked': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500 hover:bg-yellow-500/30'
            case 'sold': return 'bg-red-500/20 text-red-600 border-red-500 hover:bg-red-500/30'
            default: return 'bg-gray-500/20 text-gray-600 border-gray-500'
        }
    }

    // Get middle panel title based on view mode
    const getMiddlePanelTitle = () => {
        if (project?.property === 'plots') return 'Site Layout / Masters'
        switch (viewMode) {
            case 'unit':
                return `${selectedBlock?.blockName || 'Unit'} ${selectedUnit?.unitNumber} - Details`
            case 'floor':
                return `${selectedBlock?.blockName ? `${selectedBlock.blockName} - ` : ''}${selectedFloor?.floorName || `Floor ${selectedFloor?.floorNumber}`} - Units`
            case 'block':
                return `${selectedBlock?.blockName || 'Select Block'} - Block Plan`
            default:
                return 'Select a Block'
        }
    }

    // Get right panel title based on view mode
    const getRightPanelTitle = () => {
        if (project?.property === 'plots') return 'Plot Details'
        if (selectedUnit) {
            return `Unit ${selectedUnit.unitNumber} - Details`
        }
        if (selectedFloor) {
            return `${selectedFloor.floorName || `Floor ${selectedFloor.floorNumber}`} - Units`
        }
        return 'Select a Floor'
    }

    // Get empty state message for middle panel
    const getMiddlePanelEmptyMessage = () => {
        switch (viewMode) {
            case 'unit':
                return { title: 'No unit images', subtitle: 'No images uploaded for this unit' }
            case 'floor':
                return { title: 'No floor plan images', subtitle: 'Upload floor chart images in project edit' }
            case 'block':
                return { title: 'No block plan images', subtitle: 'Upload block plan images in project edit' }
            default:
                return { title: 'No images', subtitle: 'Select a block or floor to view' }
        }
    }

    if (loading) {
        return <LoaderScreen />
    }

    if (!project) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="text-center">
                    <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold">No Project Selected</h2>
                    <p className="text-muted-foreground">Please select a project from the listing</p>
                </div>
            </div>
        )
    }

    const minSwipeDistance = 50

    const handleDragStart = (clientX: number) => {
        setDragStart(clientX)
        setIsDragging(false)
    }

    const handleDragMove = (clientX: number) => {
        if (dragStart !== null) {
            const distance = Math.abs(clientX - dragStart)
            if (distance > 10) {
                setIsDragging(true)
            }
        }
    }

    const handleDragEnd = (clientX: number) => {
        if (dragStart !== null && galleryImages.length > 1) {
            const distance = dragStart - clientX
            if (distance > minSwipeDistance) {
                setCurrentImageIndex(prev => prev === galleryImages.length - 1 ? 0 : prev + 1)
            } else if (distance < -minSwipeDistance) {
                setCurrentImageIndex(prev => prev === 0 ? galleryImages.length - 1 : prev - 1)
            }
        }
        setDragStart(null)
        setTimeout(() => setIsDragging(false), 50)
    }

    return (
        <div className="p-3">
            {/* Main Layout - 3 columns */}
            <div className="grid grid-cols-12 gap-3 h-[calc(100vh-180px)]">

                {/* ====== LEFT PANEL: Blocks & Floors / Plots ====== */}
                <Card className="col-span-4 flex flex-col overflow-hidden">
                    <CardHeader className="py-3 flex-shrink-0">
                        <CardTitle className="text-sm flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                {project.property === 'plots' ? (
                                    <>
                                        <Layers className="h-4 w-4" />
                                        All Plots ({project.plots?.length || 0})
                                    </>
                                ) : (
                                    <>
                                        <Building2 className="h-4 w-4" />
                                        Blocks & Floors
                                    </>
                                )}
                            </div>
                            {project.img_location?.brochure && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] gap-1 px-2"
                                    onClick={() => setBrochureConfirmOpen(true)}
                                >
                                    <Download className="h-3 w-3" />
                                    Brochure
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-2 overflow-hidden">
                        <ScrollArea className="h-full pr-2">
                            {project.property === 'plots' ? (
                                project.plots && project.plots.length > 0 ? (
                                    <div className="grid grid-cols-5 gap-1">
                                        {project.plots.map((plot) => (
                                            <button
                                                key={plot.plotId}
                                                onClick={() => setSelectedPlot(plot)}
                                                className={`p-2 text-xs rounded border transition-all truncate hover:opacity-80 ${selectedPlot?.plotId === plot.plotId
                                                    ? 'ring-2 ring-primary ring-offset-1'
                                                    : ''
                                                    } ${getStatusColor(plot.status)}`}
                                                title={`Plot ${plot.plotNumber} - ${plot.size} sqft${plot.bookedBy ? ` | Booked by: #${plot.bookedBy.profileId}` : ''}`}
                                            >
                                                {plot.plotNumber}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>No plots available</p>
                                        </div>
                                    </div>
                                )
                            ) : (
                                project.blocks && project.blocks.length > 0 ? (
                                    <div className="space-y-3">
                                        {project.blocks.map((block) => (
                                            <div
                                                key={block.blockId}
                                                className={`rounded-lg border-2 transition-all ${selectedBlock?.blockId === block.blockId
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border'
                                                    }`}
                                            >
                                                {/* Block Header - Click to show block image */}
                                                <div
                                                    className={`p-3 cursor-pointer flex items-center justify-between transition-colors ${selectedBlock?.blockId === block.blockId && viewMode === 'block'
                                                        ? 'bg-primary/10'
                                                        : 'hover:bg-muted/50'
                                                        }`}
                                                    onClick={() => handleBlockClick(block)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-5 w-5 text-primary" />
                                                        <span className="font-semibold">{block.blockName}</span>
                                                    </div>
                                                    <Badge variant="secondary">{block.totalFloors} Floors</Badge>
                                                </div>

                                                {/* Floors Grid - Only show when block is selected */}
                                                {selectedBlock?.blockId === block.blockId && block.floors && block.floors.length > 0 && (
                                                    <div className="px-3 pb-3">
                                                        <div className="grid grid-cols-5 gap-1">
                                                            {[...block.floors].reverse().map((floor) => (
                                                                <button
                                                                    key={floor.floorNumber}
                                                                    onClick={() => handleFloorClick(floor)}
                                                                    className={`p-2 text-xs rounded border transition-all ${selectedFloor?.floorNumber === floor.floorNumber
                                                                        ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                                                                        : 'bg-muted/50 hover:bg-muted border-border dark:bg-muted/50 dark:hover:bg-muted dark:border-border'
                                                                        }`}
                                                                >
                                                                    F{floor.floorNumber}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>No blocks available</p>
                                        </div>
                                    </div>
                                )
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* ====== MIDDLE PANEL: Floor Plan Images / Unit Numbers / Unit Details ====== */}
                <Card className="col-span-4 flex flex-col overflow-hidden">
                    <CardHeader className="py-0 flex-shrink-0">
                        <CardTitle className="text-sm flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                {getMiddlePanelTitle()}
                            </div>
                            {galleryImages.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsGalleryOpen(true)}
                                >
                                    <Maximize2 className="h-4 w-4" />
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 px-2 pb-2 pt-0 overflow-hidden flex flex-col">
                        {/* Horizontal Unit Number Selection (User's Mockup) */}
                        {project.property !== 'plots' && selectedFloor && selectedFloor.units && (
                            <div className="mb-1 shrink-0 border-b pb-1">
                                <ScrollArea className="w-full" orientation="horizontal">
                                    <div className="flex items-center gap-2 px-2">
                                        {(selectedFloor.units as Unit[]).map((unit) => (
                                            <button
                                                key={unit.unitId}
                                                onClick={() => {
                                                    if (selectedUnit?.unitId === unit.unitId) {
                                                        // Deselect if same unit clicked -> Return to floor view
                                                        setSelectedUnit(null);
                                                        setViewMode('floor');
                                                        setCurrentImageIndex(0);
                                                    } else {
                                                        handleUnitClick(unit);

                                                    }
                                                }}
                                                className={`text-md font-bold transition-all py-0 min-w-10 text-center ${selectedUnit?.unitId === unit.unitId
                                                    ? 'text-foreground scale-105'
                                                    : 'text-muted-foreground opacity-40 hover:opacity-100'
                                                    }`}
                                            >
                                                {unit.unitNumber}
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}

                        {/* Image Gallery Area */}
                        <div className="flex-1 overflow-hidden">
                            {galleryImages.length > 0 ? (
                                <div className="w-full h-full flex flex-col">
                                    <div
                                        className="flex-1 relative bg-muted/5 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer select-none"
                                        onMouseDown={(e) => handleDragStart(e.clientX)}
                                        onMouseMove={(e) => handleDragMove(e.clientX)}
                                        onMouseUp={(e) => handleDragEnd(e.clientX)}
                                        onMouseLeave={(e) => {
                                            if (dragStart !== null) handleDragEnd(e.clientX)
                                        }}
                                        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                                        onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
                                        onTouchEnd={(e) => {
                                            if (e.changedTouches.length > 0) {
                                                handleDragEnd(e.changedTouches[0].clientX)
                                            }
                                        }}
                                        onClick={() => {
                                            if (!isDragging) setIsGalleryOpen(true)
                                        }}
                                    >
                                        <img
                                            src={galleryImages[currentImageIndex]}
                                            alt={`Plan ${currentImageIndex + 1}`}
                                            className="max-w-full max-h-full object-contain pointer-events-none transition-all duration-300"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Plan'
                                            }}
                                            draggable={false}
                                        />
                                    </div>
                                    {galleryImages.length > 1 && (
                                        <div className="flex items-center justify-center gap-2 mt-2">
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-8 w-8"
                                                onClick={() => setCurrentImageIndex(prev =>
                                                    prev === 0 ? galleryImages.length - 1 : prev - 1
                                                )}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <div className="flex gap-1">
                                                {galleryImages.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setCurrentImageIndex(idx)}
                                                        className={`h-2 w-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-primary w-4' : 'bg-muted-foreground/30'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-8 w-8"
                                                onClick={() => setCurrentImageIndex(prev =>
                                                    prev === galleryImages.length - 1 ? 0 : prev + 1
                                                )}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                                    <div className="opacity-50">
                                        <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                                        <p>{getMiddlePanelEmptyMessage().title}</p>
                                        <p className="text-xs">{getMiddlePanelEmptyMessage().subtitle}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* ====== RIGHT PANEL: Old-style Unit Grid / Plot Details ====== */}
                <Card className="col-span-4 flex flex-col overflow-hidden">
                    <CardHeader className="py-3 flex-shrink-0">
                        <CardTitle className="text-sm flex items-center gap-2">
                            {project.property === 'plots' ? (
                                <>
                                    <DoorOpen className="h-4 w-4" />
                                    Plot Details
                                </>
                            ) : (
                                <>
                                    <DoorOpen className="h-4 w-4" />
                                    {selectedFloor ? `${selectedFloor.floorName || `Floor ${selectedFloor.floorNumber}`} - Units` : 'Select a Floor'}
                                </>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-2 overflow-hidden">
                        {project.property === 'plots' ? (
                            /* ==== Plot Details ==== */
                            selectedPlot ? (
                                <ScrollArea className="h-full pr-3">
                                    <div className="flex flex-col items-center p-6 text-center space-y-3">
                                        <div className={`p-4 rounded-full ${getStatusColor(selectedPlot.status).split(' ')[0]} bg-opacity-20`}>
                                            <Layers className={`h-12 w-12 ${getStatusColor(selectedPlot.status).split(' ')[1]}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-bold">Plot {selectedPlot.plotNumber}</h3>
                                            <Badge className="mt-2 text-lg px-4 py-1" variant={selectedPlot.status === 'available' ? 'default' : 'secondary'}>
                                                {selectedPlot.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 w-full mt-6 bg-muted/30 p-4 rounded-lg">
                                            <div className="text-left">
                                                <p className="text-sm text-muted-foreground">Size</p>
                                                <p className="font-semibold text-lg">{selectedPlot.size} sqft</p>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm text-muted-foreground">Facing</p>
                                                <p className="font-semibold text-lg">{selectedPlot.facing || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="w-full pt-2">
                                            <Button
                                                className="w-full"
                                                disabled={selectedPlot.status === 'sold'}
                                                onClick={() => handleOpenBooking({
                                                    plotId: selectedPlot.plotId,
                                                    label: `Plot ${selectedPlot.plotNumber}`,
                                                    bookedBy: selectedPlot.status === 'booked' ? selectedPlot.bookedBy : undefined
                                                })}
                                            >
                                                {selectedPlot.status === 'available' ? 'Book Now' : selectedPlot.status === 'booked' ? 'View/Reverse Booking' : 'Not Available'}
                                            </Button>
                                        </div>
                                    </div>
                                </ScrollArea>
                            ) : (
                                <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                                    <div>
                                        <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>Select a plot to view details</p>
                                    </div>
                                </div>
                            )
                        ) : (
                            /* ==== Old-style Unit Grid (Green Boxes) ==== */
                            selectedFloor && selectedFloor.units && selectedFloor.units.length > 0 ? (
                                <ScrollArea className="h-full pr-3">
                                    <div className="grid grid-cols-4 gap-2">
                                        {(selectedFloor.units as Unit[]).map((unit) => (
                                            <div
                                                key={unit.unitId}
                                                className={`p-3 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer ${getStatusColor(unit.status)} ${selectedUnit?.unitId === unit.unitId ? 'ring-2 ring-primary ring-offset-1' : ''
                                                    }`}
                                                onClick={() => {
                                                    handleUnitClick(unit); // Show details in center panel
                                                    if ((unit.status === 'available' || unit.status === 'booked') && selectedBlock) {
                                                        handleOpenBooking({
                                                            unitId: unit.unitId,
                                                            blockId: selectedBlock.blockId,
                                                            label: `Unit ${unit.unitNumber} (${selectedBlock.blockName})`,
                                                            bookedBy: unit.status === 'booked' ? unit.bookedBy : undefined
                                                        })
                                                    }
                                                }}
                                                title={`Unit ${unit.unitNumber} - ${unit.status}`}
                                            >
                                                <div className="text-center">
                                                    <div className="font-bold text-lg">{unit.unitNumber}</div>
                                                    <div className="text-[10px] mt-0.5 opacity-80">{unit.bhk} BHK</div>
                                                    <div className="text-[9px] opacity-70 truncate">{unit.size} sqft</div>
                                                    {unit.bookedBy && (unit.status === 'booked' || unit.status === 'sold') && (
                                                        <div className="mt-1 pt-1 border-t border-current/20 opacity-80">
                                                            <User className="h-2.5 w-2.5 mx-auto" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                                    <div>
                                        <DoorOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>Select a floor to view units</p>
                                    </div>
                                </div>
                            )
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-3">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500"></div>
                    <span className="text-sm">Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500"></div>
                    <span className="text-sm">Booked</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500"></div>
                    <span className="text-sm">Sold</span>
                </div>
            </div>

            {/* Gallery Modal with Carousel */}
            <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                <DialogContent className="min-w-[85vw] h-[90vh] p-0 border-0 bg-black">
                    <DialogTitle className="sr-only">Layout / Floor Plan Gallery</DialogTitle>

                    {/* Close button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 z-50 text-white bg-white/20 hover:bg-white/40 h-10 w-10"
                        onClick={() => setIsGalleryOpen(false)}
                    >
                        <X className="h-6 w-6" />
                    </Button>

                    {galleryImages.length > 0 && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center">
                            <Carousel
                                opts={{
                                    align: "center",
                                    loop: true,
                                    startIndex: currentImageIndex,
                                }}
                                className="w-full h-full flex items-center"
                            >
                                <CarouselContent className="h-full items-center">
                                    {galleryImages.map((url, idx) => (
                                        <CarouselItem key={idx} className="h-full flex items-center justify-center pl-0">
                                            <div className="w-full h-full flex items-center justify-center">
                                                <img
                                                    src={url}
                                                    alt={`Plan ${idx + 1}`}
                                                    className="max-w-[90%] max-h-[75vh] object-contain"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Plan'
                                                    }}
                                                />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>

                                {galleryImages.length > 1 && (
                                    <>
                                        <CarouselPrevious className="left-4 h-14 w-14 bg-white/90 hover:bg-white text-black border-0" />
                                        <CarouselNext className="right-4 h-14 w-14 bg-white/90 hover:bg-white text-black border-0" />
                                    </>
                                )}
                            </Carousel>

                            {/* Thumbnail strip */}
                            {galleryImages.length > 1 && (
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-lg">
                                    {galleryImages.map((url, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentImageIndex(idx)}
                                            className={`w-14 h-14 rounded overflow-hidden border-2 transition-all hover:opacity-100 ${idx === currentImageIndex ? 'border-white' : 'border-transparent opacity-60'
                                                }`}
                                        >
                                            <img
                                                src={url}
                                                alt={`Thumbnail ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Booking Dialog */}
            {bookingTarget && project && (
                <BookingDialog
                    open={bookingOpen}
                    onOpenChange={setBookingOpen}
                    projectId={project.product_id}
                    unitId={bookingTarget?.unitId}
                    plotId={bookingTarget?.plotId}
                    blockId={bookingTarget?.blockId}
                    unitLabel={bookingTarget?.label || ""}
                    bookedBy={bookingTarget?.bookedBy}
                    prefilledLead={bookingLead}
                    onBookingComplete={handleBookingComplete}
                />
            )}

            {/* Brochure Download Confirmation */}
            <AlertDialog open={brochureConfirmOpen} onOpenChange={setBrochureConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Download</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to download the project brochure for {project.name}? This will download the file to your device.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            if (project.img_location?.brochure) {
                                const url = project.img_location.brochure;
                                const fullUrl = url.startsWith('http') ? url : `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
                                const a = document.createElement('a');
                                a.href = fullUrl;
                                a.download = url.split('/').pop() || `${project.name.replace(/\s+/g, '_')}_Brochure`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                            }
                            setBrochureConfirmOpen(false);
                        }}>
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}