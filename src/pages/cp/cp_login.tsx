import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, Loader2, GalleryVerticalEnd } from "lucide-react"
import { API } from "@/config/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { setCookie, deleteAllAuthCookies, isAuthenticated, getCookie } from "@/utils/cookies"
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function CpLoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

    useEffect(() => {
        if (isAuthenticated()) {
            const role = getCookie("role")
            if (role === "cp_user") {
                navigate("/cp/dashboard")
            } else {
                navigate("/executive_dashboard")
            }
        } else {
            deleteAllAuthCookies()
        }
    }, [navigate])

    const validateForm = (emailVal: string, passwordVal: string) => {
        const newErrors: { email?: string; password?: string } = {}
        if (!emailVal) {
            newErrors.email = "Email is required"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
            newErrors.email = "Invalid email"
        }
        if (!passwordVal) {
            newErrors.password = "Password is required"
        } else if (passwordVal.length < 6) {
            newErrors.password = "Minimum 6 characters"
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const trimmedEmail = email.trim()
        const trimmedPassword = password.trim()
        setEmail(trimmedEmail)
        setPassword(trimmedPassword)

        if (!validateForm(trimmedEmail, trimmedPassword)) return

        setIsLoading(true)
        try {
            const response = await axios.post(API.AUTH.CP_LOGIN, {
                email: trimmedEmail,
                password: trimmedPassword,
            })

            const data = response.data.data

            setCookie("user_id", data.user_id)
            setCookie("profile_id", data.profile_id)
            setCookie("organization", data.organization)
            setCookie("userName", `${data.firstName} ${data.lastName}`)
            setCookie("email", data.email)
            setCookie("token", data.token)
            setCookie("role", data.role || "cp_user")
            setCookie("user_type", "cp")
            setCookie("permissions", JSON.stringify(data.permissions || []))
            setCookie("allowed_projects", JSON.stringify(data.allowed_projects || []))

            toast.success("Login successful")
            navigate("/cp/dashboard")
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                "Unable to connect to the server."
            toast.error(errorMessage)
            setIsLoading(false)
        }
    }

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    <a href="#" className="flex items-center gap-2 font-medium">
                        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                            <GalleryVerticalEnd className="size-4" />
                        </div>
                        GROWVIX — Channel Partner
                    </a>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <form className={cn("flex flex-col gap-6")} onSubmit={handleSubmit}>
                            <FieldGroup>
                                <div className="flex flex-col items-center gap-1 text-center">
                                    <h1 className="text-2xl font-bold">Channel Partner Login</h1>
                                    <p className="text-muted-foreground text-sm text-balance">
                                        Enter your credentials to access your dashboard
                                    </p>
                                </div>
                                <Field>
                                    <FieldLabel htmlFor="email">Email</FieldLabel>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="partner@example.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value.trimStart())}
                                        onBlur={() => setEmail(email.trim())}
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </Field>
                                <Field>
                                    <div className="flex items-center">
                                        <FieldLabel htmlFor="password">Password</FieldLabel>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value.trimStart())}
                                            className="pr-10"
                                            onBlur={() => setPassword(password.trim())}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                                </Field>
                                <FieldSeparator>Channel Partner</FieldSeparator>
                                <Field>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Logging in...
                                            </>
                                        ) : (
                                            "Login"
                                        )}
                                    </Button>
                                </Field>
                            </FieldGroup>
                        </form>
                    </div>
                </div>
            </div>
            <div className="bg-muted relative hidden lg:block">
                <img
                    src="/assets/images/logoBanner.png"
                    alt="Image"
                    className="absolute inset-0 h-full w-full object-fit"
                />
            </div>
        </div>
    )
}
