import React, { useState, useEffect } from "react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { getCookie } from "@/utils/cookies"
import { API } from "@/config/api"
import axios from "axios"
import { toast } from "sonner"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import LoaderScreen, { HorizontalLoader } from "@/components/ui/loader-screen"

type Source = {
    _id: string
    name: string
    createdAt: string
}

export default function TrackSourceSubsource() {
    const { setBreadcrumbs } = useBreadcrumb()
    const organization = getCookie("organization") || ""

    const [sources, setSources] = useState<Source[]>([])
    const [loading, setLoading] = useState(true)
    const [newSourceName, setNewSourceName] = useState("")
    const [isCreating, setIsCreating] = useState(false)

    useEffect(() => {
        setBreadcrumbs([
            { label: "Automation" },
            { label: "Source Management" },
        ])
    }, [setBreadcrumbs])

    const fetchSources = async () => {
        if (!organization) return
        setLoading(true)
        try {
            const token = getCookie("token")
            const response = await axios.get(`${API.SOURCES}?organization=${organization}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setSources(response.data.data || [])
        } catch (err: unknown) {
            const error = err as any
            console.error("Failed to fetch sources:", error)
            toast.error(error.response?.data?.message || "Failed to fetch sources")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSources()
    }, [organization])

    const handleCreateSource = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newSourceName.trim()) {
            toast.error("Source name is required")
            return
        }

        setIsCreating(true)
        try {
            const token = getCookie("token")
            const response = await axios.post(`${API.SOURCES}?organization=${organization}`, {
                name: newSourceName.trim()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (response.data.success) {
                toast.success("Source created successfully")
                setNewSourceName("")
                fetchSources()
            }
        } catch (err: unknown) {
            const error = err as any
            toast.error(error.response?.data?.message || "Failed to create source")
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="flex flex-col h-full space-y-6 p-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Source Management</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Manage lead sources for your organization.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Create New Source</CardTitle>
                            <CardDescription>
                                Add a new lead tracking source.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateSource} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sourceName">Source Name</Label>
                                    <Input
                                        id="sourceName"
                                        placeholder="e.g. Google ads, Facebook, referral..."
                                        value={newSourceName}
                                        onChange={(e) => setNewSourceName(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <Button type="submit" disabled={isCreating} className="w-full">
                                    {isCreating ? "Creating..." : "Submit Source"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    <Card className="h-[calc(100vh-200px)] flex flex-col">
                        <CardHeader className="pb-4 border-b shrink-0">
                            <CardTitle className="text-lg">Integration Sources</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-auto flex-1 relative">
                            {loading && <div className="absolute inset-x-0 top-0"><HorizontalLoader /></div>}
                            {!loading && sources.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                    <p className="text-muted-foreground text-sm">No sources found. Create one to get started.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="font-semibold">Source Name</TableHead>
                                            <TableHead className="font-semibold w-[200px]">Created</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sources.map(source => (
                                            <TableRow key={source._id}>
                                                <TableCell className="font-medium">{source.name}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {new Date(source.createdAt).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
