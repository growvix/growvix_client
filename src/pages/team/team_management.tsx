import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { getCookie } from "@/utils/cookies"
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
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { API } from "@/config/api"
import TeamTable from "@/pages/team/team_table"

export default function TeamManagement() {
    const { setBreadcrumbs } = useBreadcrumb()

    useEffect(() => {
        setBreadcrumbs([
            { label: "Settings", href: "/settings" },
            { label: "Teams" },
        ])
    }, [setBreadcrumbs])

    const [open, setOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target
        setFormData(prev => ({ ...prev, [id]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const token = getCookie("token")
            await axios.post(
                API.TEAMS,
                { name: formData.name, description: formData.description },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            setOpen(false)
            setFormData({ name: "", description: "" })
            setRefreshKey(prev => prev + 1)
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                alert(`Error: ${error.response.data.message || "Failed to create team"}`)
            }
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-4 px-3">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button>Create Team</Button>
                    </SheetTrigger>
                    <SheetContent className="w-xl px-5">
                        <SheetHeader>
                            <SheetTitle>Create New Team</SheetTitle>
                            <SheetDescription>
                                Enter the details below to create a new team.
                            </SheetDescription>
                        </SheetHeader>
                        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Team Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Sales Team"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    placeholder="Optional team description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <Button type="submit" className="mt-4">Create Team</Button>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>
            <TeamTable key={refreshKey} initialPageSize={15} onRefresh={() => setRefreshKey(prev => prev + 1)} />
        </div>
    )
}
