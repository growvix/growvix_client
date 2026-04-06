import { useTheme } from "@/components/theme-provider"
import { LoginForm } from "@/components/login-form"

// Import logo assets
import lightLogo from "@/assets/logo/light.png"
import darkLogo from "@/assets/logo/dark.png"

export default function LoginPage() {
  const { theme } = useTheme()

  // Determine if we should show dark variant
  const isDark = theme === "dark" || 
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  const smallLogo = isDark ? darkLogo : lightLogo

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-3">
            <div className="flex aspect-square size-10 items-center justify-center">
              <img 
                src={smallLogo} 
                alt="Logo" 
                className="size-10 object-contain"
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-xl font-bold leading-none tracking-tight text-black dark:text-white">GROWVIX</span>
              <span className="text-xs font-medium text-muted-foreground mt-0.5">CRM</span>
            </div>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
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
