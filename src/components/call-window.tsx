function openIVRCall() {
  const width = 420;
  const height = 640;

  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;

  window.open(
    "/ivr-call", // your IVR page route
    "IVRCallWindow",
    `width=${width},
       height=${height},
       top=${top},
       left=${left},
       resizable=no,
       scrollbars=no,
       toolbar=no,
       menubar=no,
       location=no,
       status=no`
  );
}

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PhoneCall, Mic, MicOff, Volume2, VolumeX, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "@/config/api";

const CUSTOMER_NUMBER = "9360405951";

export default function CallWindow() {
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [callActive, setCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState<"calling" | "connected" | "failed" | "ended">("calling");
  const [error, setError] = useState<string | null>(null);

  // Initiate call on component mount
  useEffect(() => {
    const initiateCall = async () => {
      try {
        setCallStatus("calling");
        const response = await axios.post(`${API_URL}/api/call`, {
          customerNumber: CUSTOMER_NUMBER
        });
        if (response.data.success) {
          setCallStatus("connected");
          setCallActive(true);
          console.log("Call initiated:", response.data);
        } else {
          setCallStatus("failed");
          setError(response.data.message || "Failed to initiate call");
        }
      } catch (err: any) {
        console.error("Call error:", err);
        setCallStatus("failed");
        setError(err.response?.data?.message || err.message || "Failed to initiate call");
      }
    };

    initiateCall();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-muted/30">
      <Card className="w-[360px] rounded-2xl shadow-2xl border border-border/50 backdrop-blur">

        {/* Header */}
        <CardHeader className="flex flex-col items-center gap-3 pt-8">
          <div className="relative">
            <Avatar className="size-20 ring-4 ring-primary/30 shadow-lg">
              <AvatarFallback className="text-3xl font-bold tracking-wide">
                {callStatus === "calling" ? <Loader2 className="size-8 animate-spin" /> : "IV"}
              </AvatarFallback>
            </Avatar>

            {/* Call pulse */}
            {callActive && (
              <span className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
            )}
          </div>

          <CardTitle className="text-xl font-semibold tracking-tight">
            {callStatus === "calling" ? "Initiating Call..." :
              callStatus === "connected" ? "Call Connected" :
                callStatus === "failed" ? "Call Failed" : "Call Ended"}
          </CardTitle>

          <span className={`text-xs px-3 py-1 rounded-full ${callStatus === "calling" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" :
            callStatus === "connected" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" :
              callStatus === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" :
                "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300"
            }`}>
            {callStatus === "calling" ? "Connecting..." :
              callStatus === "connected" ? "Connected" :
                callStatus === "failed" ? "Failed" : "Ended"}
          </span>

          {error && (
            <div className="text-xs text-red-500 text-center px-4">
              {error}
            </div>
          )}
        </CardHeader>

        {/* Body */}
        <CardContent className="flex flex-col items-center gap-5 mt-4">
          <div className="text-sm text-muted-foreground tracking-wide">
            +91 {CUSTOMER_NUMBER.slice(0, 5)} {CUSTOMER_NUMBER.slice(5)}
          </div>

          <div className="flex gap-6">
            <Button
              variant={muted ? "secondary" : "outline"}
              size="icon"
              className="size-14 rounded-full"
              onClick={() => setMuted((m) => !m)}
            >
              {muted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
            </Button>

            <Button
              variant={speaker ? "secondary" : "outline"}
              size="icon"
              className="size-14 rounded-full"
              onClick={() => setSpeaker((s) => !s)}
            >
              {speaker ? <Volume2 className="size-6" /> : <VolumeX className="size-6" />}
            </Button>
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="flex flex-col items-center gap-3 pb-8">
          <Button
            variant="destructive"
            className="size-18 rounded-full shadow-lg hover:scale-105 transition"
            onClick={() => {
              setCallActive(false);
              setCallStatus("ended");
              setTimeout(() => {
                window.close();
              }, 1500);
            }}
          >
            <X className="size-7" />
          </Button>

          {!callActive && (
            <div className="text-sm text-red-500 font-medium">
              Call Ended
            </div>
          )}
        </CardFooter>
      </Card>
    </div>

  );
}
