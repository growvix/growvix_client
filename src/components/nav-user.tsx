"use client"

import { useState, useEffect } from "react"
import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
  Users,
  Loader2,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"
import axios from "axios"
import { API, API_URL, getSanitizedAvatarUrl } from "@/config/api"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { getCookie, setCookie, deleteAllAuthCookies } from "@/utils/cookies"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile, setLocked, setOpen, setOpenMobile } = useSidebar()

  // Helper to get user initials
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const initials = getInitials(user.name);
  const rawRole = getCookie('role');
  const role = rawRole?.toLowerCase();
  const token = getCookie("token");
  const org = getCookie("organization");

  const canImpersonate = role === 'admin' || role === 'manager';
  const [showSwitchAccount, setShowSwitchAccount] = useState(false);

  const avatarSrc = getSanitizedAvatarUrl(user.avatar);
  const [executives, setExecutives] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  // Check if we are currently impersonating
  const isAdminImpersonating = !!getCookie('admin_token');

  // Reset logic when switcher opens
  useEffect(() => {
    if (showSwitchAccount) {
      setExecutives([]);
    }
  }, [showSwitchAccount, role, token]);

  useEffect(() => {
    if (showSwitchAccount && canImpersonate && executives.length === 0) {
      const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
          // Use the main users endpoint. Backend handles org filtering via token.
          const response = await axios.get(`${API.USERS}?limit=500`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          const payload = response.data.data;
          let usersList = [];
          if (Array.isArray(payload)) {
            usersList = payload;
          } else if (payload && Array.isArray(payload.users)) {
            usersList = payload.users;
          } else if (payload && payload.data && Array.isArray(payload.data)) {
            usersList = payload.data;
          }

          const currentUserId = getCookie('user_id');
          const filteredList = usersList.filter((u: any) => {
            if (String(u._id) === String(currentUserId)) return false;
            const uRole = u.role?.toLowerCase();
            // Admins can see Managers and Users
            if (role === 'admin') return uRole === 'user' || uRole === 'manager';
            // Managers can see Users and other Managers in their org
            if (role === 'manager') return uRole === 'user' || uRole === 'manager';
            return false;
          });
          setExecutives(filteredList);
        } catch (error: any) {
          console.error("Failed to fetch accounts", error);
          const errMessage = error.response?.data?.message || "Failed to load accounts";
          toast.error(errMessage);
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [showSwitchAccount, role, token, canImpersonate, executives.length]);

  const handleImpersonate = async (targetUser: any) => {
    setSwitchingTo(targetUser._id);
    try {
      const token = getCookie("token");

      // Save admin session before impersonating
      if (canImpersonate && !isAdminImpersonating) {
        setCookie('admin_user_id', getCookie('user_id') as string);
        setCookie('admin_profile_id', getCookie('profile_id') as string);
        setCookie('admin_organization', getCookie('organization') as string);
        setCookie('admin_userName', getCookie('userName') as string);
        setCookie('admin_email', getCookie('email') as string);
        setCookie('admin_token', token as string);
        setCookie('admin_role', role as string);
        setCookie('admin_permissions', getCookie('permissions') as string);
      }

      const response = await axios.post(
        API.AUTH.IMPERSONATE,
        { targetUserId: targetUser._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data.data;

      setCookie('user_id', data.user_id);
      setCookie('profile_id', data.profile_id);
      setCookie('organization', data.organization);
      setCookie('userName', `${data.firstName} ${data.lastName}`);
      setCookie('email', data.email);
      setCookie('token', data.token);
      setCookie('role', data.role);
      setCookie('permissions', JSON.stringify(data.permissions || []));

      toast.success(`Switched to ${data.firstName} ${data.lastName}`);
      const redirectPath = data.role === 'admin' ? "/master_dashboard" : data.role === 'manager' ? "/management_dashboard" : data.role === 'cp_user' ? "/cp/dashboard" : "/executive_dashboard";
      window.location.href = redirectPath;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to switch account");
    } finally {
      setSwitchingTo(null);
    }
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isAdminImpersonating) {
      // Restore admin session
      setCookie('user_id', getCookie('admin_user_id') as string);
      setCookie('profile_id', getCookie('admin_profile_id') as string);
      setCookie('organization', getCookie('admin_organization') as string);
      setCookie('userName', getCookie('admin_userName') as string);
      setCookie('email', getCookie('admin_email') as string);
      setCookie('token', getCookie('admin_token') as string);
      setCookie('role', getCookie('admin_role') as string);
      setCookie('permissions', getCookie('admin_permissions') as string);

      const originalRole = getCookie('admin_role');

      // Clear admin cache cookies
      document.cookie = "admin_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "admin_profile_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "admin_organization=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "admin_userName=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "admin_email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "admin_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "admin_permissions=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      toast.success(originalRole === 'admin' ? "Returned to Master View" : "Returned to Management View");
      window.location.href = originalRole === 'admin' ? "/master_dashboard" : "/management_dashboard";
    } else {
      // Normal logout
      deleteAllAuthCookies();
    }
  };

  const filteredExecutives = executives.filter(exec =>
    `${exec.profile.firstName} ${exec.profile.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exec.profile_id?.toString().includes(searchQuery) ||
    (exec.teams && exec.teams.some((t: any) => t.teamName.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu onOpenChange={setLocked} modal={false}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className={cn("h-8 w-8 rounded-lg", isAdminImpersonating && "border-2 border-red-500 shadow-sm shadow-red-500/50")}>
                  <AvatarImage src={avatarSrc} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className={cn("h-8 w-8 rounded-lg", isAdminImpersonating && "border-2 border-red-500")}>
                    <AvatarImage src={avatarSrc} alt={user.name} />
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {canImpersonate && (
                  <DropdownMenuItem
                    onSelect={() => {
                      setOpen(false)
                      setOpenMobile(false)
                      setShowSwitchAccount(true)
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Users className="h-4 w-4" />
                    <span>Switch Account</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2"
                    onClick={() => {
                      setOpen(false)
                      setOpenMobile(false)
                    }}
                  >
                    <BadgeCheck />
                    <span>Account</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuItem asChild>

                {/* <Link
                  to="/updates"
                  className="flex items-center gap-2"
                  onClick={() => {
                    setOpen(false)
                    setOpenMobile(false)
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Updates</span>
                </Link>
                 */}

              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to={isAdminImpersonating ? "#" : "/login"}
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isAdminImpersonating ? "Return to Admin" : "Log out"}</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={showSwitchAccount} onOpenChange={setShowSwitchAccount}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col w-full">
          <DialogHeader>
            <DialogTitle>Switch Account</DialogTitle>
          </DialogHeader>

          <div className="mt-2 text-sm text-muted-foreground px-1 pb-2">
            <Input
              placeholder="Search by name, ID, or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto pr-2 pb-4 flex-1">
            {loadingUsers ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredExecutives.length === 0 ? (
              <p className="text-center text-muted-foreground p-4">No accounts found.</p>
            ) : (
              filteredExecutives.map(exec => (
                <button
                  key={exec._id}
                  onClick={() => handleImpersonate(exec)}
                  disabled={!!switchingTo}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-accent hover:text-accent-foreground text-left transition-colors disabled:opacity-50"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{exec.profile.firstName} {exec.profile.lastName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold uppercase tracking-wider">
                        {exec.role}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground flex gap-2">
                      <span>ID: #{exec.profile_id}</span>
                      <span>—</span>
                      <span>{(exec.teams && exec.teams.length > 0) ? exec.teams.map((t: any) => t.teamName).join(', ') : 'No Team'}</span>
                    </span>
                  </div>
                  {switchingTo === exec._id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
