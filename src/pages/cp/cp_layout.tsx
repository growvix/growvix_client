import { Outlet, useNavigate } from "react-router-dom"
import { GalleryVerticalEnd, LogOut, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCookie, deleteAllAuthCookies } from "@/utils/cookies"
import { useTheme } from "@/components/theme-provider"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function CpLayout() {
    const navigate = useNavigate()
    const userName = getCookie("userName") || "Channel Partner"
    const { theme, setTheme } = useTheme()

    const handleLogout = () => {
        deleteAllAuthCookies()
        navigate("/cp/login")
    }

    return (
        <ScrollArea className="h-svh">
            <div className="min-h-svh bg-background">
                {/* Header */}
                <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex h-14 items-center justify-between px-4 md:px-6">
                        {/* Logo */}
                        <div className="flex items-center gap-2 font-semibold">
                            <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
                                <GalleryVerticalEnd className="size-4" />
                            </div>
                            <span className="text-base">GROWVIX</span>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground hidden sm:inline-block">
                                Welcome, <span className="text-foreground font-medium">{userName}</span>
                            </span>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            >
                                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                                className="gap-1.5"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1">
                    <Outlet />
                </main>
            </div>
        </ScrollArea>
    )
}
