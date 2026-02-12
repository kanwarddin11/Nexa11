import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Shield, Search, BarChart3, AlertTriangle, CheckCircle2, XCircle, HelpCircle, Loader2, Cpu, Rocket, Building2, Wrench, ShieldCheck, ShieldAlert, Info, BadgeCheck, Send, FileDown, X, CreditCard, Lock, Award, DollarSign, Globe, Smartphone, TrendingUp, Target, Clock, Dna, FlaskConical, Fingerprint, PenLine, Route, Zap, Sun, MapPin, Layers, Headphones, Mic, Volume2, Users, FileText } from "lucide-react";
import { SiLinkedin, SiYoutube, SiFacebook } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ScoreRing, getVerdictInfo } from "@/components/score-ring";
import type { Verification, VerifiedTool } from "@shared/schema";

interface MonetizationSettings {
  paywallEnabled: boolean;
  basicPrice: string;
  starterPrice: string;
  purePrice: string;
  elitePrice: string;
}

interface SystemStatus {
  news_engine: boolean;
  tool_auditor: boolean;
  media_intelligence: boolean;
  audio_intelligence: boolean;
}

interface AudioIntelligenceResult {
  audioTitle: string;
  platform: string;
  duration: string;
  transcription: string;
  smartSummary: string;
  voiceAudit: {
    verdict: string;
    confidence: number;
    detectedModel: string;
    naturalness: number;
    breathingPatterns: string;
    microExpressions: string;
    pitchVariation: string;
    finding: string;
  };
  languageAnalysis: {
    primaryLanguage: string;
    confidence: number;
    secondaryLanguages: string[];
    accent: string;
  };
  speakerAnalysis: {
    totalSpeakers: number;
    speakers: Array<{
      label: string;
      gender: string;
      estimatedAge: string;
      speakingTime: string;
    }>;
  };
  audioQuality: {
    overallScore: number;
    signalToNoise: string;
    compression: string;
    backgroundNoise: string;
    clipping: boolean;
    sampleRate: string;
  };
  contentClassification: {
    category: string;
    sentiment: string;
    topics: string[];
    keyPhrases: string[];
  };
  riskAssessment: string;
  flags: string[];
  recommendations: string[];
}

interface MediaAuditResult {
  mediaName: string;
  mediaType: string;
  forensicScore: number;
  verdict: string;
  authenticityProbability: number;
  aiDetection: {
    isAiGenerated: boolean;
    confidence: number;
    model: string;
    method: string;
  };
  pixelForensics: {
    ela: {
      status: string;
      compressionVariance: number;
      hotspots: string[];
      finding: string;
    };
    noisePrint: {
      status: string;
      uniformityScore: number;
      breakRegions: string[];
      finding: string;
    };
    luminanceGradient: {
      status: string;
      lightSources: number;
      shadowConsistency: boolean;
      reflectionMatch: boolean;
      finding: string;
    };
    contentDna: {
      visualStyle: string;
      textureQuality: string;
      edgeSharpness: string;
      colorGamut: string;
      finding: string;
    };
  };
  hdClarityEngine?: {
    skinPoreValidation: {
      status: string;
      poreDetail: string;
      flaggedRegions: string[];
      finding: string;
    };
    facialMuscleSync: {
      status: string;
      expressionMatch: boolean;
      wrinkleConsistency: boolean;
      nasolabialCheck: string;
      finding: string;
    };
    edgeBlurDetection: {
      status: string;
      affectedEdges: string[];
      blurType: string;
      finding: string;
    };
    aiTextureMismatch: {
      status: string;
      mismatchRegions: string[];
      finding: string;
    };
  };
  heatMap: {
    overallIntegrity: string;
    tamperedZones: Array<{
      zone: string;
      severity: string;
      type: string;
      confidence: number;
    }>;
  };
  tamperCheck: {
    isTampered: boolean;
    confidence: number;
    regions: string[];
    method: string;
  };
  chatVerification: {
    isAuthenticChat: boolean | null;
    fontIntegrity: string;
    uiIntegrity: string;
    platform: string;
    method: string;
  };
  deepfakeDetection: {
    isDeepfake: boolean;
    confidence: number;
    biometricFlags: string[];
    method: string;
  };
  lipSyncAudit: {
    status: string;
    syncScore: number | null;
    anomalies: string[];
  };
  metadata: {
    extractionStatus: string;
    recoveryMethod?: string;
    originalSource: string;
    platformDetected?: string;
    creationDate: string;
    modifications: string[];
    geoTag: string;
    device: string;
    strippedBy?: string;
  };
  riskAssessment: string;
  details: string;
  flags: string[];
  recommendations: string[];
}

interface ToolAuditResult {
  toolName: string;
  safetyRating: string;
  legitimacy: string;
  userTrust: string;
  riskLevel: string;
  details: string;
  recommendations: string[];
  flags: string[];
}

interface FullAuditData {
  status: string;
  auditType: string;
  resultType: string;
  timestamp: string;
  issuedBy: string;
  founder: string;
  data: {
    statusMarks?: Record<string, boolean>;
    newsChannels?: string[];
    toolInfo?: {
      originCountry?: string;
      totalDownloads?: string;
      category?: string;
      relatedTools?: string[];
      foundedYear?: string;
      parentCompany?: string;
    };
    contentInfo?: {
      originCountry?: string;
      category?: string;
      firstReported?: string;
      relatedStories?: string[];
      viralityLevel?: string;
    };
    liveStatus?: string;
    globalAuthorityScore?: number;
    [key: string]: any;
  };
}

function FounderSection() {
  interface TeamConfig {
    showSection: boolean;
    founder: {
      name: string;
      role: string;
      image: string;
      socials: { linkedin: string; youtube: string; facebook: string };
    };
  }

  const { data: teamConfig } = useQuery<TeamConfig>({
    queryKey: ["/api/team-config"],
  });

  if (teamConfig?.showSection === false) return null;

  const name = teamConfig?.founder?.name || "KANWAR SALLAUHUDDIN ALI KHAN";
  const role = teamConfig?.founder?.role || "VISIONARY LEAD & FOUNDER | NeXA 11 AI";
  const image = teamConfig?.founder?.image || "";
  const linkedinUrl = teamConfig?.founder?.socials?.linkedin || "https://linkedin.com/in/yourprofile";
  const youtubeUrl = teamConfig?.founder?.socials?.youtube || "https://youtube.com/@yourchannel";
  const facebookUrl = teamConfig?.founder?.socials?.facebook || "https://facebook.com/yourpage";

  const initials = name.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("");

  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div className="w-24 h-24 rounded-full border-4 border-primary overflow-hidden shrink-0">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
            <span className="text-3xl font-black text-primary">{initials}</span>
          </div>
        )}
      </div>
      <div>
        <Badge className="bg-[#FFD700] text-black text-[10px] font-black px-4 mb-3 no-default-hover-elevate no-default-active-elevate">FOUNDER</Badge>
        <h3 className="text-2xl font-black italic text-foreground" data-testid="text-founder-name">{name}</h3>
        <p className="text-xs text-primary font-bold uppercase tracking-widest mt-1">{role}</p>
      </div>
      <div className="flex gap-3">
        <Button size="icon" variant="ghost" className="bg-blue-600 text-white" asChild data-testid="link-founder-linkedin">
          <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
            <SiLinkedin className="w-5 h-5" />
          </a>
        </Button>
        <Button size="icon" variant="ghost" className="bg-red-600 text-white" asChild data-testid="link-founder-youtube">
          <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
            <SiYoutube className="w-5 h-5" />
          </a>
        </Button>
        <Button size="icon" variant="ghost" className="bg-blue-800 text-white" asChild data-testid="link-founder-facebook">
          <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
            <SiFacebook className="w-5 h-5" />
          </a>
        </Button>
      </div>
    </div>
  );
}

