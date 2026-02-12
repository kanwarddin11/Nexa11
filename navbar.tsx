import { Link, useLocation } from "wouter";
import { Shield, History, Zap, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  const [location] = useLocation();

  return (
    <nav className="sticky top-0 z-[1000] border-b border-primary/30 bg-card/80 dark:bg-background/50 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between gap-4 h-14">
        <Link href="/" data-testid="link-home">
          <div className="flex items-center gap-2 cursor-pointer">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-2xl font-black tracking-tighter">
              NeXA <span className="text-foreground">TRUTH</span>
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/">
            <Button
              variant={location === "/" ? "secondary" : "ghost"}
              className="font-bold uppercase text-xs tracking-widest"
              data-testid="link-verify"
            >
              <Zap className="w-4 h-4 mr-1.5" />
              Verify
            </Button>
          </Link>
          <Link href="/history">
            <Button
              variant={location === "/history" ? "secondary" : "ghost"}
              className="font-bold uppercase text-xs tracking-widest"
              data-testid="link-history"
            >
              <History className="w-4 h-4 mr-1.5" />
              History
            </Button>
          </Link>
          <Link href="/admin">
            <Button
              variant="default"
              className="font-bold uppercase text-xs tracking-widest rounded-full"
              data-testid="link-admin"
            >
              Admin
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
