import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { BarChart3, Shield, TrendingUp, Hash, Activity, Target, LogOut, Cpu, FileText, Zap, Lock, DollarSign, CreditCard, Power, Wrench, Newspaper, BadgeCheck, Trash2, Plus, MousePointerClick, MessageSquare, Phone, Globe, Clock, Share2, Link2, Eye, Users, Upload, User, Award, RefreshCw } from "lucide-react";
import { SiLinkedin, SiYoutube, SiFacebook } from "react-icons/si";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { VerifiedTool } from "@shared/schema";

interface AdminStats {
  totalVerifications: number;
  averageScore: number;
  verdictBreakdown: { verdict: string; count: number }[];
  topKeywords: string[];
  recentActivity: { date: string; count: number }[];
}

function getVerdictColor(verdict: string) {
  switch (verdict) {
    case "Credible":
      return "text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "Mostly True":
      return "text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
    case "Questionable":
      return "text-orange-600 dark:text-orange-400 border-orange-500/30";
    case "Likely False":
      return "text-red-600 dark:text-red-400 border-red-500/30";
    default:
      return "text-muted-foreground border-muted";
  }
}

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [policyText, setPolicyText] = useState("");
  const [policyStatus, setPolicyStatus] = useState(true);
  const [footerText, setFooterText] = useState("Verified by NeXA Truth Engine");
  const [paywallEnabled, setPaywallEnabled] = useState(false);
  const [basicPrice, setBasicPrice] = useState("0");
  const [starterPrice, setStarterPrice] = useState("10");
  const [purePrice, setPurePrice] = useState("25");
  const [elitePrice, setElitePrice] = useState("49");
  const [sheetsEnabled, setSheetsEnabled] = useState(false);
  const [sheetsOAuthClientId, setSheetsOAuthClientId] = useState("");
  const [sheetsSheetId, setSheetsSheetId] = useState("");
  const [sheetsAutoSync, setSheetsAutoSync] = useState("Instant");
  const [activeEngine, setActiveEngine] = useState("OpenAI GPT-4o");
  const [paymentCurrency, setPaymentCurrency] = useState("USD");
  const [stripeKey, setStripeKey] = useState("");
  const [activeGateways, setActiveGateways] = useState<string[]>(["Stripe", "GooglePay", "LocalBank"]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [paymentSuccessAction, setPaymentSuccessAction] = useState("Unlock_Elite_Features");
  const [currencyLock, setCurrencyLock] = useState(true);

  const { data: session, isLoading: sessionLoading } = useQuery<{ authenticated: boolean }>({
    queryKey: ["/api/admin/session"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/admin/session"], { authenticated: false });
      navigate("/admin/login");
    },
  });

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!session?.authenticated,
  });

  const { data: policyData } = useQuery<{ policy: string; policyStatus: boolean; footerText: string }>({
    queryKey: ["/api/admin/policy"],
    enabled: !!session?.authenticated,
  });

  useEffect(() => {
    if (policyData) {
      if (policyData.policy) setPolicyText(policyData.policy);
      if (policyData.policyStatus !== undefined) setPolicyStatus(policyData.policyStatus);
      if (policyData.footerText) setFooterText(policyData.footerText);
    }
  }, [policyData]);

  const { data: engineData } = useQuery<{ activeEngine: string }>({
    queryKey: ["/api/admin/engine"],
    enabled: !!session?.authenticated,
  });

  useEffect(() => {
    if (engineData?.activeEngine) {
      setActiveEngine(engineData.activeEngine);
    }
  }, [engineData]);

  const saveEngineMutation = useMutation({
    mutationFn: async (engine: string) => {
      await apiRequest("POST", "/api/admin/engine", { activeEngine: engine });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/engine"] });
      toast({ title: "Engine Updated", description: "Active AI engine changed successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update engine.", variant: "destructive" });
    },
  });

  const handleEngineChange = (value: string) => {
    setActiveEngine(value);
    saveEngineMutation.mutate(value);
  };

  interface SystemStatus {
    news_engine: boolean;
    tool_auditor: boolean;
    media_intelligence: boolean;
    audio_intelligence: boolean;
  }

  const { data: systemStatus } = useQuery<SystemStatus>({
    queryKey: ["/api/system-status"],
    enabled: !!session?.authenticated,
  });

  const controlMutation = useMutation({
    mutationFn: async (target: string) => {
      const res = await apiRequest("POST", "/api/admin/control", { target });
      return (await res.json()) as SystemStatus & { status: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-status"] });
      toast({ title: "System Updated", description: "Router switch toggled successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update system control.", variant: "destructive" });
    },
  });

  interface MonetizationSettings {
    paywallEnabled: boolean;
    basicPrice: string;
    starterPrice: string;
    purePrice: string;
    elitePrice: string;
  }

  const { data: monetizationData } = useQuery<MonetizationSettings>({
    queryKey: ["/api/admin/monetization"],
    enabled: !!session?.authenticated,
  });

  useEffect(() => {
    if (monetizationData) {
      setPaywallEnabled(monetizationData.paywallEnabled);
      setBasicPrice(monetizationData.basicPrice);
      setStarterPrice(monetizationData.starterPrice);
      setPurePrice(monetizationData.purePrice);
      setElitePrice(monetizationData.elitePrice);
    }
  }, [monetizationData]);

  useEffect(() => {
    if (session?.authenticated) {
      fetch("/api/admin/google-sheets-status", { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setSheetsEnabled(data.enabled);
            if (data.auth) {
              setSheetsOAuthClientId(data.auth.oauthClientId || "");
              setSheetsSheetId(data.auth.sheetId || "");
              setSheetsAutoSync(data.auth.autoSyncInterval || "Instant");
            }
          }
        })
        .catch(() => {});
    }
  }, [session?.authenticated]);

  const saveMonetizationMutation = useMutation({
    mutationFn: async (settings: MonetizationSettings) => {
      await apiRequest("POST", "/api/admin/monetization", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/monetization"] });
      toast({ title: "Settings Saved", description: "Monetization settings updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  const handlePaywallToggle = (checked: boolean) => {
    setPaywallEnabled(checked);
    saveMonetizationMutation.mutate({
      paywallEnabled: checked,
      basicPrice,
      starterPrice,
      purePrice,
      elitePrice,
    });
  };

  interface PaymentConfig {
    currency: string;
    stripeKey: string;
    activeGateways: string[];
    webhookUrl: string;
    paymentSuccessAction: string;
    currencyLock: boolean;
  }

  const { data: paymentConfigData } = useQuery<PaymentConfig>({
    queryKey: ["/api/admin/payment-config"],
    enabled: !!session?.authenticated,
  });

  useEffect(() => {
    if (paymentConfigData) {
      setPaymentCurrency(paymentConfigData.currency);
      setStripeKey(paymentConfigData.stripeKey);
      setActiveGateways(paymentConfigData.activeGateways);
      if (paymentConfigData.webhookUrl !== undefined) setWebhookUrl(paymentConfigData.webhookUrl);
      if (paymentConfigData.paymentSuccessAction !== undefined) setPaymentSuccessAction(paymentConfigData.paymentSuccessAction);
      if (paymentConfigData.currencyLock !== undefined) setCurrencyLock(paymentConfigData.currencyLock);
    }
  }, [paymentConfigData]);

  const savePaymentConfigMutation = useMutation({
    mutationFn: async (config: PaymentConfig) => {
      await apiRequest("POST", "/api/admin/payment-config", config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-config"] });
      toast({ title: "Payment Config Saved", description: "Gateway settings updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save payment config.", variant: "destructive" });
    },
  });

  const allGateways = ["Stripe", "GooglePay", "PayPal", "LocalBank", "ApplePay"];

  const toggleGateway = (gw: string) => {
    setActiveGateways(prev =>
      prev.includes(gw) ? prev.filter(g => g !== gw) : [...prev, gw]
    );
  };

  const [newToolName, setNewToolName] = useState("");
  const [newToolLink, setNewToolLink] = useState("");
  const [displayLimit, setDisplayLimit] = useState(10);
  const [ppcRate, setPpcRate] = useState(0.50);
  const [partnerTheme, setPartnerTheme] = useState("LIGHT");
  const [partnerSpeed, setPartnerSpeed] = useState(40);
  const [partnerVisible, setPartnerVisible] = useState(true);

  const { data: verifiedToolsData } = useQuery<VerifiedTool[]>({
    queryKey: ["/api/verified-tools/all"],
    enabled: !!session?.authenticated,
  });

  const { data: promotionData } = useQuery<{ visibleToolLimit: number; ppcRate: number }>({
    queryKey: ["/api/admin/promotion"],
    enabled: !!session?.authenticated,
  });

  const { data: partnerSettingsData } = useQuery<{ theme: string; scrollingSpeed: number; showSection: boolean }>({
    queryKey: ["/api/partner-settings"],
    enabled: !!session?.authenticated,
  });

  useEffect(() => {
    if (promotionData) {
      setDisplayLimit(promotionData.visibleToolLimit);
      setPpcRate(promotionData.ppcRate);
    }
  }, [promotionData]);

  useEffect(() => {
    if (partnerSettingsData) {
      setPartnerTheme(partnerSettingsData.theme);
      setPartnerSpeed(partnerSettingsData.scrollingSpeed);
      setPartnerVisible(partnerSettingsData.showSection);
    }
  }, [partnerSettingsData]);

  const addToolMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/verified-tools", { name: newToolName, link: newToolLink });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/verified-tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/verified-tools/all"] });
      setNewToolName("");
      setNewToolLink("");
      toast({ title: "Tool Added", description: "Verified partner tool added." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add tool.", variant: "destructive" });
    },
  });

  const removeToolMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/verified-tools/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/verified-tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/verified-tools/all"] });
      toast({ title: "Tool Removed", description: "Partner tool removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove tool.", variant: "destructive" });
    },
  });

  const savePromotionMutation = useMutation({
    mutationFn: async (config: { visibleToolLimit: number; ppcRate: number }) => {
      await apiRequest("POST", "/api/admin/promotion", config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promotion"] });
      queryClient.invalidateQueries({ queryKey: ["/api/verified-tools"] });
      toast({ title: "Settings Saved", description: "Promotion settings updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save promotion settings.", variant: "destructive" });
    },
  });

  const savePartnerSettingsMutation = useMutation({
    mutationFn: async (settings: { theme?: string; scrollingSpeed?: number; showSection?: boolean }) => {
      await apiRequest("POST", "/api/admin/partner-settings", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-settings"] });
      toast({ title: "Locked & Saved", description: "Partner Hub settings permanently saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save partner settings.", variant: "destructive" });
    },
  });

  interface Inquiry {
    id: number;
    name: string;
    phone: string;
    subject: string;
    link: string;
    message: string;
    time: string;
  }

  const { data: inquiriesData } = useQuery<Inquiry[]>({
    queryKey: ["/api/admin/inquiries"],
    enabled: !!session?.authenticated,
  });

  const deleteInquiryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/inquiries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inquiries"] });
      toast({ title: "Inquiry Removed", description: "Support ticket deleted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete inquiry.", variant: "destructive" });
    },
  });

  const [viralPostText, setViralPostText] = useState("");

  const viralPostMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/admin/viral-post", { content });
      return (await res.json()) as { status: string };
    },
    onSuccess: (data) => {
      toast({ title: "Viral Post", description: data.status });
      setViralPostText("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to post.", variant: "destructive" });
    },
  });

  const [founderLinkedin, setFounderLinkedin] = useState("");
  const [founderYoutube, setFounderYoutube] = useState("");
  const [founderFacebook, setFounderFacebook] = useState("");
  const [founderName, setFounderName] = useState("KANWAR SALLAUHUDDIN ALI KHAN");
  const [founderRole, setFounderRole] = useState("VISIONARY LEAD & FOUNDER | NeXA 11 AI");
  const [founderImage, setFounderImage] = useState("");
  const [founderVisible, setFounderVisible] = useState(true);

  interface TeamConfig {
    showSection: boolean;
    founder: {
      name: string;
      role: string;
      image: string;
      socials: { linkedin: string; youtube: string; facebook: string };
    };
  }

  const { data: teamConfigData } = useQuery<TeamConfig>({
    queryKey: ["/api/team-config"],
    enabled: !!session?.authenticated,
  });

  useEffect(() => {
    if (teamConfigData) {
      setFounderLinkedin(teamConfigData.founder.socials.linkedin);
      setFounderYoutube(teamConfigData.founder.socials.youtube);
      setFounderFacebook(teamConfigData.founder.socials.facebook);
      setFounderName(teamConfigData.founder.name);
      setFounderRole(teamConfigData.founder.role);
      setFounderImage(teamConfigData.founder.image);
      setFounderVisible(teamConfigData.showSection);
    }
  }, [teamConfigData]);

  const saveFounderSocialsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/founder-socials", {
        linkedin: founderLinkedin,
        youtube: founderYoutube,
        facebook: founderFacebook,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder-socials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-config"] });
      toast({ title: "Synced", description: "Founder social links updated on frontend." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update social links.", variant: "destructive" });
    },
  });

  const saveTeamMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/update-team", {
        name: founderName,
        role: founderRole,
        visibility: founderVisible,
        image: founderImage,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder-socials"] });
      toast({ title: "Updated", description: "Team Floor Updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update team config.", variant: "destructive" });
    },
  });

  const savePolicyMutation = useMutation({
    mutationFn: async (data: { policy?: string; policyStatus?: boolean; footerText?: string }) => {
      await apiRequest("POST", "/api/admin/policy", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/policy"] });
      toast({ title: "Blueprint Updated", description: "Policy & footer settings permanently saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save policy.", variant: "destructive" });
    },
  });

  interface DynamicStats {
    showStats: boolean;
    newsCount: string;
    toolsCount: string;
    certType: string;
  }

  const { data: statsConfig } = useQuery<DynamicStats>({
    queryKey: ["/api/stats"],
    enabled: !!session?.authenticated,
  });

  const [statsVisible, setStatsVisible] = useState(true);
  const [statsNews, setStatsNews] = useState("1.2M+");
  const [statsTools, setStatsTools] = useState("500+");
  const [statsCertType, setStatsCertType] = useState("Official NeXA Authenticity Certificate");

  useEffect(() => {
    if (statsConfig) {
      setStatsVisible(statsConfig.showStats);
      setStatsNews(statsConfig.newsCount);
      setStatsTools(statsConfig.toolsCount);
      setStatsCertType(statsConfig.certType);
    }
  }, [statsConfig]);

  const saveStatsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/stats", {
        showStats: statsVisible,
        newsCount: statsNews,
        toolsCount: statsTools,
        certType: statsCertType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Stats Updated", description: "Stats & visibility updated on frontend." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update stats.", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!sessionLoading && !session?.authenticated) {
      navigate("/admin/login");
    }
  }, [sessionLoading, session, navigate]);

  if (sessionLoading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!session?.authenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-10 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-5 w-40" />
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-5 w-32" />
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const maxActivity = Math.max(...(stats.recentActivity.map((a) => a.count)), 1);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Portal</h1>
            <Badge variant="secondary" className="text-xs">Dashboard</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-admin-logout"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card data-testid="card-stat-total">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">Total Verifications</span>
              </div>
              <p className="text-3xl font-black" data-testid="text-total-verifications">
                {stats.totalVerifications}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-score">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">Average Score</span>
              </div>
              <p className="text-3xl font-black" data-testid="text-average-score">
                {stats.averageScore}<span className="text-lg text-muted-foreground">/100</span>
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-verdicts">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">Verdict Types</span>
              </div>
              <p className="text-3xl font-black" data-testid="text-verdict-count">
                {stats.verdictBreakdown.length}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card data-testid="card-verdict-breakdown">
            <CardContent className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Verdict Breakdown
              </h3>
              {stats.verdictBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              ) : (
                <div className="space-y-3">
                  {stats.verdictBreakdown.map((item) => {
                    const pct = stats.totalVerifications > 0
                      ? Math.round((item.count / stats.totalVerifications) * 100)
                      : 0;
                    return (
                      <div key={item.verdict} data-testid={`row-verdict-${item.verdict}`}>
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span className={`text-sm font-medium ${getVerdictColor(item.verdict).split(" ")[0]}`}>
                            {item.verdict}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {item.count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-top-keywords">
            <CardContent className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary" />
                Top SEO Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {stats.topKeywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="outline"
                    data-testid={`badge-keyword-${keyword}`}
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-recent-activity">
          <CardContent className="p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Recent Activity
            </h3>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="flex items-end gap-1.5 h-32">
                {stats.recentActivity.slice().reverse().map((day) => {
                  const heightPct = Math.max(8, (day.count / maxActivity) * 100);
                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center gap-1"
                      data-testid={`bar-activity-${day.date}`}
                    >
                      <span className="text-[10px] text-muted-foreground">{day.count}</span>
                      <div
                        className="w-full bg-primary/80 rounded-sm transition-all duration-300"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                        {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-10 mb-6">
          <h2 className="text-2xl font-black flex items-center gap-2 flex-wrap">
            <Cpu className="w-6 h-6 text-primary" />
            <span className="text-primary">NeXA 11 AI</span>
            <span className="text-muted-foreground">|</span>
            <span>COMMAND CENTER</span>
          </h2>
        </div>

        <Card className="mb-6 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent" data-testid="card-founder-override">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Power className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-black">Founder Master Override</h3>
                <p className="text-xs text-muted-foreground">@KanwarSallauhuddin — Manual Activation Control</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                onClick={() => controlMutation.mutate("master_override_all_on")}
                disabled={controlMutation.isPending}
                className="rounded-full font-bold px-6"
                data-testid="button-master-all-on"
              >
                ACTIVATE ALL ENGINES
              </Button>
              <Button
                variant="outline"
                onClick={() => controlMutation.mutate("master_override_all_off")}
                disabled={controlMutation.isPending}
                className="rounded-full font-bold px-6 bg-destructive/10 text-destructive border-destructive/30"
                data-testid="button-master-all-off"
              >
                SHUTDOWN ALL
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl flex items-center justify-between gap-4" data-testid="card-switch-news">
            <div>
              <h3 className="text-xl font-bold">News Verification Engine</h3>
              <p className="text-xs text-muted-foreground italic">Router: /api/verify</p>
            </div>
            <Button
              onClick={() => controlMutation.mutate("news")}
              disabled={controlMutation.isPending}
              className={`rounded-full font-bold px-6 ${systemStatus?.news_engine ? "" : "bg-destructive text-destructive-foreground"}`}
              data-testid="button-toggle-news"
            >
              {systemStatus?.news_engine ? "ON" : "OFF"}
            </Button>
          </div>

          <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl flex items-center justify-between gap-4" data-testid="card-switch-tool">
            <div>
              <h3 className="text-xl font-bold">AI Tool Auditor Engine</h3>
              <p className="text-xs text-muted-foreground italic">Router: /api/audit-tool</p>
            </div>
            <Button
              variant="outline"
              onClick={() => controlMutation.mutate("tool")}
              disabled={controlMutation.isPending}
              className={`rounded-full font-bold px-6 ${!systemStatus?.tool_auditor ? "bg-destructive text-destructive-foreground border-destructive" : ""}`}
              data-testid="button-toggle-tool"
            >
              {systemStatus?.tool_auditor ? "ON" : "OFF"}
            </Button>
          </div>

          <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl flex items-center justify-between gap-4" data-testid="card-switch-media">
            <div>
              <h3 className="text-xl font-bold">Media Intelligence v7</h3>
              <p className="text-xs text-muted-foreground italic">Router: /api/audit-media</p>
            </div>
            <Button
              variant="outline"
              onClick={() => controlMutation.mutate("media")}
              disabled={controlMutation.isPending}
              className={`rounded-full font-bold px-6 ${!systemStatus?.media_intelligence ? "bg-destructive text-destructive-foreground border-destructive" : ""}`}
              data-testid="button-toggle-media"
            >
              {systemStatus?.media_intelligence ? "ON" : "OFF"}
            </Button>
          </div>

          <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl flex items-center justify-between gap-4" data-testid="card-switch-audio">
            <div>
              <h3 className="text-xl font-bold">Audio Intelligence</h3>
              <p className="text-xs text-muted-foreground italic">Router: /api/audit-audio</p>
            </div>
            <Button
              variant="outline"
              onClick={() => controlMutation.mutate("audio")}
              disabled={controlMutation.isPending}
              className={`rounded-full font-bold px-6 ${!systemStatus?.audio_intelligence ? "bg-destructive text-destructive-foreground border-destructive" : ""}`}
              data-testid="button-toggle-audio"
            >
              {systemStatus?.audio_intelligence ? "ON" : "OFF"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="border-primary/20" data-testid="card-ai-hub">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                AI Integration Hub
              </h3>
              <div className="mb-4">
                <label className="text-xs text-muted-foreground mb-1.5 block">Active Engine</label>
                <Select value={activeEngine} onValueChange={handleEngineChange}>
                  <SelectTrigger className="w-full" data-testid="select-engine">
                    <SelectValue placeholder="Select AI Engine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OpenAI GPT-4o">OpenAI GPT-4o (Current)</SelectItem>
                    <SelectItem value="Google Gemini">Google Gemini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <input
                type="password"
                placeholder="Paste API Key"
                disabled
                className="w-full bg-muted/30 border border-border p-3 rounded-md text-sm text-muted-foreground mb-3"
                data-testid="input-api-key"
              />
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  Connected - Production
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20" data-testid="card-monetization">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Monetization & Gateways
              </h3>
              <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-md mb-4">
                <span className="text-sm font-medium">Enable Subscription Packages</span>
                <Switch
                  checked={paywallEnabled}
                  onCheckedChange={handlePaywallToggle}
                  data-testid="switch-paywall-toggle"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Basic</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <input
                      type="text"
                      value={basicPrice}
                      onChange={(e) => setBasicPrice(e.target.value)}
                      placeholder="0"
                      className="w-full bg-muted/30 border border-border p-3 pl-7 rounded-md text-sm text-foreground outline-none focus:border-primary transition-colors"
                      data-testid="input-price-basic"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Starter</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <input
                      type="text"
                      value={starterPrice}
                      onChange={(e) => setStarterPrice(e.target.value)}
                      placeholder="10"
                      className="w-full bg-muted/30 border border-border p-3 pl-7 rounded-md text-sm text-foreground outline-none focus:border-primary transition-colors"
                      data-testid="input-price-starter"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Pure</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <input
                      type="text"
                      value={purePrice}
                      onChange={(e) => setPurePrice(e.target.value)}
                      placeholder="25"
                      className="w-full bg-muted/30 border border-border p-3 pl-7 rounded-md text-sm text-foreground outline-none focus:border-primary transition-colors"
                      data-testid="input-price-pure"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Elite</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <input
                      type="text"
                      value={elitePrice}
                      onChange={(e) => setElitePrice(e.target.value)}
                      placeholder="49"
                      className="w-full bg-muted/30 border border-border p-3 pl-7 rounded-md text-sm text-foreground outline-none focus:border-primary transition-colors"
                      data-testid="input-price-elite"
                    />
                  </div>
                </div>
              </div>
              <Button
                className="w-full font-bold mb-3"
                onClick={() =>
                  saveMonetizationMutation.mutate({
                    paywallEnabled,
                    basicPrice,
                    starterPrice,
                    purePrice,
                    elitePrice,
                  })
                }
                disabled={saveMonetizationMutation.isPending}
                data-testid="button-save-monetization"
              >
                SAVE PRICING
              </Button>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                Supports: Google Pay, Stripe, PayPal, and Local Transfers.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-card/50 dark:bg-white/5 p-10 rounded-[2.5rem] border border-emerald-500/20 backdrop-blur-xl mb-6" data-testid="card-payment-config">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <h3 className="text-2xl font-black text-emerald-400 italic uppercase">Payment & Gateway Bridge</h3>
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
              {activeGateways.length} Active
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-xs text-muted-foreground uppercase">Currency</label>
              <Select value={paymentCurrency} onValueChange={setPaymentCurrency} disabled={currencyLock}>
                <SelectTrigger className="bg-background dark:bg-black border-border/50 dark:border-white/10 rounded-2xl" data-testid="select-currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="PKR">PKR - Pakistani Rupee</SelectItem>
                  <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                  <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between gap-4 p-3 bg-muted/30 rounded-md">
                <div>
                  <span className="text-xs text-muted-foreground uppercase block">Currency Lock</span>
                  <span className="text-xs text-muted-foreground">{currencyLock ? `Locked to ${paymentCurrency}` : "Unlocked"}</span>
                </div>
                <Switch
                  checked={currencyLock}
                  onCheckedChange={setCurrencyLock}
                  data-testid="switch-currency-lock"
                />
              </div>

              <label className="text-xs text-muted-foreground uppercase">Stripe Secret Key</label>
              <input
                type="password"
                value={stripeKey}
                onChange={(e) => setStripeKey(e.target.value)}
                placeholder="sk_live_..."
                className="w-full bg-background dark:bg-black border border-border/50 dark:border-white/10 p-4 rounded-2xl text-foreground outline-none focus:border-emerald-400 transition-colors font-mono text-sm"
                data-testid="input-stripe-key"
              />

              <label className="text-xs text-muted-foreground uppercase">Stripe Webhook URL</label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://nexa11.ai/api/stripe-webhook"
                className="w-full bg-background dark:bg-black border border-border/50 dark:border-white/10 p-4 rounded-2xl text-foreground outline-none focus:border-emerald-400 transition-colors font-mono text-sm"
                data-testid="input-webhook-url"
              />
            </div>

            <div className="space-y-4">
              <label className="text-xs text-muted-foreground uppercase">Active Gateways</label>
              <div className="flex flex-wrap gap-2">
                {allGateways.map(gw => (
                  <Button
                    key={gw}
                    variant={activeGateways.includes(gw) ? "default" : "outline"}
                    className={`rounded-full font-bold text-xs toggle-elevate ${activeGateways.includes(gw) ? "toggle-elevated bg-emerald-600 border-emerald-600" : ""}`}
                    onClick={() => toggleGateway(gw)}
                    data-testid={`toggle-gateway-${gw.toLowerCase()}`}
                  >
                    {gw}
                  </Button>
                ))}
              </div>

              <label className="text-xs text-muted-foreground uppercase">Payment Success Action</label>
              <Select value={paymentSuccessAction} onValueChange={setPaymentSuccessAction}>
                <SelectTrigger className="bg-background dark:bg-black border-border/50 dark:border-white/10 rounded-2xl" data-testid="select-payment-success-action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Unlock_Elite_Features">Unlock Elite Features</SelectItem>
                  <SelectItem value="Unlock_Pure_Features">Unlock Pure Features</SelectItem>
                  <SelectItem value="Unlock_Starter_Features">Unlock Starter Features</SelectItem>
                  <SelectItem value="Send_PDF_Report">Send PDF Report</SelectItem>
                  <SelectItem value="Grant_API_Access">Grant API Access</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="lg"
                className="w-full font-black rounded-2xl mt-4"
                onClick={() => savePaymentConfigMutation.mutate({
                  currency: paymentCurrency,
                  stripeKey,
                  activeGateways,
                  webhookUrl,
                  paymentSuccessAction,
                  currencyLock,
                })}
                disabled={savePaymentConfigMutation.isPending}
                data-testid="button-save-payment-config"
              >
                SAVE GATEWAY CONFIG
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-6 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Payment keys are encrypted and never exposed to the frontend. Stripe webhook connects directly to gateway.
          </p>
        </div>

        <Card className="border-primary/20 mb-6" data-testid="card-google-sheets">
          <CardContent className="p-8">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Google Sheets Automation
              </h3>
              <Badge variant="outline" className={sheetsEnabled ? "text-emerald-500 border-emerald-500/30" : "text-muted-foreground"}>
                {sheetsEnabled ? "LIVE" : "OFF"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-md mb-4">
              <div>
                <span className="text-sm font-medium block">Google Sheets Integration</span>
                <span className="text-xs text-muted-foreground">{sheetsEnabled ? "Growth Mode Active" : "Manual Mode"}</span>
              </div>
              <Switch
                checked={sheetsEnabled}
                onCheckedChange={async () => {
                  try {
                    const res = await apiRequest("POST", "/api/admin/google-sheets-toggle", {});
                    const data = await res.json();
                    setSheetsEnabled(data.enabled);
                    toast({ title: data.enabled ? "Sheets Integration ON" : "Sheets Integration OFF", description: data.enabled ? "Data export to Google Sheets is now active." : "Google Sheets sync is now disabled." });
                  } catch {
                    toast({ title: "Error", description: "Failed to toggle Google Sheets.", variant: "destructive" });
                  }
                }}
                data-testid="switch-google-sheets"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase">OAuth Client ID</label>
                <input
                  type="password"
                  value={sheetsOAuthClientId}
                  onChange={(e) => setSheetsOAuthClientId(e.target.value)}
                  placeholder="Your_Google_Client_ID"
                  className="w-full bg-muted/30 border border-border p-3 rounded-md text-sm text-foreground outline-none focus:border-primary transition-colors font-mono"
                  data-testid="input-sheets-oauth-id"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase">Sheet ID</label>
                <input
                  type="text"
                  value={sheetsSheetId}
                  onChange={(e) => setSheetsSheetId(e.target.value)}
                  placeholder="Enter_Sheet_ID_Here"
                  className="w-full bg-muted/30 border border-border p-3 rounded-md text-sm text-foreground outline-none focus:border-primary transition-colors font-mono"
                  data-testid="input-sheets-sheet-id"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 p-3 bg-muted/30 rounded-md mb-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase">Auto-Sync Interval</span>
                <span className="text-sm font-bold block mt-0.5">{sheetsAutoSync}</span>
              </div>
              <Select value={sheetsAutoSync} onValueChange={setSheetsAutoSync}>
                <SelectTrigger className="w-40" data-testid="select-sheets-sync-interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Instant">Instant</SelectItem>
                  <SelectItem value="5min">Every 5 min</SelectItem>
                  <SelectItem value="15min">Every 15 min</SelectItem>
                  <SelectItem value="Manual">Manual Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button
                variant="outline"
                className="flex-1 font-bold"
                onClick={async () => {
                  try {
                    await apiRequest("POST", "/api/admin/google-sheets-auth", {
                      oauthClientId: sheetsOAuthClientId,
                      sheetId: sheetsSheetId,
                      autoSyncInterval: sheetsAutoSync,
                    });
                    toast({ title: "Sheets Auth Saved", description: "OAuth and Sheet ID configuration updated." });
                  } catch {
                    toast({ title: "Error", description: "Failed to save Sheets auth.", variant: "destructive" });
                  }
                }}
                data-testid="button-save-sheets-auth"
              >
                SAVE AUTH CONFIG
              </Button>
              <Button
                className="flex-1 font-bold"
                onClick={async () => {
                  try {
                    const res = await apiRequest("POST", "/api/sync-to-sheets", {});
                    const data = await res.json();
                    toast({ title: data.status, description: `${data.message}${data.totalUsers !== undefined ? ` (${data.totalUsers} users)` : ""}` });
                  } catch {
                    toast({ title: "Sync Error", description: "Failed to sync data.", variant: "destructive" });
                  }
                }}
                disabled={!sheetsEnabled}
                data-testid="button-sync-sheets"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                SYNC NOW
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Customer data, finance tracking, and audit history synced to Google Sheets.
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 mb-6" data-testid="card-viral-post">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Social Viral Post
            </h3>
            <textarea
              value={viralPostText}
              onChange={(e) => setViralPostText(e.target.value)}
              placeholder='e.g. "Fact Check: This claim is Verified. Verified by @NeXA_Truth"'
              className="w-full bg-muted/30 border border-border rounded-md p-4 text-sm text-foreground resize-none h-24 outline-none focus:border-primary transition-colors mb-4"
              data-testid="input-viral-post"
            />
            <Button
              className="w-full font-bold"
              onClick={() => {
                if (!viralPostText.trim()) {
                  toast({ title: "Empty Post", description: "Please write content to post.", variant: "destructive" });
                  return;
                }
                viralPostMutation.mutate(viralPostText.trim());
              }}
              disabled={viralPostMutation.isPending}
              data-testid="button-viral-post"
            >
              <Share2 className="w-4 h-4 mr-1.5" />
              POST TO SOCIAL MEDIA
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Auto-post verification results to Twitter/X and social platforms.
            </p>
          </CardContent>
        </Card>

        <div className="bg-card/50 dark:bg-white/5 p-10 rounded-[2.5rem] border border-border/50 dark:border-white/10 backdrop-blur-xl mb-6" data-testid="card-partner-hub">
          <h2 className="text-2xl font-black text-primary mb-6 flex items-center gap-2">
            <Award className="w-6 h-6" />
            Partner Hub Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-background/50 dark:bg-black/50 p-4 rounded-2xl">
              <span className="text-xs text-muted-foreground">Section Visibility</span>
              <div className="flex items-center gap-3 mt-3">
                <Switch
                  checked={partnerVisible}
                  onCheckedChange={(v) => {
                    setPartnerVisible(v);
                    savePartnerSettingsMutation.mutate({ showSection: v });
                  }}
                  data-testid="switch-partner-visibility"
                />
                <span className="text-sm font-bold">{partnerVisible ? "VISIBLE" : "HIDDEN"}</span>
              </div>
            </div>

            <div className="bg-background/50 dark:bg-black/50 p-4 rounded-2xl">
              <span className="text-xs text-muted-foreground">Theme</span>
              <Select value={partnerTheme} onValueChange={(v) => {
                setPartnerTheme(v);
                savePartnerSettingsMutation.mutate({ theme: v });
              }}>
                <SelectTrigger className="w-full mt-2" data-testid="select-partner-theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LIGHT">Light</SelectItem>
                  <SelectItem value="DARK">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-background/50 dark:bg-black/50 p-4 rounded-2xl">
              <span className="text-xs text-muted-foreground">Scroll Speed (seconds)</span>
              <Select value={String(partnerSpeed)} onValueChange={(v) => {
                setPartnerSpeed(Number(v));
                savePartnerSettingsMutation.mutate({ scrollingSpeed: Number(v) });
              }}>
                <SelectTrigger className="w-full mt-2" data-testid="select-partner-speed">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20s (Fast)</SelectItem>
                  <SelectItem value="30">30s (Normal)</SelectItem>
                  <SelectItem value="40">40s (Default)</SelectItem>
                  <SelectItem value="60">60s (Slow)</SelectItem>
                  <SelectItem value="80">80s (Very Slow)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-card/50 dark:bg-white/5 p-10 rounded-[2.5rem] border border-border/50 dark:border-white/10 backdrop-blur-xl mb-6" data-testid="card-promotion-manager">
          <h2 className="text-2xl font-black text-primary mb-6 flex items-center gap-2">
            <MousePointerClick className="w-6 h-6" />
            Promotion & Revenue Manager
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-background/50 dark:bg-black/50 p-4 rounded-2xl">
              <span className="text-xs text-muted-foreground">Global Display Limit</span>
              <Select value={String(displayLimit)} onValueChange={(v) => {
                setDisplayLimit(Number(v));
                savePromotionMutation.mutate({ visibleToolLimit: Number(v), ppcRate });
              }}>
                <SelectTrigger className="w-full mt-2" data-testid="select-display-limit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 Tools</SelectItem>
                  <SelectItem value="20">20 Tools</SelectItem>
                  <SelectItem value="40">40 Tools</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-background/50 dark:bg-black/50 p-4 rounded-2xl">
              <span className="text-xs text-muted-foreground">PPC Rate ($/click)</span>
              <p className="text-2xl font-black mt-2" data-testid="text-ppc-rate">${ppcRate.toFixed(2)}</p>
            </div>
            <div className="bg-background/50 dark:bg-black/50 p-4 rounded-2xl">
              <span className="text-xs text-muted-foreground">Total Ad Revenue (PPC)</span>
              <p className="text-2xl font-black text-emerald-500 mt-2" data-testid="text-total-revenue">
                ${verifiedToolsData ? (verifiedToolsData.reduce((sum, t) => sum + t.clicks, 0) * ppcRate).toFixed(2) : "0.00"}
              </p>
            </div>
          </div>

          <div className="flex items-end gap-3 mb-6 flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-muted-foreground mb-1.5 block">Tool Name</label>
              <input
                type="text"
                value={newToolName}
                onChange={(e) => setNewToolName(e.target.value)}
                placeholder="e.g. ChatGPT"
                className="w-full bg-background/50 dark:bg-black/50 border border-border p-3 rounded-md text-sm text-foreground outline-none focus:border-primary transition-colors"
                data-testid="input-new-tool-name"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1.5 block">Tool Link</label>
              <input
                type="text"
                value={newToolLink}
                onChange={(e) => setNewToolLink(e.target.value)}
                placeholder="https://..."
                className="w-full bg-background/50 dark:bg-black/50 border border-border p-3 rounded-md text-sm text-foreground outline-none focus:border-primary transition-colors"
                data-testid="input-new-tool-link"
              />
            </div>
            <Button
              onClick={() => addToolMutation.mutate()}
              disabled={addToolMutation.isPending || !newToolName || !newToolLink}
              data-testid="button-add-tool"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Partner
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const res = await fetch("/api/sync-official-logos");
                  const data = await res.json();
                  toast({ title: "Logos Synced", description: `${data.synced} of ${data.total} partner logos updated from official sources.` });
                  queryClient.invalidateQueries({ queryKey: ["/api/verified-tools/all"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/verified-tools"] });
                } catch {
                  toast({ title: "Error", description: "Failed to sync logos.", variant: "destructive" });
                }
              }}
              data-testid="button-sync-logos"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Sync Official Logos
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/50 text-primary">
                  <th className="py-3 font-bold">Tool Name</th>
                  <th className="font-bold">Logo</th>
                  <th className="font-bold">Status</th>
                  <th className="font-bold">Total Clicks</th>
                  <th className="font-bold">Revenue Earned</th>
                  <th className="font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {verifiedToolsData && verifiedToolsData.length > 0 ? (
                  verifiedToolsData.map((tool) => (
                    <tr key={tool.id} className="border-b border-border/10" data-testid={`row-tool-${tool.id}`}>
                      <td className="py-3 font-bold">{tool.name}</td>
                      <td>
                        {tool.logoUrl ? (
                          <img src={tool.logoUrl} alt={tool.name} className="w-6 h-6 object-contain" />
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </td>
                      <td>
                        <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px]">
                          <BadgeCheck className="w-3 h-3 mr-1" />
                          {tool.status}
                        </Badge>
                      </td>
                      <td data-testid={`text-clicks-${tool.id}`}>{tool.clicks}</td>
                      <td className="text-emerald-600 dark:text-emerald-400 font-bold" data-testid={`text-revenue-${tool.id}`}>
                        ${(tool.clicks * ppcRate).toFixed(2)}
                      </td>
                      <td>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeToolMutation.mutate(tool.id)}
                          disabled={removeToolMutation.isPending}
                          className="text-destructive border-destructive/30"
                          data-testid={`button-remove-tool-${tool.id}`}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-foreground">No verified partner tools yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card/50 dark:bg-white/5 p-10 rounded-[2.5rem] border border-border/50 dark:border-white/10 backdrop-blur-xl mb-6" data-testid="card-inquiries">
          <h2 className="text-2xl font-black text-primary mb-6 flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Support Tickets & Inquiries
          </h2>

          {inquiriesData && inquiriesData.length > 0 ? (
            <div className="space-y-4">
              {inquiriesData.map((inq) => (
                <div key={inq.id} className="bg-background/50 dark:bg-black/50 p-6 rounded-2xl border border-border/30" data-testid={`card-inquiry-${inq.id}`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-lg">{inq.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {inq.subject === "advertising" ? "Advertisement" : inq.subject === "support" ? "Support" : "Verification Badge"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {inq.time}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteInquiryMutation.mutate(inq.id)}
                        disabled={deleteInquiryMutation.isPending}
                        className="text-destructive border-destructive/30"
                        data-testid={`button-delete-inquiry-${inq.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {inq.phone}
                    </span>
                    {inq.link && (
                      <a href={inq.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary underline underline-offset-2">
                        <Globe className="w-3 h-3" />
                        {inq.link}
                      </a>
                    )}
                  </div>
                  {inq.message && (
                    <p className="text-sm text-muted-foreground mt-2 bg-muted/20 p-3 rounded-md">{inq.message}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No support tickets or inquiries yet.</p>
          )}
        </div>

        <Card data-testid="card-legal-policy">
          <CardContent className="p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Legal & Policy Framework
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-muted/30 border border-border rounded-md p-4">
                <span className="text-xs text-muted-foreground uppercase">Policy Status</span>
                <div className="flex items-center gap-3 mt-3">
                  <Switch
                    checked={policyStatus}
                    onCheckedChange={(v) => {
                      setPolicyStatus(v);
                      savePolicyMutation.mutate({ policyStatus: v });
                    }}
                    data-testid="switch-policy-status"
                  />
                  <span className="text-sm font-bold">{policyStatus ? "ACTIVE" : "DISABLED"}</span>
                </div>
              </div>
              <div className="bg-muted/30 border border-border rounded-md p-4">
                <span className="text-xs text-muted-foreground uppercase">Footer Verification Text</span>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="Verified by NeXA Truth Engine"
                  className="w-full bg-background border border-border p-3 rounded-md text-sm text-foreground outline-none focus:border-primary transition-colors mt-2"
                  data-testid="input-footer-text"
                />
              </div>
            </div>

            <textarea
              value={policyText}
              onChange={(e) => setPolicyText(e.target.value)}
              placeholder="Write your Privacy Policy and Terms of Service here..."
              className="w-full bg-muted/30 border border-border rounded-md p-4 text-sm text-foreground resize-none h-48 outline-none focus:border-primary transition-colors"
              data-testid="input-policy-text"
            />
            <Button
              size="lg"
              className="mt-4 font-bold"
              onClick={() => savePolicyMutation.mutate({ policy: policyText, policyStatus, footerText })}
              disabled={savePolicyMutation.isPending}
              data-testid="button-save-policy"
            >
              SAVE POLICY & FOOTER
            </Button>
          </CardContent>
        </Card>

        <div className="bg-card/50 dark:bg-white/5 p-10 rounded-[2.5rem] border border-blue-500/20 backdrop-blur-xl mt-10" data-testid="card-founder-socials">
          <h3 className="text-2xl font-black text-blue-400 italic uppercase mb-6">Founder & Team Control</h3>

          <div className="p-6 bg-card/50 dark:bg-white/5 rounded-3xl border border-border/50 dark:border-white/10 flex flex-wrap justify-between items-center gap-4 mb-8">
            <span className="text-sm font-medium text-foreground">Founder Card Visibility</span>
            <div className="flex items-center gap-4">
              <Switch
                checked={founderVisible}
                onCheckedChange={setFounderVisible}
                data-testid="switch-founder-visible"
              />
              <Button
                variant="default"
                className="bg-blue-600 border-blue-600 text-xs font-bold rounded-md"
                onClick={() => {
                  saveTeamMutation.mutate();
                }}
                disabled={saveTeamMutation.isPending}
                data-testid="button-save-founder-state"
              >
                SAVE STATE
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-xs text-muted-foreground uppercase">Founder Name & Role</label>
              <input
                type="text"
                value={founderName}
                onChange={(e) => setFounderName(e.target.value)}
                placeholder="KANWAR SALLAUHUDDIN ALI KHAN"
                className="w-full bg-background dark:bg-black border border-border/50 dark:border-white/10 p-4 rounded-2xl text-foreground outline-none focus:border-blue-400 transition-colors"
                data-testid="input-founder-name"
              />

              <label className="text-xs text-muted-foreground uppercase">Profile Picture (Upload)</label>
              <div className="flex items-center gap-4">
                {founderImage && (
                  <div className="w-16 h-16 rounded-2xl border-2 border-blue-500/30 overflow-hidden shrink-0">
                    <img src={founderImage} alt="Founder" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="flex-1 cursor-pointer">
                  <div className="w-full bg-card/50 dark:bg-white/5 p-4 rounded-2xl text-sm text-muted-foreground border border-dashed border-border/50 dark:border-white/20 flex items-center justify-center gap-3 transition-colors hover:border-blue-400" data-testid="input-founder-image">
                    <Upload className="w-5 h-5 text-blue-400" />
                    <span>{founderImage ? "Change Photo" : "Upload Founder Photo"}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append("image", file);
                      try {
                        const res = await fetch("/api/admin/upload-image", {
                          method: "POST",
                          body: formData,
                          credentials: "include",
                        });
                        const data = await res.json();
                        if (data.success) {
                          setFounderImage(data.imageUrl);
                          queryClient.invalidateQueries({ queryKey: ["/api/team-config"] });
                          toast({ title: "Photo Uploaded", description: "Founder profile picture permanently saved." });
                        } else {
                          toast({ title: "Upload Failed", description: data.message || "Could not upload image.", variant: "destructive" });
                        }
                      } catch {
                        toast({ title: "Upload Error", description: "Failed to upload image.", variant: "destructive" });
                      }
                      e.target.value = "";
                    }}
                    data-testid="file-founder-image"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs text-muted-foreground uppercase">Social Connectivity</label>
              <input
                type="text"
                value={founderLinkedin}
                onChange={(e) => setFounderLinkedin(e.target.value)}
                placeholder="LinkedIn URL"
                className="w-full bg-background/40 dark:bg-black/40 border border-border/50 dark:border-white/10 p-3 rounded-xl text-sm text-foreground outline-none focus:border-blue-400 transition-colors"
                data-testid="input-founder-linkedin"
              />
              <input
                type="text"
                value={founderYoutube}
                onChange={(e) => setFounderYoutube(e.target.value)}
                placeholder="YouTube URL"
                className="w-full bg-background/40 dark:bg-black/40 border border-border/50 dark:border-white/10 p-3 rounded-xl text-sm text-foreground outline-none focus:border-blue-400 transition-colors"
                data-testid="input-founder-youtube"
              />
              <Button
                size="lg"
                className="w-full font-black rounded-2xl"
                onClick={() => {
                  saveTeamMutation.mutate();
                  saveFounderSocialsMutation.mutate();
                }}
                disabled={saveTeamMutation.isPending || saveFounderSocialsMutation.isPending}
                data-testid="button-sync-socials"
              >
                SYNC TEAM DATA
              </Button>
            </div>
          </div>
        </div>
        <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2.5rem] border border-primary/20 backdrop-blur-xl mt-10" data-testid="card-stats-control">
          <h3 className="text-2xl font-black text-primary mb-6 uppercase italic">
            Stats & Counters Management
          </h3>
          <div className="flex items-center justify-between bg-background/40 dark:bg-black/40 p-6 rounded-2xl mb-6">
            <span className="font-medium">Show Statistics on Home Page (1.2M+, 500+)</span>
            <Button
              variant={statsVisible ? "default" : "destructive"}
              className="rounded-full font-bold px-6"
              onClick={() => setStatsVisible(!statsVisible)}
              data-testid="switch-stats-visible"
            >
              {statsVisible ? "ON" : "OFF"}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <input
              type="text"
              value={statsNews}
              onChange={(e) => setStatsNews(e.target.value)}
              placeholder="Update News Count (e.g. 1.5M+)"
              className="w-full bg-background dark:bg-black p-4 rounded-xl border border-border/50 dark:border-white/10 text-foreground outline-none focus:border-primary transition-colors"
              data-testid="input-stats-news"
            />
            <input
              type="text"
              value={statsTools}
              onChange={(e) => setStatsTools(e.target.value)}
              placeholder="Update Tools Count (e.g. 800+)"
              className="w-full bg-background dark:bg-black p-4 rounded-xl border border-border/50 dark:border-white/10 text-foreground outline-none focus:border-primary transition-colors"
              data-testid="input-stats-tools"
            />
          </div>
          <div className="mb-6">
            <label className="text-xs text-muted-foreground uppercase mb-1.5 block">Certificate Title</label>
            <input
              type="text"
              value={statsCertType}
              onChange={(e) => setStatsCertType(e.target.value)}
              placeholder="Official NeXA Authenticity Certificate"
              className="w-full bg-background dark:bg-black p-4 rounded-xl border border-border/50 dark:border-white/10 text-foreground outline-none focus:border-primary transition-colors"
              data-testid="input-stats-cert-type"
            />
          </div>
          <Button
            size="lg"
            className="w-full font-black"
            onClick={() => saveStatsMutation.mutate()}
            disabled={saveStatsMutation.isPending}
            data-testid="button-save-stats"
          >
            UPDATE STATS & CERTIFICATE
          </Button>
        </div>
      </div>
    </div>
  );
}