export default function Home() {
  const [newsContent, setNewsContent] = useState("");
  const [toolContent, setToolContent] = useState("");
  const [mediaContent, setMediaContent] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [audioContent, setAudioContent] = useState("");
  const [audioPlatform, setAudioPlatform] = useState("auto");
  const [ticketName, setTicketName] = useState("");
  const [ticketPhone, setTicketPhone] = useState("");
  const [ticketSubject, setTicketSubject] = useState("advertising");
  const [ticketLink, setTicketLink] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; plan: string; price: string }>({ open: false, plan: "", price: "" });
  const [paymentForm, setPaymentForm] = useState({ name: "", email: "", card: "" });
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [fullAuditData, setFullAuditData] = useState<FullAuditData | null>(null);
  const [fullAuditLoading, setFullAuditLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = (plan: string) => {
    const prices: Record<string, string> = {
      basic: monetization?.basicPrice || "0",
      starter: monetization?.starterPrice || "10",
      pure: monetization?.purePrice || "25",
      elite: monetization?.elitePrice || "49",
    };
    setPaymentForm({ name: "", email: "", card: "" });
    setPaymentModal({ open: true, plan, price: prices[plan.toLowerCase()] || "0" });
  };

  const handlePaymentSubmit = async () => {
    if (!paymentForm.name.trim() || !paymentForm.email.trim()) {
      toast({ title: "Missing Info", description: "Please fill in your name and email.", variant: "destructive" });
      return;
    }
    setPaymentProcessing(true);
    try {
      await apiRequest("POST", "/api/initiate-payment", { plan: paymentModal.plan });
      const upgradeRes = await apiRequest("POST", "/api/upgrade-user", {
        email: paymentForm.email.trim(),
        name: paymentForm.name.trim(),
        plan: paymentModal.plan,
      });
      const upgradeData = await upgradeRes.json();
      toast({
        title: "Subscription Activated",
        description: upgradeData.message || `Your ${paymentModal.plan.toUpperCase()} plan is now permanently active.`,
      });
      setPaymentModal({ open: false, plan: "", price: "" });
    } catch {
      toast({ title: "Payment Error", description: "Could not process payment. Please try again.", variant: "destructive" });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const { data: monetization } = useQuery<MonetizationSettings>({
    queryKey: ["/api/admin/monetization"],
  });

  const { data: systemStatus } = useQuery<SystemStatus>({
    queryKey: ["/api/system-status"],
  });

  const { data: verifiedToolsList } = useQuery<VerifiedTool[]>({
    queryKey: ["/api/verified-tools"],
  });

  const { data: partnerSettings } = useQuery<{ theme: string; scrollingSpeed: number; showSection: boolean }>({
    queryKey: ["/api/partner-settings"],
  });

  const { data: policyPublic } = useQuery<{ policy: string; policyStatus: boolean; footerText: string }>({
    queryKey: ["/api/policy-public"],
  });

  const { data: statsConfig } = useQuery<{ showStats: boolean; newsCount: string; toolsCount: string; certType: string }>({
    queryKey: ["/api/stats"],
  });

  const verifyMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/verify", { content: text });
      return (await res.json()) as Verification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/verifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const auditMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/audit-tool", { content: text });
      return (await res.json()) as ToolAuditResult;
    },
    onError: (error: Error) => {
      toast({
        title: "Audit failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const mediaAuditMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/audit-media", { content: text, mediaType });
      return (await res.json()) as MediaAuditResult;
    },
    onError: (error: Error) => {
      toast({
        title: "Media audit failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const audioAuditMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/audit-audio", { content: text, platform: audioPlatform === "auto" ? undefined : audioPlatform });
      return (await res.json()) as AudioIntelligenceResult;
    },
    onError: (error: Error) => {
      toast({
        title: "Audio audit failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const ticketMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/submit-ticket", {
        name: ticketName,
        phone: ticketPhone,
        subject: ticketSubject,
        link: ticketLink,
        message: ticketMessage,
      });
      return (await res.json()) as { success: boolean; message: string };
    },
    onSuccess: (data) => {
      toast({ title: "Inquiry Submitted", description: data.message });
      setTicketName("");
      setTicketPhone("");
      setTicketSubject("advertising");
      setTicketLink("");
      setTicketMessage("");
    },
    onError: (error: Error) => {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    },
  });

  const newsResult = verifyMutation.data;
  const auditResult = auditMutation.data;
  const mediaResult = mediaAuditMutation.data;
  const audioResult = audioAuditMutation.data;
  const isUrl = newsContent.trim().startsWith("http");
  const newsOffline = systemStatus && !systemStatus.news_engine;
  const toolOffline = systemStatus && !systemStatus.tool_auditor;
  const mediaOffline = systemStatus && !systemStatus.media_intelligence;
  const audioOffline = systemStatus && !systemStatus.audio_intelligence;

  function getCredibilityRating(score: number): { rating: string; color: string; indicator: string; indicatorColor: string } {
    if (score >= 90) return { rating: "AAA+++", color: "text-emerald-500", indicator: "VERIFIED", indicatorColor: "text-emerald-500" };
    if (score >= 75) return { rating: "AA+", color: "text-emerald-400", indicator: "VERIFIED", indicatorColor: "text-emerald-400" };
    if (score >= 60) return { rating: "A", color: "text-green-500", indicator: "VERIFIED", indicatorColor: "text-green-500" };
    if (score >= 40) return { rating: "B", color: "text-yellow-500", indicator: "CAUTION", indicatorColor: "text-yellow-500" };
    if (score >= 20) return { rating: "D", color: "text-orange-500", indicator: "DANGER", indicatorColor: "text-orange-500" };
    return { rating: "F", color: "text-red-500", indicator: "FAKE", indicatorColor: "text-red-500" };
  }

  function getVerdictIcon(score: number) {
    if (score >= 60) return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (score >= 40) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  }

  function getSafetyRatingInfo(rating: string): { color: string; indicator: string; indicatorColor: string } {
    const r = rating.toUpperCase().replace(/[^A-Z+]/g, "");
    if (r.includes("AAA")) return { color: "text-emerald-500", indicator: "VERIFIED", indicatorColor: "text-emerald-500" };
    if (r.includes("AA")) return { color: "text-emerald-400", indicator: "VERIFIED", indicatorColor: "text-emerald-400" };
    if (r.startsWith("A")) return { color: "text-green-500", indicator: "VERIFIED", indicatorColor: "text-green-500" };
    if (r.startsWith("B")) return { color: "text-yellow-500", indicator: "CAUTION", indicatorColor: "text-yellow-500" };
    if (r.startsWith("D")) return { color: "text-orange-500", indicator: "DANGER", indicatorColor: "text-orange-500" };
    if (r.startsWith("F")) return { color: "text-red-500", indicator: "FAKE", indicatorColor: "text-red-500" };
    return { color: "text-muted-foreground", indicator: "N/A", indicatorColor: "text-muted-foreground" };
  }

  function getSafetyColor(rating: string) {
    return getSafetyRatingInfo(rating).color;
  }

  function getRiskColor(risk: string) {
    switch (risk) {
      case "Minimal": return "text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "Low": return "text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "Medium": return "text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
      case "High": return "text-orange-600 dark:text-orange-400 border-orange-500/30";
      case "Critical": return "text-red-600 dark:text-red-400 border-red-500/30";
      default: return "text-muted-foreground border-muted";
    }
  }

  function getTrustColor(trust: string) {
    switch (trust) {
      case "Very High": return "text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "High": return "text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "Moderate": return "text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
      case "Low": return "text-orange-600 dark:text-orange-400 border-orange-500/30";
      case "Very Low": return "text-red-600 dark:text-red-400 border-red-500/30";
      default: return "text-muted-foreground border-muted";
    }
  }

  const handleNewsScan = () => {
    if (newsContent.trim().length < 10) {
      toast({ title: "Too short", description: "Please provide at least 10 characters of content to verify.", variant: "destructive" });
      return;
    }
    verifyMutation.mutate(newsContent.trim());
  };

  const handleToolAudit = () => {
    if (toolContent.trim().length < 3) {
      toast({ title: "Too short", description: "Please provide the tool name or URL to audit.", variant: "destructive" });
      return;
    }
    auditMutation.mutate(toolContent.trim());
  };

  const handleMediaAudit = () => {
    if (mediaContent.trim().length < 3) {
      toast({ title: "Too short", description: "Please provide a media URL or description to audit.", variant: "destructive" });
      return;
    }
    mediaAuditMutation.mutate(mediaContent.trim());
  };

  const handleAudioAudit = () => {
    if (audioContent.trim().length < 3) {
      toast({ title: "Too short", description: "Please provide an audio URL or description to analyze.", variant: "destructive" });
      return;
    }
    audioAuditMutation.mutate(audioContent.trim());
  };

  function getForensicColor(score: number) {
    if (score >= 90) return "text-emerald-500";
    if (score >= 70) return "text-emerald-400";
    if (score >= 50) return "text-yellow-500";
    if (score >= 30) return "text-orange-500";
    return "text-red-500";
  }

  function getVerdictColor(verdict: string) {
    const v = verdict?.toUpperCase() || "";
    if (v.includes("AUTHENTIC") && !v.includes("LIKELY")) return "text-emerald-500 border-emerald-500/30";
    if (v.includes("LIKELY_AUTHENTIC")) return "text-emerald-400 border-emerald-500/30";
    if (v.includes("INCONCLUSIVE")) return "text-yellow-500 border-yellow-500/30";
    if (v.includes("LIKELY_MANIPULATED")) return "text-orange-500 border-orange-500/30";
    if (v.includes("MANIPULATED") || v.includes("SYNTHETIC")) return "text-red-500 border-red-500/30";
    return "text-muted-foreground border-muted";
  }

  function getRiskBadgeColor(risk: string) {
    const r = risk?.toUpperCase() || "";
    if (r === "SAFE") return "text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    if (r === "LOW_RISK") return "text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    if (r === "MEDIUM_RISK") return "text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
    if (r === "HIGH_RISK") return "text-orange-600 dark:text-orange-400 border-orange-500/30";
    if (r === "CRITICAL") return "text-red-600 dark:text-red-400 border-red-500/30";
    return "text-muted-foreground border-muted";
  }

  function getPassFailColor(status: string) {
    if (status === "PASS") return "text-emerald-500";
    if (status === "FAIL") return "text-red-500";
    return "text-muted-foreground";
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <section className="relative pt-10 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 leading-tight">
            Global{" "}
            <span className="text-primary underline decoration-primary/50 underline-offset-4">
              Intelligence
            </span>{" "}
            Hub
          </h1>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card/50 dark:bg-white/5 p-12 rounded-[2.5rem] border border-border/50 dark:border-white/10 shadow-2xl backdrop-blur-xl" data-testid="panel-news-verifier">
            <h2 className="text-3xl font-bold mb-2 text-primary" data-testid="heading-news-verifier">News Verifier</h2>
            <p className="text-muted-foreground mb-6">Verify any news claim or link instantly.</p>

            {newsOffline && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-3 mb-4 flex items-center gap-2" data-testid="banner-news-offline">
                <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive font-medium">News Engine is currently offline by Admin.</p>
              </div>
            )}

            <textarea
              value={newsContent}
              onChange={(e) => setNewsContent(e.target.value)}
              placeholder="Paste news text..."
              className="w-full bg-background/50 dark:bg-black/50 border border-border/50 dark:border-white/10 rounded-2xl p-5 h-40 text-foreground focus:border-primary transition-colors outline-none resize-none mb-4 placeholder:text-muted-foreground"
              data-testid="input-news-content"
            />

            {isUrl && (
              <div className="flex items-center gap-1.5 mb-3">
                <Badge variant="outline" className="text-xs">URL Detected</Badge>
                <span className="text-xs text-muted-foreground">We'll analyze the linked content</span>
              </div>
            )}

            <Button
              size="lg"
              onClick={handleNewsScan}
              disabled={verifyMutation.isPending || !!newsOffline}
              className="w-full font-black rounded-2xl text-lg"
              data-testid="button-news-scan"
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  SCANNING...
                </>
              ) : (
                <>
                  EXECUTE NEWS SCAN
                  <Cpu className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>

          <div className="bg-card/50 dark:bg-white/5 p-12 rounded-[2.5rem] border border-border/50 dark:border-white/10 shadow-2xl backdrop-blur-xl" data-testid="panel-tool-auditor">
            <h2 className="text-3xl font-bold mb-2 text-primary" data-testid="heading-tool-auditor">Tool Auditor</h2>
            <p className="text-muted-foreground mb-6">Audit any AI tool or Software link for safety.</p>

            {toolOffline && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-3 mb-4 flex items-center gap-2" data-testid="banner-tool-offline">
                <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive font-medium">Tool Auditor is currently offline by Admin.</p>
              </div>
            )}

            <input
              type="text"
              value={toolContent}
              onChange={(e) => setToolContent(e.target.value)}
              placeholder="https://tool-link.com"
              className="w-full bg-background/50 dark:bg-black/50 border border-border/50 dark:border-white/10 rounded-2xl p-5 text-foreground focus:border-primary transition-colors outline-none mb-4 placeholder:text-muted-foreground"
              data-testid="input-tool-content"
            />

            <div className="h-[calc(8rem-3.5rem)]" />

            <Button
              size="lg"
              variant="outline"
              onClick={handleToolAudit}
              disabled={auditMutation.isPending || !!toolOffline}
              className="w-full font-black rounded-2xl text-lg"
              data-testid="button-tool-audit"
            >
              {auditMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AUDITING...
                </>
              ) : (
                <>
                  AUDIT TOOL SAFETY
                  <Wrench className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-8">
          <div className="bg-card/50 dark:bg-white/5 p-12 rounded-[2.5rem] border border-border/50 dark:border-white/10 shadow-2xl backdrop-blur-xl" data-testid="panel-media-intelligence">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <h2 className="text-3xl font-bold text-primary" data-testid="heading-media-intelligence">Media Intelligence</h2>
              <Badge variant="outline" className="text-xs font-mono tracking-wider">v7 FORENSIC ENGINE</Badge>
            </div>
            <p className="text-muted-foreground mb-6">Deep forensic scan for images, screenshots & videos.</p>

            {mediaOffline && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-3 mb-4 flex items-center gap-2" data-testid="banner-media-offline">
                <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive font-medium">Media Intelligence is currently offline by Admin.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end">
              <input
                type="text"
                value={mediaContent}
                onChange={(e) => setMediaContent(e.target.value)}
                placeholder="Paste image/video URL or describe the media to analyze..."
                className="w-full bg-background/50 dark:bg-black/50 border border-border/50 dark:border-white/10 rounded-2xl p-5 text-foreground focus:border-primary transition-colors outline-none placeholder:text-muted-foreground"
                data-testid="input-media-content"
              />

              <div className="flex gap-2">
                <Button
                  variant={mediaType === "image" ? "default" : "outline"}
                  onClick={() => setMediaType("image")}
                  className="rounded-2xl"
                  data-testid="button-media-type-image"
                >
                  <Search className="w-4 h-4" />
                  Image
                </Button>
                <Button
                  variant={mediaType === "video" ? "default" : "outline"}
                  onClick={() => setMediaType("video")}
                  className="rounded-2xl"
                  data-testid="button-media-type-video"
                >
                  <BarChart3 className="w-4 h-4" />
                  Video
                </Button>
              </div>

              <Button
                size="lg"
                onClick={handleMediaAudit}
                disabled={mediaAuditMutation.isPending || !!mediaOffline}
                className="font-black rounded-2xl text-lg"
                data-testid="button-media-audit"
              >
                {mediaAuditMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    SCANNING...
                  </>
                ) : (
                  <>
                    FORENSIC SCAN
                    <Shield className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-8">
          <div className="bg-card/50 dark:bg-white/5 p-12 rounded-[2.5rem] border border-border/50 dark:border-white/10 shadow-2xl backdrop-blur-xl" data-testid="panel-audio-intelligence">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <h2 className="text-3xl font-bold text-primary" data-testid="heading-audio-intelligence">Audio Intelligence</h2>
              <Badge variant="outline" className="text-xs font-mono tracking-wider">VOICE AUDIT ENGINE</Badge>
            </div>
            <p className="text-muted-foreground mb-6">Transcription, AI voice detection & audio forensics.</p>

            {audioOffline && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-3 mb-4 flex items-center gap-2" data-testid="banner-audio-offline">
                <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive font-medium">Audio Intelligence is currently offline by Admin.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end">
              <input
                type="text"
                value={audioContent}
                onChange={(e) => setAudioContent(e.target.value)}
                placeholder="Paste YouTube, Instagram, Facebook URL or describe audio content..."
                className="w-full bg-background/50 dark:bg-black/50 border border-border/50 dark:border-white/10 rounded-2xl p-5 text-foreground focus:border-primary transition-colors outline-none placeholder:text-muted-foreground"
                data-testid="input-audio-content"
              />

              <Select value={audioPlatform} onValueChange={setAudioPlatform}>
                <SelectTrigger className="w-[160px] rounded-2xl" data-testid="select-audio-platform">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto Detect</SelectItem>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="Direct Upload">Direct Upload</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="lg"
                onClick={handleAudioAudit}
                disabled={audioAuditMutation.isPending || !!audioOffline}
                className="font-black rounded-2xl text-lg"
                data-testid="button-audio-audit"
              >
                {audioAuditMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    SCANNING...
                  </>
                ) : (
                  <>
                    AUDIO SCAN
                    <Headphones className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {(verifyMutation.isPending || auditMutation.isPending || mediaAuditMutation.isPending || audioAuditMutation.isPending) && (
          <div className="max-w-4xl mx-auto mt-10">
            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-muted border-t-primary animate-spin" />
              </div>
              <p className="text-muted-foreground font-medium">
                {verifyMutation.isPending
                  ? "Analyzing claims and cross-referencing sources..."
                  : mediaAuditMutation.isPending
                  ? "Running deep forensic media analysis..."
                  : audioAuditMutation.isPending
                  ? "Processing audio intelligence scan..."
                  : "Scanning tool for safety and legitimacy..."}
              </p>
            </div>
          </div>
        )}

        {newsResult && !verifyMutation.isPending && (
          <div className="max-w-5xl mx-auto mt-12 space-y-6" data-testid="section-news-results">
            <div className="bg-card/50 dark:bg-white/5 nexa-card-glow rounded-[2.5rem] p-10 backdrop-blur-xl" data-testid="card-analysis-dashboard">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center" data-testid="card-trust-score">
                  <h4 className="text-primary font-bold uppercase text-xs tracking-widest">Credibility Index</h4>
                  <p className="text-7xl font-black mt-2" data-testid="text-score-value">{newsResult.credibilityScore}%</p>
                </div>
                <div className="text-center" data-testid="card-rating">
                  <h4 className="text-primary font-bold uppercase text-xs tracking-widest">NeXA Rating</h4>
                  <p className={`text-5xl font-black mt-2 ${getCredibilityRating(newsResult.credibilityScore).color}`} data-testid="text-nexa-rating">
                    {getCredibilityRating(newsResult.credibilityScore).rating}
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-1.5">
                    {newsResult.credibilityScore >= 60 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : newsResult.credibilityScore >= 40 ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-xs font-black uppercase ${getCredibilityRating(newsResult.credibilityScore).indicatorColor}`}>
                      {getCredibilityRating(newsResult.credibilityScore).indicator}
                    </span>
                  </div>
                </div>
                <div className="text-center" data-testid="card-origin">
                  <h4 className="text-primary font-bold uppercase text-xs tracking-widest">Source Intelligence</h4>
                  <p className="text-lg font-bold mt-4 italic text-muted-foreground" data-testid="text-origin">
                    {newsResult.originSource || "User Provided Text"}
                  </p>
                </div>
                <div className="text-center" data-testid="card-verdict">
                  <h4 className="text-primary font-bold uppercase text-xs tracking-widest">Final Verdict</h4>
                  <div className="mt-4">
                    <span className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-full font-black text-xl italic uppercase" data-testid="text-verdict">
                      {newsResult.verdict}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ScoreRing score={newsResult.credibilityScore} />
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2 flex-wrap">
                    {getVerdictIcon(newsResult.credibilityScore)}
                    <h2 className="text-xl font-bold">{newsResult.verdict}</h2>
                    <Badge variant="outline" className={getVerdictInfo(newsResult.credibilityScore).color}>
                      {getVerdictInfo(newsResult.credibilityScore).label}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed" data-testid="text-summary">{newsResult.summary}</p>
                </div>
              </div>
            </div>

            {newsResult.claimsAnalyzed && newsResult.claimsAnalyzed.length > 0 && (
              <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary" />
                  Claims Analyzed
                </h3>
                <ul className="space-y-2">
                  {newsResult.claimsAnalyzed.map((claim, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                      <span>{claim}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {newsResult.flaggedClaims && newsResult.flaggedClaims.length > 0 && (
              <div className="bg-red-500/5 dark:bg-red-500/10 p-8 rounded-[2rem] border-2 border-red-500/30 backdrop-blur-xl" data-testid="card-flagged-claims">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  Flagged Claims — False / Misleading
                </h3>
                <ul className="space-y-3">
                  {newsResult.flaggedClaims.map((claim, i) => (
                    <li key={i} className="flex items-start gap-3 bg-red-500/10 dark:bg-red-500/15 rounded-xl p-4 border border-red-500/20" data-testid={`flagged-claim-${i}`}>
                      <XCircle className="w-5 h-5 mt-0.5 text-red-500 shrink-0" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">{claim}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {newsResult.sources && newsResult.sources.length > 0 && (
              <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Referenced Sources
                </h3>
                <ul className="space-y-1.5">
                  {newsResult.sources.map((source, i) => (
                    <li key={i} className="text-sm text-muted-foreground">{source}</li>
                  ))}
                </ul>
              </div>
            )}

            {((newsResult as any).sourceOrigin || (newsResult as any).yearTimestamp || (newsResult as any).platformReach || (newsResult as any).sentimentSummary) && (
              <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl" data-testid="card-news-deep-analytics">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Deep Analytics
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(newsResult as any).sourceOrigin && (
                    <div className="p-4 rounded-2xl bg-muted/50" data-testid="news-source-origin">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Source Origin</p>
                      <p className="text-sm font-bold mt-1">{(newsResult as any).sourceOrigin}</p>
                    </div>
                  )}
                  {(newsResult as any).yearTimestamp && (
                    <div className="p-4 rounded-2xl bg-muted/50" data-testid="news-year-timestamp">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Year / Timestamp</p>
                      <p className="text-lg font-bold mt-1">{(newsResult as any).yearTimestamp}</p>
                    </div>
                  )}
                  {(newsResult as any).platformReach && (
                    <div className="p-4 rounded-2xl bg-muted/50" data-testid="news-platform-reach">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Platform Reach</p>
                      <p className="text-sm font-bold mt-1">{(newsResult as any).platformReach}</p>
                    </div>
                  )}
                  {(newsResult as any).sentimentSummary && (
                    <div className="p-4 rounded-2xl bg-muted/50 md:col-span-3" data-testid="news-sentiment-summary">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Sentiment Summary</p>
                      <p className="text-sm font-medium mt-1 text-muted-foreground">{(newsResult as any).sentimentSummary}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(newsResult as any).contentDNA && (
              <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl" data-testid="card-content-dna">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <Dna className="w-5 h-5 text-primary" />
                  Content DNA Analysis
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(newsResult as any).contentDNA.writingStyle && (
                    <div className="p-4 rounded-2xl bg-muted/50" data-testid="dna-writing-style">
                      <div className="flex items-center gap-2 mb-1">
                        <PenLine className="w-4 h-4 text-primary" />
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Writing Style</p>
                      </div>
                      <p className="text-sm font-bold mt-1">{(newsResult as any).contentDNA.writingStyle}</p>
                    </div>
                  )}
                  {(newsResult as any).contentDNA.timestampAudit && (
                    <div className="p-4 rounded-2xl bg-muted/50" data-testid="dna-timestamp-audit">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-primary" />
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Timestamp Audit</p>
                      </div>
                      <p className="text-sm font-bold mt-1">{(newsResult as any).contentDNA.timestampAudit}</p>
                    </div>
                  )}
                  {(newsResult as any).contentDNA.contentDistortion && (
                    <div className={`p-4 rounded-2xl ${(newsResult as any).contentDNA.contentDistortion?.includes("None") ? "bg-muted/50" : "bg-red-500/10 border border-red-500/20"}`} data-testid="dna-content-distortion">
                      <div className="flex items-center gap-2 mb-1">
                        <Fingerprint className="w-4 h-4 text-primary" />
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Content Distortion</p>
                      </div>
                      <p className={`text-sm font-bold mt-1 ${(newsResult as any).contentDNA.contentDistortion?.includes("None") ? "" : "text-red-600 dark:text-red-400"}`}>{(newsResult as any).contentDNA.contentDistortion}</p>
                    </div>
                  )}
                  {(newsResult as any).contentDNA.viralPathway && (
                    <div className="p-4 rounded-2xl bg-muted/50" data-testid="dna-viral-pathway">
                      <div className="flex items-center gap-2 mb-1">
                        <Route className="w-4 h-4 text-primary" />
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Viral Pathway</p>
                      </div>
                      <p className="text-sm font-bold mt-1">{(newsResult as any).contentDNA.viralPathway}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(newsResult as any).scientificScrutiny && (newsResult as any).scientificScrutiny.applicable && (
              <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl" data-testid="card-scientific-scrutiny">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-primary" />
                  Scientific Scrutiny
                </h4>
                <div className="space-y-4">
                  {(newsResult as any).scientificScrutiny.biologyFactCheck && (newsResult as any).scientificScrutiny.biologyFactCheck !== "N/A" && (
                    <div className="p-4 rounded-2xl bg-muted/50" data-testid="science-biology-check">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Biology / Medical Fact Check</p>
                      <p className="text-sm font-medium">{(newsResult as any).scientificScrutiny.biologyFactCheck}</p>
                    </div>
                  )}
                  {(newsResult as any).scientificScrutiny.misleadingClaims && (newsResult as any).scientificScrutiny.misleadingClaims !== "N/A" && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20" data-testid="science-misleading">
                      <p className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wider mb-1 font-bold">Pseudo-Science / Misleading Claims</p>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">{(newsResult as any).scientificScrutiny.misleadingClaims}</p>
                    </div>
                  )}
                  {(newsResult as any).scientificScrutiny.expertSummary && (newsResult as any).scientificScrutiny.expertSummary !== "N/A" && (
                    <div className="p-4 rounded-2xl bg-muted/50" data-testid="science-expert-summary">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Expert Summary</p>
                      <p className="text-sm font-medium">{(newsResult as any).scientificScrutiny.expertSummary}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(newsResult as any).motiveAnalysis && (newsResult as any).motiveAnalysis.detectedMotive && (
              <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border-2 border-yellow-500/20 backdrop-blur-xl" data-testid="card-motive-analysis">
                <h4 className="font-bold mb-2 flex flex-wrap items-center gap-2">
                  <Target className="w-5 h-5 text-yellow-500" />
                  Deep Contextual Motive Analysis
                </h4>
                <p className="text-xs text-muted-foreground mb-5">Detecting hidden intent, beneficiaries, and manipulation techniques</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Detected Motive</p>
                    <p className={`text-lg font-black mt-1 ${(newsResult as any).motiveAnalysis.detectedMotive === "Informational" || (newsResult as any).motiveAnalysis.detectedMotive === "Public Awareness" ? "text-emerald-500" : (newsResult as any).motiveAnalysis.detectedMotive === "Unknown" ? "text-muted-foreground" : "text-yellow-500"}`} data-testid="text-motive">
                      {(newsResult as any).motiveAnalysis.detectedMotive}
                    </p>
                    {(newsResult as any).motiveAnalysis.confidenceLevel !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">{(newsResult as any).motiveAnalysis.confidenceLevel}% confidence</p>
                    )}
                  </div>
                  {(newsResult as any).motiveAnalysis.targetAudience && (
                    <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Target Audience</p>
                      <p className="text-sm font-bold mt-1" data-testid="text-target-audience">{(newsResult as any).motiveAnalysis.targetAudience}</p>
                    </div>
                  )}
                  {(newsResult as any).motiveAnalysis.beneficiary && (
                    <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Beneficiary</p>
                      <p className="text-sm font-bold mt-1" data-testid="text-beneficiary">{(newsResult as any).motiveAnalysis.beneficiary}</p>
                    </div>
                  )}
                  {(newsResult as any).motiveAnalysis.narrativeAlignment && (
                    <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Narrative Alignment</p>
                      <p className="text-sm font-bold mt-1" data-testid="text-narrative">{(newsResult as any).motiveAnalysis.narrativeAlignment}</p>
                    </div>
                  )}
                </div>
                {(newsResult as any).motiveAnalysis.manipulationTechniques?.length > 0 && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                    <p className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wider font-bold mb-2">Manipulation Techniques Detected</p>
                    <div className="flex flex-wrap gap-2">
                      {(newsResult as any).motiveAnalysis.manipulationTechniques.map((t: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs text-red-600 dark:text-red-400 border-red-500/30">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {(newsResult as any).styleMatch && (newsResult as any).styleMatch.matchedPattern && (
              <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl" data-testid="card-style-match">
                <h4 className="font-bold mb-4 flex flex-wrap items-center gap-2">
                  <PenLine className="w-5 h-5 text-primary" />
                  Content Style Intelligence
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Matched Pattern</p>
                    <p className="text-sm font-bold mt-1" data-testid="text-matched-pattern">{(newsResult as any).styleMatch.matchedPattern}</p>
                  </div>
                  {(newsResult as any).styleMatch.languageTone && (
                    <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Language Tone</p>
                      <p className={`text-sm font-bold mt-1 ${(newsResult as any).styleMatch.languageTone === "Sensational" || (newsResult as any).styleMatch.languageTone === "Alarmist" || (newsResult as any).styleMatch.languageTone === "Aggressive" ? "text-red-500" : (newsResult as any).styleMatch.languageTone === "Neutral/Objective" || (newsResult as any).styleMatch.languageTone === "Academic" ? "text-emerald-500" : ""}`} data-testid="text-language-tone">
                        {(newsResult as any).styleMatch.languageTone}
                      </p>
                    </div>
                  )}
                  {(newsResult as any).styleMatch.originalLanguage && (
                    <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Original Language</p>
                      <p className="text-sm font-bold mt-1" data-testid="text-original-lang">{(newsResult as any).styleMatch.originalLanguage}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {auditResult && !auditMutation.isPending && (
          <div className="max-w-5xl mx-auto mt-12 space-y-6" data-testid="section-audit-results">
            <div className="bg-card/50 dark:bg-white/5 nexa-card-glow rounded-[2.5rem] p-10 backdrop-blur-xl" data-testid="card-audit-dashboard">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center" data-testid="audit-safety-rating">
                  <h4 className="text-primary font-bold uppercase text-xs tracking-widest">Safety Rating</h4>
                  <p className={`text-7xl font-black mt-2 ${getSafetyColor(auditResult.safetyRating)}`} data-testid="text-safety-rating">
                    {auditResult.safetyRating}
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-1.5">
                    {getSafetyRatingInfo(auditResult.safetyRating).indicator === "VERIFIED" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : getSafetyRatingInfo(auditResult.safetyRating).indicator === "CAUTION" ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-xs font-black uppercase ${getSafetyRatingInfo(auditResult.safetyRating).indicatorColor}`}>
                      {getSafetyRatingInfo(auditResult.safetyRating).indicator}
                    </span>
                  </div>
                </div>
                <div className="text-center" data-testid="audit-legitimacy">
                  <h4 className="text-primary font-bold uppercase text-xs tracking-widest">Legitimacy</h4>
                  <div className="mt-4">
                    <span className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold text-sm uppercase" data-testid="text-legitimacy">
                      {auditResult.legitimacy}
                    </span>
                  </div>
                </div>
                <div className="text-center" data-testid="audit-trust">
                  <h4 className="text-primary font-bold uppercase text-xs tracking-widest">User Trust</h4>
                  <div className="mt-4">
                    <Badge variant="outline" className={`text-lg px-4 py-1 font-bold ${getTrustColor(auditResult.userTrust)}`} data-testid="text-user-trust">
                      {auditResult.userTrust}
                    </Badge>
                  </div>
                </div>
                <div className="text-center" data-testid="audit-risk">
                  <h4 className="text-primary font-bold uppercase text-xs tracking-widest">Risk Level</h4>
                  <div className="mt-4">
                    <Badge variant="outline" className={`text-lg px-4 py-1 font-bold ${getRiskColor(auditResult.riskLevel)}`} data-testid="text-risk-level">
                      {auditResult.riskLevel}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-3">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="font-bold">Analysis: {auditResult.toolName}</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-audit-details">{auditResult.details}</p>
              {((auditResult as any).historicalYear || (auditResult as any).originalChannel || (auditResult as any).sentimentSummary || (auditResult as any).privacyAudit || (auditResult as any).trafficMetrics) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  {(auditResult as any).historicalYear && (
                    <div className="p-4 rounded-2xl bg-muted/50" data-testid="audit-historical-year">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Founded</p>
                      <p className="text-lg font-bold mt-1">{(auditResult as any).historicalYear}</p>
                    </div>
                  )}
                  {(auditResult as any).originalChannel && (
                    <div className="p-4 rounded-2xl bg-muted/50" data-testid="audit-original-channel">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Original Channel</p>
                      <p className="text-sm font-bold mt-1">{(auditResult as any).originalChannel}</p>
                    </div>
                  )}
                  {(auditResult as any).privacyAudit && (
                    <div className="p-4 rounded-2xl bg-muted/50" data-testid="audit-privacy">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Privacy Audit</p>
                      <p className="text-sm font-bold mt-1">{(auditResult as any).privacyAudit}</p>
                    </div>
                  )}
                  {(auditResult as any).trafficMetrics && (
                    <div className="p-4 rounded-2xl bg-muted/50" data-testid="audit-traffic">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Traffic Metrics</p>
                      <p className="text-sm font-bold mt-1">{(auditResult as any).trafficMetrics}</p>
                    </div>
                  )}
                  {(auditResult as any).sentimentSummary && (
                    <div className="p-4 rounded-2xl bg-muted/50 md:col-span-3" data-testid="audit-sentiment">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Sentiment</p>
                      <p className="text-sm font-medium mt-1 text-muted-foreground">{(auditResult as any).sentimentSummary}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {((auditResult as any).pricingPlans || (auditResult as any).marketWorth || (auditResult as any).saleStatus) && (
              <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <h3 className="font-bold">Commercial Metrics</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(auditResult as any).pricingPlans && (
                    <div className="p-4 rounded-2xl bg-muted/50" data-testid="audit-pricing-plans">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Pricing Plans</p>
                      <p className="text-sm font-bold mt-1">{(auditResult as any).pricingPlans}</p>
                    </div>
                  )}
                  {(auditResult as any).marketWorth && (
                    <div className="p-4 rounded-2xl bg-muted/50" data-testid="audit-market-worth">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Market Worth</p>
                      <p className="text-sm font-bold mt-1">{(auditResult as any).marketWorth}</p>
                    </div>
                  )}
                  {(auditResult as any).saleStatus && (
                    <div className="p-4 rounded-2xl bg-muted/50" data-testid="audit-sale-status">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Sale Status</p>
                      <p className="text-sm font-bold mt-1">{(auditResult as any).saleStatus}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {((auditResult as any).isWebTool !== undefined || (auditResult as any).playStoreStatus || (auditResult as any).ageYears) && (
              <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-5 h-5 text-primary" />
                  <h3 className="font-bold">Existence Check</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(auditResult as any).isWebTool !== undefined && (
                    <div className="p-4 rounded-2xl bg-muted/50" data-testid="audit-is-web-tool">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Web Tool</p>
                      <div className="flex items-center gap-2 mt-1">
                        {(auditResult as any).isWebTool ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <p className="text-sm font-bold">{(auditResult as any).isWebTool ? "Yes" : "No"}</p>
                      </div>
                    </div>
                  )}
                  {(auditResult as any).playStoreStatus && (
                    <div className="p-4 rounded-2xl bg-muted/50" data-testid="audit-play-store">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">App Store Status</p>
                      <p className="text-sm font-bold mt-1">{(auditResult as any).playStoreStatus}</p>
                    </div>
                  )}
                  {(auditResult as any).ageYears && (
                    <div className="p-4 rounded-2xl bg-muted/50" data-testid="audit-age-years">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Age</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm font-bold">{(auditResult as any).ageYears} years</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {((auditResult as any).userReach || (auditResult as any).resultAccuracy) && (
              <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-bold">Performance Metrics</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(auditResult as any).userReach && (
                    <div className="p-4 rounded-2xl bg-muted/50" data-testid="audit-user-reach">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">User Reach</p>
                      <p className="text-sm font-bold mt-1">{(auditResult as any).userReach}</p>
                    </div>
                  )}
                  {(auditResult as any).resultAccuracy && (
                    <div className="p-4 rounded-2xl bg-muted/50" data-testid="audit-result-accuracy">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Result Accuracy</p>
                      <div className="flex items-center gap-3 mt-1">
                        <Target className="w-4 h-4 text-primary" />
                        <p className="text-sm font-bold">{(auditResult as any).resultAccuracy}%</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {auditResult.flags && auditResult.flags.length > 0 && (
              <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  Red Flags
                </h3>
                <ul className="space-y-2">
                  {auditResult.flags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <XCircle className="w-4 h-4 mt-0.5 text-destructive shrink-0" />
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {auditResult.recommendations && auditResult.recommendations.length > 0 && (
              <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {auditResult.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {(statsConfig?.showStats !== false) && (
        <div className="py-10 px-4" data-testid="section-stats-banner">
          <div className="flex justify-center gap-20 items-center">
            <div className="text-center" data-testid="stat-news-verified">
              <p className="text-4xl font-black text-primary">{statsConfig?.newsCount || "1.2M+"}</p>
              <p className="text-xs uppercase text-muted-foreground tracking-wider">News Verified</p>
            </div>
            <div className="text-center border-l border-border/30 dark:border-white/10 pl-20" data-testid="stat-tools-audited">
              <p className="text-4xl font-black text-foreground">{statsConfig?.toolsCount || "500+"}</p>
              <p className="text-xs uppercase text-muted-foreground tracking-wider">AI Tools Audited</p>
            </div>
          </div>
          {(newsResult || auditResult) && (
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <Button
                className="font-black rounded-2xl px-8"
                onClick={async () => {
                  if (newsResult) {
                    try {
                      const res = await fetch(`/api/get-audit-result/${newsResult.id}`);
                      const report = await res.json();
                      const lines = [
                        "═══════════════════════════════════════════════════",
                        `        ${report.title}`,
                        "═══════════════════════════════════════════════════",
                        "",
                        `Report ID: ${report.id}`,
                        `Date: ${report.date}`,
                        `Timestamp: ${report.timestamp}`,
                        `Issued By: ${report.issuedBy}`,
                        `Founder: ${report.founder}`,
                        "",
                        `Summary: ${report.summary}`,
                        report.verdict ? `Verdict: ${report.verdict}` : "",
                        report.credibilityScore ? `Credibility Score: ${report.credibilityScore}/100` : "",
                        "",
                        ...(report.flaggedClaims?.length ? ["--- FLAGGED CLAIMS ---", ...report.flaggedClaims.map((c: string) => `  - ${c}`), ""] : []),
                        ...(report.sourceReferences?.length ? ["--- SOURCE REFERENCES ---", ...report.sourceReferences.map((s: string) => `  - ${s}`), ""] : []),
                        `Legal: ${report.legal}`,
                        `Liability: ${report.liability}`,
                        "",
                        "--- DISCLAIMER ---",
                        report.disclaimer,
                        "Digital Report Only - No Physical Copy Issued",
                        "═══════════════════════════════════════════════════",
                      ].filter(Boolean).join("\n");
                      const blob = new Blob([lines], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `NeXA_Audit_Result_${newsResult.id}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast({ title: "Report Downloaded", description: "Your NeXA Intelligence Report has been generated." });
                    } catch {
                      toast({ title: "Error", description: "Failed to generate audit report.", variant: "destructive" });
                    }
                  } else if (auditResult) {
                    const now = new Date();
                    const lines = [
                      "═══════════════════════════════════════════════════",
                      "        NeXA Tool Audit Report",
                      "═══════════════════════════════════════════════════",
                      "",
                      `Tool: ${auditResult.toolName}`,
                      `Date: ${now.toLocaleDateString()}`,
                      `Timestamp: ${now.toISOString()}`,
                      `Issued By: NeXA 11 AI - Global Verification Network`,
                      "",
                      `Safety Rating: ${auditResult.safetyRating}`,
                      `Legitimacy: ${auditResult.legitimacy}`,
                      `User Trust: ${auditResult.userTrust}`,
                      `Risk Level: ${auditResult.riskLevel}`,
                      "",
                      `Analysis: ${auditResult.details}`,
                      "",
                      ...(auditResult.flags?.length ? ["--- RED FLAGS ---", ...auditResult.flags.map((f) => `  - ${f}`), ""] : []),
                      ...(auditResult.recommendations?.length ? ["--- RECOMMENDATIONS ---", ...auditResult.recommendations.map((r) => `  - ${r}`), ""] : []),
                      "--- DISCLAIMER ---",
                      "This result is for informational purposes only. NeXA 11 AI assumes no legal liability.",
                      "Zero-Liability for misuse or viral spread.",
                      "Digital Report Only - No Physical Copy Issued",
                      "═══════════════════════════════════════════════════",
                    ].join("\n");
                    const blob = new Blob([lines], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `NeXA_Audit_Result_${auditResult.toolName.replace(/\s+/g, "_")}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast({ title: "Report Downloaded", description: "Your NeXA Tool Audit Report has been generated." });
                  }
                }}
                data-testid="button-get-audit-result"
              >
                GET AUDIT RESULT
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl font-bold uppercase text-xs"
                onClick={async () => {
                  if (newsResult) {
                    try {
                      const res = await fetch(`/api/generate-pdf-result/${newsResult.id}`);
                      if (!res.ok) throw new Error("PDF generation failed");
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `NeXA_Audit_${newsResult.id}.pdf`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast({ title: "PDF Downloaded", description: "Your professional NeXA Intelligence Report PDF has been generated." });
                    } catch {
                      toast({ title: "Error", description: "Failed to generate PDF report.", variant: "destructive" });
                    }
                  } else if (auditResult) {
                    try {
                      const res = await fetch("/api/generate-tool-pdf", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          toolName: auditResult.toolName,
                          safetyRating: auditResult.safetyRating,
                          legitimacy: auditResult.legitimacy,
                          userTrust: auditResult.userTrust,
                          riskLevel: auditResult.riskLevel,
                          details: auditResult.details,
                          flags: auditResult.flags,
                          recommendations: auditResult.recommendations,
                          privacyAudit: (auditResult as any).privacyAudit,
                          trafficMetrics: (auditResult as any).trafficMetrics,
                          historicalYear: (auditResult as any).historicalYear,
                          originalChannel: (auditResult as any).originalChannel,
                          pricingPlans: (auditResult as any).pricingPlans,
                          marketWorth: (auditResult as any).marketWorth,
                          saleStatus: (auditResult as any).saleStatus,
                          isWebTool: (auditResult as any).isWebTool,
                          playStoreStatus: (auditResult as any).playStoreStatus,
                          ageYears: (auditResult as any).ageYears,
                          userReach: (auditResult as any).userReach,
                          resultAccuracy: (auditResult as any).resultAccuracy,
                        }),
                      });
                      if (!res.ok) throw new Error("PDF generation failed");
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `NeXA_Tool_Audit_${auditResult.toolName.replace(/\s+/g, "_")}.pdf`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast({ title: "PDF Downloaded", description: "Your NeXA Tool Audit Report PDF has been generated." });
                    } catch {
                      toast({ title: "Error", description: "Failed to generate tool audit PDF.", variant: "destructive" });
                    }
                  } else {
                    toast({ title: "No data", description: "Run a verification or tool audit first.", variant: "destructive" });
                  }
                }}
                data-testid="button-download-certificate"
              >
                <FileDown className="w-4 h-4" />
                DOWNLOAD PDF REPORT
              </Button>
              {(newsResult || auditResult) && (
                <Button
                  className="rounded-2xl font-black uppercase text-xs bg-blue-600 text-white"
                  disabled={fullAuditLoading || (!newsResult && !auditResult)}
                  onClick={async () => {
                    const auditContent = newsResult
                      ? newsResult.inputText
                      : auditResult
                        ? auditResult.toolName
                        : "";
                    if (!auditContent || auditContent.trim().length < 3) {
                      toast({ title: "No Data", description: "Run a verification or tool audit first.", variant: "destructive" });
                      return;
                    }
                    setFullAuditLoading(true);
                    setFullAuditData(null);
                    try {
                      const type = newsResult ? "news" : "tool";
                      const res = await apiRequest("POST", "/api/full-audit-report", { content: auditContent, type });
                      const data = await res.json();
                      setFullAuditData(data);
                      toast({ title: "Full Audit Complete", description: "Deep intelligence report generated successfully." });
                    } catch {
                      toast({ title: "Audit Failed", description: "Could not generate full audit report.", variant: "destructive" });
                    } finally {
                      setFullAuditLoading(false);
                    }
                  }}
                  data-testid="button-full-audit-report"
                >
                  {fullAuditLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      GENERATING DEEP AUDIT...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      FULL AUDIT REPORT
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {mediaResult && !mediaAuditMutation.isPending && (
        <div className="max-w-5xl mx-auto mt-12 space-y-6 px-4" data-testid="section-media-results">
          <div className="bg-card/50 dark:bg-white/5 nexa-card-glow rounded-[2.5rem] p-10 backdrop-blur-xl" data-testid="card-media-dashboard">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-black uppercase text-primary" data-testid="text-media-name">{mediaResult.mediaName}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs font-mono">{mediaResult.mediaType?.toUpperCase()}</Badge>
                  <Badge variant="outline" className="text-xs font-mono">MEDIA INTELLIGENCE v7</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center" data-testid="media-forensic-score">
                <h4 className="text-primary font-bold uppercase text-xs tracking-widest">Forensic Score</h4>
                <p className={`text-7xl font-black mt-2 ${getForensicColor(mediaResult.forensicScore)}`} data-testid="text-forensic-score">
                  {mediaResult.forensicScore}%
                </p>
              </div>
              <div className="text-center" data-testid="media-authenticity">
                <h4 className="text-primary font-bold uppercase text-xs tracking-widest">Authenticity</h4>
                <p className={`text-5xl font-black mt-2 ${(mediaResult.authenticityProbability ?? 50) >= 70 ? "text-emerald-500" : (mediaResult.authenticityProbability ?? 50) >= 40 ? "text-yellow-500" : "text-red-500"}`} data-testid="text-authenticity-prob">
                  {mediaResult.authenticityProbability ?? 50}%
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  {(mediaResult.authenticityProbability ?? 50) >= 70 ? "LIKELY AUTHENTIC" : (mediaResult.authenticityProbability ?? 50) >= 40 ? "UNCERTAIN" : "LIKELY AI/FAKE"}
                </p>
              </div>
              <div className="text-center" data-testid="media-verdict">
                <h4 className="text-primary font-bold uppercase text-xs tracking-widest">Verdict</h4>
                <div className="mt-4">
                  <Badge variant="outline" className={`text-lg px-4 py-1 font-bold ${getVerdictColor(mediaResult.verdict)}`} data-testid="text-media-verdict">
                    {mediaResult.verdict?.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
              <div className="text-center" data-testid="media-risk">
                <h4 className="text-primary font-bold uppercase text-xs tracking-widest">Risk Assessment</h4>
                <div className="mt-4">
                  <Badge variant="outline" className={`text-lg px-4 py-1 font-bold ${getRiskBadgeColor(mediaResult.riskAssessment)}`} data-testid="text-media-risk">
                    {mediaResult.riskAssessment?.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {mediaResult.aiDetection && (
            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl" data-testid="card-ai-detection">
              <h4 className="text-primary font-bold uppercase text-sm tracking-widest mb-4 flex flex-wrap items-center gap-2">
                <Cpu className="w-4 h-4" />
                AI Detection - Deep Neural Scan
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">AI Generated</p>
                  <p className={`text-lg font-bold mt-1 ${mediaResult.aiDetection.isAiGenerated ? "text-red-500" : "text-emerald-500"}`} data-testid="text-ai-generated">
                    {mediaResult.aiDetection.isAiGenerated ? "YES" : "NO"}
                  </p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Confidence</p>
                  <p className="text-lg font-bold mt-1" data-testid="text-ai-confidence">{mediaResult.aiDetection.confidence}%</p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Detected Model</p>
                  <p className="text-lg font-bold mt-1" data-testid="text-ai-model">{mediaResult.aiDetection.model}</p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Method</p>
                  <p className="text-sm text-muted-foreground mt-1">{mediaResult.aiDetection.method}</p>
                </div>
              </div>
            </div>
          )}

          {mediaResult.pixelForensics && (
            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border-2 border-primary/20 backdrop-blur-xl" data-testid="card-pixel-forensics">
              <h4 className="text-primary font-bold uppercase text-sm tracking-widest mb-2 flex flex-wrap items-center gap-2">
                <Layers className="w-4 h-4" />
                Pixel-Level Forced Audit — 4 Forensic Methods
              </h4>
              <p className="text-xs text-muted-foreground mb-5">Maximum pixel scrutiny with sub-pixel analysis</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mediaResult.pixelForensics.ela && (
                  <div className={`rounded-xl p-5 border ${mediaResult.pixelForensics.ela.status === "FAIL" ? "bg-red-500/5 border-red-500/30" : mediaResult.pixelForensics.ela.status === "SUSPICIOUS" ? "bg-yellow-500/5 border-yellow-500/30" : "bg-background/50 dark:bg-black/30 border-border/50"}`} data-testid="forensic-ela">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        <p className="text-sm font-black uppercase tracking-wider">ELA - Error Level Analysis</p>
                      </div>
                      <Badge variant="outline" className={`text-xs font-bold ${mediaResult.pixelForensics.ela.status === "FAIL" ? "text-red-500 border-red-500/50" : mediaResult.pixelForensics.ela.status === "SUSPICIOUS" ? "text-yellow-500 border-yellow-500/50" : "text-emerald-500 border-emerald-500/50"}`}>
                        {mediaResult.pixelForensics.ela.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Deep Compression Variance Analysis</p>
                    <div className="flex flex-wrap items-center gap-4 mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Compression Variance</p>
                        <p className={`text-lg font-bold ${mediaResult.pixelForensics.ela.compressionVariance > 60 ? "text-red-500" : mediaResult.pixelForensics.ela.compressionVariance > 30 ? "text-yellow-500" : "text-emerald-500"}`}>{mediaResult.pixelForensics.ela.compressionVariance}%</p>
                      </div>
                      {mediaResult.pixelForensics.ela.hotspots?.length > 0 && (
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Hotspots</p>
                          <div className="flex flex-wrap gap-1">
                            {mediaResult.pixelForensics.ela.hotspots.map((h: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{h}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground italic">{mediaResult.pixelForensics.ela.finding}</p>
                  </div>
                )}

                {mediaResult.pixelForensics.noisePrint && (
                  <div className={`rounded-xl p-5 border ${mediaResult.pixelForensics.noisePrint.status === "ANOMALOUS" ? "bg-red-500/5 border-red-500/30" : mediaResult.pixelForensics.noisePrint.status === "INCONSISTENT" ? "bg-yellow-500/5 border-yellow-500/30" : "bg-background/50 dark:bg-black/30 border-border/50"}`} data-testid="forensic-noise-print">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="w-4 h-4 text-primary" />
                        <p className="text-sm font-black uppercase tracking-wider">Noise Print Analysis</p>
                      </div>
                      <Badge variant="outline" className={`text-xs font-bold ${mediaResult.pixelForensics.noisePrint.status === "ANOMALOUS" ? "text-red-500 border-red-500/50" : mediaResult.pixelForensics.noisePrint.status === "INCONSISTENT" ? "text-yellow-500 border-yellow-500/50" : "text-emerald-500 border-emerald-500/50"}`}>
                        {mediaResult.pixelForensics.noisePrint.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Sub-pixel Digital Noise Mapping</p>
                    <div className="flex flex-wrap items-center gap-4 mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Uniformity Score</p>
                        <p className={`text-lg font-bold ${mediaResult.pixelForensics.noisePrint.uniformityScore >= 70 ? "text-emerald-500" : mediaResult.pixelForensics.noisePrint.uniformityScore >= 40 ? "text-yellow-500" : "text-red-500"}`}>{mediaResult.pixelForensics.noisePrint.uniformityScore}%</p>
                      </div>
                      {mediaResult.pixelForensics.noisePrint.breakRegions?.length > 0 && (
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Break Regions</p>
                          <div className="flex flex-wrap gap-1">
                            {mediaResult.pixelForensics.noisePrint.breakRegions.map((r: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{r}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground italic">{mediaResult.pixelForensics.noisePrint.finding}</p>
                  </div>
                )}

                {mediaResult.pixelForensics.luminanceGradient && (
                  <div className={`rounded-xl p-5 border ${mediaResult.pixelForensics.luminanceGradient.status === "INCONSISTENT" ? "bg-red-500/5 border-red-500/30" : "bg-background/50 dark:bg-black/30 border-border/50"}`} data-testid="forensic-luminance">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-primary" />
                        <p className="text-sm font-black uppercase tracking-wider">Luminance Gradient</p>
                      </div>
                      <Badge variant="outline" className={`text-xs font-bold ${mediaResult.pixelForensics.luminanceGradient.status === "INCONSISTENT" ? "text-red-500 border-red-500/50" : "text-emerald-500 border-emerald-500/50"}`}>
                        {mediaResult.pixelForensics.luminanceGradient.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Lighting & Shadow Direction Check</p>
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Light Sources</p>
                        <p className="text-lg font-bold">{mediaResult.pixelForensics.luminanceGradient.lightSources}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Shadow Match</p>
                        <p className={`text-sm font-bold ${mediaResult.pixelForensics.luminanceGradient.shadowConsistency ? "text-emerald-500" : "text-red-500"}`}>
                          {mediaResult.pixelForensics.luminanceGradient.shadowConsistency ? "CONSISTENT" : "MISMATCH"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Reflection</p>
                        <p className={`text-sm font-bold ${mediaResult.pixelForensics.luminanceGradient.reflectionMatch ? "text-emerald-500" : "text-red-500"}`}>
                          {mediaResult.pixelForensics.luminanceGradient.reflectionMatch ? "MATCH" : "MISMATCH"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground italic">{mediaResult.pixelForensics.luminanceGradient.finding}</p>
                  </div>
                )}

                {mediaResult.pixelForensics.contentDna && (
                  <div className={`rounded-xl p-5 border ${mediaResult.pixelForensics.contentDna.visualStyle?.includes("AI") ? "bg-red-500/5 border-red-500/30" : "bg-background/50 dark:bg-black/30 border-border/50"}`} data-testid="forensic-content-dna">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Dna className="w-4 h-4 text-primary" />
                        <p className="text-sm font-black uppercase tracking-wider">Content DNA</p>
                      </div>
                      <Badge variant="outline" className="text-xs font-bold">
                        {mediaResult.pixelForensics.contentDna.visualStyle}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Style & Intent Forensic Profiling</p>
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Texture</p>
                        <p className={`text-sm font-bold ${mediaResult.pixelForensics.contentDna.textureQuality === "Synthetic" || mediaResult.pixelForensics.contentDna.textureQuality === "Over-Smoothed" ? "text-red-500" : "text-emerald-500"}`}>
                          {mediaResult.pixelForensics.contentDna.textureQuality}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Edge Quality</p>
                        <p className={`text-sm font-bold ${mediaResult.pixelForensics.contentDna.edgeSharpness === "Natural" ? "text-emerald-500" : "text-yellow-500"}`}>
                          {mediaResult.pixelForensics.contentDna.edgeSharpness}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Color Gamut</p>
                        <p className={`text-sm font-bold ${mediaResult.pixelForensics.contentDna.colorGamut === "Photographic" ? "text-emerald-500" : "text-yellow-500"}`}>
                          {mediaResult.pixelForensics.contentDna.colorGamut}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground italic">{mediaResult.pixelForensics.contentDna.finding}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {mediaResult.hdClarityEngine && (
            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-primary/30 backdrop-blur-xl" data-testid="card-hd-clarity-engine">
              <h4 className="text-primary font-bold uppercase text-sm tracking-widest mb-2 flex flex-wrap items-center gap-2">
                <Fingerprint className="w-4 h-4" />
                HD Clarity Engine — Face &amp; Skin Forensics
              </h4>
              <p className="text-xs text-muted-foreground mb-5">High-Definition forensic scan targeting skin pores, facial muscles, edge artifacts, and texture mismatches.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mediaResult.hdClarityEngine.skinPoreValidation && (
                  <div className={`rounded-xl p-5 border ${mediaResult.hdClarityEngine.skinPoreValidation.status === "FAIL" ? "bg-red-500/5 border-red-500/30" : mediaResult.hdClarityEngine.skinPoreValidation.status === "SUSPICIOUS" ? "bg-yellow-500/5 border-yellow-500/30" : "bg-background/50 dark:bg-black/30 border-border/50"}`} data-testid="hd-skin-pore">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Skin Pore Validation</span>
                      <Badge variant="outline" className={`text-xs font-bold ${mediaResult.hdClarityEngine.skinPoreValidation.status === "FAIL" ? "text-red-500 border-red-500/50" : mediaResult.hdClarityEngine.skinPoreValidation.status === "SUSPICIOUS" ? "text-yellow-500 border-yellow-500/50" : "text-emerald-500 border-emerald-500/50"}`}>
                        {mediaResult.hdClarityEngine.skinPoreValidation.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-bold mb-2">{mediaResult.hdClarityEngine.skinPoreValidation.poreDetail}</p>
                    {mediaResult.hdClarityEngine.skinPoreValidation.flaggedRegions?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {mediaResult.hdClarityEngine.skinPoreValidation.flaggedRegions.map((r: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{r}</Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground italic">{mediaResult.hdClarityEngine.skinPoreValidation.finding}</p>
                  </div>
                )}
                {mediaResult.hdClarityEngine.facialMuscleSync && (
                  <div className={`rounded-xl p-5 border ${mediaResult.hdClarityEngine.facialMuscleSync.status === "DESYNCED" ? "bg-red-500/5 border-red-500/30" : "bg-background/50 dark:bg-black/30 border-border/50"}`} data-testid="hd-facial-muscle">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Facial Muscle Sync</span>
                      <Badge variant="outline" className={`text-xs font-bold ${mediaResult.hdClarityEngine.facialMuscleSync.status === "DESYNCED" ? "text-red-500 border-red-500/50" : "text-emerald-500 border-emerald-500/50"}`}>
                        {mediaResult.hdClarityEngine.facialMuscleSync.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Expression</p>
                        <p className={`text-sm font-bold ${mediaResult.hdClarityEngine.facialMuscleSync.expressionMatch ? "text-emerald-500" : "text-red-500"}`}>
                          {mediaResult.hdClarityEngine.facialMuscleSync.expressionMatch ? "MATCH" : "MISMATCH"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Wrinkles</p>
                        <p className={`text-sm font-bold ${mediaResult.hdClarityEngine.facialMuscleSync.wrinkleConsistency ? "text-emerald-500" : "text-red-500"}`}>
                          {mediaResult.hdClarityEngine.facialMuscleSync.wrinkleConsistency ? "CONSISTENT" : "INCONSISTENT"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Nasolabial</p>
                        <p className={`text-sm font-bold ${mediaResult.hdClarityEngine.facialMuscleSync.nasolabialCheck === "NATURAL" ? "text-emerald-500" : "text-red-500"}`}>
                          {mediaResult.hdClarityEngine.facialMuscleSync.nasolabialCheck}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground italic">{mediaResult.hdClarityEngine.facialMuscleSync.finding}</p>
                  </div>
                )}
                {mediaResult.hdClarityEngine.edgeBlurDetection && (
                  <div className={`rounded-xl p-5 border ${mediaResult.hdClarityEngine.edgeBlurDetection.status !== "CLEAN" ? "bg-yellow-500/5 border-yellow-500/30" : "bg-background/50 dark:bg-black/30 border-border/50"}`} data-testid="hd-edge-blur">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Edge Blur Detection</span>
                      <Badge variant="outline" className={`text-xs font-bold ${mediaResult.hdClarityEngine.edgeBlurDetection.status !== "CLEAN" ? "text-yellow-500 border-yellow-500/50" : "text-emerald-500 border-emerald-500/50"}`}>
                        {mediaResult.hdClarityEngine.edgeBlurDetection.status?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-sm font-bold mb-2">{mediaResult.hdClarityEngine.edgeBlurDetection.blurType}</p>
                    {mediaResult.hdClarityEngine.edgeBlurDetection.affectedEdges?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {mediaResult.hdClarityEngine.edgeBlurDetection.affectedEdges.map((e: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{e}</Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground italic">{mediaResult.hdClarityEngine.edgeBlurDetection.finding}</p>
                  </div>
                )}
                {mediaResult.hdClarityEngine.aiTextureMismatch && (
                  <div className={`rounded-xl p-5 border ${mediaResult.hdClarityEngine.aiTextureMismatch.status === "MISMATCH_DETECTED" ? "bg-red-500/5 border-red-500/30" : "bg-background/50 dark:bg-black/30 border-border/50"}`} data-testid="hd-texture-mismatch">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">AI Texture Mismatch</span>
                      <Badge variant="outline" className={`text-xs font-bold ${mediaResult.hdClarityEngine.aiTextureMismatch.status === "MISMATCH_DETECTED" ? "text-red-500 border-red-500/50" : "text-emerald-500 border-emerald-500/50"}`}>
                        {mediaResult.hdClarityEngine.aiTextureMismatch.status?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    {mediaResult.hdClarityEngine.aiTextureMismatch.mismatchRegions?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {mediaResult.hdClarityEngine.aiTextureMismatch.mismatchRegions.map((r: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px] text-red-400">{r}</Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground italic">{mediaResult.hdClarityEngine.aiTextureMismatch.finding}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {mediaResult.heatMap && mediaResult.heatMap.tamperedZones?.length > 0 && (
            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border-2 border-red-500/30 backdrop-blur-xl" data-testid="card-heat-map">
              <h4 className="text-red-500 font-bold uppercase text-sm tracking-widest mb-2 flex flex-wrap items-center gap-2">
                <MapPin className="w-4 h-4" />
                Tamper Heat Map — Red Zones
              </h4>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="outline" className={`text-xs font-bold ${mediaResult.heatMap.overallIntegrity === "CLEAN" ? "text-emerald-500 border-emerald-500/50" : mediaResult.heatMap.overallIntegrity === "MINOR_ANOMALIES" ? "text-yellow-500 border-yellow-500/50" : "text-red-500 border-red-500/50"}`}>
                  {mediaResult.heatMap.overallIntegrity?.replace(/_/g, " ")}
                </Badge>
                <span className="text-xs text-muted-foreground">{mediaResult.heatMap.tamperedZones.length} zone(s) flagged</span>
              </div>
              <div className="space-y-3">
                {mediaResult.heatMap.tamperedZones.map((zone: any, i: number) => (
                  <div key={i} className={`rounded-xl p-4 border flex flex-wrap items-center justify-between gap-3 ${zone.severity === "CRITICAL" ? "bg-red-500/10 border-red-500/40" : zone.severity === "HIGH" ? "bg-red-500/5 border-red-500/30" : zone.severity === "MEDIUM" ? "bg-yellow-500/5 border-yellow-500/30" : "bg-background/50 dark:bg-black/30 border-border/50"}`} data-testid={`heat-zone-${i}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${zone.severity === "CRITICAL" || zone.severity === "HIGH" ? "bg-red-500" : zone.severity === "MEDIUM" ? "bg-yellow-500" : "bg-emerald-500"}`} />
                      <div>
                        <p className="text-sm font-bold">{zone.zone}</p>
                        <p className="text-xs text-muted-foreground">{zone.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={`text-xs font-bold ${zone.severity === "CRITICAL" || zone.severity === "HIGH" ? "text-red-500 border-red-500/50" : zone.severity === "MEDIUM" ? "text-yellow-500 border-yellow-500/50" : "text-emerald-500 border-emerald-500/50"}`}>
                        {zone.severity}
                      </Badge>
                      <span className="text-sm font-bold">{zone.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mediaResult.tamperCheck && (
            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl" data-testid="card-tamper-check">
              <h4 className="text-primary font-bold uppercase text-sm tracking-widest mb-4 flex flex-wrap items-center gap-2">
                <Search className="w-4 h-4" />
                Tamper Check - Pixel Inconsistency Mapping
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Tampered</p>
                  <p className={`text-lg font-bold mt-1 ${mediaResult.tamperCheck.isTampered ? "text-red-500" : "text-emerald-500"}`} data-testid="text-tampered">
                    {mediaResult.tamperCheck.isTampered ? "YES" : "NO"}
                  </p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Confidence</p>
                  <p className="text-lg font-bold mt-1">{mediaResult.tamperCheck.confidence}%</p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Suspicious Regions</p>
                  {mediaResult.tamperCheck.regions?.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {mediaResult.tamperCheck.regions.map((r: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{r}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">None detected</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {mediaResult.chatVerification && mediaResult.chatVerification.isAuthenticChat !== null && (
            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl" data-testid="card-chat-verification">
              <h4 className="text-primary font-bold uppercase text-sm tracking-widest mb-4 flex flex-wrap items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Chat Verification - Font & UI Integrity
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Authentic Chat</p>
                  <p className={`text-lg font-bold mt-1 ${mediaResult.chatVerification.isAuthenticChat ? "text-emerald-500" : "text-red-500"}`}>
                    {mediaResult.chatVerification.isAuthenticChat ? "YES" : "NO"}
                  </p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Font Integrity</p>
                  <p className={`text-lg font-bold mt-1 ${getPassFailColor(mediaResult.chatVerification.fontIntegrity)}`}>
                    {mediaResult.chatVerification.fontIntegrity}
                  </p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">UI Integrity</p>
                  <p className={`text-lg font-bold mt-1 ${getPassFailColor(mediaResult.chatVerification.uiIntegrity)}`}>
                    {mediaResult.chatVerification.uiIntegrity}
                  </p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Platform</p>
                  <p className="text-lg font-bold mt-1">{mediaResult.chatVerification.platform}</p>
                </div>
              </div>
            </div>
          )}

          {mediaResult.deepfakeDetection && (
            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl" data-testid="card-deepfake-detection">
              <h4 className="text-primary font-bold uppercase text-sm tracking-widest mb-4 flex flex-wrap items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Deepfake Detection - Frame-by-Frame Biometric Scan
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Deepfake Detected</p>
                  <p className={`text-lg font-bold mt-1 ${mediaResult.deepfakeDetection.isDeepfake ? "text-red-500" : "text-emerald-500"}`} data-testid="text-deepfake">
                    {mediaResult.deepfakeDetection.isDeepfake ? "YES" : "NO"}
                  </p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Confidence</p>
                  <p className="text-lg font-bold mt-1">{mediaResult.deepfakeDetection.confidence}%</p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Biometric Flags</p>
                  {mediaResult.deepfakeDetection.biometricFlags?.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {mediaResult.deepfakeDetection.biometricFlags.map((f: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">None detected</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {mediaResult.lipSyncAudit && mediaResult.lipSyncAudit.status !== "N/A" && (
            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl" data-testid="card-lip-sync">
              <h4 className="text-primary font-bold uppercase text-sm tracking-widest mb-4 flex flex-wrap items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Lip Sync Audit
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                  <p className={`text-lg font-bold mt-1 ${getPassFailColor(mediaResult.lipSyncAudit.status)}`}>
                    {mediaResult.lipSyncAudit.status}
                  </p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Sync Score</p>
                  <p className="text-lg font-bold mt-1">
                    {mediaResult.lipSyncAudit.syncScore !== null ? `${mediaResult.lipSyncAudit.syncScore}%` : "N/A"}
                  </p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Anomalies</p>
                  {mediaResult.lipSyncAudit.anomalies?.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {mediaResult.lipSyncAudit.anomalies.map((a: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{a}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">None detected</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {mediaResult.metadata && (
            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl" data-testid="card-metadata">
              <h4 className="text-primary font-bold uppercase text-sm tracking-widest mb-2 flex flex-wrap items-center gap-2">
                <Info className="w-4 h-4" />
                Metadata Extraction{mediaResult.metadata.extractionStatus === "Forced Recovery" ? " — Forced Recovery" : ""}
              </h4>
              {mediaResult.metadata.recoveryMethod && mediaResult.metadata.recoveryMethod !== "None" && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge variant="outline" className="text-xs font-bold text-primary border-primary/50">
                    {mediaResult.metadata.recoveryMethod}
                  </Badge>
                  {mediaResult.metadata.strippedBy && mediaResult.metadata.strippedBy !== "N/A" && (
                    <span className="text-xs text-muted-foreground">Metadata stripped by {mediaResult.metadata.strippedBy}</span>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Extraction Status</p>
                  <p className={`text-sm font-bold mt-1 ${mediaResult.metadata.extractionStatus === "Forced Recovery" ? "text-primary" : ""}`}>{mediaResult.metadata.extractionStatus}</p>
                </div>
                {mediaResult.metadata.platformDetected && mediaResult.metadata.platformDetected !== "Unknown" && (
                  <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Platform Detected</p>
                    <p className="text-sm font-bold mt-1">{mediaResult.metadata.platformDetected}</p>
                  </div>
                )}
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Original Source</p>
                  <p className="text-sm font-bold mt-1">{mediaResult.metadata.originalSource}</p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Creation Date</p>
                  <p className="text-sm font-bold mt-1">{mediaResult.metadata.creationDate}</p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Geo Tag</p>
                  <p className="text-sm font-bold mt-1">{mediaResult.metadata.geoTag}</p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Device</p>
                  <p className="text-sm font-bold mt-1">{mediaResult.metadata.device}</p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Modifications</p>
                  {mediaResult.metadata.modifications?.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {mediaResult.metadata.modifications.map((m: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{m}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">None detected</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl">
            <h4 className="text-primary font-bold uppercase text-sm tracking-widest mb-3">Analysis Summary</h4>
            <p className="text-foreground leading-relaxed" data-testid="text-media-details">{mediaResult.details}</p>
          </div>

          {mediaResult.flags?.length > 0 && (
            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl" data-testid="card-media-flags">
              <h4 className="text-primary font-bold uppercase text-sm tracking-widest mb-4">Red Flags</h4>
              <div className="space-y-2">
                {mediaResult.flags.map((f: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mediaResult.recommendations?.length > 0 && (
            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl" data-testid="card-media-recommendations">
              <h4 className="text-primary font-bold uppercase text-sm tracking-widest mb-4">Recommendations</h4>
              <div className="space-y-2">
                {mediaResult.recommendations.map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            size="lg"
            data-testid="button-download-media-pdf"
            className="w-full font-black text-lg uppercase tracking-widest"
            onClick={async () => {
              try {
                const res = await fetch("/api/generate-media-pdf", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(mediaResult),
                });
                if (!res.ok) throw new Error("PDF generation failed");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `NeXA_Media_Forensic_${(mediaResult.mediaName || "report").replace(/\s+/g, "_")}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
                toast({ title: "PDF Downloaded", description: "Your NeXA Media Forensic Report PDF has been generated." });
              } catch {
                toast({ title: "Error", description: "Failed to generate media forensic PDF.", variant: "destructive" });
              }
            }}
          >
            <FileText className="w-5 h-5 mr-2" />
            DOWNLOAD MEDIA FORENSIC PDF
          </Button>
        </div>
      )}

      {audioResult && !audioAuditMutation.isPending && (
        <div className="max-w-5xl mx-auto mt-12 space-y-6 px-4" data-testid="section-audio-results">
          <div className="bg-card/50 dark:bg-white/5 nexa-card-glow rounded-[2.5rem] p-10 backdrop-blur-xl" data-testid="card-audio-dashboard">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-black uppercase text-primary" data-testid="text-audio-title">{audioResult.audioTitle || "Audio Analysis"}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {audioResult.platform && <Badge variant="outline" className="text-xs font-mono">{audioResult.platform}</Badge>}
                  <Badge variant="outline" className="text-xs font-mono">AUDIO INTELLIGENCE</Badge>
                  {audioResult.duration && <Badge variant="outline" className="text-xs font-mono">{audioResult.duration}</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Headphones className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {audioResult.voiceAudit && (
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Voice Verdict</p>
                  <p className={`text-lg font-black mt-1 ${audioResult.voiceAudit.verdict === "HUMAN" ? "text-emerald-500" : audioResult.voiceAudit.verdict === "AI_GENERATED" ? "text-red-500" : audioResult.voiceAudit.verdict === "MIXED" ? "text-yellow-500" : "text-muted-foreground"}`} data-testid="text-voice-verdict">
                    {audioResult.voiceAudit.verdict}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{audioResult.voiceAudit.confidence}% confidence</p>
                </div>
              )}
              {audioResult.audioQuality && (
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Audio Quality</p>
                  <p className={`text-2xl font-black mt-1 ${audioResult.audioQuality.overallScore >= 80 ? "text-emerald-500" : audioResult.audioQuality.overallScore >= 50 ? "text-yellow-500" : "text-red-500"}`} data-testid="text-audio-quality-score">
                    {audioResult.audioQuality.overallScore}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{audioResult.audioQuality.signalToNoise}</p>
                </div>
              )}
              {audioResult.speakerAnalysis && (
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Speakers</p>
                  <p className="text-2xl font-black mt-1 text-primary" data-testid="text-speaker-count">{audioResult.speakerAnalysis.totalSpeakers}</p>
                  <p className="text-xs text-muted-foreground mt-1">Detected</p>
                </div>
              )}
              {audioResult.languageAnalysis && (
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Language</p>
                  <p className="text-lg font-black mt-1" data-testid="text-primary-language">{audioResult.languageAnalysis.primaryLanguage}</p>
                  {audioResult.languageAnalysis.accent && <p className="text-xs text-muted-foreground mt-1">{audioResult.languageAnalysis.accent}</p>}
                </div>
              )}
            </div>

            {audioResult.riskAssessment && (
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className={`text-sm font-bold ${audioResult.riskAssessment === "SAFE" ? "text-emerald-500 border-emerald-500/30" : audioResult.riskAssessment === "LOW_RISK" ? "text-emerald-500 border-emerald-500/30" : audioResult.riskAssessment === "MEDIUM_RISK" ? "text-yellow-500 border-yellow-500/30" : "text-red-500 border-red-500/30"}`} data-testid="badge-audio-risk">
                  {audioResult.riskAssessment.replace(/_/g, " ")}
                </Badge>
              </div>
            )}
          </div>

          {audioResult.voiceAudit && (
            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl" data-testid="card-voice-audit">
              <h4 className="font-bold mb-4 flex flex-wrap items-center gap-2">
                <Mic className="w-5 h-5 text-primary" />
                Voice Audit — AI vs Human Detection
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Naturalness</p>
                  <p className={`text-lg font-black mt-1 ${(audioResult.voiceAudit.naturalness || 0) >= 80 ? "text-emerald-500" : (audioResult.voiceAudit.naturalness || 0) >= 50 ? "text-yellow-500" : "text-red-500"}`}>
                    {audioResult.voiceAudit.naturalness ?? "N/A"}%
                  </p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Breathing</p>
                  <p className={`text-sm font-bold mt-1 ${audioResult.voiceAudit.breathingPatterns === "NATURAL" ? "text-emerald-500" : audioResult.voiceAudit.breathingPatterns === "ABSENT" ? "text-red-500" : "text-yellow-500"}`}>
                    {audioResult.voiceAudit.breathingPatterns || "N/A"}
                  </p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Pitch Variation</p>
                  <p className={`text-sm font-bold mt-1 ${audioResult.voiceAudit.pitchVariation === "NATURAL" ? "text-emerald-500" : audioResult.voiceAudit.pitchVariation === "MONOTONE" ? "text-red-500" : "text-yellow-500"}`}>
                    {audioResult.voiceAudit.pitchVariation || "N/A"}
                  </p>
                </div>
                {audioResult.voiceAudit.detectedModel && audioResult.voiceAudit.detectedModel !== "N/A" && (
                  <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Detected AI Model</p>
                    <p className="text-sm font-bold mt-1 text-red-500">{audioResult.voiceAudit.detectedModel}</p>
                  </div>
                )}
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4 col-span-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Finding</p>
                  <p className="text-sm mt-1">{audioResult.voiceAudit.finding || "N/A"}</p>
                </div>
              </div>
            </div>
          )}

          {audioResult.smartSummary && (
            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border-2 border-primary/20 backdrop-blur-xl" data-testid="card-smart-summary">
              <h4 className="font-bold mb-3 flex flex-wrap items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Smart Summary
                <Badge variant="outline" className="text-xs">Pure & Elite Plans</Badge>
              </h4>
              <p className="text-foreground leading-relaxed" data-testid="text-smart-summary">{audioResult.smartSummary}</p>
            </div>
          )}

          {audioResult.transcription && (
            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl" data-testid="card-transcription">
              <h4 className="font-bold mb-3 flex flex-wrap items-center gap-2">
                <FileDown className="w-5 h-5 text-primary" />
                Full Transcription
                <Badge variant="outline" className="text-xs">Elite Plan</Badge>
              </h4>
              <div className="bg-background/50 dark:bg-black/30 rounded-xl p-5 max-h-80 overflow-y-auto">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-transcription">{audioResult.transcription}</p>
              </div>
            </div>
          )}

          {audioResult.speakerAnalysis && audioResult.speakerAnalysis.speakers?.length > 0 && (
            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl" data-testid="card-speaker-analysis">
              <h4 className="font-bold mb-4 flex flex-wrap items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Speaker Analysis
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {audioResult.speakerAnalysis.speakers.map((s, i) => (
                  <div key={i} className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                    <p className="text-sm font-bold text-primary">{s.label}</p>
                    <div className="mt-2 space-y-1">
                      {s.gender && <p className="text-xs text-muted-foreground">Gender: <span className="text-foreground font-medium">{s.gender}</span></p>}
                      {s.estimatedAge && <p className="text-xs text-muted-foreground">Age: <span className="text-foreground font-medium">{s.estimatedAge}</span></p>}
                      {s.speakingTime && <p className="text-xs text-muted-foreground">Speaking: <span className="text-foreground font-medium">{s.speakingTime}</span></p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {audioResult.audioQuality && (
            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl" data-testid="card-audio-quality">
              <h4 className="font-bold mb-4 flex flex-wrap items-center gap-2">
                <Volume2 className="w-5 h-5 text-primary" />
                Audio Quality Analysis
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Compression</p>
                  <p className="text-sm font-bold mt-1">{audioResult.audioQuality.compression || "N/A"}</p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Background Noise</p>
                  <p className="text-sm font-bold mt-1">{audioResult.audioQuality.backgroundNoise || "N/A"}</p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Sample Rate</p>
                  <p className="text-sm font-bold mt-1">{audioResult.audioQuality.sampleRate || "N/A"}</p>
                </div>
                <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Clipping</p>
                  <p className={`text-sm font-bold mt-1 ${audioResult.audioQuality.clipping ? "text-red-500" : "text-emerald-500"}`}>
                    {audioResult.audioQuality.clipping ? "Detected" : "None"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {audioResult.contentClassification && (
            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl" data-testid="card-content-classification">
              <h4 className="font-bold mb-4 flex flex-wrap items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Content Classification
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {audioResult.contentClassification.category && (
                  <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Category</p>
                    <p className="text-sm font-bold mt-1">{audioResult.contentClassification.category}</p>
                  </div>
                )}
                {audioResult.contentClassification.sentiment && (
                  <div className="bg-background/50 dark:bg-black/30 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Sentiment</p>
                    <p className={`text-sm font-bold mt-1 ${audioResult.contentClassification.sentiment === "Positive" ? "text-emerald-500" : audioResult.contentClassification.sentiment === "Negative" ? "text-red-500" : "text-muted-foreground"}`}>
                      {audioResult.contentClassification.sentiment}
                    </p>
                  </div>
                )}
              </div>
              {audioResult.contentClassification.topics?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {audioResult.contentClassification.topics.map((t, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {audioResult.contentClassification.keyPhrases?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Key Phrases</p>
                  <div className="flex flex-wrap gap-2">
                    {audioResult.contentClassification.keyPhrases.map((p, i) => (
                      <Badge key={i} variant="outline" className="text-xs text-primary border-primary/30">{p}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {audioResult.flags?.length > 0 && (
            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl" data-testid="card-audio-flags">
              <h4 className="text-primary font-bold uppercase text-sm tracking-widest mb-4">Red Flags</h4>
              <div className="space-y-2">
                {audioResult.flags.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {audioResult.recommendations?.length > 0 && (
            <div className="bg-card/50 dark:bg-white/5 p-8 rounded-[2rem] border border-border/50 dark:border-white/10 backdrop-blur-xl" data-testid="card-audio-recommendations">
              <h4 className="text-primary font-bold uppercase text-sm tracking-widest mb-4">Recommendations</h4>
              <div className="space-y-2">
                {audioResult.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            size="lg"
            data-testid="button-download-audio-pdf"
            className="w-full font-black text-lg uppercase tracking-widest"
            onClick={async () => {
              try {
                const res = await fetch("/api/generate-audio-pdf", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(audioResult),
                });
                if (!res.ok) throw new Error("PDF generation failed");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `NeXA_Audio_Forensic_${(audioResult.audioTitle || "report").replace(/\s+/g, "_")}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
                toast({ title: "PDF Downloaded", description: "Your NeXA Audio Forensic Report PDF has been generated." });
              } catch {
                toast({ title: "Error", description: "Failed to generate audio forensic PDF.", variant: "destructive" });
              }
            }}
          >
            <FileText className="w-5 h-5 mr-2" />
            DOWNLOAD AUDIO FORENSIC PDF
          </Button>
        </div>
      )}

      {fullAuditData && fullAuditData.data && (
        <div className="max-w-5xl mx-auto mt-8" data-testid="section-full-audit">
          <Card className="p-8 md:p-10 rounded-[2.5rem]">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
              <h3 className="text-2xl font-black uppercase italic text-primary" data-testid="text-audit-title">
                Audit Intelligence
              </h3>
              <Badge className="bg-blue-600 text-white text-sm font-bold px-5 py-1.5" data-testid="badge-official-verified">
                <Award className="w-4 h-4 mr-1.5" />
                OFFICIAL VERIFIED
              </Badge>
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap mb-8 p-5 rounded-2xl bg-muted/50">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{fullAuditData.resultType}</p>
                <p className="text-sm text-muted-foreground mt-1">{fullAuditData.issuedBy}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Global Authority Score</p>
                <p className="text-4xl font-black text-primary" data-testid="text-global-authority-score">
                  {fullAuditData.data.globalAuthorityScore ?? "--"}
                </p>
              </div>
            </div>

            {fullAuditData.data.statusMarks && (
              <div className="mb-8" data-testid="card-status-marks">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Verification Status Marks
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(fullAuditData.data.statusMarks).map(([key, value]) => (
                    <div
                      key={key}
                      className="p-5 rounded-2xl bg-muted/50 flex items-center justify-between gap-3"
                      data-testid={`status-mark-${key}`}
                    >
                      <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                      {value ? (
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 shrink-0 text-red-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fullAuditData.data.newsChannels && fullAuditData.data.newsChannels.length > 0 && (
              <div className="mb-8" data-testid="card-news-channels">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Referenced News Channels
                </h4>
                <div className="flex flex-wrap gap-2">
                  {fullAuditData.data.newsChannels.map((channel: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-sm px-4 py-1.5 font-bold" data-testid={`badge-channel-${i}`}>
                      {channel}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(fullAuditData.data.toolInfo || fullAuditData.data.contentInfo) && (
              <div className="mb-8" data-testid="card-intel-info">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  {fullAuditData.auditType === "tool" ? "Tool Intelligence" : "Content Intelligence"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fullAuditData.data.toolInfo && (
                    <>
                      <div className="p-5 rounded-2xl bg-muted/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Origin Country</p>
                        <p className="text-lg font-bold mt-1" data-testid="text-origin-country">{fullAuditData.data.toolInfo.originCountry || "N/A"}</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-muted/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Downloads</p>
                        <p className="text-lg font-bold mt-1" data-testid="text-total-downloads">{fullAuditData.data.toolInfo.totalDownloads || "N/A"}</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-muted/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Category</p>
                        <p className="text-lg font-bold mt-1" data-testid="text-category">{fullAuditData.data.toolInfo.category || "N/A"}</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-muted/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Parent Company</p>
                        <p className="text-lg font-bold mt-1" data-testid="text-parent-company">{fullAuditData.data.toolInfo.parentCompany || "N/A"}</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-muted/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Founded</p>
                        <p className="text-lg font-bold mt-1" data-testid="text-founded-year">{fullAuditData.data.toolInfo.foundedYear || "N/A"}</p>
                      </div>
                      {fullAuditData.data.toolInfo.relatedTools && fullAuditData.data.toolInfo.relatedTools.length > 0 && (
                        <div className="p-5 rounded-2xl bg-muted/50">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Related Tools</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {fullAuditData.data.toolInfo.relatedTools.map((tool: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{tool}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {fullAuditData.data.contentInfo && (
                    <>
                      <div className="p-5 rounded-2xl bg-muted/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Origin Country</p>
                        <p className="text-lg font-bold mt-1">{fullAuditData.data.contentInfo.originCountry || "N/A"}</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-muted/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Category</p>
                        <p className="text-lg font-bold mt-1">{fullAuditData.data.contentInfo.category || "N/A"}</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-muted/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">First Reported</p>
                        <p className="text-lg font-bold mt-1">{fullAuditData.data.contentInfo.firstReported || "N/A"}</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-muted/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Virality Level</p>
                        <p className="text-lg font-bold mt-1">{fullAuditData.data.contentInfo.viralityLevel || "N/A"}</p>
                      </div>
                      {fullAuditData.data.contentInfo.relatedStories && fullAuditData.data.contentInfo.relatedStories.length > 0 && (
                        <div className="p-5 rounded-2xl bg-muted/50 md:col-span-2">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Related Stories</p>
                          <ul className="mt-2 space-y-1">
                            {fullAuditData.data.contentInfo.relatedStories.map((story: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <Search className="w-3 h-3 mt-1 text-primary shrink-0" />
                                <span>{story}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {(fullAuditData.data.historicalYear || fullAuditData.data.originalChannel || fullAuditData.data.viralSpreadAnalytics || fullAuditData.data.sentimentSummary || fullAuditData.data.privacyAudit || fullAuditData.data.trafficMetrics) && (
              <div className="mb-8" data-testid="card-deep-analytics">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Deep Analytics
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fullAuditData.data.historicalYear && (
                    <div className="p-5 rounded-2xl bg-muted/50" data-testid="card-historical-year">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Historical Year</p>
                      <p className="text-lg font-bold mt-1">{fullAuditData.data.historicalYear}</p>
                    </div>
                  )}
                  {fullAuditData.data.originalChannel && (
                    <div className="p-5 rounded-2xl bg-muted/50" data-testid="card-original-channel">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Original Channel</p>
                      <p className="text-lg font-bold mt-1">{fullAuditData.data.originalChannel}</p>
                    </div>
                  )}
                  {fullAuditData.data.viralSpreadAnalytics && (
                    <div className="p-5 rounded-2xl bg-muted/50" data-testid="card-viral-spread">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Viral Spread Analytics</p>
                      <p className="text-lg font-bold mt-1">{fullAuditData.data.viralSpreadAnalytics}</p>
                    </div>
                  )}
                  {fullAuditData.data.privacyAudit && (
                    <div className="p-5 rounded-2xl bg-muted/50" data-testid="card-privacy-audit">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Privacy Audit</p>
                      <p className="text-sm font-bold mt-1">{fullAuditData.data.privacyAudit}</p>
                    </div>
                  )}
                  {fullAuditData.data.trafficMetrics && (
                    <div className="p-5 rounded-2xl bg-muted/50" data-testid="card-traffic-metrics">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Traffic Metrics</p>
                      <p className="text-sm font-bold mt-1">{fullAuditData.data.trafficMetrics}</p>
                    </div>
                  )}
                  {fullAuditData.data.sentimentSummary && (
                    <div className="p-5 rounded-2xl bg-muted/50 md:col-span-2" data-testid="card-sentiment-summary">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Sentiment Summary</p>
                      <p className="text-sm font-medium mt-1 text-muted-foreground">{fullAuditData.data.sentimentSummary}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(fullAuditData.data.pricingPlans || fullAuditData.data.marketWorth || fullAuditData.data.saleStatus) && (
              <div className="mb-8" data-testid="card-commercial-metrics-full">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Commercial Metrics
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {fullAuditData.data.pricingPlans && (
                    <div className="p-5 rounded-2xl bg-muted/50" data-testid="card-pricing-plans">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Pricing Plans</p>
                      <p className="text-sm font-bold mt-1">{fullAuditData.data.pricingPlans}</p>
                    </div>
                  )}
                  {fullAuditData.data.marketWorth && (
                    <div className="p-5 rounded-2xl bg-muted/50" data-testid="card-market-worth">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Market Worth</p>
                      <p className="text-sm font-bold mt-1">{fullAuditData.data.marketWorth}</p>
                    </div>
                  )}
                  {fullAuditData.data.saleStatus && (
                    <div className="p-5 rounded-2xl bg-muted/50" data-testid="card-sale-status">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Sale Status</p>
                      <p className="text-sm font-bold mt-1">{fullAuditData.data.saleStatus}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(fullAuditData.data.isWebTool !== undefined || fullAuditData.data.playStoreStatus || fullAuditData.data.ageYears) && (
              <div className="mb-8" data-testid="card-existence-check-full">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Existence Check
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {fullAuditData.data.isWebTool !== undefined && (
                    <div className="p-5 rounded-2xl bg-muted/50" data-testid="card-is-web-tool">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Web Tool</p>
                      <div className="flex items-center gap-2 mt-1">
                        {fullAuditData.data.isWebTool ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <p className="text-lg font-bold">{fullAuditData.data.isWebTool ? "Yes" : "No"}</p>
                      </div>
                    </div>
                  )}
                  {fullAuditData.data.playStoreStatus && (
                    <div className="p-5 rounded-2xl bg-muted/50" data-testid="card-play-store">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">App Store Status</p>
                      <p className="text-lg font-bold mt-1">{fullAuditData.data.playStoreStatus}</p>
                    </div>
                  )}
                  {fullAuditData.data.ageYears && (
                    <div className="p-5 rounded-2xl bg-muted/50" data-testid="card-age-years">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Age</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <p className="text-lg font-bold">{fullAuditData.data.ageYears} years</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(fullAuditData.data.userReach || fullAuditData.data.resultAccuracy) && (
              <div className="mb-8" data-testid="card-performance-metrics-full">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Performance Metrics
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fullAuditData.data.userReach && (
                    <div className="p-5 rounded-2xl bg-muted/50" data-testid="card-user-reach">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">User Reach</p>
                      <p className="text-lg font-bold mt-1">{fullAuditData.data.userReach}</p>
                    </div>
                  )}
                  {fullAuditData.data.resultAccuracy && (
                    <div className="p-5 rounded-2xl bg-muted/50" data-testid="card-result-accuracy">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Result Accuracy</p>
                      <div className="flex items-center gap-3 mt-1">
                        <Target className="w-4 h-4 text-primary" />
                        <p className="text-lg font-bold">{fullAuditData.data.resultAccuracy}%</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {fullAuditData.data.liveStatus && (
              <div className="mb-8 p-5 rounded-2xl bg-muted/50 flex items-center justify-between gap-4 flex-wrap" data-testid="card-live-status">
                <div className="flex items-center gap-3">
                  <Rocket className="w-5 h-5 text-primary" />
                  <span className="font-bold">Live Status</span>
                </div>
                <Badge variant="outline" className={`text-sm px-4 py-1.5 font-bold ${
                  fullAuditData.data.liveStatus.includes("Active") || fullAuditData.data.liveStatus.includes("Credible")
                    ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : fullAuditData.data.liveStatus.includes("Issue") || fullAuditData.data.liveStatus.includes("Developing")
                      ? "text-yellow-600 dark:text-yellow-400 border-yellow-500/30"
                      : "text-red-600 dark:text-red-400 border-red-500/30"
                }`} data-testid="text-live-status">
                  {fullAuditData.data.liveStatus}
                </Badge>
              </div>
            )}

            <Button
              className="w-full rounded-2xl font-black uppercase"
              size="lg"
              onClick={() => {
                if (newsResult) {
                  window.open(`/api/generate-pdf-result/${newsResult.id || 0}`, "_blank");
                } else if (auditResult) {
                  const params = new URLSearchParams();
                  params.set("toolName", auditResult.toolName);
                  params.set("safetyRating", auditResult.safetyRating);
                  params.set("legitimacy", auditResult.legitimacy);
                  params.set("userTrust", auditResult.userTrust);
                  params.set("riskLevel", auditResult.riskLevel);
                  params.set("details", auditResult.details);
                  params.set("flags", JSON.stringify(auditResult.flags));
                  params.set("recommendations", JSON.stringify(auditResult.recommendations));
                  fetch("/api/generate-tool-pdf", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(auditResult),
                  }).then(r => r.blob()).then(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `NeXA_Tool_Audit_${auditResult.toolName}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                  });
                }
              }}
              data-testid="button-download-full-audit-pdf"
            >
              <FileDown className="w-5 h-5 mr-2" />
              DOWNLOAD FULL NeXA AUDIT REPORT (PDF)
            </Button>

            <p className="text-center text-[10px] text-muted-foreground mt-4">
              Full Audit by {fullAuditData.issuedBy} | Founder: {fullAuditData.founder} | {new Date(fullAuditData.timestamp).toLocaleString()} | Non-Binding Result
            </p>
          </Card>
        </div>
      )}

      <section className="py-16 px-4 border-t border-border/50" data-testid="section-how-it-works">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-3">How It Works</h2>
          <p className="text-center text-muted-foreground mb-10 text-sm">6-Step Intelligence Pipeline</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="text-center relative overflow-visible" data-testid="card-step-1">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="font-black text-xs">STEP 1</Badge>
              </div>
              <CardContent className="p-6 pt-8 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Send className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold">Multi-Input Submit</h3>
                <p className="text-sm text-muted-foreground">Submit a direct link or upload images and videos from your gallery for instant analysis.</p>
              </CardContent>
            </Card>
            <Card className="text-center relative overflow-visible" data-testid="card-step-2">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="font-black text-xs">STEP 2</Badge>
              </div>
              <CardContent className="p-6 pt-8 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Fingerprint className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold">Deep Forensic Scan</h3>
                <p className="text-sm text-muted-foreground">Execute Google-grade pixel scanning and advanced cutting detection to identify manipulations.</p>
              </CardContent>
            </Card>
            <Card className="text-center relative overflow-visible" data-testid="card-step-3">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="font-black text-xs">STEP 3</Badge>
              </div>
              <CardContent className="p-6 pt-8 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold">Audio to Script</h3>
                <p className="text-sm text-muted-foreground">Automatically extract audio from videos to generate a full transcript and a smart summary.</p>
              </CardContent>
            </Card>
            <Card className="text-center relative overflow-visible" data-testid="card-step-4">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="font-black text-xs">STEP 4</Badge>
              </div>
              <CardContent className="p-6 pt-8 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Dna className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold">Content DNA Check</h3>
                <p className="text-sm text-muted-foreground">Analyze writing styles and scan historical records to verify content authenticity.</p>
              </CardContent>
            </Card>
            <Card className="text-center relative overflow-visible" data-testid="card-step-5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="font-black text-xs">STEP 5</Badge>
              </div>
              <CardContent className="p-6 pt-8 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold">Package Validation</h3>
                <p className="text-sm text-muted-foreground">Instantly unlock detailed results based on your selected plan ($10, $25, or $49).</p>
              </CardContent>
            </Card>
            <Card className="text-center relative overflow-visible" data-testid="card-step-6">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="font-black text-xs">STEP 6</Badge>
              </div>
              <CardContent className="p-6 pt-8 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileDown className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold">Verified Report</h3>
                <p className="text-sm text-muted-foreground">Receive an official PDF certification including forensic heat-maps and a final verdict.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {monetization?.paywallEnabled && (
        <section id="pricing" className="py-20 px-4 bg-muted/30 dark:bg-black/50" data-testid="section-pricing">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black">
              Choose Your{" "}
              <span className="text-primary">Intelligence Plan</span>
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="bg-card/50 dark:bg-white/10 p-8 rounded-[2.5rem] border border-border/50 dark:border-white/10 w-72 text-center backdrop-blur-xl" data-testid="card-plan-basic">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold uppercase">Basic</h3>
              <p className="text-4xl font-black my-4">
                ${monetization.basicPrice}<span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              <ul className="text-muted-foreground mb-8 space-y-2 text-sm text-left pl-2">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />Live Indicators</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />Basic Safety Rating</li>
                <li className="flex items-start gap-2"><XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />No Forensic Scan</li>
                <li className="flex items-start gap-2"><XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />No PDF Reports</li>
              </ul>
              <Button variant="outline" className="w-full rounded-2xl font-bold" onClick={() => handleUpgrade("basic")} disabled={upgrading === "basic"} data-testid="button-plan-basic">
                {upgrading === "basic" ? "Processing..." : "FREE ACCESS"}
              </Button>
            </div>

            <div className="bg-card/50 dark:bg-white/10 p-8 rounded-[2.5rem] border border-border/50 dark:border-white/10 w-72 text-center backdrop-blur-xl" data-testid="card-plan-starter">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold uppercase">Starter</h3>
              <p className="text-4xl font-black my-4">
                ${monetization.starterPrice}<span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              <ul className="text-muted-foreground mb-8 space-y-2 text-sm text-left pl-2">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />News Summary</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />Writing Style Audit</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />Video-to-Script Extraction</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />Basic Text Analysis</li>
                <li className="flex items-start gap-2"><XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />No PDF Reports</li>
              </ul>
              <Button variant="outline" className="w-full rounded-2xl font-bold" onClick={() => handleUpgrade("starter")} disabled={upgrading === "starter"} data-testid="button-plan-starter">
                {upgrading === "starter" ? "Processing..." : "GET STARTED"}
              </Button>
            </div>

            <div className="bg-card/50 dark:bg-white/10 p-8 rounded-[2.5rem] border-2 border-primary w-72 text-center backdrop-blur-xl relative" data-testid="card-plan-pure">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 font-bold">MOST POPULAR</Badge>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold uppercase">Pure</h3>
              <p className="text-4xl font-black my-4">
                ${monetization.purePrice}<span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              <ul className="text-muted-foreground mb-8 space-y-2 text-sm text-left pl-2">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />All Starter Features</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />Market Worth Analysis</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />Viral History (Year/Source Tracking)</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />Detailed Script Summary</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />Content DNA Audit</li>
                <li className="flex items-start gap-2"><XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />No PDF Reports</li>
              </ul>
              <Button className="w-full rounded-2xl font-black" onClick={() => handleUpgrade("pure")} disabled={upgrading === "pure"} data-testid="button-plan-pure">
                {upgrading === "pure" ? "Processing..." : "UPGRADE NOW"}
              </Button>
            </div>

            <div className="bg-card/50 dark:bg-white/10 p-8 rounded-[2.5rem] border border-border/50 dark:border-white/10 w-72 text-center backdrop-blur-xl" data-testid="card-plan-elite">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold uppercase">Elite</h3>
              <p className="text-4xl font-black my-4">
                ${monetization.elitePrice}<span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              <ul className="text-muted-foreground mb-8 space-y-2 text-sm text-left pl-2">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />All Pure Features</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />Full Forensic Pixel Scan</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />Deepfake Video Movement Audit</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />WhatsApp/Chat Integrity Scan</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />Official PDF Reports</li>
                <li className="flex items-start gap-2"><BadgeCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />Ad-Free Experience</li>
              </ul>
              <Button variant="outline" className="w-full rounded-2xl font-bold" onClick={() => handleUpgrade("elite")} disabled={upgrading === "elite"} data-testid="button-plan-elite">
                {upgrading === "elite" ? "Processing..." : "GO ELITE"}
              </Button>
            </div>
          </div>
        </section>
      )}

      {verifiedToolsList && verifiedToolsList.length > 0 && (partnerSettings?.showSection !== false) && (
        <section className={`mt-0 border-t-0 py-16 overflow-hidden ${partnerSettings?.theme === "DARK" ? "bg-zinc-950 border-white/10" : "bg-white dark:bg-zinc-950 border-border/30"}`} data-testid="footer-verified-partners">
          <h3 className="text-3xl font-black text-primary italic uppercase tracking-tighter text-center mb-10">
            Verified NeXA Partners
          </h3>

          <div className="overflow-hidden">
            <div
              className="flex gap-10"
              style={{
                width: "max-content",
                animation: `partnerScroll ${partnerSettings?.scrollingSpeed || Math.max(verifiedToolsList.length * 6, 30)}s linear infinite`,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.animationPlayState = "paused"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.animationPlayState = "running"; }}
              data-testid="slider-track-partners"
            >
              {[...verifiedToolsList, ...verifiedToolsList].map((tool, idx) => {
                const subtitles = [
                  "Official Neural Processing Partner",
                  "Authorized Video Intelligence",
                  "Certified Open Intelligence",
                  "Strategic AI Research Ally",
                  "Advanced Analytics Partner",
                  "Digital Innovation Collaborator",
                  "Trusted Security Partner",
                  "Cloud Infrastructure Partner",
                  "Data Intelligence Partner",
                  "Machine Learning Partner",
                ];
                const subtitle = subtitles[(tool.id - 1) % subtitles.length];
                return (
                  <a
                    key={`partner-${idx}`}
                    href="#"
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        const res = await fetch(`/api/track-click/${tool.id}`);
                        const data = await res.json();
                        if (data.redirect) window.open(data.redirect, "_blank");
                      } catch {
                        window.open(tool.link, "_blank");
                      }
                    }}
                    className="shrink-0 w-[300px] bg-white dark:bg-zinc-900 nexa-card-glow rounded-[2.5rem] p-8 transition-all group relative flex flex-col items-center text-center"
                    data-testid={`card-partner-${tool.id}`}
                  >
                    <div className="absolute top-4 right-6">
                      <Badge className="bg-[#FFD700] text-black text-[10px] font-black px-3 no-default-hover-elevate no-default-active-elevate">VERIFIED</Badge>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4 overflow-hidden">
                      {tool.logoUrl ? (
                        <img src={tool.logoUrl} alt={tool.name} className="w-9 h-9 object-contain" />
                      ) : (
                        <Cpu className="w-7 h-7 text-primary" />
                      )}
                    </div>
                    <h4 className="text-foreground font-bold text-base">{tool.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>
                    <div className="mt-6 w-full bg-[#FFD700] text-black py-3 rounded-2xl text-[12px] font-black text-center uppercase flex items-center justify-center gap-2">
                      <BadgeCheck className="w-4 h-4" />
                      Official Partner
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="px-4 py-8 mt-0" data-testid="section-founder-partnership">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="nexa-card-glow bg-card dark:bg-zinc-900 rounded-[2rem] p-10 flex flex-col justify-center" data-testid="section-founder">
            <FounderSection />
          </div>

          <div className="nexa-card-glow bg-card dark:bg-zinc-900 rounded-[2rem] p-10" data-testid="footer-partnership">
            <h2 className="text-2xl font-black mb-6 text-primary uppercase tracking-wider flex flex-wrap items-center gap-2">
              <Send className="w-5 h-5" />
              PARTNERSHIP & SUPPORT
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={ticketName}
                  onChange={(e) => setTicketName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-background/50 dark:bg-black/50 border border-border/50 dark:border-white/10 p-3 rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                  data-testid="input-ticket-name"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">WhatsApp / Phone</label>
                <input
                  type="tel"
                  value={ticketPhone}
                  onChange={(e) => setTicketPhone(e.target.value)}
                  placeholder="WhatsApp / Phone"
                  className="w-full bg-background/50 dark:bg-black/50 border border-border/50 dark:border-white/10 p-3 rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                  data-testid="input-ticket-phone"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
                <Select value={ticketSubject} onValueChange={setTicketSubject}>
                  <SelectTrigger className="w-full rounded-xl bg-background/50 dark:bg-black/50 border-border/50 dark:border-white/10" data-testid="select-ticket-subject">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advertising">Buy Advertisement / Promotion</SelectItem>
                    <SelectItem value="support">Technical Support Ticket</SelectItem>
                    <SelectItem value="verification">Request Tool Verification Badge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Your Tool/Website URL</label>
                <input
                  type="url"
                  value={ticketLink}
                  onChange={(e) => setTicketLink(e.target.value)}
                  placeholder="Your Tool/Website URL"
                  className="w-full bg-background/50 dark:bg-black/50 border border-border/50 dark:border-white/10 p-3 rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                  data-testid="input-ticket-link"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Message</label>
                <textarea
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Message Details..."
                  className="w-full bg-background/50 dark:bg-black/50 border border-border/50 dark:border-white/10 p-3 rounded-xl h-24 text-sm text-foreground outline-none focus:border-primary transition-colors resize-none placeholder:text-muted-foreground"
                  data-testid="input-ticket-message"
                />
              </div>
              <div>
                <Button
                  className="w-full font-black rounded-xl text-sm uppercase"
                  onClick={() => {
                    if (!ticketName.trim() || !ticketPhone.trim()) {
                      toast({ title: "Required fields", description: "Please provide your name and phone number.", variant: "destructive" });
                      return;
                    }
                    ticketMutation.mutate();
                  }}
                  disabled={ticketMutation.isPending}
                  data-testid="button-submit-ticket"
                >
                  {ticketMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Inquiry
                      <Send className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {policyPublic?.footerText && (
        <div className="bg-zinc-950 text-center py-4 px-4 border-t border-white/10">
          <p className="text-xs text-zinc-500 tracking-widest uppercase" data-testid="text-footer-verification">
            {policyPublic.footerText}
          </p>
        </div>
      )}

      {paymentModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setPaymentModal({ open: false, plan: "", price: "" })}
          data-testid="modal-payment-overlay"
        >
          <div
            className="bg-card dark:bg-[hsl(222,20%,12%)] border border-border/50 dark:border-white/10 rounded-[2rem] p-8 w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
            data-testid="modal-payment"
          >
            <button
              onClick={() => setPaymentModal({ open: false, plan: "", price: "" })}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-close-payment"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-black uppercase">{paymentModal.plan} Plan</h3>
              <p className="text-3xl font-black text-primary mt-1">
                ${paymentModal.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  value={paymentForm.name}
                  onChange={(e) => setPaymentForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full bg-background/50 dark:bg-black/50 border border-border/50 dark:border-white/10 p-3 rounded-xl text-foreground outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                  data-testid="input-payment-name"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  value={paymentForm.email}
                  onChange={(e) => setPaymentForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full bg-background/50 dark:bg-black/50 border border-border/50 dark:border-white/10 p-3 rounded-xl text-foreground outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                  data-testid="input-payment-email"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Card Number</label>
                <input
                  type="text"
                  value={paymentForm.card}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                    setPaymentForm(f => ({ ...f, card: v.replace(/(.{4})/g, "$1 ").trim() }));
                  }}
                  placeholder="1234 5678 9012 3456"
                  className="w-full bg-background/50 dark:bg-black/50 border border-border/50 dark:border-white/10 p-3 rounded-xl text-foreground outline-none focus:border-primary transition-colors placeholder:text-muted-foreground font-mono tracking-wider"
                  data-testid="input-payment-card"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Expiry</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full bg-background/50 dark:bg-black/50 border border-border/50 dark:border-white/10 p-3 rounded-xl text-foreground outline-none focus:border-primary transition-colors placeholder:text-muted-foreground font-mono"
                    data-testid="input-payment-expiry"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    maxLength={4}
                    className="w-full bg-background/50 dark:bg-black/50 border border-border/50 dark:border-white/10 p-3 rounded-xl text-foreground outline-none focus:border-primary transition-colors placeholder:text-muted-foreground font-mono"
                    data-testid="input-payment-cvc"
                  />
                </div>
              </div>
            </div>

            <Button
              className="w-full mt-6 rounded-2xl font-black text-base"
              onClick={handlePaymentSubmit}
              disabled={paymentProcessing}
              data-testid="button-confirm-payment"
            >
              {paymentProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  PAY ${paymentModal.price} / MONTH
                </>
              )}
            </Button>

            <p className="text-[10px] text-muted-foreground text-center mt-4 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Secured by NeXA Payment Gateway. All data encrypted.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
