import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { API } from "@/config/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { setCookie, deleteAllAuthCookies, isAuthenticated } from "@/utils/cookies"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  // Clear all cookies when login page loads and redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/executive_dashboard");
    } else {
      deleteAllAuthCookies();
    }
  }, [navigate]);
  const validateForm = (emailVal: string, passwordVal: string) => {
    let newErrors: any = {}

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

    // Update state with trimmed values so form reflects submitted data
    setEmail(trimmedEmail)
    setPassword(trimmedPassword)

    // Validate form using trimmed variables
    if (!validateForm(trimmedEmail, trimmedPassword)) {
      return
    }

    setIsLoading(true)

  try {
    const response = await axios.post(API.AUTH.LOGIN, {
      email: trimmedEmail,
      password: trimmedPassword
    })

    const data = response.data.data

    setCookie('user_id', data.user_id);
    setCookie('profile_id', data.profile_id);
    setCookie('organization', data.organization);
    setCookie('userName', `${data.firstName} ${data.lastName}`);
    setCookie('email', data.email);
    setCookie('token', data.token);
    setCookie('role', data.role);
    setCookie('permissions', JSON.stringify(data.permissions || []));

    toast.success("Login successful")
    navigate("/executive_dashboard")

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
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => {
              const val = e.target.value;
              setEmail(val.trimStart()); // actively remove leading spaces
            }}
            onBlur={() => setEmail(email.trim())}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => {
                  const val = e.target.value;
                  setPassword(val.trimStart()); // actively remove leading spaces
              }}
              className="pr-10 [::-ms-reveal]:hidden [::-ms-clear]:hidden [::-webkit-contacts-auto-fill-button]:hidden"
              onBlur={() => setPassword(password.trim())}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </Field>
        <FieldSeparator>EL-ROI</FieldSeparator>
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
  )
}
