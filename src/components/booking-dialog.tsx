import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { toast } from "sonner"
import { API, API_URL } from "@/config/api"
import { getCookie } from "@/utils/cookies"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Search,
    User,
    Phone,
    Hash,
    Pencil,
    Check,
    X,
    Loader2,
    BookOpen,
    AlertCircle,
} from "lucide-react"

interface LeadSearchResult {
    _id: string
    profile_id: number
    name: string
    phone?: string
}

interface PrefilledLead {
    _id: string
    profile_id: string | number
    name: string
    phone: string
}

interface BookingDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId: number
    unitId?: string
    plotId?: string
    blockId?: string
    unitLabel: string
    prefilledLead?: PrefilledLead | null
    onBookingComplete?: () => void
}

export function BookingDialog({
    open,
    onOpenChange,
    projectId,
    unitId,
    plotId,
    blockId,
    unitLabel,
    prefilledLead,
    onBookingComplete,
}: BookingDialogProps) {
    const organization = getCookie("organization") || ""

    // Lead search state
    const [searchQuery, setSearchQuery] = useState("")
    const [searching, setSearching] = useState(false)
    const [searchResult, setSearchResult] = useState<LeadSearchResult | null>(null)
    const [searchError, setSearchError] = useState(false)

    // Selected lead state
    const [selectedLead, setSelectedLead] = useState<LeadSearchResult | null>(null)
    const [phoneNumber, setPhoneNumber] = useState("")
    const [isEditingPhone, setIsEditingPhone] = useState(false)
    const [editedPhone, setEditedPhone] = useState("")

    // Booking state
    const [booking, setBooking] = useState(false)

    // Cancel confirmation state
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)

    // Reset all state when dialog opens/closes
    useEffect(() => {
        if (!open) {
            setSearchQuery("")
            setSearchResult(null)
            setSearchError(false)
            setSelectedLead(null)
            setPhoneNumber("")
            setIsEditingPhone(false)
            setEditedPhone("")
            setBooking(false)
            setSearching(false)
        } else if (prefilledLead) {
            // Auto-select the prefilled lead when dialog opens
            setSelectedLead({
                _id: prefilledLead._id,
                profile_id: typeof prefilledLead.profile_id === 'string' ? parseInt(prefilledLead.profile_id) || 0 : prefilledLead.profile_id,
                name: prefilledLead.name,
                phone: prefilledLead.phone,
            })
            setPhoneNumber(prefilledLead.phone || "")
            setEditedPhone(prefilledLead.phone || "")
        }
    }, [open, prefilledLead])

    // Debounced lead search
    useEffect(() => {
        const profileIdMatch = searchQuery.match(/^#(\d+)$/)
        if (!profileIdMatch) {
            setSearchResult(null)
            setSearchError(false)
            return
        }

        const profileId = profileIdMatch[1]
        let cancelled = false

        const searchLead = async () => {
            setSearching(true)
            setSearchError(false)
            setSearchResult(null)

            try {
                if (!organization) {
                    setSearchError(true)
                    return
                }

                const response = await axios.get(
                    `${API_URL}/api/leads/search/${organization}/${profileId}`
                )

                if (cancelled) return

                if (response.status === 200 && response.data.data) {
                    setSearchResult({
                        _id: response.data.data._id,
                        profile_id: response.data.data.profile_id,
                        name: response.data.data.name || "Unknown",
                        phone: response.data.data.profile?.phone || response.data.data.phone || "",
                    })
                } else {
                    setSearchError(true)
                }
            } catch {
                if (!cancelled) setSearchError(true)
            } finally {
                if (!cancelled) setSearching(false)
            }
        }

        const debounce = setTimeout(searchLead, 400)
        return () => {
            cancelled = true
            clearTimeout(debounce)
        }
    }, [searchQuery, organization])

    // Select a lead from search results
    const handleSelectLead = useCallback((lead: LeadSearchResult) => {
        setSelectedLead(lead)
        setPhoneNumber(lead.phone || "")
        setEditedPhone(lead.phone || "")
        setSearchQuery("")
        setSearchResult(null)
        toast.success(`Lead "${lead.name}" selected`)
    }, [])

    // Phone editing
    const handleStartEditPhone = () => {
        setEditedPhone(phoneNumber)
        setIsEditingPhone(true)
    }

    const handleSavePhone = () => {
        if (!editedPhone.trim()) {
            toast.error("Phone number cannot be empty")
            return
        }
        setPhoneNumber(editedPhone.trim())
        setIsEditingPhone(false)
        toast.success("Phone number updated")
    }

    const handleCancelEditPhone = () => {
        setEditedPhone(phoneNumber)
        setIsEditingPhone(false)
    }

    // Handle cancel with confirmation
    const handleCancel = () => {
        if (selectedLead) {
            setShowCancelConfirm(true)
        } else {
            onOpenChange(false)
            toast.info("Booking cancelled")
        }
    }

    const handleConfirmCancel = () => {
        setShowCancelConfirm(false)
        onOpenChange(false)
        toast.info("Booking cancelled")
    }

    // Submit booking
    const handleBooking = async () => {
        if (!selectedLead || !phoneNumber) {
            toast.error("Please select a lead and ensure phone number is filled")
            return
        }

        setBooking(true)
        try {
            await axios.post(API.bookUnit(projectId), {
                organization,
                leadName: selectedLead.name,
                leadUuid: selectedLead._id,
                profileId: selectedLead.profile_id,
                phone: phoneNumber,
                unitId: unitId || undefined,
                plotId: plotId || undefined,
                blockId: blockId || undefined,
                userId: getCookie("user_id") || undefined,
                userName: getCookie("first_name") ? `${getCookie("first_name")} ${getCookie("last_name") || ""}`.trim() : undefined,
            })

            toast.success(
                `Successfully booked ${unitLabel} for ${selectedLead.name}`,
                { duration: 4000 }
            )
            onOpenChange(false)
            onBookingComplete?.()
        } catch (err: any) {
            const message =
                err.response?.data?.message || "Failed to complete booking"
            toast.error(message)
        } finally {
            setBooking(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={(val) => {
                if (!val) handleCancel()
                else onOpenChange(val)
            }}>
                <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 px-6 py-5">
                        <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            Book {unitLabel}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground mt-1">
                            Search for a lead and confirm the booking details below.
                        </DialogDescription>
                    </div>

                    <div className="px-6 py-5 space-y-5">
                        {/* Lead Search */}
                        {!selectedLead ? (
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">
                                    Search Lead
                                </Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="lead-search"
                                        placeholder="Type #profileId (e.g. #1, #42)"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                        autoFocus
                                        aria-label="Search for a lead by profile ID"
                                    />
                                </div>

                                {/* Search results */}
                                {searching && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Searching...
                                    </div>
                                )}

                                {searchResult && !searching && (
                                    <button
                                        onClick={() => handleSelectLead(searchResult)}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-left cursor-pointer group"
                                        aria-label={`Select lead ${searchResult.name}`}
                                    >
                                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{searchResult.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                #{searchResult.profile_id}
                                                {searchResult.phone && ` · ${searchResult.phone}`}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="text-xs shrink-0">
                                            Select
                                        </Badge>
                                    </button>
                                )}

                                {searchError && !searching && (
                                    <div className="flex items-center gap-2 text-sm text-red-500 py-2">
                                        <AlertCircle className="h-4 w-4" />
                                        No lead found. Check the profile ID and try again.
                                    </div>
                                )}

                                {!searchQuery && (
                                    <p className="text-xs text-muted-foreground">
                                        Enter a lead&apos;s profile ID preceded by # to search.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Selected Lead Details */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">Lead Details</Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedLead(null)
                                                setPhoneNumber("")
                                                setIsEditingPhone(false)
                                            }}
                                            className="text-xs h-7 text-muted-foreground hover:text-foreground"
                                        >
                                            Change Lead
                                        </Button>
                                    </div>

                                    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                                        {/* Lead Name */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Lead Name</p>
                                                <p className="font-medium">{selectedLead.name}</p>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Lead UUID */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500/10">
                                                <Hash className="h-4 w-4 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Lead ID</p>
                                                <p className="font-medium text-sm font-mono">
                                                    #{selectedLead.profile_id}
                                                </p>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Phone Number (editable) */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-500/10">
                                                <Phone className="h-4 w-4 text-green-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-muted-foreground">Phone Number</p>
                                                {isEditingPhone ? (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Input
                                                            id="edit-phone"
                                                            value={editedPhone}
                                                            onChange={(e) => setEditedPhone(e.target.value)}
                                                            className="h-8 text-sm"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") handleSavePhone()
                                                                if (e.key === "Escape") handleCancelEditPhone()
                                                            }}
                                                            aria-label="Edit phone number"
                                                        />
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 text-green-600 hover:text-green-700 shrink-0"
                                                            onClick={handleSavePhone}
                                                            aria-label="Save phone number"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 text-red-500 hover:text-red-600 shrink-0"
                                                            onClick={handleCancelEditPhone}
                                                            aria-label="Cancel phone edit"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-sm">
                                                            {phoneNumber || "Not provided"}
                                                        </p>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                                            onClick={handleStartEditPhone}
                                                            aria-label="Edit phone number"
                                                        >
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={handleCancel}
                                        disabled={booking}
                                        aria-label="Cancel booking"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={handleBooking}
                                        disabled={booking || !phoneNumber}
                                        aria-label="Confirm booking"
                                    >
                                        {booking ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Booking...
                                            </>
                                        ) : (
                                            "Confirm Booking"
                                        )}
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* Cancel-only button when no lead selected */}
                        {!selectedLead && (
                            <div className="pt-1">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => onOpenChange(false)}
                                    aria-label="Close booking dialog"
                                >
                                    Close
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Cancel Confirmation Alert */}
            <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have lead details filled in. Are you sure you want to cancel this booking? Your progress will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Continue Booking</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmCancel}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            Yes, Cancel
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
