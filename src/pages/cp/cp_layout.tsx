import { Outlet, useNavigate } from "react-router-dom"
import { GalleryVerticalEnd, LogOut, Moon, Sun, Edit, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCookie, deleteAllAuthCookies } from "@/utils/cookies"
import { useTheme } from "@/components/theme-provider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"

export default function CpLayout() {
    const navigate = useNavigate()
    const userName = getCookie("userName") || "Channel Partner"
    const { theme, setTheme } = useTheme()

    // Profile Modal State
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [firstName, setFirstName] = useState(userName.split(' ')[0] || "")
    const [lastName, setLastName] = useState(userName.split(' ').slice(1).join(' ') || "")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    const handleLogout = () => {
        deleteAllAuthCookies()
        navigate("/cp/login")
    }

    const handleCancel = () => {
        setFirstName(userName.split(' ')[0] || "")
        setLastName(userName.split(' ').slice(1).join(' ') || "")
        setEmail("")
        setPhone("")
        setNewPassword("")
        setConfirmPassword("")
    }

    const handleSave = () => {
        // Implementation for updating profile can go here
        setIsProfileOpen(false)
    }

    return (
        <ScrollArea className="h-svh">
            <div className="min-h-svh bg-background">
                {/* Header */}
                <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex h-14 items-center justify-between px-4 md:px-6">
                        {/* Logo */}
                        <div className="flex items-center gap-2 font-semibold cursor-pointer" onClick={() => navigate("/cp/dashboard")}>
                            <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
                                <GalleryVerticalEnd className="size-4" />
                            </div>
                            <span className="text-base uppercase tracking-wider">GROWVIX</span>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => navigate("/cp/bulk_upload")}
                                className="h-8 gap-1.5 px-3 mr-1"
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span className="hidden md:inline">Import Leads</span>
                            </Button>

                            <span 
                                className="text-sm text-muted-foreground hidden sm:flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors group"
                                onClick={() => setIsProfileOpen(true)}
                                title="Edit Profile"
                            >
                                Welcome, <span className="text-foreground font-medium group-hover:underline underline-offset-4">{userName}</span>
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

            {/* Profile Update Dialog */}
            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DialogContent 
                    className="sm:max-w-[700px] p-0 overflow-hidden" 
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <div className="p-6 sm:p-8">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl">Profile Update</DialogTitle>
                            <DialogDescription className="border-b pb-4 text-base mt-2">
                                View and edit your profile information.
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs defaultValue="account" className="w-full">
                            <TabsList className="w-full h-10 mb-8 bg-muted/50 rounded-lg p-1">
                                <TabsTrigger value="account" className="w-1/2 rounded-md transition-all">Account update</TabsTrigger>
                                <TabsTrigger value="password" className="w-1/2 rounded-md transition-all">Password update</TabsTrigger>
                            </TabsList>

                            <TabsContent value="account">
                                <div className="flex flex-col items-center gap-8 animate-in fade-in-50 zoom-in-95 duration-200">
                                    {/* Avatar */}
                                    <div className="relative group w-32 h-32">
                                        <Avatar className="w-full h-full ring-1 ring-offset-2 ring-border">
                                            <AvatarFallback className="text-4xl bg-muted">
                                                👤
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full backdrop-blur-sm">
                                            <span className="flex items-center gap-2 text-white font-medium">
                                                <Edit className="h-4 w-4" />
                                                <span>Edit</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="grid grid-cols-[120px_1fr] gap-x-6 gap-y-5 w-full max-w-lg">
                                        <div className="flex items-center justify-end">
                                            <Label htmlFor="firstName" className="text-right">First name</Label>
                                        </div>
                                        <div>
                                            <Input id="firstName" placeholder="Enter first name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                                        </div>

                                        <div className="flex items-center justify-end">
                                            <Label htmlFor="lastName" className="text-right">Last name</Label>
                                        </div>
                                        <div>
                                            <Input id="lastName" placeholder="Enter last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                        </div>

                                        <div className="flex items-center justify-end">
                                            <Label htmlFor="email" className="text-right">Email address</Label>
                                        </div>
                                        <div>
                                            <Input id="email" placeholder="Enter Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                        </div>

                                        <div className="flex items-center justify-end">
                                            <Label htmlFor="phone" className="text-right">Phone number</Label>
                                        </div>
                                        <div>
                                            <Input id="phone" placeholder="Enter Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="password">
                                <div className="flex flex-col items-center mt-8 animate-in fade-in-50 zoom-in-95 duration-200">
                                    <div className="grid grid-cols-[160px_1fr] gap-x-6 gap-y-6 w-full max-w-lg">
                                        <div className="flex items-center justify-end">
                                            <Label htmlFor="newPassword">New password</Label>
                                        </div>
                                        <div>
                                            <Input 
                                                id="newPassword" 
                                                type={showPassword ? "text" : "password"} 
                                                placeholder="Enter new password" 
                                                value={newPassword} 
                                                onChange={(e) => setNewPassword(e.target.value)} 
                                            />
                                        </div>

                                        <div className="flex items-center justify-end">
                                            <Label htmlFor="confirmPassword">Confirm password</Label>
                                        </div>
                                        <div>
                                            <Input 
                                                id="confirmPassword" 
                                                type={showPassword ? "text" : "password"} 
                                                placeholder="Enter Confirm new password" 
                                                value={confirmPassword} 
                                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                            />
                                        </div>

                                        <div className="col-start-2">
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="checkbox" 
                                                    id="show-password" 
                                                    className="rounded border-gray-300 w-4 h-4 accent-primary"
                                                    checked={showPassword}
                                                    onChange={(e) => setShowPassword(e.target.checked)}
                                                />
                                                <Label htmlFor="show-password" className="font-normal cursor-pointer text-sm">Show password</Label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="flex justify-end gap-3 mt-10 pt-5 border-t">
                            <Button variant="ghost" onClick={handleCancel}>Reset</Button>
                            <Button onClick={handleSave}>Save Changes</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </ScrollArea>
    )
}
