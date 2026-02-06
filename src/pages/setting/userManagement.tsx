import { useState, useMemo, useEffect } from "react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { useBreadcrumb } from "@/context/breadcrumb-context"
import UserTable from "@/pages/setting/user_table"

export default function UserManagement() {
    const org = getCookie("organization");

    const { setBreadcrumbs } = useBreadcrumb()

    useEffect(() => {
        setBreadcrumbs([
            { label: "Settings", href: "/settings" },
            { label: "User Management" }])
    }, [setBreadcrumbs])
    const [open, setOpen] = useState(false)
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: "",
        role: ""
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target
        // Map HTML ids to state keys
        const key = id === "first-name" ? "firstName" : id === "last-name" ? "lastName" : id === "phone-number" ? "phoneNumber" : id
        setFormData(prev => ({ ...prev, [key]: value }))
    }

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, role: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            // Construct payload to match backend schema (IUser structure)
            const payload = {
                phoneNumber: formData.phoneNumber || "0000000000",
                organization: org,
                profile: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                },
                password: formData.password,
                role: formData.role || "user"
            }
            console.log(payload);


            const response = await axios.post('http://localhost:3000/api/auth/register', payload)
            console.log("User created:", response.data)

            // Close the sheet and reset form on success
            setOpen(false)
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phoneNumber: "",
                password: "",
                role: ""
            })
        } catch (error) {
            console.error("Error creating user:", error)
            if (axios.isAxiosError(error) && error.response) {
                console.error("Server responded with:", error.response.data);
                alert(`Errors: ${error.response.data.message || "Failed to create user"}`);
            }
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-4 px-3">
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild><Button>Add User</Button></SheetTrigger>
                <SheetContent className="w-xl px-5">
                    <SheetHeader>
                        <SheetTitle>Add New User</SheetTitle>
                        <SheetDescription>
                            Enter the details below to create a new user account.
                        </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="first-name">First Name</Label>
                                <Input
                                    id="first-name"
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="last-name">Last Name</Label>
                                <Input
                                    id="last-name"
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john.doe@example.com"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone-number">Phone Number</Label>
                            <Input
                                id="phone-number"
                                placeholder="+1 234 567 890"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select onValueChange={handleSelectChange} value={formData.role}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="user">User</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="mt-4">Create User</Button>
                    </form>
                </SheetContent>
            </Sheet>
            <UserTable initialPageSize={15} />
        </div>
    )
}