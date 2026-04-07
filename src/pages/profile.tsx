import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, X, Loader2 } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useNavigate } from "react-router-dom";
import { getCookie, setCookie } from "@/utils/cookies";
import { API, getSanitizedAvatarUrl } from "@/config/api";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const userId = getCookie("user_id");
  const token = getCookie("token");
  const isAdminImpersonating = !!getCookie("admin_token");

  useEffect(() => {
    // Fetch user data
    if (!userId) {
        setLoading(false);
        return;
    }

    const fetchUser = async () => {
      try {
        const response = await axios.get(API.getUser(userId as string), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const profile = response.data.data.profile;
        setFirstName(profile.firstName || "");
        setLastName(profile.lastName || "");
        setEmail(profile.email || "");
        setPhone(profile.phone || "");
        if (profile.profileImagePath) {
          setAvatarUrl(profile.profileImagePath);
          if (userId) localStorage.setItem(`userAvatar_${userId}`, profile.profileImagePath);
        }
      } catch (err) {
        console.error("Failed to fetch user data", err);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId, token]);

  const handleCancel = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        profile: {
          firstName,
          lastName,
          email,
          phone,
          profileImagePath: avatarUrl
        }
      };
      await axios.put(API.updateUser(userId as string), payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Profile updated successfully");
      if (avatarUrl && userId) localStorage.setItem(`userAvatar_${userId}`, avatarUrl);
      // Update the userName cookie so the sidebar reflects changes immediately
      setCookie('userName', `${firstName} ${lastName}`);
      
      // Notify other components of the profile update
      window.dispatchEvent(new Event('profileUpdate'));
      
      navigate(-1);
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const uploadUrl = avatarUrl && avatarUrl !== '/user_icon.png'
        ? `${API.UPLOAD.PROFILE_PICTURE}?oldUrl=${encodeURIComponent(avatarUrl)}`
        : API.UPLOAD.PROFILE_PICTURE;
      const response = await axios.post(uploadUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });
      const url = response.data.data.url;
      setAvatarUrl(url);
      if (userId) localStorage.setItem(`userAvatar_${userId}`, url);
      
      // Automatically save the updated avatar URL to the user profile
      await axios.put(API.updateUser(userId as string), {
        profile: { firstName, lastName, email, phone, profileImagePath: url }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Notify other components (like Sidebar/NavUser) of the profile update
      window.dispatchEvent(new Event('profileUpdate'));
      
      toast.success("Profile picture updated successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to upload profile picture");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="px-3 flex justify-center mt-10 min-h-[calc(100vh-100px)] cursor-default" 
    >
      <Card className="w-3xl h-fit mb-10 relative" onClick={(e) => e.stopPropagation()}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          onClick={() => navigate(-1)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
        <CardHeader>
          <CardTitle>Profile Update</CardTitle>
          <CardDescription className="border-b pb-2">View and edit your profile information.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Tabs defaultValue="account">
            <TabsList className="w-full h-10 mb-7">
              <TabsTrigger value="account">Account update</TabsTrigger>
              <TabsTrigger value="password">Password update</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <div className="flex justify-center">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
                <div className="relative group w-35 h-35">
                  <Avatar className={cn("w-35 h-35 ring-1 ring-offset-1 ring-ring border-x", isAdminImpersonating && "border-2 border-red-500 shadow-sm shadow-red-500/50")}>
                    <AvatarImage src={getSanitizedAvatarUrl(avatarUrl)} alt="Avatar" />
                    <AvatarFallback className="text-6xl">
                      {firstName && lastName ? `${firstName[0]}${lastName[0]}`.toUpperCase() : "👤"}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={cn(
                        "absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full",
                        uploading && "opacity-100 cursor-not-allowed"
                    )}
                  >
                    <span className="flex items-center gap-2 text-white">
                      {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Edit />}
                      <span>{uploading ? "Uploading" : "Edit"}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="grid grid-cols-3 mt-6 gap-y-4 gap-x-6 w-xl">
                  <div className="col-span-1 flex justify-end">
                    <Label htmlFor="First name" className="text-md mb-1 ms-1">
                      First name
                    </Label>
                  </div>
                  <div className="col-span-2">
                    <Input
                      id="First name"
                      placeholder="Enter first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Label htmlFor="Last name" className="text-md mb-1 ms-1">
                      Last name
                    </Label>
                  </div>
                  <div className="col-span-2">
                    <Input
                      id="Last name"
                      placeholder="Enter last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Label htmlFor="Email" className="text-md mb-1 ms-1">
                      Email address
                    </Label>
                  </div>
                  <div className="col-span-2">
                    <Input
                      id="Email"
                      placeholder="Enter Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Label htmlFor="Phone number" className="text-md mb-1 ms-1">
                      Phone number
                    </Label>
                  </div>
                  <div className="col-span-2">
                    <Input
                      id="Phone number"
                      placeholder="Enter Phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="password">
              <div className="flex justify-center">
              </div>
              <div className="flex justify-center">
                <div className="grid grid-cols-3 mt-1 gap-y-4 gap-x-6 w-xl">
                  <div className="col-span-1 flex justify-end">
                    <Label htmlFor="new password" className="text-md mb-1 ms-1">
                      New password
                    </Label>
                  </div>
                  <div className="col-span-2">
                    <Input
                      id="new password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Label htmlFor="Confirm new password" className="text-md mb-1 ms-1">
                      Confirm password
                    </Label>
                  </div>
                  <div className="col-span-2">
                    <Input
                      id="Confirm new password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 grid grid-cols-2">
                    <div></div>
                    <div className="flex items-center gap-2 ps-3.5">
                      <input
                        type="checkbox"
                        id="show-password"
                        onChange={(e) => setShowPassword(e.target.checked)}
                        checked={showPassword}
                      />
                      <Label htmlFor="show-password">
                        Show password
                      </Label>
                    </div>
                  </div>
                </div>
              </div> 
            </TabsContent>
          </Tabs>

        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button variant={"ghost"} onClick={handleCancel}>Reset</Button>
          <Button variant="default" className="" disabled={saving} onClick={handleSave}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
