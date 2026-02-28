import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState } from "react";
import { Label } from "@/components/ui/label"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
const defaultUser = {
  name: "John Doe",
  icon: "👤"
};

export default function ProfilePage() {
  const [user, setUser] = useState(defaultUser);
  const [name, setName] = useState(user.name);
  const [icon, setIcon] = useState(user.icon);
  const [editing, setEditing] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleCancel = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSave = () => {
    setUser({ name, icon });
    setEditing(false);
  };
  const [showPassword, setShowPassword] = useState(false);

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="px-3 flex justify-center mt-10">
      <Card className="w-3xl">
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
                <div className="relative group w-35 h-35">
                  <Avatar className="w-35 h-35 ring-1 ring-offset-1 ring-ring border-x">
                    <AvatarFallback className="text-4xl">{user.icon}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                    <span className="flex items-center gap-2 text-white">
                      <Edit />
                      <span>Edit</span>
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
              <div className="flex justify-end gap-3">
                <Button variant={"ghost"} onClick={handleCancel}>Reset</Button>
                <Button variant="default" className="" onClick={handleSave}>Save Changes</Button>
              </div>
            </TabsContent>
          </Tabs>

        </CardContent>
        {/*<CardFooter className="flex justify-end gap-3">
          <Button variant={"ghost"} onClick={handleCancel}>Reset</Button>
          <Button variant="default" className="" onClick={handleSave}>Save Changes</Button>
        </CardFooter>*/}
      </Card>
    </div>
  );
}
