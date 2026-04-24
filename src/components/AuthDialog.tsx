import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

const BASE_URL = "http://127.0.0.1:8000";

export function AuthDialog() {
  const { login } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const endpoint = isRegisterMode ? "/api/register" : "/api/login";
    
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      login(data.access_token);
      toast.success(isRegisterMode ? "Registered successfully!" : "Welcome back!");
      setIsOpen(false);
      setEmail("");
      setPassword("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LogIn className="w-4 h-4" />
          Sign In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isRegisterMode ? "Create an account" : "Sign In"}</DialogTitle>
          <DialogDescription>
            {isRegisterMode 
              ? "Join CivicSense to track your impact on the community."
              : "Welcome back! Enter your details to access your reports."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid py-4 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="citizen@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? "Please wait..." : (isRegisterMode ? "Register" : "Sign In")}
          </Button>
        </form>
        <div className="text-center text-sm text-muted-foreground mt-2">
          {isRegisterMode ? "Already have an account? " : "Don't have an account? "}
          <button 
            type="button"
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className="text-primary hover:underline font-medium"
          >
            {isRegisterMode ? "Sign In" : "Register"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
