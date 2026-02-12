import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] w-full flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-sm text-muted-foreground mb-6">
            The page you're looking for doesn't exist.
          </p>
          <Link href="/">
            <Button data-testid="button-go-home">Back to Home</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
