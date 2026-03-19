import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { getCookie } from "@/utils/cookies"
import { API } from "@/config/api"
import { encodeProjectId } from "@/utils/idEncoder"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Layers, Package } from "lucide-react"

interface AllowedProject {
    project_id: number
    project_name: string
}

interface ProjectDetail {
    product_id: number
    name: string
    location: string
    property: string
    totalUnits?: number
    bookedCount?: number
    blockCount?: number
}

export default function CpDashboard() {
    const navigate = useNavigate()
    const [projects, setProjects] = useState<ProjectDetail[]>([])
    const [loading, setLoading] = useState(true)

    const fetchProjectDetails = useCallback(async () => {
        try {
            setLoading(true)
            const raw = getCookie("allowed_projects")
            const organization = getCookie("organization")
            const token = getCookie("token")

            if (!raw || !organization) {
                setProjects([])
                setLoading(false)
                return
            }

            let allowedProjects: AllowedProject[] = []
            try {
                allowedProjects = JSON.parse(decodeURIComponent(raw))
            } catch {
                setProjects([])
                setLoading(false)
                return
            }

            if (allowedProjects.length === 0) {
                setProjects([])
                setLoading(false)
                return
            }

            // Fetch full project list and filter by allowed IDs
            const res = await axios.get(`${API.PROJECTS}?organization=${organization}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const allProjects: ProjectDetail[] = res.data.data || []
            const allowedIds = new Set(allowedProjects.map(p => p.project_id))
            const filtered = allProjects.filter(p => allowedIds.has(p.product_id))
            setProjects(filtered)
        } catch (err) {
            console.error("Failed to fetch projects:", err)
            setProjects([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProjectDetails()
    }, [fetchProjectDetails])

    const handleProjectClick = (project: ProjectDetail) => {
        const encodedId = encodeProjectId(project.product_id)
        navigate(`/cp/project?id=${encodedId}`)
    }

    const getPropertyIcon = (property: string) => {
        switch (property) {
            case "plots":
                return <Layers className="h-5 w-5" />
            default:
                return <Building2 className="h-5 w-5" />
        }
    }

    return (
        <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Your accessible inventory projects
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <Card>
                    <CardContent className="flex items-center gap-3 py-4">
                        <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                            <Package className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{projects.length}</p>
                            <p className="text-xs text-muted-foreground">Total Projects</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3 py-4">
                        <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {projects.reduce((sum, p) => sum + (p.totalUnits || 0), 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">Total Units</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3 py-4">
                        <div className="p-2.5 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {projects.reduce((sum, p) => sum + (p.bookedCount || 0), 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">Booked Units</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Project Cards */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-muted p-6 rounded-2xl shadow-sm mb-4">
                        <Package className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No Projects Available</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        You don't have access to any inventory projects yet. Contact your administrator to get project access.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {projects.map((project) => (
                        <Card
                            key={project.product_id}
                            className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30"
                            onClick={() => handleProjectClick(project)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        {getPropertyIcon(project.property)}
                                    </div>
                                    <Badge variant="outline" className="capitalize text-xs">
                                        {project.property || "—"}
                                    </Badge>
                                </div>
                                <CardTitle className="text-base mt-3 group-hover:text-primary transition-colors">
                                    {project.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {project.location && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                                        <MapPin className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{project.location}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 pt-2 border-t">
                                    {project.totalUnits != null && (
                                        <div className="text-xs">
                                            <span className="font-semibold text-foreground">{project.totalUnits}</span>
                                            <span className="text-muted-foreground ml-1">units</span>
                                        </div>
                                    )}
                                    {project.blockCount != null && (
                                        <div className="text-xs">
                                            <span className="font-semibold text-foreground">{project.blockCount}</span>
                                            <span className="text-muted-foreground ml-1">blocks</span>
                                        </div>
                                    )}
                                    {project.bookedCount != null && project.bookedCount > 0 && (
                                        <Badge className="ml-auto text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 hover:bg-orange-200">
                                            {project.bookedCount} booked
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
