import { useQuery, useMutation } from "@tanstack/react-query";
import { History, Trash2, Bookmark, BookmarkCheck, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ScoreRing, getVerdictInfo } from "@/components/score-ring";
import type { Verification } from "@shared/schema";

export default function HistoryPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: verifications, isLoading } = useQuery<Verification[]>({
    queryKey: ["/api/verifications"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/verifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/verifications"] });
      toast({ title: "Verification removed" });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async ({ id, isBookmarked }: { id: number; isBookmarked: boolean }) => {
      await apiRequest("PATCH", `/api/verifications/${id}`, { isBookmarked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/verifications"] });
    },
  });

  const filtered = verifications?.filter((v) =>
    v.inputText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.verdict.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <History className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Verification History</h1>
          {verifications && (
            <Badge variant="secondary" className="text-xs">
              {verifications.length} total
            </Badge>
          )}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search past verifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-history"
          />
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-16 h-16 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filtered && filtered.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-1">
                {searchTerm ? "No matches found" : "No verifications yet"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {searchTerm
                  ? "Try adjusting your search terms."
                  : "Start by verifying some news on the home page."}
              </p>
            </CardContent>
          </Card>
        )}

        {filtered && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((v) => {
              const verdictInfo = getVerdictInfo(v.credibilityScore);
              return (
                <Card key={v.id} data-testid={`card-verification-${v.id}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 hidden sm:block">
                        <ScoreRing score={v.credibilityScore} size={64} strokeWidth={5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className={verdictInfo.color}
                          >
                            {verdictInfo.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(v.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-1 line-clamp-2" data-testid={`text-input-${v.id}`}>
                          {v.inputText}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {v.summary}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            bookmarkMutation.mutate({
                              id: v.id,
                              isBookmarked: !v.isBookmarked,
                            })
                          }
                          data-testid={`button-bookmark-${v.id}`}
                        >
                          {v.isBookmarked ? (
                            <BookmarkCheck className="w-4 h-4 text-primary" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(v.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${v.id}`}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
