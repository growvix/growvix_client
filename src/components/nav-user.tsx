"use client"

import { useState, useEffect, useRef } from "react"
import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
  Users,
  Loader2,
  Sparkles,
  MessageSquareWarning,
  ImagePlus,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
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
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

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

// Types
interface SupportTicket {
  _id: string
  uuid: string
  subject: string
  description: string
  screenshots: string[]
  status: 'pending' | 'in_progress' | 'completed'
  createdBy: { userId: string; userName: string }
  createdAt: string
  updatedAt: string
}

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

  // ─── Support Ticket State ────────────────────────────────────
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const [supportTab, setSupportTab] = useState<'create' | 'tickets'>('create');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketScreenshots, setTicketScreenshots] = useState<string[]>([]);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

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

      const response = await axios.post(
        API.AUTH.IMPERSONATE,
        { targetUserId: targetUser._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data.data;

      // Save admin session ONLY AFTER successful impersonation
      if (canImpersonate && !isAdminImpersonating) {
        setCookie('admin_user_id', getCookie('user_id') as string);
        setCookie('admin_profile_id', getCookie('profile_id') as string);
        setCookie('admin_organization', getCookie('organization') as string);
        setCookie('admin_userName', getCookie('userName') as string);
        setCookie('admin_email', getCookie('email') as string);
        setCookie('admin_token', token as string);
        setCookie('admin_role', getCookie('role') as string);
        setCookie('admin_permissions', getCookie('permissions') as string);
      }

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
      // Ensure we clear any half-set admin cookies if something went wrong before the redirect
      if (!isAdminImpersonating) {
        const adminCookies = ['admin_user_id', 'admin_profile_id', 'admin_organization', 'admin_userName', 'admin_email', 'admin_token', 'admin_role', 'admin_permissions'];
        adminCookies.forEach(name => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });
      }
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

  // ─── Support Ticket Handlers ─────────────────────────────────

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const userId = getCookie('user_id');
      const response = await axios.get(API.SUPPORT_TICKETS, {
        params: { organization: org, userId }
      });
      setTickets(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (showSupportDialog && supportTab === 'tickets') {
      fetchTickets();
    }
  }, [showSupportDialog, supportTab]);

  const handleScreenshotUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const invalidFile = fileArray.find(f => !allowedTypes.includes(f.type));
    if (invalidFile) {
      toast.error('Only image files (PNG, JPEG, JPG, WebP) are allowed');
      return;
    }

    if (ticketScreenshots.length + fileArray.length > 5) {
      toast.error(`Maximum 5 screenshots allowed. You can add ${5 - ticketScreenshots.length} more.`);
      return;
    }

    setUploadingScreenshot(true);
    const formData = new FormData();
    fileArray.forEach(file => formData.append('images', file));

    try {
      const response = await axios.post(API.UPLOAD.FLOOR_PLANS, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newUrls = response.data.data.urls;
      setTicketScreenshots(prev => [...prev, ...newUrls].slice(0, 5));
      toast.success(`${newUrls.length} screenshot(s) uploaded`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload screenshot');
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleSubmitTicket = async () => {
    if (!ticketSubject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!ticketDescription.trim()) {
      toast.error('Please describe the issue');
      return;
    }

    setSubmittingTicket(true);
    try {
      const userId = getCookie('user_id');
      const userName = getCookie('userName') || 'User';

      await axios.post(API.SUPPORT_TICKETS, {
        subject: ticketSubject.trim(),
        description: ticketDescription.trim(),
        screenshots: ticketScreenshots,
        userId,
        userName,
      }, {
        params: { organization: org }
      });

      toast.success('Support ticket submitted successfully!');
      // Reset form
      setTicketSubject('');
      setTicketDescription('');
      setTicketScreenshots([]);
      // Switch to tickets tab to show the new ticket
      setSupportTab('tickets');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-500 bg-yellow-500/10 gap-1 text-[10px]">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-500 bg-blue-500/10 gap-1 text-[10px]">
            <AlertCircle className="h-3 w-3" />
            In Progress
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="text-green-600 border-green-500 bg-green-500/10 gap-1 text-[10px]">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
                <DropdownMenuItem
                  onSelect={() => {
                    setOpen(false)
                    setOpenMobile(false)
                    setSupportTab('create')
                    setShowSupportDialog(true)
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <MessageSquareWarning className="h-4 w-4" />
                  <span>Report Issue</span>
                </DropdownMenuItem>
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

      {/* Switch Account Dialog */}
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

      {/* Support Issue Ticket Dialog */}
      <Dialog open={showSupportDialog} onOpenChange={(open) => {
        setShowSupportDialog(open);
        if (!open) {
          // Reset form when closing
          setTicketSubject('');
          setTicketDescription('');
          setTicketScreenshots([]);
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareWarning className="h-5 w-5 text-primary" />
              Support
            </DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg shrink-0">
            <button
              onClick={() => setSupportTab('create')}
              className={cn(
                "flex-1 text-sm font-medium py-1.5 px-3 rounded-md transition-all",
                supportTab === 'create'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Report Issue
            </button>
            <button
              onClick={() => setSupportTab('tickets')}
              className={cn(
                "flex-1 text-sm font-medium py-1.5 px-3 rounded-md transition-all",
                supportTab === 'tickets'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              My Tickets
            </button>
          </div>

          {/* Tab Content */}
          {supportTab === 'create' ? (
            <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">
              {/* Subject */}
              <div className="space-y-1.5">
                <Label htmlFor="ticket-subject" className="text-sm font-medium">Subject *</Label>
                <Input
                  id="ticket-subject"
                  placeholder="Brief summary of the issue..."
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="ticket-description" className="text-sm font-medium">Description *</Label>
                <Textarea
                  id="ticket-description"
                  placeholder="Describe the issue in detail. Include steps to reproduce, expected behavior, and what actually happened..."
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  className="min-h-[150px] resize-none"
                />
              </div>

              {/* Screenshots */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Screenshots (optional, max 5)</Label>

                {/* Preview grid */}
                {ticketScreenshots.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {ticketScreenshots.map((url, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                        <img src={url} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setTicketScreenshots(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {ticketScreenshots.length < 5 && (
                  <div
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                    onClick={() => screenshotInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {uploadingScreenshot ? (
                        <div className="flex items-center gap-2 text-sm text-primary">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </div>
                      ) : (
                        <>
                          <ImagePlus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                          <p className="text-xs text-muted-foreground">Click to upload screenshots</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <input
                  ref={screenshotInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleScreenshotUpload(e.target.files);
                    e.target.value = '';
                  }}
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmitTicket}
                disabled={submittingTicket || !ticketSubject.trim() || !ticketDescription.trim()}
                className="w-full"
              >
                {submittingTicket ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</>
                ) : (
                  'Submit Ticket'
                )}
              </Button>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              {loadingTickets ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquareWarning className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No tickets submitted yet</p>
                  <p className="text-xs mt-1">Report an issue to get started</p>
                </div>
              ) : (
                <div className="space-y-3 pr-3">
                  {tickets.map((ticket) => (
                    <div key={ticket._id} className="border rounded-lg p-3 space-y-2 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium leading-tight flex-1">{ticket.subject}</h4>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>
                      {ticket.screenshots && ticket.screenshots.length > 0 && (
                        <div className="flex gap-1.5">
                          {ticket.screenshots.map((url, idx) => (
                            <div key={idx} className="h-10 w-10 rounded border overflow-hidden shrink-0">
                              <img src={url} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
