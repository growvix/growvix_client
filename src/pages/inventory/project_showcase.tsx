import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useLocation } from "react-router-dom"
import axios from "axios"
import { API } from "@/config/api"
import { getCookie } from "@/utils/cookies"
import { decodeProjectId } from "@/utils/idEncoder"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import LoaderScreen from "@/components/ui/loader-screen"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, DoorOpen, ImageIcon, X, Maximize2, ChevronLeft, ChevronRight, Layers, Info, User, CalendarClock, CalendarCheck, ExternalLink } from "lucide-react"
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
    bookedBy?: {
        leadName: string;
        profileId?: string;
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
        profileId?: string;
        leadUuid?: string;
        phone?: string;
        userName?: string;
        bookedAt?: string;
    }
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

interface Project {
    product_id: number
    name: string
    property: string
    location: string
    blocks: Block[]
    plots?: Plot[]
    layoutImages?: string[]
}

export default function ProjectShowcase() {
    const [searchParams] = useSearchParams()
    const location = useLocation()
    const projectId = searchParams.get('id')

    // Lead context from navigation state (passed from lead detail page)
    const bookingLead = (location.state as any)?.bookingLead || null

    const [loading, setLoading] = useState(true)
    const [project, setProject] = useState<Project | null>(null)
    const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)
    const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null)
    const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isGalleryOpen, setIsGalleryOpen] = useState(false)

    // Booking dialog state
    const [bookingOpen, setBookingOpen] = useState(false)
    const [bookingTarget, setBookingTarget] = useState<{
        unitId?: string
        plotId?: string
        blockId?: string
        label: string
    } | null>(null)

    // Keyboard navigation for gallery
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isGalleryOpen) return

            let images: string[] = []
            if (project?.property === 'plots') {
                images = project.layoutImages || []
            } else {
                images = selectedBlock?.floorPlanImages || []
            }

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
    }, [isGalleryOpen, selectedBlock?.floorPlanImages, project?.layoutImages, project?.property])

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
                params: { organization }
            })
            const projectData = response.data.data
            setProject(projectData)

            // Auto-select first block if available
            if (projectData.blocks && projectData.blocks.length > 0) {
                setSelectedBlock(projectData.blocks[0])
            }
        } catch (error) {
            console.error('Failed to fetch project:', error)
        } finally {
            setLoading(false)
        }
    }, [projectId])

    useEffect(() => {
        fetchProject()
    }, [fetchProject])

    // Handle booking dialog open
    const handleOpenBooking = useCallback((target: { unitId?: string; plotId?: string; blockId?: string; label: string }) => {
        setBookingTarget(target)
        setBookingOpen(true)
    }, [])

    // Refetch project after a booking is completed
    const handleBookingComplete = useCallback(() => {
        fetchProject()
    }, [fetchProject])

    // Handle block change - reset floor selection and update images
    const handleBlockChange = (block: Block) => {
        setSelectedBlock(block)
        setSelectedFloor(null)
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

    // Determine which images to show in gallery
    const galleryImages = project.property === 'plots'
        ? (project.layoutImages || [])
        : (selectedBlock?.floorPlanImages || [])

    return (
        <div className="p-3">
            {/* Project Header */}
            <Card className="mb-3 py-1">
                <CardHeader className="">
                    <div className="flex items-center justify-around">
                        <div>
                            <CardTitle className="text-xl">{project.name}</CardTitle>

                        </div>
                        <p className="text-sm text-muted-foreground">{project.location}</p>
                        <div className="flex gap-2">
                            <Badge variant="outline">{project.property}</Badge>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Main Layout - 3 columns */}
            <div className="grid grid-cols-12 gap-3 h-[calc(100vh-180px)]">

                {/* Left Panel: Blocks/Floors OR Plots List */}
                <Card className="col-span-4 flex flex-col overflow-hidden">
                    <CardHeader className="py-3 flex-shrink-0">
                        <CardTitle className="text-sm flex items-center gap-2">
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
                                                title={`Plot ${plot.plotNumber} - ${plot.size} sqft${plot.bookedBy ? ` | Booked by: ${plot.bookedBy.leadName}` : ''}`}
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
                                                {/* Block Header */}
                                                <div
                                                    className="p-3 cursor-pointer flex items-center justify-between"
                                                    onClick={() => handleBlockChange(block)}
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
                                                                    onClick={() => setSelectedFloor(floor)}
                                                                    className={`p-2 text-xs rounded border transition-all ${selectedFloor?.floorNumber === floor.floorNumber
                                                                        ? 'bg-primary text-white border-primary'
                                                                        : 'bg-muted/50 hover:bg-muted border-border'
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

                {/* Middle Panel: Layout / Floor Plan Images */}
                <Card className="col-span-4 flex flex-col overflow-hidden">
                    <CardHeader className="py-3 flex-shrink-0">
                        <CardTitle className="text-sm flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                {project.property === 'plots' ? 'Site Layout / Masters' : `Floor Plan - ${selectedBlock?.blockName || 'Select Block'}`}
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
                    <CardContent className="flex-1 p-2 flex items-center justify-center">
                        {galleryImages.length > 0 ? (
                            <div className="w-full h-full flex flex-col">
                                <div className="flex-1 relative bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center">
                                    <img
                                        src={galleryImages[currentImageIndex]}
                                        alt={`Layout Plan ${currentImageIndex + 1}`}
                                        className="max-w-full max-h-full object-contain cursor-pointer"
                                        onClick={() => setIsGalleryOpen(true)}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Plan'
                                        }}
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
                            <div className="text-center text-muted-foreground">
                                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>{project.property === 'plots' ? 'No layout images' : 'No floor plan images'}</p>
                                <p className="text-xs">{project.property === 'plots' ? 'Upload layout images in project edit' : 'Select a block to view'}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Panel: Units/Plot Details */}
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
                                    {selectedFloor ? `${selectedFloor.floorName} - Units` : 'Select a Floor'}
                                </>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-2">
                        {project.property === 'plots' ? (
                            selectedPlot ? (
                                <ScrollArea className="h-full">
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

                                        {/* Booked By Info */}
                                        {selectedPlot.bookedBy && (selectedPlot.status === 'booked' || selectedPlot.status === 'sold') && (
                                            <div className="w-full mt-4 bg-muted/30 p-4 rounded-lg text-left space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="h-2 w-2 rounded-full shrink-0 bg-emerald-500" />
                                                        <span className="font-semibold text-[15px] text-foreground truncate">
                                                            {selectedPlot.bookedBy.leadName}
                                                        </span>
                                                    </div>
                                                    <Badge className="bg-background hover:bg-muted text-foreground font-medium text-[10px] px-2 py-0.5 rounded-md shrink-0 border">
                                                        {selectedPlot.status.charAt(0).toUpperCase() + selectedPlot.status.slice(1)}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 gap-y-2 gap-x-1 text-xs text-muted-foreground pl-4">
                                                    {selectedPlot.bookedBy.userName && (
                                                        <div className="col-span-2 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 mt-1">
                                                            <CalendarCheck className="h-3.5 w-3.5 shrink-0" />
                                                            <span className="truncate">{selectedPlot.status.charAt(0).toUpperCase() + selectedPlot.status.slice(1)} by {selectedPlot.bookedBy.userName}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="pl-2 pt-1">
                                                    <a
                                                        href={`/lead_detail/${selectedPlot.bookedBy.leadUuid || selectedPlot.bookedBy.profileId}`}
                                                        className="inline-flex h-6 items-center text-[13px] font-medium gap-1 text-primary hover:text-primary/80 transition-colors p-0"
                                                    >
                                                        View Lead <ExternalLink className="h-3.5 w-3.5" />
                                                    </a>
                                                </div>
                                                
                                            </div>
                                        )}
                                        <div className="w-full pt-2">
                                            <Button
                                                className="w-full"
                                                disabled={selectedPlot.status !== 'available'}
                                                onClick={() => handleOpenBooking({
                                                    plotId: selectedPlot.plotId,
                                                    label: `Plot ${selectedPlot.plotNumber}`,
                                                })}
                                            >
                                                {selectedPlot.status === 'available' ? 'Book Now' : 'Not Available'}
                                            </Button>
                                        </div>

                                        
                                    </div>
                                </ScrollArea>
                            ) : (
                                <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                                    <div>
                                        <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>Select a plot to view details</p>
                                        <p className="text-xs mt-1">Click on a plot number in the left panel</p>
                                    </div>
                                </div>
                            )
                        ) : (
                            selectedFloor && selectedFloor.units && selectedFloor.units.length > 0 ? (
                                <ScrollArea className="h-full">
                                    <div className="grid grid-cols-4 gap-2">
                                        {selectedFloor.units.map((unit) => (
                                            <div
                                                key={unit.unitId}
                                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${getStatusColor(unit.status)}`}
                                                onClick={() => {
                                                    if (unit.status === 'available' && selectedBlock) {
                                                        handleOpenBooking({
                                                            unitId: unit.unitId,
                                                            blockId: selectedBlock.blockId,
                                                            label: `Unit ${unit.unitNumber} (${selectedBlock.blockName})`,
                                                        })
                                                    }
                                                }}
                                                title={unit.status === 'available' ? `Click to book Unit ${unit.unitNumber}` : `Unit ${unit.unitNumber} - ${unit.status}`}
                                            >
                                                <div className="text-center">
                                                    <div className="font-bold text-lg">{unit.unitNumber}</div>
                                                    <div className="text-xs">{unit.bhk} BHK</div>
                                                    <div className="text-xs opacity-70">{unit.size} sqft</div>
                                                    <div className="text-xs opacity-70">{unit.facing}</div>
                                                    {unit.bookedBy && unit.status === 'booked' && (
                                                        <div className="text-xs mt-1 pt-1 border-t border-current/20 opacity-80 truncate" title={unit.bookedBy.leadName}>
                                                            <User className="h-3 w-3 inline mr-0.5" />
                                                            {unit.bookedBy.leadName}
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
                                        <p className="text-xs mt-1">Click on a floor button (F1, F2...) in the left panel</p>
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
                    unitId={bookingTarget.unitId}
                    plotId={bookingTarget.plotId}
                    blockId={bookingTarget.blockId}
                    unitLabel={bookingTarget.label}
                    prefilledLead={bookingLead}
                    onBookingComplete={handleBookingComplete}
                />
            )}
        </div>
    )
}