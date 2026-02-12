import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: session } = useQuery<{ authenticated: boolean }>({
    queryKey: ["/api/admin/session"],
  });

  useEffect(() => {
    if (session?.authenticated) {
      navigate("/admin");
    }
  }, [session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/admin/login", { username, password });
      const data = await res.json();
      if (data.success) {
        queryClient.setQueryData(["/api/admin/session"], { authenticated: true });
        navigate("/admin");
      }
    } catch {
      toast({
        title: "Access Denied",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="bg-card/50 dark:bg-white/5 p-10 rounded-[2rem] border border-primary/20 backdrop-blur-xl w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <Shield className="w-10 h-10 text-primary mb-3" />
          <h2 className="text-primary text-3xl font-black tracking-tighter text-center">
            NeXA ADMIN
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full bg-background/50 dark:bg-black/50 border border-border dark:border-white/10 p-4 rounded-2xl text-foreground outline-none focus:border-primary transition-colors"
            data-testid="input-admin-username"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-background/50 dark:bg-black/50 border border-border dark:border-white/10 p-4 rounded-2xl text-foreground outline-none focus:border-primary transition-colors"
            data-testid="input-admin-password"
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="w-4 h-4 accent-primary bg-background dark:bg-black border-border dark:border-white/10 rounded focus:ring-primary"
              data-testid="checkbox-remember-device"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-muted-foreground">Remember this device</label>
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full font-black text-lg rounded-2xl"
            data-testid="button-admin-login"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "LOGIN TO COMMAND"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
