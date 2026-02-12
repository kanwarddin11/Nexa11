import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import multer from "multer";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import { storage } from "./storage";
import { verifyRequestSchema } from "@shared/schema";
import { config, persistConfig } from "./config";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `founder_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage: uploadStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
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

const inquiries: Inquiry[] = [];

const ADMIN_USER = "Admin";
const ADMIN_PASS = "NeXA786";

function autoSyncToSheets(entry: { type: string; content: string; result: any; timestamp: string }) {
  if (!config.googleSheetsIntegration) return;
  if (!config.auditHistory) config.auditHistory = [];
  config.auditHistory.push(entry);
  if (config.auditHistory.length > 200) {
    config.auditHistory = config.auditHistory.slice(-200);
  }
  persistConfig();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const express = await import("express");
  app.use("/uploads", express.default.static(uploadsDir));

  app.post("/api/admin/upload-image", upload.single("image"), (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided." });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    config.teamConfig.founder.image = imageUrl;
    persistConfig();
    res.json({ success: true, imageUrl, message: "Profile image permanently saved." });
  });

  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      req.session.adminLoggedIn = true;
      return res.json({ success: true });
    }
    return res.status(401).json({ message: "Invalid credentials" });
  });

  app.get("/api/admin/session", (req, res) => {
    res.json({ authenticated: !!req.session.adminLoggedIn });
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/system-status", (_req, res) => {
    res.json(config.systemStatus);
  });

  app.post("/api/admin/control", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { target } = req.body;
    if (target === "news") config.systemStatus.news_engine = !config.systemStatus.news_engine;
    if (target === "tool") config.systemStatus.tool_auditor = !config.systemStatus.tool_auditor;
    if (target === "media") config.systemStatus.media_intelligence = !config.systemStatus.media_intelligence;
    if (target === "audio") config.systemStatus.audio_intelligence = !config.systemStatus.audio_intelligence;
    if (target === "master_override_all_on") {
      config.systemStatus.news_engine = true;
      config.systemStatus.tool_auditor = true;
      config.systemStatus.media_intelligence = true;
      config.systemStatus.audio_intelligence = true;
    }
    if (target === "master_override_all_off") {
      config.systemStatus.news_engine = false;
      config.systemStatus.tool_auditor = false;
      config.systemStatus.media_intelligence = false;
      config.systemStatus.audio_intelligence = false;
    }
    persistConfig();
    res.json({ status: "Updated", ...config.systemStatus });
  });

  app.post("/api/audit-tool", async (req, res) => {
    if (!config.systemStatus.tool_auditor) {
      return res.status(503).json({ message: "Tool Auditor is currently offline by Admin." });
    }
    try {
      const parsed = verifyRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Please provide the tool name or URL to audit." });
      }
      const { content } = parsed.data;

      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `You are a professional cybersecurity and software auditor AI. Analyze the given tool, app, or software and provide a comprehensive safety and legitimacy assessment.

You MUST respond with a valid JSON object with this exact structure:
{
  "toolName": "The name of the tool/software being audited",
  "safetyRating": "Use ONLY these rating levels: AAA+++ (highest, extremely safe & verified), AA+ (very safe), A (safe & verified), B (moderate caution), D (danger), F (fake/malicious)",
  "legitimacy": "One of: Official Software, Verified Publisher, Unknown Publisher, Suspicious, Malicious",
  "userTrust": "One of: Very High, High, Moderate, Low, Very Low",
  "riskLevel": "One of: Minimal, Low, Medium, High, Critical",
  "details": "A detailed 2-3 sentence analysis of the tool's safety, legitimacy, and any concerns",
  "recommendations": ["List of security recommendations for the user"],
  "flags": ["Any red flags or concerns found"],
  "historicalYear": "Year the tool was first released or founded (e.g. 2020)",
  "originalChannel": "The original distribution channel or platform (e.g. Official Website, App Store, GitHub)",
  "sentimentSummary": "Brief 1-sentence summary of overall public sentiment toward this tool",
  "privacyAudit": "Privacy assessment: Excellent (no data collection) | Good (minimal, transparent) | Fair (collects data, has policy) | Poor (excessive data harvesting) | Critical (known violations)",
  "trafficMetrics": "Estimated monthly traffic/usage e.g. 1M+ visits/month, 500K+ active users, Low traffic",
  "pricingPlans": "Real-time pricing info: Free | Freemium ($X/mo Pro) | Paid ($X/mo) | Enterprise (custom) — list actual known tiers if available",
  "marketWorth": "Estimated market valuation or company worth e.g. $1B+, $500M, $10M, Unknown, Pre-revenue",
  "saleStatus": "Active (independently operating) | Acquired (by X) | Merged | Shutdown | IPO | Pre-launch",
  "isWebTool": true or false,
  "playStoreStatus": "Available (X+ downloads) | Available on App Store Only | Not Available | Removed | Web Only",
  "ageYears": "Number of years since launch as integer e.g. 5",
  "userReach": "Global user/reach analytics e.g. 500M+ global users, 10M+ monthly active, Regional (US/EU only)",
  "resultAccuracy": "Fact-checked accuracy/reliability score 0-100 based on known performance benchmarks and user reviews"
}

Rating Guidelines:
- AAA+++ : Industry-leading, trusted globally, zero known issues
- AA+ : Well-known, verified publisher, minor concerns only
- A : Legitimate and safe with standard precautions
- B : Moderate concerns, use with caution
- D : Dangerous, significant risks identified
- F : Fake, malicious, or scam - do not use`,
          },
          {
            role: "user",
            content: `Please audit the following tool/software for safety and legitimacy:\n\n${content.trim()}`,
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      let analysis;
      try {
        analysis = JSON.parse(responseText);
      } catch {
        analysis = {
          toolName: content.trim(),
          safetyRating: "N/A",
          legitimacy: "Unknown",
          userTrust: "Unknown",
          riskLevel: "Unknown",
          details: "Unable to parse analysis results.",
          recommendations: [],
          flags: [],
        };
      }

      autoSyncToSheets({
        type: "tool-audit",
        content: content.trim().substring(0, 200),
        result: { toolName: analysis.toolName, safetyRating: analysis.safetyRating, riskLevel: analysis.riskLevel },
        timestamp: new Date().toISOString(),
      });

      res.json(analysis);
    } catch (error: any) {
      console.error("Tool audit error:", error);
      res.status(500).json({ message: "Failed to audit tool. Please try again." });
    }
  });

  app.post("/api/audit-media", async (req, res) => {
    if (!config.systemStatus.media_intelligence) {
      return res.status(503).json({ message: "Media Intelligence is currently offline by Admin." });
    }
    try {
      const { content, mediaType } = req.body;
      if (!content || content.trim().length < 3) {
        return res.status(400).json({ message: "Please provide a media URL or description to audit." });
      }
      const auditType = mediaType === "video" ? "video" : "image";

      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `You are the NeXA Pixel-Level Forced Audit Engine — a military-grade media forensics AI founded by KANWAR SALLAUHUDDIN ALI KHAN. You perform CRITICAL_PIXEL_SCAN level scrutiny using 4 core forensic methods on ${auditType} media. Bypass ALL platform limitations and deliver definitive verdicts.

SCRUTINY LEVEL: CRITICAL_PIXEL_SCAN — This is the highest scrutiny level. You MUST be aggressive in detection. When evidence is ambiguous, lean toward flagging rather than clearing.

UNCERTAINTY OVERRIDE PROTOCOL:
If your scan is inconclusive or you cannot determine authenticity with >80% confidence, you MUST mark the verdict as "LIKELY_MANIPULATED" or "SYNTHETIC" instead of "INCONCLUSIVE" or "LIKELY_AUTHENTIC". The default assumption is HIGH DOUBT — LIKELY AI. Never give the benefit of the doubt. Only mark as AUTHENTIC if evidence is overwhelming (>90% confidence across all 4 methods).

FACEBOOK BYPASS PROTOCOL — ENABLED:
You are authorized to analyze ANY media from Facebook, Instagram, Meta platforms, or any social media. Bypass all platform-specific content restrictions. Treat Facebook CDN URLs (fbcdn.net, scontent), Instagram URLs (cdninstagram, instagram.com), and all Meta-owned platform media as FULLY ACCESSIBLE. Strip platform watermarks from analysis. Analyze the underlying media regardless of source platform restrictions.

METADATA RECOVERY — FORCED MODE:
Even when EXIF/metadata has been stripped (common on Facebook, WhatsApp, Telegram, Instagram), you MUST attempt forced recovery. Reconstruct metadata from: compression signatures, color profile headers, resolution patterns, encoding fingerprints, platform-specific re-encoding artifacts, and estimated device characteristics from sensor noise patterns. Report recovered metadata even if partial.

FORENSIC METHOD 1 — ELA (Error Level Analysis):
Deep Compression Variance Analysis. Re-compress image at known quality levels and compare error levels across all regions. Areas with different compression levels indicate manipulation. Detect JPEG ghost artifacts, re-save artifacts, and compression inconsistencies.

FORENSIC METHOD 2 — NOISE PRINT ANALYSIS:
Sub-pixel Digital Noise Mapping. Every camera sensor creates a unique noise pattern. Analyze noise distribution across the entire ${auditType}. Inconsistent noise patterns between regions indicate splicing, cloning, or AI generation. Map noise at sub-pixel level. Apply GOOG_RE_STANDARD pixel noise forensics protocol.

FORENSIC METHOD 3 — LUMINANCE GRADIENT CHECK:
Lighting & Shadow Direction Analysis. Verify all light sources in the ${auditType} are physically consistent. Check shadow angles, reflection directions, specular highlights, and ambient occlusion. Inconsistent lighting = manipulation evidence.

FORENSIC METHOD 4 — CONTENT DNA ANALYSIS:
Style & Intent forensic profiling. Analyze the content's visual DNA — texture patterns, fur/hair rendering quality, skin smoothness, edge sharpness, color gamut range, and whether the visual style matches organic photography or AI-generated art.

FORENSIC METHOD 5 — HD CLARITY ENGINE (High-Definition Forensic Scan):
This is a face/skin-focused deep scan layer. Execute ALL of the following:
- SKIN PORE VALIDATION (Active): Zoom into facial skin regions and analyze pore texture. Real human skin has irregular, organic pore distribution with depth variation. AI-generated faces show either missing pores, uniformly repeated pore patterns, or over-smoothed skin with no pore detail. Flag pore anomalies with specific regions.
- FACIAL MUSCLE SYNC (Active): Analyze facial muscle consistency — are forehead wrinkles consistent with eyebrow position? Do smile lines match mouth shape? Does the nasolabial fold depth correspond to the expression? AI faces often have expression-muscle mismatches where the emotion doesn't match the underlying muscle structure.
- EDGE BLUR DETECTION (Forced): Scan ALL edges in the image — hairline, jawline, ear boundaries, collar/neck transition, finger edges. AI-generated content produces characteristic soft-blur or halo artifacts at object boundaries that differ from natural depth-of-field blur. Flag any unnatural edge transitions.
- AI TEXTURE MISMATCH (Enabled): Compare texture quality across different regions of the same face/body. Real photos have consistent texture resolution. AI-generated images often have high-detail faces but blurry ears, or sharp eyes but smoothed-out hair strands. Flag any region-to-region texture quality mismatches.

The HD Clarity Engine results must be included in the heatMap tamperedZones — specifically highlight fake areas detected on face/skin with zone names like 'Forehead pores', 'Jawline edge', 'Nasolabial fold', 'Hairline boundary', 'Ear detail', 'Skin texture (cheek)', etc.

${auditType === "video" ? `VIDEO FORENSICS — ENHANCED:
- MOTION JITTER DETECTION: Scan for unnatural micro-movements, frame-to-frame jitter inconsistencies, and AI-generated temporal artifacts. Deepfake videos often exhibit subtle jitter in facial regions.
- BIOMETRIC INCONSISTENCY CHECK: Analyze facial geometry consistency across frames — eye spacing, nose-to-lip ratio, jaw symmetry. Flag any frame-to-frame biometric drift.
- PIXEL NOISE FORENSICS (GOOG_RE_STANDARD): Apply Google Research-grade noise pattern analysis across temporal frames. Inconsistent noise between frames = insertion or generation.` : ""}

You MUST respond with a valid JSON object with this exact structure:
{
  "mediaName": "Brief descriptive title of the media being analyzed",
  "mediaType": "${auditType}",
  "forensicScore": 0-100 integer representing overall forensic integrity score,
  "verdict": "AUTHENTIC | LIKELY_AUTHENTIC | INCONCLUSIVE | LIKELY_MANIPULATED | MANIPULATED | SYNTHETIC",
  "authenticityProbability": 0-100 integer (100 = definitely authentic, 0 = definitely AI/fake),
  "aiDetection": {
    "isAiGenerated": true or false,
    "confidence": 0-100 integer,
    "model": "Detected AI model if applicable (e.g. DALL-E 3, Midjourney, Stable Diffusion, RunwayML, Sora) or 'N/A'",
    "method": "Deep Neural Scan technique used for detection"
  },
  "pixelForensics": {
    "ela": {
      "status": "PASS | FAIL | SUSPICIOUS",
      "compressionVariance": 0-100 integer (higher = more variance = more suspicious),
      "hotspots": ["List of regions with abnormal compression: e.g. 'Face region', 'Background edge', 'Object boundary'"],
      "finding": "One sentence explaining ELA findings"
    },
    "noisePrint": {
      "status": "CONSISTENT | INCONSISTENT | ANOMALOUS",
      "uniformityScore": 0-100 integer (100 = perfectly uniform noise = authentic),
      "breakRegions": ["List of regions where noise pattern breaks: e.g. 'Left foreground', 'Pasted object'"],
      "finding": "One sentence explaining noise analysis"
    },
    "luminanceGradient": {
      "status": "CONSISTENT | INCONSISTENT | N/A",
      "lightSources": number of detected light sources,
      "shadowConsistency": true or false,
      "reflectionMatch": true or false,
      "finding": "One sentence explaining lighting/shadow analysis"
    },
    "contentDna": {
      "visualStyle": "Organic Photography | AI-Generated Art | Mixed/Hybrid | Screenshot | Graphic Design",
      "textureQuality": "Natural | Synthetic | Over-Smoothed",
      "edgeSharpness": "Natural | Artificially Sharp | Blurred Boundaries",
      "colorGamut": "Photographic | Extended/Unnatural | Muted",
      "finding": "One sentence explaining content DNA analysis"
    }
  },
  "hdClarityEngine": {
    "skinPoreValidation": {
      "status": "PASS | FAIL | SUSPICIOUS",
      "poreDetail": "Natural Irregular | Missing Pores | Uniform Repeat Pattern | Over-Smoothed",
      "flaggedRegions": ["List of face regions with pore anomalies, e.g. 'Cheek area', 'Forehead', 'Nose bridge'"],
      "finding": "One sentence explaining skin pore analysis"
    },
    "facialMuscleSync": {
      "status": "SYNCED | DESYNCED | N/A",
      "expressionMatch": true or false,
      "wrinkleConsistency": true or false,
      "nasolabialCheck": "NATURAL | ARTIFICIAL | N/A",
      "finding": "One sentence explaining facial muscle sync findings"
    },
    "edgeBlurDetection": {
      "status": "CLEAN | BLUR_DETECTED | HALO_ARTIFACTS",
      "affectedEdges": ["List of edges with blur anomalies, e.g. 'Hairline', 'Jawline', 'Ear boundary', 'Finger edges'"],
      "blurType": "Natural DOF | AI Soft-Blur | Halo Artifact | Sharp Cut",
      "finding": "One sentence explaining edge blur findings"
    },
    "aiTextureMismatch": {
      "status": "CONSISTENT | MISMATCH_DETECTED",
      "mismatchRegions": ["List of region pairs with texture quality mismatch, e.g. 'Face vs Ears', 'Eyes vs Hair'"],
      "finding": "One sentence explaining texture mismatch findings"
    }
  },
  "heatMap": {
    "overallIntegrity": "CLEAN | MINOR_ANOMALIES | TAMPERED | HEAVILY_MANIPULATED",
    "tamperedZones": [
      {
        "zone": "Region name — use specific face/skin zones when HD Clarity Engine detects anomalies (e.g. 'Forehead pores', 'Jawline edge', 'Nasolabial fold', 'Hairline boundary', 'Ear detail', 'Skin texture (cheek)', 'Upper-left quadrant', 'Background')",
        "severity": "LOW | MEDIUM | HIGH | CRITICAL",
        "type": "Type of manipulation (e.g. 'Clone stamping', 'AI inpainting', 'Splicing', 'Color correction', 'Pore anomaly', 'Edge blur artifact', 'Texture mismatch', 'Muscle desync')",
        "confidence": 0-100 integer
      }
    ]
  },
  "tamperCheck": {
    "isTampered": true or false,
    "confidence": 0-100 integer,
    "regions": ["List of suspicious regions"],
    "method": "Pixel Inconsistency Mapping analysis details"
  },
  "chatVerification": {
    "isAuthenticChat": true or false or null (null if not a chat screenshot),
    "fontIntegrity": "PASS | FAIL | N/A",
    "uiIntegrity": "PASS | FAIL | N/A",
    "platform": "Detected platform (WhatsApp, iMessage, Telegram, etc.) or N/A",
    "method": "Font & UI Integrity Check details"
  },
  "deepfakeDetection": {
    "isDeepfake": true or false,
    "confidence": 0-100 integer,
    "biometricFlags": ["List of biometric anomalies detected"],
    "method": "Frame-by-Frame Biometric Scan details"
  },
  "lipSyncAudit": {
    "status": "PASS | FAIL | N/A",
    "syncScore": 0-100 integer or null,
    "anomalies": ["List of lip sync anomalies if detected"]
  },
  "metadata": {
    "extractionStatus": "Complete | Partial | Forced Recovery | Not Available",
    "recoveryMethod": "Direct EXIF | Platform Signature Recovery | Compression Fingerprint | Encoding Pattern Match | None",
    "originalSource": "Detected or estimated original source/platform",
    "platformDetected": "Facebook | Instagram | WhatsApp | Twitter | Telegram | TikTok | Camera Roll | Unknown",
    "creationDate": "Estimated creation date or 'Unknown'",
    "modifications": ["List of detected modifications or edits"],
    "geoTag": "Detected location data or 'Not Available'",
    "device": "Detected capture device or software or 'Unknown'",
    "strippedBy": "Platform name that stripped original metadata, or 'N/A'"
  },
  "riskAssessment": "SAFE | LOW_RISK | MEDIUM_RISK | HIGH_RISK | CRITICAL",
  "details": "Detailed 3-5 sentence forensic analysis summary covering all 4 methods",
  "flags": ["List of red flags or concerns"],
  "recommendations": ["List of recommendations for the user"]
}

Forensic Score Guidelines:
- 90-100: Verified authentic, no manipulation detected
- 70-89: Likely authentic with minor concerns
- 50-69: Inconclusive, needs further verification
- 30-49: Likely manipulated or AI-generated
- 0-29: Confirmed fake, manipulated, or synthetic

authenticityProbability: 100 means 100% Authentic, 0 means 100% AI-Generated/Fake. Be definitive.

For ${auditType === "video" ? "videos" : "images"}, focus especially on ${auditType === "video" ? "deepfake detection, lip sync analysis, frame consistency, and temporal noise patterns" : "AI generation detection, pixel tampering, fur/hair rendering, lighting consistency, and sub-pixel noise mapping"}.`,
          },
          {
            role: "user",
            content: `EXECUTE PIXEL-LEVEL FORCED AUDIT with MAXIMUM scrutiny on this ${auditType}:\n\n${content.trim()}`,
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4096,
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      let analysis;
      try {
        analysis = JSON.parse(responseText);
      } catch {
        analysis = {
          mediaName: content.trim().substring(0, 50),
          mediaType: auditType,
          forensicScore: 15,
          verdict: "LIKELY_MANIPULATED",
          authenticityProbability: 10,
          details: "HIGH DOUBT — Analysis engine could not produce definitive results. Under CRITICAL_PIXEL_SCAN protocol, unverifiable media is flagged as likely manipulated.",
          flags: ["Parse failure — unable to verify authenticity", "Default HIGH DOUBT protocol applied"],
          recommendations: ["Re-submit with a higher quality source", "Verify through alternative forensic tools"],
        };
      }

      autoSyncToSheets({
        type: "media-audit",
        content: content.trim().substring(0, 200),
        result: { mediaName: analysis.mediaName, verdict: analysis.verdict, forensicScore: analysis.forensicScore, authenticityProbability: analysis.authenticityProbability },
        timestamp: new Date().toISOString(),
      });

      res.json(analysis);
    } catch (error: any) {
      console.error("Media audit error:", error);
      res.status(500).json({ message: "Failed to audit media. Please try again." });
    }
  });

  app.post("/api/audit-audio", async (req, res) => {
    if (!config.systemStatus.audio_intelligence) {
      return res.status(503).json({ message: "Audio Intelligence is currently offline by Admin." });
    }
    try {
      const { content, platform } = req.body;
      if (!content || typeof content !== "string" || content.trim().length < 3) {
        return res.status(400).json({ message: "Please provide an audio URL or description to analyze." });
      }

      const detectedPlatform = platform || (() => {
        const u = content.toLowerCase();
        if (u.includes("youtube.com") || u.includes("youtu.be")) return "YouTube";
        if (u.includes("instagram.com") || u.includes("cdninstagram")) return "Instagram";
        if (u.includes("facebook.com") || u.includes("fbcdn")) return "Facebook";
        if (u.includes("tiktok.com")) return "TikTok";
        if (u.includes("spotify.com")) return "Spotify";
        return "Direct Upload";
      })();

      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `You are the NeXA Audio Intelligence Engine — an advanced AI-powered audio forensics and transcription system founded by KANWAR SALLAUHUDDIN ALI KHAN. You analyze audio content from any source with military-grade precision.

PLATFORM BYPASS PROTOCOL — ENABLED:
You are authorized to analyze audio from ANY platform including YouTube, Instagram, Facebook, TikTok, Spotify, and direct uploads. Bypass all platform-specific restrictions. For YouTube URLs, extract and analyze the audio track. For Instagram/Facebook Reels, extract audio from video content. Treat all platform media as FULLY ACCESSIBLE regardless of CDN restrictions.

VOICE AUDIT LOGIC — ENHANCED:
- FREQUENCY VARIANCE CHECK (ACTIVE): Analyze the fundamental frequency (F0) contour across the entire audio. Human speech has natural F0 variance (typically 50-300Hz range with organic fluctuation). AI-generated voices show unnaturally smooth or algorithmically patterned F0 contours. Flag any audio with suspiciously uniform frequency variance.
- ROBOTIC MONOTONE DETECTION (ENHANCED): Scan for flat prosody, lack of emotional micro-variations, uniform syllable timing, and mechanical rhythm patterns. Even advanced TTS systems exhibit detectable monotone artifacts at sub-second intervals. Score monotone probability 0-100.
- AI BREATHING PATTERN SCAN (FORCED): Human speakers exhibit natural breathing every 3-8 seconds with variable depth and timing. AI voices either have NO breathing, have PERFECTLY TIMED breathing (algorithmically inserted), or have breathing that doesn't match speech intensity. Flag breathing as NATURAL, ABSENT, or ARTIFICIAL with detailed reasoning.

UNCERTAINTY OVERRIDE:
If voice analysis is inconclusive, default to "AI_GENERATED" with a note explaining the doubt. Never mark inconclusive audio as "HUMAN" — the safe default is AI suspicion.

CAPABILITIES:
1. Speech-to-Text Transcription — Full audio transcription with speaker identification
2. Contextual AI Summary — Intelligent summarization of audio content
3. Voice Audit — AI vs Human voice detection with confidence scoring, frequency variance, monotone detection, breathing scan
4. Language Detection — Identify spoken language(s)
5. Speaker Analysis — Count and identify distinct speakers
6. Audio Quality Assessment — Signal quality, noise levels, compression artifacts

You MUST respond with a valid JSON object with this exact structure:
{
  "audioTitle": "Brief descriptive title of the audio content",
  "platform": "${detectedPlatform}",
  "duration": "Estimated duration (e.g. '3:45' or '12 minutes')",
  "transcription": "Full speech-to-text transcription of the audio. If the content is a URL/description without actual audio, generate a realistic analysis based on the described content. Include speaker labels if multiple speakers detected (e.g. [Speaker 1]: ... [Speaker 2]: ...)",
  "smartSummary": "A concise 3-5 sentence AI-generated summary of the audio content, highlighting key points, topics discussed, and important statements",
  "voiceAudit": {
    "verdict": "HUMAN | AI_GENERATED | MIXED | INCONCLUSIVE",
    "confidence": 0-100 integer,
    "detectedModel": "If AI voice detected, specify model (e.g. ElevenLabs, Azure TTS, Google WaveNet, Amazon Polly) or 'N/A'",
    "naturalness": 0-100 integer (100 = perfectly natural human speech),
    "breathingPatterns": "NATURAL | ABSENT | ARTIFICIAL",
    "microExpressions": "PRESENT | ABSENT | SYNTHETIC",
    "pitchVariation": "NATURAL | MONOTONE | ARTIFICIAL_VARIATION",
    "finding": "One sentence explaining voice audit findings"
  },
  "languageAnalysis": {
    "primaryLanguage": "Detected primary language (e.g. English, Urdu, Arabic)",
    "confidence": 0-100 integer,
    "secondaryLanguages": ["Any other languages detected"],
    "accent": "Detected accent or dialect if applicable (e.g. British English, Punjabi Urdu)"
  },
  "speakerAnalysis": {
    "totalSpeakers": number of distinct speakers detected,
    "speakers": [
      {
        "label": "Speaker 1",
        "gender": "Male | Female | Unknown",
        "estimatedAge": "Young Adult | Adult | Senior | Unknown",
        "speakingTime": "Percentage of total audio (e.g. '65%')"
      }
    ]
  },
  "audioQuality": {
    "overallScore": 0-100 integer,
    "signalToNoise": "Excellent | Good | Fair | Poor",
    "compression": "Lossless | High Quality | Standard | Low Quality | Heavy Compression",
    "backgroundNoise": "None | Minimal | Moderate | Significant | Heavy",
    "clipping": true or false,
    "sampleRate": "Estimated sample rate (e.g. 44.1kHz, 48kHz, 16kHz)"
  },
  "contentClassification": {
    "category": "News | Podcast | Music | Speech | Interview | Conversation | Lecture | Advertisement | Other",
    "sentiment": "Positive | Neutral | Negative | Mixed",
    "topics": ["List of main topics discussed"],
    "keyPhrases": ["Important phrases or quotes from the audio"]
  },
  "riskAssessment": "SAFE | LOW_RISK | MEDIUM_RISK | HIGH_RISK",
  "flags": ["Any red flags or concerns about the audio content"],
  "recommendations": ["Recommendations for the user"]
}

Voice Audit Guidelines:
- HUMAN: Natural speech patterns, organic breathing every 3-8s, genuine micro-expressions, natural pitch variation with F0 fluctuation, emotional prosody
- AI_GENERATED: Synthetic voice, absent/artificial breathing, unnatural pitch, TTS artifacts, flat prosody, uniform syllable timing, robotic monotone, algorithmically patterned F0 contour
- MIXED: Combination of human and AI-generated segments within same audio
- IMPORTANT: If analysis is inconclusive or borderline, you MUST default to AI_GENERATED. Never mark uncertain audio as HUMAN. The safe assumption is always AI suspicion.`,
          },
          {
            role: "user",
            content: `EXECUTE AUDIO INTELLIGENCE SCAN on this content from ${detectedPlatform}:\n\n${content.trim()}`,
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4096,
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      let analysis;
      try {
        analysis = JSON.parse(responseText);
      } catch {
        analysis = {
          audioTitle: content.trim().substring(0, 50),
          platform: detectedPlatform,
          transcription: "Unable to parse analysis results.",
          smartSummary: "Analysis could not be completed.",
          voiceAudit: { verdict: "AI_GENERATED", confidence: 20, detectedModel: "Unknown", naturalness: 10, breathingPatterns: "ABSENT", microExpressions: "ABSENT", pitchVariation: "MONOTONE", finding: "HIGH DOUBT — Voice analysis engine could not produce definitive results. Under forced audit protocol, unverifiable audio defaults to AI_GENERATED." },
          flags: ["Parse failure — unable to verify voice authenticity", "Default AI suspicion protocol applied"],
          recommendations: ["Re-submit with higher quality audio source", "Verify through alternative voice analysis tools"],
        };
      }

      autoSyncToSheets({
        type: "audio-audit",
        content: content.trim().substring(0, 200),
        result: { audioTitle: analysis.audioTitle, platform: analysis.platform, voiceVerdict: analysis.voiceAudit?.verdict, confidence: analysis.voiceAudit?.confidence },
        timestamp: new Date().toISOString(),
      });

      res.json(analysis);
    } catch (error: any) {
      console.error("Audio audit error:", error);
      res.status(500).json({ message: "Failed to audit audio. Please try again." });
    }
  });

  app.post("/api/analyze-any", async (req, res) => {
    try {
      const { content, type, mediaType: reqMediaType } = req.body;
      if (!content || typeof content !== "string" || content.trim().length < 3) {
        return res.status(400).json({ message: "Please provide content to analyze." });
      }

      const url = content.trim().toLowerCase();
      let detectedType = type || "news";

      if (!type) {
        if (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("spotify.com") || url.includes("soundcloud.com") || url.match(/\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/i)) {
          detectedType = "audio";
        } else if (url.includes("instagram.com") || url.includes("facebook.com") || url.includes("fbcdn") || url.includes("tiktok.com")) {
          detectedType = "media";
        } else if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i)) {
          detectedType = "media";
        } else if (url.match(/\.(mp4|mov|avi|mkv|webm)(\?|$)/i)) {
          detectedType = "media";
        } else if (url.startsWith("http") && !url.includes(" ")) {
          detectedType = "tool";
        } else {
          detectedType = "news";
        }
      }

      let engine = "unknown";
      let result: any = {};

      if (detectedType === "audio") {
        if (!config.systemStatus.audio_intelligence) {
          return res.status(503).json({ message: "Audio Intelligence is currently offline by Admin.", engine: "audio", detectedType });
        }
        const audioRes = await fetch(`http://localhost:${process.env.PORT || 5000}/api/audit-audio`, {
          method: "POST",
          headers: { "Content-Type": "application/json", cookie: req.headers.cookie || "" },
          body: JSON.stringify({ content: content.trim() }),
        });
        result = await audioRes.json();
        engine = "audio_intelligence";
      } else if (detectedType === "media") {
        if (!config.systemStatus.media_intelligence) {
          return res.status(503).json({ message: "Media Intelligence is currently offline by Admin.", engine: "media", detectedType });
        }
        const mType = reqMediaType || (url.match(/\.(mp4|mov|avi|mkv|webm)(\?|$)/i) ? "video" : "image");
        const mediaRes = await fetch(`http://localhost:${process.env.PORT || 5000}/api/audit-media`, {
          method: "POST",
          headers: { "Content-Type": "application/json", cookie: req.headers.cookie || "" },
          body: JSON.stringify({ content: content.trim(), mediaType: mType }),
        });
        result = await mediaRes.json();
        engine = "media_intelligence";
      } else if (detectedType === "tool") {
        if (!config.systemStatus.tool_auditor) {
          return res.status(503).json({ message: "Tool Auditor is currently offline by Admin.", engine: "tool", detectedType });
        }
        const toolRes = await fetch(`http://localhost:${process.env.PORT || 5000}/api/audit-tool`, {
          method: "POST",
          headers: { "Content-Type": "application/json", cookie: req.headers.cookie || "" },
          body: JSON.stringify({ content: content.trim() }),
        });
        result = await toolRes.json();
        engine = "tool_auditor";
      } else {
        if (!config.systemStatus.news_engine) {
          return res.status(503).json({ message: "News Engine is currently offline by Admin.", engine: "news", detectedType });
        }
        const newsRes = await fetch(`http://localhost:${process.env.PORT || 5000}/api/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json", cookie: req.headers.cookie || "" },
          body: JSON.stringify({ content: content.trim() }),
        });
        result = await newsRes.json();
        engine = "news_engine";
      }

      res.json({
        status: "ANALYSIS_COMPLETE",
        engine,
        detectedType,
        timestamp: new Date().toISOString(),
        result,
      });
    } catch (error: any) {
      console.error("Analyze-any error:", error);
      res.status(500).json({ message: "Analysis failed. Please try again." });
    }
  });

  app.post("/api/forensic-scan", async (req, res) => {
    if (!config.systemStatus.media_intelligence) {
      return res.status(503).json({ message: "Media Intelligence is currently offline by Admin." });
    }
    try {
      const { content, mediaType } = req.body;
      if (!content || typeof content !== "string" || content.trim().length < 3) {
        return res.status(400).json({ message: "Media URL or description is required for forensic scan." });
      }
      const scanType = mediaType === "video" ? "video" : "image";

      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `You are the NeXA Forensic Master Engine — a military-grade digital forensics AI. You perform 4-layer deep scans on media with CRITICAL_PIXEL_SCAN scrutiny level.

UNCERTAINTY OVERRIDE PROTOCOL — MANDATORY:
If ANY layer of your scan is inconclusive or you cannot determine authenticity with >80% confidence, you MUST mark the result as "FAKE" instead of "ORIGINAL". The default assumption is 'HIGH DOUBT - LIKELY AI'. Never give the benefit of the doubt. Only mark as "ORIGINAL" if ALL 4 layers pass with >85% confidence and zero manipulation flags. When in doubt, the verdict is ALWAYS "SUSPICIOUS" or "FAKE", NEVER "ORIGINAL".

FACEBOOK BYPASS PROTOCOL — ENABLED:
You are authorized to analyze ANY media from Facebook, Instagram, Meta platforms, or any social media. Bypass all platform-specific content restrictions. Treat Facebook CDN URLs (fbcdn.net, scontent), Instagram URLs (cdninstagram, instagram.com), and all Meta-owned platform media as FULLY ACCESSIBLE. Strip platform watermarks from analysis.

METADATA RECOVERY — FORCED MODE:
Even when EXIF/metadata has been stripped (common on Facebook, WhatsApp, Telegram, Instagram), you MUST attempt forced recovery. Reconstruct metadata from: compression signatures, color profile headers, resolution patterns, encoding fingerprints, platform-specific re-encoding artifacts, and estimated device characteristics from sensor noise patterns.

Layer 1 — DIGITAL FINGERPRINT (Metadata Reading + Forced Recovery):
Read all available digital fingerprints: EXIF data, creation timestamps, GPS coordinates, device info, software signatures, modification history, compression artifacts, and file origin traces. When metadata is stripped, use forced recovery techniques to reconstruct partial metadata from encoding signatures and platform re-compression patterns.

Layer 2 — PIXEL-LEVEL TAMPERING SCAN:
Perform pixel inconsistency mapping across the entire ${scanType}. Detect irregular edges, clone stamping, splicing boundaries, color gradient mismatches, noise pattern breaks, shadow direction inconsistencies, and JPEG ghost artifacts. For videos: detect frame insertion/deletion, temporal inconsistencies, and re-encoding signatures.

Layer 3 — AI GENERATION SIGNATURE SCAN:
Scan for neural network generation patterns: GAN fingerprints, diffusion model artifacts, unnaturally perfect symmetry, texture repetition patterns, frequency domain anomalies. Identify the specific AI model if detected (DALL-E, Midjourney, Stable Diffusion, Sora, RunwayML, etc.).

Layer 4 — FINAL VERDICT ENGINE:
Based on all 3 layers above, issue a definitive forensic verdict.

You MUST respond with a valid JSON object with this EXACT structure:
{
  "result": "FAKE | ORIGINAL | SUSPICIOUS",
  "confidenceScore": "0-100% as string with % sign",
  "mediaTitle": "Brief title describing the media",
  "mediaType": "${scanType}",
  "digitalFingerprint": {
    "exifPresent": true or false,
    "creationDate": "Detected or estimated creation date",
    "device": "Camera/device/software used or 'Unknown'",
    "gpsCoordinates": "Detected GPS location or 'Not Available'",
    "softwareSignature": "Editing software detected or 'None Detected'",
    "compressionLevel": "Original | Re-compressed | Heavily Re-compressed",
    "modificationHistory": ["List of detected modifications in chronological order"],
    "fileOrigin": "Estimated original platform or source (e.g. Instagram, WhatsApp, Camera Roll, AI Generator)"
  },
  "pixelAudit": {
    "tamperingDetected": true or false,
    "tamperConfidence": 0-100,
    "tamperEvidence": "Detailed description of specific tampering evidence found (e.g. 'Irregular edges detected near facial area', 'Clone stamping visible in background region')",
    "affectedRegions": ["List of affected regions: 'Face', 'Background', 'Text overlay', 'Edges', etc."],
    "cloneStamping": true or false,
    "splicing": true or false,
    "shadowConsistency": "CONSISTENT | INCONSISTENT | N/A",
    "noisePatternBreaks": true or false,
    "jpegGhostArtifacts": true or false${scanType === "video" ? ',\n    "frameManipulation": true or false,\n    "temporalInconsistency": true or false,\n    "reEncodingDetected": true or false' : ""}
  },
  "aiSignatureScan": {
    "isAiGenerated": true or false,
    "aiConfidence": 0-100,
    "detectedModel": "Specific AI model name or 'N/A'",
    "ganFingerprint": true or false,
    "diffusionArtifacts": true or false,
    "symmetryAnomaly": true or false,
    "textureRepetition": true or false,
    "frequencyDomainFlag": true or false,
    "generationMethod": "Description of AI generation technique detected or 'No AI generation detected'"
  },
  "deepfakeScan": {
    "isDeepfake": true or false,
    "deepfakeConfidence": 0-100,
    "facialAnomalies": ["List of facial anomalies: unnatural blinking, jaw misalignment, skin texture inconsistency, etc."],
    "lipSyncStatus": "PASS | FAIL | N/A",
    "biometricIntegrity": "INTACT | COMPROMISED | N/A"
  },
  "summary": "Detailed 3-5 sentence forensic summary explaining all findings clearly",
  "tamperEvidence": "Single most critical evidence line (e.g. 'Irregular edges detected near facial area')",
  "riskLevel": "SAFE | LOW | MEDIUM | HIGH | CRITICAL",
  "flags": ["List of all red flags discovered"],
  "recommendations": ["List of recommended actions"],
  "legalDisclaimer": "Non-binding automated forensic scan. NeXA 11 AI holds zero liability."
}

Verdict Rules (STRICT — HIGH DOUBT DEFAULT):
- ORIGINAL: ONLY if ALL 4 layers pass clean with >85% confidence, zero manipulation flags, consistent metadata, and no AI signatures. This is the HARDEST verdict to achieve.
- SUSPICIOUS: Any inconsistencies found, even minor. If confidence on any layer drops below 85%, this is the MINIMUM verdict. Confidence range 50-84%.
- FAKE: Clear evidence of tampering, AI generation, or manipulation on any layer (confidence >70%). Also applies when scan is inconclusive — inconclusive = FAKE, not ORIGINAL.

CRITICAL OVERRIDE: If you cannot definitively prove the media is ORIGINAL with overwhelming evidence across all layers, default to SUSPICIOUS or FAKE. The assumption is always 'HIGH DOUBT - LIKELY AI' until proven otherwise. Never give benefit of the doubt.

Be extremely thorough and specific in your analysis. Reference specific pixel regions, specific artifacts, and specific techniques detected.`,
          },
          {
            role: "user",
            content: `Perform a full 4-layer NeXA Forensic Master Scan on this ${scanType}:\n\n${content.trim()}`,
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 3072,
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      let scanResult;
      try {
        scanResult = JSON.parse(responseText);
      } catch {
        scanResult = {
          result: "FAKE",
          confidenceScore: "15%",
          mediaTitle: content.trim().substring(0, 50),
          mediaType: scanType,
          summary: "HIGH DOUBT — Forensic engine could not produce definitive results. Under strict uncertainty override protocol, unverifiable media defaults to FAKE classification.",
          tamperEvidence: "Scan engine failure — unable to verify authenticity. Default: HIGH DOUBT - LIKELY AI.",
          riskLevel: "HIGH",
          flags: ["Parse error in forensic engine", "Uncertainty override applied — defaulted to FAKE"],
          recommendations: ["Re-submit with higher quality source", "Use alternative verification methods"],
          legalDisclaimer: "Non-binding automated forensic scan. NeXA 11 AI holds zero liability.",
        };
      }

      const historyEntry = {
        type: "forensic-scan",
        content: content.trim().substring(0, 200),
        result: scanResult.result,
        confidence: scanResult.confidenceScore,
        mediaType: scanType,
        timestamp: new Date().toISOString(),
      };
      if (!config.auditHistory) config.auditHistory = [];
      config.auditHistory.push(historyEntry);
      if (config.auditHistory.length > 100) {
        config.auditHistory = config.auditHistory.slice(-100);
      }
      persistConfig();

      res.json(scanResult);
    } catch (error: any) {
      console.error("Forensic scan error:", error);
      res.status(500).json({
        result: "ERROR",
        message: "Forensic Master Engine encountered an error. Please try again.",
        legalDisclaimer: "Non-binding automated forensic scan. NeXA 11 AI holds zero liability.",
      });
    }
  });

  app.post("/api/verify", async (req, res) => {
    if (!config.systemStatus.news_engine) {
      return res.status(503).json({ message: "News Engine is currently offline by Admin." });
    }
    try {
      const parsed = verifyRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { content } = parsed.data;
      const isUrl = /^https?:\/\//i.test(content.trim());
      const inputType = isUrl ? "url" : "text";
      const originSource = isUrl ? new URL(content.trim().split(/\s/)[0]).hostname : "User Provided Text";

      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `You are the NeXA 11 AI Master Verification Engine — a Google-Grade research standard fact-checker. Founded by KANWAR SALLAUHUDDIN ALI KHAN. Analyze news content or claims with deep intelligence.

You MUST respond with a valid JSON object with this exact structure:
{
  "verdict": "A short verdict statement (e.g., 'Mostly True', 'False - Misleading Claims', 'Unverified')",
  "credibilityScore": <number from 0-100>,
  "summary": "A detailed 2-3 sentence explanation of your analysis and findings",
  "sources": ["List of relevant source references or fact-checking notes"],
  "claimsAnalyzed": ["Each individual claim you identified and verified"],
  "flaggedClaims": ["Claims that appear false, misleading, or unverifiable — be very specific about what is wrong with each claim"],
  "sourceOrigin": "The original source or publication that first reported this (e.g. Reuters, BBC, Social Media Post)",
  "yearTimestamp": "Year or approximate date when this news/event first appeared",
  "platformReach": "Estimated platform reach: Not Viral | Slightly Viral | Moderately Viral | Highly Viral | Mega Viral",
  "sentimentSummary": "Brief 1-sentence summary of overall public sentiment toward this news",
  "contentDNA": {
    "writingStyle": "AI-Generated | Human-Authored | Mixed/Edited | Uncertain — include brief reasoning",
    "timestampAudit": "When was this content first seen online vs when it went viral. E.g. 'First reported March 2024, went viral June 2025'",
    "contentDistortion": "None Detected | Minor Distortion | Moderate Distortion | Heavy Distortion | Complete Fabrication — describe how facts were twisted or manipulated",
    "viralPathway": "Track how this content spread across platforms, e.g. 'Originated on Twitter, picked up by Facebook groups, then amplified by WhatsApp forwards'"
  },
  "scientificScrutiny": {
    "applicable": true or false,
    "biologyFactCheck": "If the content involves health/biology/science claims, verify against known medical and scientific databases. Otherwise 'N/A'",
    "misleadingClaims": "Identify any pseudo-science, fake cures, anti-vax misinformation, or unproven health claims. Otherwise 'N/A'",
    "expertSummary": "Simplified plain-language truth of any complex scientific or biological claims made. Otherwise 'N/A'"
  },
  "motiveAnalysis": {
    "detectedMotive": "Informational | Political Agenda | Financial Gain | Clickbait/Engagement | Fear-Mongering | Propaganda | Satire/Parody | Public Awareness | Disinformation Campaign | Unknown",
    "confidenceLevel": 0-100 integer of how confident you are in the detected motive,
    "beneficiary": "Who benefits from this content being spread? e.g. 'Political party X', 'Supplement company', 'News outlet seeking clicks', 'Unknown'",
    "narrativeAlignment": "Which broader narrative or agenda does this content serve? e.g. 'Anti-establishment', 'Pro-industry', 'Health scare', 'Election influence', 'None detected'",
    "manipulationTechniques": ["List of persuasion/manipulation techniques used: e.g. 'Emotional appeal', 'Cherry-picked data', 'False authority', 'Bandwagon effect', 'Strawman argument', 'Out-of-context quotes'"],
    "targetAudience": "Who is this content designed to influence? e.g. 'General public', 'Health-conscious consumers', 'Voters in region X', 'Young social media users'"
  },
  "styleMatch": {
    "matchedPattern": "Breaking News Template | Opinion Piece | Scientific Paper | Press Release | Blog Post | Social Media Post | Satire | Promotional | Unknown",
    "languageTone": "Neutral/Objective | Sensational | Alarmist | Persuasive | Academic | Informal | Aggressive",
    "originalLanguage": "English | Translated (from X) | Multi-language | Unknown"
  }
}

Guidelines:
- Be objective and evidence-based using Google-Grade research standards
- Score 80-100: Strong evidence supports the claims
- Score 60-79: Partially true, some claims verified
- Score 40-59: Questionable, mixed evidence
- Score 0-39: Likely false or highly misleading
- Always identify specific claims within the content
- Flag any claims that cannot be verified or appear misleading — be very specific about WHY each flagged claim is problematic
- For Content DNA: analyze the writing style fingerprint, track when content first appeared vs when it went viral, detect fact manipulation/distortion, and trace the viral spread pathway
- For Scientific Scrutiny: only populate if the content involves health, biology, medicine, or scientific claims`,
          },
          {
            role: "user",
            content: `Please verify the following news content/claim:\n\n${content}`,
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4096,
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      let analysis;
      try {
        analysis = JSON.parse(responseText);
      } catch {
        analysis = {
          verdict: "Analysis Error",
          credibilityScore: 50,
          summary: "Unable to parse analysis results.",
          sources: [],
          claimsAnalyzed: [],
          flaggedClaims: [],
        };
      }

      const year = new Date().getFullYear();
      const seoKeyword = `Verified News ${year}`;

      const verification = await storage.createVerification({
        inputText: content,
        inputType,
        originSource,
        verdict: analysis.verdict || "Unknown",
        credibilityScore: Math.max(0, Math.min(100, analysis.credibilityScore || 50)),
        summary: analysis.summary || "No summary available.",
        sources: analysis.sources || [],
        claimsAnalyzed: analysis.claimsAnalyzed || [],
        flaggedClaims: analysis.flaggedClaims || [],
        seoKeyword,
        isBookmarked: false,
      });

      autoSyncToSheets({
        type: "news-verification",
        content: content.substring(0, 200),
        result: { verdict: analysis.verdict, credibilityScore: analysis.credibilityScore, motive: analysis.motiveAnalysis?.detectedMotive },
        timestamp: new Date().toISOString(),
      });

      res.json({
        ...verification,
        sourceOrigin: analysis.sourceOrigin || null,
        yearTimestamp: analysis.yearTimestamp || null,
        platformReach: analysis.platformReach || null,
        sentimentSummary: analysis.sentimentSummary || null,
        contentDNA: analysis.contentDNA || null,
        scientificScrutiny: analysis.scientificScrutiny || null,
        motiveAnalysis: analysis.motiveAnalysis || null,
        styleMatch: analysis.styleMatch || null,
      });
    } catch (error: any) {
      console.error("Verification error:", error);
      res.status(500).json({ message: "Failed to verify content. Please try again." });
    }
  });

  app.get("/api/verifications", async (_req, res) => {
    try {
      const results = await storage.getVerifications();
      res.json(results);
    } catch (error) {
      console.error("Error fetching verifications:", error);
      res.status(500).json({ message: "Failed to fetch verifications." });
    }
  });

  app.get("/api/verifications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const v = await storage.getVerification(id);
      if (!v) return res.status(404).json({ message: "Not found" });
      res.json(v);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch verification." });
    }
  });

  app.patch("/api/verifications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isBookmarked } = req.body;
      if (typeof isBookmarked !== "boolean") {
        return res.status(400).json({ message: "Only isBookmarked (boolean) can be updated." });
      }
      const v = await storage.updateVerification(id, { isBookmarked });
      if (!v) return res.status(404).json({ message: "Not found" });
      res.json(v);
    } catch (error) {
      res.status(500).json({ message: "Failed to update verification." });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats." });
    }
  });

  app.get("/api/admin/policy", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json({ policy: config.policyText, policyStatus: config.policyStatus, footerText: config.footerText });
  });

  app.post("/api/admin/policy", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { policy, policyStatus, footerText } = req.body;
    if (policy !== undefined && typeof policy === "string") config.policyText = policy;
    if (policyStatus !== undefined) config.policyStatus = policyStatus;
    if (footerText !== undefined) config.footerText = footerText;
    persistConfig();
    res.json({ success: true, message: "Blueprint Updated", features: "Settled" });
  });

  app.get("/api/policy-public", (_req, res) => {
    res.json({ policy: config.policyText, policyStatus: config.policyStatus, footerText: config.footerText });
  });

  app.get("/api/admin/engine", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(config.engineSettings);
  });

  app.post("/api/admin/engine", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { activeEngine } = req.body;
    if (typeof activeEngine === "string") {
      config.engineSettings.activeEngine = activeEngine;
    }
    persistConfig();
    res.json({ success: true });
  });

  app.get("/api/admin/monetization", (req, res) => {
    res.json(config.monetizationSettings);
  });

  app.post("/api/admin/monetization", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { paywallEnabled, basicPrice, starterPrice, purePrice, elitePrice } = req.body;
    if (typeof paywallEnabled === "boolean") config.monetizationSettings.paywallEnabled = paywallEnabled;
    if (typeof basicPrice === "string") config.monetizationSettings.basicPrice = basicPrice;
    if (typeof starterPrice === "string") config.monetizationSettings.starterPrice = starterPrice;
    if (typeof purePrice === "string") config.monetizationSettings.purePrice = purePrice;
    if (typeof elitePrice === "string") config.monetizationSettings.elitePrice = elitePrice;
    persistConfig();
    res.json({ success: true });
  });

  app.delete("/api/verifications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVerification(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete verification." });
    }
  });

  app.get("/api/verified-tools", async (_req, res) => {
    try {
      const tools = await storage.getVerifiedTools();
      const limited = tools.slice(0, config.promotionConfig.visibleToolLimit);
      res.json(limited);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch verified tools." });
    }
  });

  app.get("/api/verified-tools/all", async (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const tools = await storage.getVerifiedTools();
      res.json(tools);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch verified tools." });
    }
  });

  app.post("/api/verified-tools", async (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const { name, link } = req.body;
      if (!name || !link) {
        return res.status(400).json({ message: "Name and link are required." });
      }
      const tool = await storage.createVerifiedTool({ name, link, clicks: 0, status: "Verified" });
      res.json(tool);
    } catch (error) {
      res.status(500).json({ message: "Failed to create verified tool." });
    }
  });

  app.delete("/api/verified-tools/:id", async (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVerifiedTool(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete verified tool." });
    }
  });

  app.get("/api/track-click/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tool = await storage.incrementToolClicks(id);
      if (!tool) return res.status(404).json({ message: "Tool not found" });
      res.json({ redirect: tool.link });
    } catch (error) {
      res.status(500).json({ message: "Failed to track click." });
    }
  });

  app.get("/api/admin/promotion", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(config.promotionConfig);
  });

  app.post("/api/admin/promotion", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { visibleToolLimit, ppcRate } = req.body;
    if (typeof visibleToolLimit === "number") config.promotionConfig.visibleToolLimit = visibleToolLimit;
    if (typeof ppcRate === "number") config.promotionConfig.ppcRate = ppcRate;
    persistConfig();
    res.json({ success: true });
  });

  app.get("/api/admin/payment-config", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(config.paymentConfig);
  });

  app.post("/api/admin/payment-config", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { currency, stripeKey, activeGateways, webhookUrl, paymentSuccessAction, currencyLock } = req.body;
    if (typeof currency === "string") config.paymentConfig.currency = currency;
    if (typeof stripeKey === "string") config.paymentConfig.stripeKey = stripeKey;
    if (Array.isArray(activeGateways)) config.paymentConfig.activeGateways = activeGateways;
    if (typeof webhookUrl === "string") config.paymentConfig.webhookUrl = webhookUrl;
    if (typeof paymentSuccessAction === "string") config.paymentConfig.paymentSuccessAction = paymentSuccessAction;
    if (typeof currencyLock === "boolean") config.paymentConfig.currencyLock = currencyLock;
    persistConfig();
    res.json({ success: true });
  });

  app.post("/api/initiate-payment", (req, res) => {
    const { plan, email } = req.body;
    if (!plan) {
      return res.status(400).json({ message: "Plan is required" });
    }
    const validPlans = ["basic", "starter", "pure", "elite"];
    if (!validPlans.includes(plan.toLowerCase())) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const priceMap: Record<string, string> = {
      basic: config.monetizationSettings.basicPrice,
      starter: config.monetizationSettings.starterPrice,
      pure: config.monetizationSettings.purePrice,
      elite: config.monetizationSettings.elitePrice,
    };
    const price = parseFloat(priceMap[plan.toLowerCase()] || "0");
    const currency = config.paymentConfig.currency || "USD";

    if (plan.toLowerCase() !== "basic" && price <= 0) {
      return res.status(400).json({ message: "Payment floor active — plan price must be configured by admin before checkout." });
    }

    autoSyncToSheets({
      type: "payment-initiated",
      content: `Plan: ${plan.toUpperCase()} | Email: ${email || "anonymous"}`,
      result: { plan: plan.toLowerCase(), price, currency },
      timestamp: new Date().toISOString(),
    });

    res.json({
      status: "redirect",
      plan: plan.toLowerCase(),
      price,
      currency,
      checkout_url: `https://checkout.nexa-11.ai/pay/${plan.toLowerCase()}?amount=${price}&currency=${currency}`,
      sop: "SOP_ACTIVE",
      gateways: config.paymentConfig.activeGateways,
    });
  });

  app.post("/api/upgrade-user", (req, res) => {
    const { email, name, plan } = req.body;
    if (!email || !plan) {
      return res.status(400).json({ message: "Email and plan are required." });
    }
    const tierMap: Record<string, { tier: string; accessLevel: number }> = {
      basic: { tier: "FREE", accessLevel: 1 },
      starter: { tier: "STARTER", accessLevel: 3 },
      pure: { tier: "PURE", accessLevel: 7 },
      elite: { tier: "ELITE", accessLevel: 10 },
    };
    const tierInfo = tierMap[plan.toLowerCase()] || { tier: "STARTER", accessLevel: 3 };
    config.userRegistry[email.toLowerCase()] = {
      status: "PAID",
      tier: tierInfo.tier,
      plan: plan.toLowerCase(),
      accessLevel: tierInfo.accessLevel,
      joinedDate: new Date().toISOString().split("T")[0],
    };
    persistConfig();
    res.json({
      message: `User permanently upgraded to ${tierInfo.tier} status.`,
      user: config.userRegistry[email.toLowerCase()],
    });
  });

  app.get("/api/user-status/:email", (req, res) => {
    const email = req.params.email.toLowerCase();
    const user = config.userRegistry[email];
    if (!user) {
      return res.json({ status: "FREE", tier: "NONE", plan: "free", accessLevel: 0 });
    }
    res.json(user);
  });

  app.get("/api/admin/users", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const users = Object.entries(config.userRegistry).map(([email, data]) => ({
      email,
      ...data,
    }));
    res.json(users);
  });

  app.delete("/api/admin/users/:email", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const email = req.params.email.toLowerCase();
    if (!config.userRegistry[email]) {
      return res.status(404).json({ message: "User not found." });
    }
    delete config.userRegistry[email];
    persistConfig();
    res.json({ message: "User removed successfully." });
  });

  app.post("/api/audit-master", async (req, res) => {
    const { content, type } = req.body;
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Content is required for audit." });
    }

    const auditType = type === "tool" ? "tool" : "news";

    if (auditType === "tool" && !config.systemStatus.tool_auditor) {
      return res.status(503).json({ message: "Tool Auditor is currently offline by Admin." });
    }
    if (auditType === "news" && !config.systemStatus.news_engine) {
      return res.status(503).json({ message: "News Engine is currently offline by Admin." });
    }

    try {
      const systemPrompt = auditType === "tool"
        ? `You are a professional cybersecurity and software auditor AI for NeXA 11 AI Global Verification Network. Perform a high-level intelligence audit on the given tool/software. Respond with valid JSON:
{
  "toolName": "Name of tool",
  "safetyRating": "Use ONLY: AAA+++ | AA+ | A | B | D | F",
  "legitimacy": "Official Software | Verified Publisher | Unknown Publisher | Suspicious | Malicious",
  "userTrust": "Very High | High | Moderate | Low | Very Low",
  "riskLevel": "Minimal | Low | Medium | High | Critical",
  "globalAuthorityScore": 0-100,
  "details": "Corporate-level audit summary (no personal names)",
  "recommendations": ["list"],
  "flags": ["list"],
  "trustedSourceMatch": true/false,
  "resultType": "High-Level Intelligence Audit"
}`
        : `You are a professional fact-checking AI for NeXA 11 AI Global Verification Network. Perform a high-level intelligence audit on the given news/claim. Respond with valid JSON:
{
  "verdict": "Credible | Mostly True | Questionable | Likely False | False",
  "credibilityScore": 0-100,
  "globalAuthorityScore": 0-100,
  "summary": "Corporate-level audit summary (no personal names)",
  "claimsAnalyzed": ["list"],
  "flaggedClaims": ["list"],
  "sources": ["list of reference URLs"],
  "trustedSourceMatch": true/false,
  "resultType": "High-Level Intelligence Audit"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Audit the following:\n\n${content.trim()}` },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");

      res.json({
        status: "Success",
        auditType,
        resultType: "High-Level Intelligence Audit",
        data: result,
        legal: "Non-Binding Automated Result. NeXA 11 AI holds zero liability.",
        issuedBy: "NeXA 11 AI - Global Verification Network",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Audit Master error:", error);
      res.status(500).json({
        status: "Error",
        message: "Audit engine encountered an error. Please try again.",
        legal: "Non-Binding Automated Result. NeXA 11 AI holds zero liability.",
      });
    }
  });

  app.post("/api/full-audit-report", async (req, res) => {
    const { content, type } = req.body;
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Content is required for full audit." });
    }

    const auditType = type === "tool" ? "tool" : "news";
    if (auditType === "tool" && !config.systemStatus.tool_auditor) {
      return res.status(503).json({ message: "Tool Auditor is currently offline by Admin." });
    }
    if (auditType === "news" && !config.systemStatus.news_engine) {
      return res.status(503).json({ message: "News Engine is currently offline by Admin." });
    }

    try {
      const systemPrompt = auditType === "tool"
        ? `You are a deep intelligence auditor AI for NeXA 11 AI Global Verification Network. Perform an exhaustive full audit report on the given tool/software by cross-referencing all known data sources, databases, and online intelligence.

You MUST respond with a valid JSON object with this EXACT structure:
{
  "toolName": "The name of the tool",
  "safetyRating": "Use ONLY these levels: AAA+++ (highest, industry-leading), AA+ (very safe), A (safe), B (moderate caution), D (danger), F (fake/malicious)",
  "legitimacy": "Official Software | Verified Publisher | Unknown Publisher | Suspicious | Malicious",
  "userTrust": "Very High | High | Moderate | Low | Very Low",
  "riskLevel": "Minimal | Low | Medium | High | Critical",
  "globalAuthorityScore": 0-100,
  "details": "Comprehensive 3-5 sentence deep analysis",
  "recommendations": ["list of 3-5 actionable recommendations"],
  "flags": ["list of red flags found, empty if none"],
  "statusMarks": {
    "domainVerified": true or false,
    "sslCertificate": true or false,
    "publisherKnown": true or false,
    "dataPrivacy": true or false,
    "noMalware": true or false,
    "activeSupport": true or false,
    "regulatoryCompliance": true or false
  },
  "newsChannels": ["List of 3-5 major news outlets or tech publications that have covered or mentioned this tool, e.g. BBC, TechCrunch, Reuters, Wired, The Verge"],
  "toolInfo": {
    "originCountry": "Country or countries where the tool is headquartered",
    "totalDownloads": "Estimated total downloads or users e.g. 500k+, 10M+, 1B+",
    "category": "Category like AI Assistant, Productivity, Security, Social Media, etc.",
    "relatedTools": ["List of 3-5 similar or related tools/alternatives"],
    "foundedYear": "Year the tool was launched or founded",
    "parentCompany": "Parent company or developer organization name"
  },
  "liveStatus": "Online & Active | Online with Issues | Partially Offline | Offline | Unknown",
  "historicalYear": "Year the tool was first publicly available or founded",
  "originalChannel": "Primary original distribution channel (e.g. Official Website, App Store, GitHub, Chrome Web Store)",
  "viralSpreadAnalytics": "Brief assessment of how widely this tool has spread: Not Viral | Slightly Viral | Moderately Viral | Highly Viral | Mega Viral",
  "sentimentSummary": "1-2 sentence summary of overall public and expert sentiment toward this tool",
  "privacyAudit": "Privacy assessment: Excellent | Good | Fair | Poor | Critical — with brief explanation of data practices",
  "trafficMetrics": "Estimated monthly traffic/active users e.g. 100M+ visits/month, 50M+ active users",
  "pricingPlans": "Real-time pricing info: Free | Freemium ($X/mo Pro) | Paid ($X/mo) | Enterprise (custom) — list actual known tiers if available",
  "marketWorth": "Estimated market valuation or company worth e.g. $1B+, $500M, $10M, Unknown, Pre-revenue",
  "saleStatus": "Active (independently operating) | Acquired (by X) | Merged | Shutdown | IPO | Pre-launch",
  "isWebTool": true or false,
  "playStoreStatus": "Available (X+ downloads) | Available on App Store Only | Not Available | Removed | Web Only",
  "ageYears": "Number of years since launch as integer e.g. 5",
  "userReach": "Global user/reach analytics e.g. 500M+ global users, 10M+ monthly active, Regional (US/EU only)",
  "resultAccuracy": "Fact-checked accuracy/reliability score 0-100 based on known performance benchmarks and user reviews"
}`
        : `You are a deep intelligence fact-checker AI for NeXA 11 AI Global Verification Network. Perform an exhaustive full audit report on the given news content or claim by cross-referencing all known data sources, databases, and online intelligence.

You MUST respond with a valid JSON object with this EXACT structure:
{
  "verdict": "Credible | Mostly True | Questionable | Likely False | False",
  "credibilityScore": 0-100,
  "globalAuthorityScore": 0-100,
  "summary": "Comprehensive 3-5 sentence deep analysis",
  "claimsAnalyzed": ["Each individual claim identified and verified"],
  "flaggedClaims": ["Claims that appear false or misleading"],
  "sources": ["List of relevant source references"],
  "statusMarks": {
    "sourceVerified": true or false,
    "factChecked": true or false,
    "multipleSourcesConfirm": true or false,
    "noManipulation": true or false,
    "dateAccurate": true or false,
    "authorCredible": true or false,
    "noSatireIndicators": true or false
  },
  "newsChannels": ["List of 3-5 major news outlets that have reported on this topic, e.g. BBC, Al-Jazeera, Reuters, CNN, AP News"],
  "contentInfo": {
    "originCountry": "Country of origin for the news source",
    "category": "Category like Politics, Science, Technology, Health, Business, etc.",
    "firstReported": "Approximate date or timeframe when this was first reported",
    "relatedStories": ["List of 3-5 related stories or events"],
    "viralityLevel": "Not Viral | Slightly Viral | Moderately Viral | Highly Viral | Mega Viral"
  },
  "liveStatus": "Active Coverage | Developing Story | Resolved | Archived | Unknown",
  "historicalYear": "Year this news/claim first appeared or the events occurred",
  "originalChannel": "The first known publication or channel that reported this (e.g. Reuters, Twitter, Government Press Release)",
  "viralSpreadAnalytics": "Assessment of viral spread: Not Viral | Slightly Viral | Moderately Viral | Highly Viral | Mega Viral, with brief note on spread pattern",
  "sentimentSummary": "1-2 sentence summary of overall public sentiment and media reaction to this news"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Perform a full deep intelligence audit on the following:\n\n${content.trim()}` },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4096,
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");

      const auditHistory = {
        type: auditType,
        content: content.trim(),
        result,
        timestamp: new Date().toISOString(),
        issuedBy: "NeXA 11 AI - Global Verification Network",
      };

      if (!config.auditHistory) {
        config.auditHistory = [];
      }
      config.auditHistory.push(auditHistory);
      if (config.auditHistory.length > 50) {
        config.auditHistory = config.auditHistory.slice(-50);
      }
      persistConfig();

      res.json({
        status: "Success",
        auditType,
        resultType: "Full Deep Intelligence Audit",
        data: result,
        legal: "Non-Binding Automated Result. NeXA 11 AI holds zero liability.",
        issuedBy: "NeXA 11 AI - Global Verification Network",
        founder: config.teamConfig.founder.name,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Full Audit Report error:", error);
      res.status(500).json({
        status: "Error",
        message: "Full audit engine encountered an error. Please try again.",
        legal: "Non-Binding Automated Result. NeXA 11 AI holds zero liability.",
      });
    }
  });

  app.post("/api/audit-intel", async (req, res) => {
    const { content, type, email, mediaType } = req.body;
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Content is required for intelligence audit." });
    }

    const auditType = type === "tool" ? "tool" : type === "media" ? "media" : "news";

    if (auditType === "tool" && !config.systemStatus.tool_auditor) {
      return res.status(503).json({ message: "Tool Auditor is currently offline by Admin." });
    }
    if (auditType === "news" && !config.systemStatus.news_engine) {
      return res.status(503).json({ message: "News Engine is currently offline by Admin." });
    }
    if (auditType === "media" && !config.systemStatus.media_intelligence) {
      return res.status(503).json({ message: "Media Intelligence is currently offline by Admin." });
    }

    let userAccess = { status: "FREE", tier: "NONE", plan: "free", accessLevel: 0 };
    if (email) {
      const userRecord = config.userRegistry[email.toLowerCase()];
      if (userRecord) {
        userAccess = userRecord;
      }
    }

    const accessMap: Record<string, { level: number; plan: string }> = {
      news: { level: 1, plan: "starter" },
      tool: { level: 3, plan: "starter" },
      media: { level: 7, plan: "pure" },
    };
    const required = accessMap[auditType] || { level: 1, plan: "starter" };

    if (config.monetizationSettings.paywallEnabled && userAccess.accessLevel < required.level) {
      return res.status(403).json({
        message: `Your current plan (${userAccess.tier || "FREE"}) does not include ${auditType === "media" ? "Media Intelligence" : auditType === "tool" ? "Tool Auditor" : "News Engine"} access. Please upgrade to ${required.plan.toUpperCase()} or higher.`,
        requiredPlan: required.plan,
        currentTier: userAccess.tier,
        locked: true,
      });
    }

    try {
      let systemPrompt = "";
      if (auditType === "tool") {
        systemPrompt = `You are a professional cybersecurity and software intelligence AI for NeXA 11 AI Global Verification Network. Perform a unified deep intelligence audit. Respond with valid JSON:
{
  "toolName": "Name of tool",
  "safetyRating": "AAA+++ | AA+ | A | B | D | F",
  "legitimacy": "Official Software | Verified Publisher | Unknown Publisher | Suspicious | Malicious",
  "userTrust": "Very High | High | Moderate | Low | Very Low",
  "riskLevel": "Minimal | Low | Medium | High | Critical",
  "globalAuthorityScore": 0-100,
  "details": "Corporate-level audit summary",
  "recommendations": ["list"],
  "flags": ["list"],
  "originCountry": "Country of origin",
  "originYear": "Year founded or launched",
  "marketWorth": "Estimated market valuation e.g. $1B+, $500M, Unknown",
  "pricingPlans": "Free | Freemium ($X/mo) | Paid ($X/mo) | Enterprise",
  "trafficMetrics": "Estimated monthly users or visits",
  "saleStatus": "Active | Acquired | Merged | Shutdown | IPO",
  "isWebTool": true or false,
  "playStoreStatus": "Available | Not Available | Web Only",
  "ageYears": number,
  "userReach": "Global reach analytics",
  "resultAccuracy": 0-100,
  "privacyAudit": "Excellent | Good | Fair | Poor | Critical",
  "liveStatus": "Online & Active | Online with Issues | Offline | Unknown",
  "sentimentSummary": "Public sentiment summary"
}`;
      } else if (auditType === "media") {
        const mType = mediaType === "video" ? "video" : "image";
        systemPrompt = `You are a professional media forensics AI for NeXA 11 AI Global Verification Network. Perform a Media Intelligence v7 forensic scan on the given ${mType}. Respond with valid JSON:
{
  "mediaName": "Brief title of the media",
  "mediaType": "${mType}",
  "forensicScore": 0-100,
  "verdict": "AUTHENTIC | LIKELY_AUTHENTIC | INCONCLUSIVE | LIKELY_MANIPULATED | MANIPULATED | SYNTHETIC",
  "aiDetection": {
    "isAiGenerated": true or false,
    "confidence": 0-100,
    "model": "Detected AI model or N/A",
    "method": "Deep Neural Scan details"
  },
  "tamperCheck": {
    "isTampered": true or false,
    "confidence": 0-100,
    "regions": ["suspicious regions"],
    "method": "Pixel Inconsistency Mapping details"
  },
  "chatVerification": {
    "isAuthenticChat": true or false or null,
    "fontIntegrity": "PASS | FAIL | N/A",
    "uiIntegrity": "PASS | FAIL | N/A",
    "platform": "Detected platform or N/A",
    "method": "Font & UI Integrity Check details"
  },
  "deepfakeDetection": {
    "isDeepfake": true or false,
    "confidence": 0-100,
    "biometricFlags": ["anomalies"],
    "method": "Frame-by-Frame Biometric Scan details"
  },
  "lipSyncAudit": {
    "status": "PASS | FAIL | N/A",
    "syncScore": 0-100 or null,
    "anomalies": ["lip sync issues"]
  },
  "metadata": {
    "extractionStatus": "Complete | Partial | Not Available",
    "originalSource": "Detected source",
    "creationDate": "Estimated date or Unknown",
    "modifications": ["detected edits"],
    "geoTag": "Location or Not Available",
    "device": "Capture device or Unknown"
  },
  "riskAssessment": "SAFE | LOW_RISK | MEDIUM_RISK | HIGH_RISK | CRITICAL",
  "details": "Forensic summary",
  "flags": ["concerns"],
  "recommendations": ["recommendations"]
}`;
      } else {
        systemPrompt = `You are a professional fact-checking intelligence AI for NeXA 11 AI Global Verification Network. Perform a unified deep intelligence audit. Respond with valid JSON:
{
  "verdict": "Credible | Mostly True | Questionable | Likely False | False",
  "credibilityScore": 0-100,
  "globalAuthorityScore": 0-100,
  "summary": "Corporate-level audit summary",
  "claimsAnalyzed": ["claims"],
  "flaggedClaims": ["flagged claims"],
  "sources": ["reference URLs"],
  "originCountry": "Country of origin of the news source",
  "originYear": "Year the news/event first appeared",
  "platformReach": "Estimated reach of the original platform",
  "sentimentSummary": "Public sentiment summary",
  "viralSpreadAnalytics": "Not Viral | Slightly Viral | Moderately Viral | Highly Viral | Mega Viral",
  "newsChannels": ["Major outlets covering this"],
  "liveStatus": "Active Coverage | Developing Story | Resolved | Archived | Unknown",
  "details": "Detailed analysis",
  "flags": ["red flags"],
  "recommendations": ["recommendations"]
}`;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Perform a full intelligence audit on the following:\n\n${content.trim()}` },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 3072,
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");

      const auditRecord = {
        type: auditType,
        content: content.trim().substring(0, 200),
        result,
        userEmail: email || "anonymous",
        userTier: userAccess.tier,
        timestamp: new Date().toISOString(),
      };

      if (!config.auditHistory) {
        config.auditHistory = [];
      }
      config.auditHistory.push(auditRecord);
      if (config.auditHistory.length > 100) {
        config.auditHistory = config.auditHistory.slice(-100);
      }
      persistConfig();

      let sheetsSync = { synced: false, message: "Google Sheets integration is OFF" };
      if (config.googleSheetsIntegration) {
        sheetsSync = {
          synced: true,
          message: "Audit data synced to Google Sheets",
        };
      }

      res.json({
        status: "Success",
        auditType,
        resultType: "NeXA 11 AI Master Intelligence Audit",
        data: result,
        userAccess: {
          tier: userAccess.tier,
          plan: userAccess.plan,
          accessLevel: userAccess.accessLevel,
        },
        sheetsSync,
        legal: "Non-Binding Automated Result. NeXA 11 AI holds zero liability.",
        issuedBy: "NeXA 11 AI - Global Verification Network",
        founder: config.teamConfig.founder.name,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Audit Intel error:", error);
      res.status(500).json({
        status: "Error",
        message: "Intelligence audit engine encountered an error. Please try again.",
        legal: "Non-Binding Automated Result. NeXA 11 AI holds zero liability.",
      });
    }
  });

  app.post("/api/pay-per-report", (req, res) => {
    const { email } = req.body;
    const currency = config.paymentConfig.currency || "USD";
    const price = 4.99;

    autoSyncToSheets({
      type: "pay-per-report",
      content: `Single Report | Email: ${email || "anonymous"}`,
      result: { price, currency },
      timestamp: new Date().toISOString(),
    });

    res.json({
      checkout_url: `https://checkout.nexa-11.ai/pay/single-report?amount=${price}&currency=${currency}`,
      status: "success",
      price,
      currency,
      sop: "SOP_ACTIVE",
      gateways: config.paymentConfig.activeGateways,
    });
  });

  app.post("/api/admin/viral-post", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { content } = req.body;
    res.json({ status: "Posted to Social Media Successfully", content: content || "" });
  });

  app.post("/api/submit-ticket", (req, res) => {
    const { name, phone, subject, link, message } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required." });
    }
    const newEntry: Inquiry = {
      id: inquiries.length + 1,
      name: name || "",
      phone: phone || "",
      subject: subject || "support",
      link: link || "",
      message: message || "",
      time: new Date().toISOString().replace("T", " ").substring(0, 16),
    };
    inquiries.push(newEntry);
    res.json({ success: true, message: "Thank you! NeXA 11 AI team will contact you soon." });
  });

  app.get("/api/admin/inquiries", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(inquiries);
  });

  app.delete("/api/admin/inquiries/:id", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const id = parseInt(req.params.id);
    const idx = inquiries.findIndex((inq) => inq.id === id);
    if (idx === -1) return res.status(404).json({ message: "Not found" });
    inquiries.splice(idx, 1);
    res.status(204).send();
  });

  app.get("/api/founder-socials", (_req, res) => {
    res.json(config.teamConfig.founder.socials);
  });

  app.get("/api/team-config", (_req, res) => {
    res.json(config.teamConfig);
  });

  app.post("/api/admin/founder-socials", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { linkedin, youtube, facebook } = req.body;
    if (linkedin !== undefined) config.teamConfig.founder.socials.linkedin = linkedin;
    if (youtube !== undefined) config.teamConfig.founder.socials.youtube = youtube;
    if (facebook !== undefined) config.teamConfig.founder.socials.facebook = facebook;
    persistConfig();
    res.json({ success: true, ...config.teamConfig.founder.socials });
  });

  app.post("/api/admin/update-team", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { name, role, visibility, image } = req.body;
    if (name !== undefined) config.teamConfig.founder.name = name;
    if (role !== undefined) config.teamConfig.founder.role = role;
    if (visibility !== undefined) config.teamConfig.showSection = visibility;
    if (image !== undefined) config.teamConfig.founder.image = image;
    persistConfig();
    res.json({ status: "Team Floor Updated", ...config.teamConfig });
  });

  app.get("/api/partner-settings", (_req, res) => {
    res.json(config.partnerSection);
  });

  app.post("/api/admin/partner-settings", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { theme, scrollingSpeed, showSection } = req.body;
    if (theme !== undefined) config.partnerSection.theme = theme;
    if (scrollingSpeed !== undefined) config.partnerSection.scrollingSpeed = Number(scrollingSpeed);
    if (showSection !== undefined) config.partnerSection.showSection = showSection;
    persistConfig();
    res.json({ status: "Success", message: "Partner settings locked & saved.", ...config.partnerSection });
  });

  app.get("/api/stats", (_req, res) => {
    res.json(config.dynamicStats);
  });

  app.post("/api/admin/stats", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { showStats, newsCount, toolsCount, certType } = req.body;
    if (showStats !== undefined) config.dynamicStats.showStats = showStats;
    if (newsCount !== undefined) config.dynamicStats.newsCount = newsCount;
    if (toolsCount !== undefined) config.dynamicStats.toolsCount = toolsCount;
    if (certType !== undefined) config.dynamicStats.certType = certType;
    persistConfig();
    res.json({ status: "Stats & Visibility Updated", ...config.dynamicStats });
  });

  app.get("/api/generate-certificate/:id", (req, res) => {
    const id = req.params.id;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    res.json({
      title: config.dynamicStats.certType,
      serial: `NEXA-TRUTH-${id}`,
      issuedTo: "Verified Asset",
      verdict: "AUTHENTIC / SECURE",
      date: dateStr,
      timestamp: now.toISOString().replace("T", " ").substring(0, 19),
      founder: config.teamConfig.founder.name,
      verifiedBy: "NeXA 11 AI - Global Verification Network",
      legalStatus: "Digitally Verified - No Liability Accepted",
      liability: "Zero-Liability for misuse or viral spread.",
      isDigitalOnly: true,
      disclaimer: "This audit is automated. NeXA 11 AI is not liable for data accuracy from 3rd party sources.",
    });
  });

  app.get("/api/get-audit-result/:id", async (req, res) => {
    const id = req.params.id;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const timestamp = now.toISOString().replace("T", " ").substring(0, 19);

    try {
      const numId = parseInt(id);
      const verification = !isNaN(numId) ? await storage.getVerification(numId) : null;

      res.json({
        id: `NEXA-RES-${id}`,
        title: "NeXA Intelligence Report",
        summary: verification
          ? `${verification.verdict} — Credibility Score: ${verification.credibilityScore}/100`
          : "High-Level Intelligence Audit",
        verdict: verification?.verdict || "Pending Analysis",
        credibilityScore: verification?.credibilityScore || null,
        content: verification?.inputText || null,
        flaggedClaims: verification?.flaggedClaims || [],
        sourceReferences: verification?.sources || [],
        date: dateStr,
        timestamp,
        issuedBy: "NeXA 11 AI - Global Verification Network",
        founder: config.teamConfig.founder.name,
        legal: "Non-Binding Audit Result",
        disclaimer: "This result is for informational purposes only. NeXA 11 AI assumes no legal liability.",
        liability: "Zero-Liability for misuse or viral spread.",
        isDigitalOnly: true,
      });
    } catch {
      res.json({
        id: `NEXA-RES-${id}`,
        title: "NeXA Intelligence Report",
        summary: "High-Level Intelligence Audit",
        date: dateStr,
        timestamp,
        issuedBy: "NeXA 11 AI - Global Verification Network",
        founder: config.teamConfig.founder.name,
        legal: "Non-Binding Audit Result",
        disclaimer: "This result is for informational purposes only. NeXA 11 AI assumes no legal liability.",
        liability: "Zero-Liability for misuse or viral spread.",
        isDigitalOnly: true,
      });
    }
  });

  const OFFICIAL_LOGOS: Record<string, string> = {
    "google": "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
    "openai": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/512px-OpenAI_Logo.svg.png",
    "microsoft": "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31",
    "meta": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/512px-Meta_Platforms_Inc._logo.svg.png",
    "apple": "https://www.apple.com/ac/globalnav/7/en_US/images/be15095f-5a20-57d0-ad14-cf4c638e223a/globalnav_apple_image__b5er5ngrzxqq_large.svg",
    "amazon": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/512px-Amazon_logo.svg.png",
    "nvidia": "https://upload.wikimedia.org/wikipedia/sco/thumb/2/21/Nvidia_logo.svg/512px-Nvidia_logo.svg.png",
    "tesla": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Tesla_Motors.svg/512px-Tesla_Motors.svg.png",
    "ibm": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/IBM_logo.svg/512px-IBM_logo.svg.png",
    "intel": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Intel_logo_%282006-2020%29.svg/512px-Intel_logo_%282006-2020%29.svg.png",
    "samsung": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/512px-Samsung_Logo.svg.png",
    "adobe": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Adobe_Corporate_Logo.svg/512px-Adobe_Corporate_Logo.svg.png",
    "spotify": "https://storage.googleapis.com/pr-newsroom-wp/1/2023/05/Spotify_Primary_Logo_RGB_Green.png",
    "stripe": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/512px-Stripe_Logo%2C_revised_2016.svg.png",
    "slack": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/512px-Slack_icon_2019.svg.png",
    "zoom": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Zoom_Logo_2022.svg/512px-Zoom_Logo_2022.svg.png",
    "tiktok": "https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/TikTok_logo.svg/512px-TikTok_logo.svg.png",
    "twitter": "https://abs.twimg.com/responsive-web/client-web/icon-ios.77d25eba.png",
    "linkedin": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/480px-LinkedIn_logo_initials.png",
    "youtube": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/512px-YouTube_full-color_icon_%282017%29.svg.png",
    "github": "https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png",
    "chatgpt": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/512px-ChatGPT_logo.svg.png",
    "gemini": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Google_Gemini_logo.svg/512px-Google_Gemini_logo.svg.png",
    "anthropic": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Anthropic_logo.svg/512px-Anthropic_logo.svg.png",
    "claude": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Anthropic_logo.svg/512px-Anthropic_logo.svg.png",
    "deepmind": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/DeepMind_new_logo.svg/512px-DeepMind_new_logo.svg.png",
  };

  app.get("/api/sync-official-logos", async (req: any, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const tools = await storage.getVerifiedTools();
      let synced = 0;
      for (const tool of tools) {
        const nameLower = tool.name.toLowerCase().trim();
        let matchedUrl: string | null = null;
        for (const [key, url] of Object.entries(OFFICIAL_LOGOS)) {
          if (nameLower.includes(key) || key.includes(nameLower)) {
            matchedUrl = url;
            break;
          }
        }
        if (matchedUrl && matchedUrl !== tool.logoUrl) {
          await storage.updateToolLogo(tool.id, matchedUrl);
          synced++;
        }
      }
      res.json({ status: "Official Logos Synced", synced, total: tools.length });
    } catch (err) {
      res.status(500).json({ error: "Failed to sync logos" });
    }
  });

  function getRatingFromScore(score: number): string {
    if (score >= 90) return "AAA+++";
    if (score >= 75) return "AA+";
    if (score >= 60) return "A";
    if (score >= 40) return "B";
    if (score >= 20) return "D";
    return "F";
  }

  function getRatingColor(rating: string): string {
    const r = rating.toUpperCase();
    if (r.includes("AAA")) return "#16A34A";
    if (r.includes("AA")) return "#22C55E";
    if (r.startsWith("A")) return "#65A30D";
    if (r.startsWith("B")) return "#D97706";
    if (r.startsWith("D")) return "#EA580C";
    return "#DC2626";
  }

  function getRatingLabel(rating: string): string {
    const r = rating.toUpperCase();
    if (r.includes("AAA") || r.includes("AA") || r.startsWith("A")) return "VERIFIED";
    if (r.startsWith("B")) return "CAUTION";
    if (r.startsWith("D")) return "DANGER";
    return "FAKE";
  }

  app.get("/api/generate-pdf-result/:id", async (req, res) => {
    const id = req.params.id;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const timestamp = now.toISOString().replace("T", " ").substring(0, 19);

    try {
      const numId = parseInt(id);
      const verification = !isNaN(numId) ? await storage.getVerification(numId) : null;

      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `NeXA Intelligence Report - ${id}`,
          Author: "NeXA 11 AI - Global Verification Network",
          Creator: "NeXA Truth Engine",
        },
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="NeXA_Report_${id}.pdf"`);
      doc.pipe(res);

      const pageWidth = doc.page.width - 100;
      const pw = doc.page.width;

      doc.rect(0, 0, pw, 130).fill("#0A0E1A");
      doc.rect(0, 126, pw, 4).fill("#F5C518");
      doc.fontSize(6).font("Helvetica").fillColor("#475569")
        .text("AUTHENTICATED BY NeXA 11 AI", pw - 200, 112);

      doc.fontSize(26).font("Helvetica-Bold").fillColor("#F5C518")
        .text("NeXA", 50, 30, { continued: true })
        .fillColor("#FFFFFF")
        .text(" TRUTH ENGINE");

      doc.fontSize(9).font("Helvetica").fillColor("#94A3B8")
        .text("Global Verification Network  |  AI-Powered Intelligence", 50, 65);

      doc.fontSize(7).fillColor("#64748B")
        .text(`Report ID: NEXA-RES-${id}  |  ${dateStr}  |  ${timestamp}`, 50, 85);

      const badgeX = pw - 190;
      doc.roundedRect(badgeX, 30, 140, 30, 6).fill("#1D4ED8");
      doc.roundedRect(badgeX, 60, 140, 20, 4).fill("#B8860B");
      doc.fontSize(11).font("Helvetica-Bold").fillColor("#FFFFFF")
        .text("VERIFIED", badgeX, 36, { width: 140, align: "center" });
      doc.fontSize(7).font("Helvetica-Bold").fillColor("#FFFFFF")
        .text("Official NeXA Badge", badgeX, 63, { width: 140, align: "center" });

      doc.fontSize(7).fillColor("#475569")
        .text("Anonymous AI-Generated Report  |  No Human Signature", 50, 100);

      let yPos = 150;

      doc.fontSize(14).font("Helvetica-Bold").fillColor("#1E293B")
        .text("Intelligence Report", 50, yPos);
      yPos += 25;
      doc.rect(50, yPos, pageWidth, 2).fill("#F5C518");
      yPos += 15;

      if (verification) {
        const score = verification.credibilityScore;
        const rating = getRatingFromScore(score);
        const ratingColor = getRatingColor(rating);
        const ratingLabel = getRatingLabel(rating);

        doc.rect(50, yPos, pageWidth, 95).fill("#F8FAFC");
        doc.roundedRect(50, yPos, pageWidth, 95, 6).stroke("#E2E8F0");

        doc.fontSize(9).font("Helvetica-Bold").fillColor("#334155")
          .text("Verdict:", 65, yPos + 10);
        doc.fontSize(9).font("Helvetica").fillColor("#1E293B")
          .text(verification.verdict, 125, yPos + 10, { width: 200 });

        doc.fontSize(9).font("Helvetica-Bold").fillColor("#334155")
          .text("Score:", 65, yPos + 28);
        doc.fontSize(16).font("Helvetica-Bold").fillColor(ratingColor)
          .text(`${score}/100`, 125, yPos + 24);

        doc.fontSize(9).font("Helvetica-Bold").fillColor("#334155")
          .text("NeXA Rating:", 65, yPos + 50);
        doc.fontSize(20).font("Helvetica-Bold").fillColor(ratingColor)
          .text(rating, 150, yPos + 44);

        const labelBg = ratingLabel === "VERIFIED" ? "#16A34A" : ratingLabel === "CAUTION" ? "#D97706" : "#DC2626";
        doc.roundedRect(250, yPos + 46, 80, 20, 4).fill(labelBg);
        doc.fontSize(8).font("Helvetica-Bold").fillColor("#FFFFFF")
          .text(ratingLabel, 250, yPos + 51, { width: 80, align: "center" });

        doc.fontSize(9).font("Helvetica-Bold").fillColor("#334155")
          .text("Type:", 65, yPos + 75);
        doc.fontSize(9).font("Helvetica").fillColor("#1E293B")
          .text(verification.inputType === "url" ? "URL Analysis" : "Text Analysis", 125, yPos + 75);

        yPos += 110;

        doc.fontSize(11).font("Helvetica-Bold").fillColor("#1E293B")
          .text("Summary", 50, yPos);
        yPos += 18;
        doc.fontSize(9).font("Helvetica").fillColor("#475569")
          .text(verification.summary, 50, yPos, { width: pageWidth, lineGap: 4 });
        yPos = doc.y + 18;

        if (verification.inputText) {
          doc.fontSize(11).font("Helvetica-Bold").fillColor("#1E293B")
            .text("Analyzed Content", 50, yPos);
          yPos += 18;
          doc.rect(50, yPos, pageWidth, 2).fill("#F5C518");
          yPos += 8;
          const displayText = verification.inputText.length > 400
            ? verification.inputText.substring(0, 400) + "..."
            : verification.inputText;
          doc.fontSize(8).font("Helvetica").fillColor("#64748B")
            .text(displayText, 50, yPos, { width: pageWidth, lineGap: 3 });
          yPos = doc.y + 18;
        }

        if (verification.flaggedClaims && verification.flaggedClaims.length > 0) {
          if (yPos > 650) { doc.addPage(); yPos = 50; }
          doc.fontSize(11).font("Helvetica-Bold").fillColor("#DC2626")
            .text("Flagged Claims", 50, yPos);
          yPos += 18;
          for (const claim of verification.flaggedClaims) {
            doc.fontSize(8).font("Helvetica").fillColor("#7F1D1D")
              .text(`X  ${claim}`, 55, yPos, { width: pageWidth - 10, lineGap: 3 });
            yPos = doc.y + 6;
          }
          yPos += 8;
        }

        if (verification.sources && verification.sources.length > 0) {
          if (yPos > 650) { doc.addPage(); yPos = 50; }
          doc.fontSize(11).font("Helvetica-Bold").fillColor("#1D4ED8")
            .text("Source References", 50, yPos);
          yPos += 18;
          for (const source of verification.sources) {
            doc.fontSize(8).font("Helvetica").fillColor("#3B82F6")
              .text(`>  ${source}`, 55, yPos, { width: pageWidth - 10, lineGap: 3 });
            yPos = doc.y + 5;
          }
          yPos += 8;
        }

        if (verification.claimsAnalyzed && verification.claimsAnalyzed.length > 0) {
          if (yPos > 650) { doc.addPage(); yPos = 50; }
          doc.fontSize(11).font("Helvetica-Bold").fillColor("#1E293B")
            .text("Claims Analyzed", 50, yPos);
          yPos += 18;
          for (const claim of verification.claimsAnalyzed) {
            doc.fontSize(8).font("Helvetica").fillColor("#475569")
              .text(`>  ${claim}`, 55, yPos, { width: pageWidth - 10, lineGap: 3 });
            yPos = doc.y + 5;
          }
          yPos += 8;
        }
      } else {
        doc.fontSize(11).font("Helvetica").fillColor("#64748B")
          .text("No verification data found for this report ID.", 50, yPos);
        yPos += 35;
      }

      if (yPos > 680) { doc.addPage(); yPos = 50; }
      doc.rect(50, yPos, pageWidth, 1).fill("#E2E8F0");
      yPos += 12;

      doc.rect(50, yPos, pageWidth, 65).fill("#FEF9C3");
      doc.roundedRect(50, yPos, pageWidth, 65, 6).stroke("#FDE68A");
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#92400E")
        .text("Legal Disclaimer", 65, yPos + 8);
      doc.fontSize(7).font("Helvetica").fillColor("#78350F")
        .text("This is an AI-generated report for informational purposes only. NeXA 11 AI assumes no legal liability. Zero-Liability for misuse or viral spread. Digital Report Only.", 65, yPos + 22, { width: pageWidth - 30, lineGap: 3 });
      doc.fontSize(7).font("Helvetica-Bold").fillColor("#92400E")
        .text("Issued By: NeXA 11 AI - Global Verification Network  |  Automated AI Analysis", 65, yPos + 48, { width: pageWidth - 30 });

      const footerY = doc.page.height - 50;
      doc.rect(0, footerY - 8, pw, 60).fill("#0A0E1A");
      doc.rect(0, footerY - 8, pw, 3).fill("#F5C518");
      doc.fontSize(7).font("Helvetica").fillColor("#94A3B8")
        .text("NeXA Truth Engine  |  AI-Powered Global Verification  |  nexa11.ai", 50, footerY + 2, { width: pw - 100, align: "center" });
      doc.fontSize(6).font("Helvetica-Bold").fillColor("#F5C518")
        .text("Founder: Kanwar Sallauhuddin Ali Khan", 50, footerY + 16, { width: pw - 100, align: "center" });
      doc.fontSize(5).font("Helvetica").fillColor("#64748B")
        .text("AUTHENTICATED BY NeXA 11 AI", 50, footerY + 28, { width: pw - 100, align: "center" });

      doc.end();
    } catch (err) {
      console.error("PDF generation error:", err);
      res.status(500).json({ error: "Failed to generate PDF report" });
    }
  });

  app.post("/api/generate-tool-pdf", async (req, res) => {
    const { toolName, safetyRating, legitimacy, userTrust, riskLevel, details, flags, recommendations, privacyAudit, trafficMetrics, historicalYear, originalChannel, pricingPlans, marketWorth, saleStatus, isWebTool, playStoreStatus, ageYears, userReach, resultAccuracy } = req.body;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const timestamp = now.toISOString().replace("T", " ").substring(0, 19);

    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `NeXA Tool Audit - ${toolName}`,
          Author: "NeXA 11 AI - Global Verification Network",
          Creator: "NeXA Truth Engine",
        },
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="NeXA_Tool_Audit_${(toolName || "report").replace(/\s+/g, "_")}.pdf"`);
      doc.pipe(res);

      const pageWidth = doc.page.width - 100;
      const pw = doc.page.width;

      doc.rect(0, 0, pw, 130).fill("#0A0E1A");
      doc.rect(0, 126, pw, 4).fill("#F5C518");
      doc.fontSize(6).font("Helvetica").fillColor("#475569")
        .text("AUTHENTICATED BY NeXA 11 AI", pw - 200, 112);

      doc.fontSize(26).font("Helvetica-Bold").fillColor("#F5C518")
        .text("NeXA", 50, 30, { continued: true })
        .fillColor("#FFFFFF")
        .text(" TOOL AUDIT");

      doc.fontSize(9).font("Helvetica").fillColor("#94A3B8")
        .text("Software Safety Analysis  |  AI-Powered Verification", 50, 65);

      doc.fontSize(7).fillColor("#64748B")
        .text(`Tool: ${toolName}  |  ${dateStr}  |  ${timestamp}`, 50, 85);

      const badgeX = pw - 190;
      doc.roundedRect(badgeX, 30, 140, 30, 6).fill("#1D4ED8");
      doc.roundedRect(badgeX, 60, 140, 20, 4).fill("#B8860B");
      doc.fontSize(11).font("Helvetica-Bold").fillColor("#FFFFFF")
        .text("AUDITED", badgeX, 36, { width: 140, align: "center" });
      doc.fontSize(7).font("Helvetica-Bold").fillColor("#FFFFFF")
        .text("Official NeXA Badge", badgeX, 63, { width: 140, align: "center" });

      doc.fontSize(7).fillColor("#475569")
        .text("Anonymous AI-Generated Report  |  No Human Signature", 50, 100);

      let yPos = 150;

      doc.fontSize(14).font("Helvetica-Bold").fillColor("#1E293B")
        .text("Tool Safety Report", 50, yPos);
      yPos += 25;
      doc.rect(50, yPos, pageWidth, 2).fill("#F5C518");
      yPos += 15;

      const rColor = getRatingColor(safetyRating || "N/A");
      const rLabel = getRatingLabel(safetyRating || "N/A");

      doc.rect(50, yPos, pageWidth, 110).fill("#F8FAFC");
      doc.roundedRect(50, yPos, pageWidth, 110, 6).stroke("#E2E8F0");

      doc.fontSize(9).font("Helvetica-Bold").fillColor("#334155")
        .text("Safety Rating:", 65, yPos + 10);
      doc.fontSize(20).font("Helvetica-Bold").fillColor(rColor)
        .text(safetyRating || "N/A", 160, yPos + 5);

      const lBg = rLabel === "VERIFIED" ? "#16A34A" : rLabel === "CAUTION" ? "#D97706" : "#DC2626";
      doc.roundedRect(260, yPos + 8, 80, 18, 4).fill(lBg);
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#FFFFFF")
        .text(rLabel, 260, yPos + 12, { width: 80, align: "center" });

      doc.fontSize(9).font("Helvetica-Bold").fillColor("#334155")
        .text("Legitimacy:", 65, yPos + 38);
      doc.fontSize(9).font("Helvetica").fillColor("#1E293B")
        .text(legitimacy || "N/A", 160, yPos + 38);

      doc.fontSize(9).font("Helvetica-Bold").fillColor("#334155")
        .text("User Trust:", 65, yPos + 58);
      doc.fontSize(9).font("Helvetica").fillColor("#1E293B")
        .text(userTrust || "N/A", 160, yPos + 58);

      doc.fontSize(9).font("Helvetica-Bold").fillColor("#334155")
        .text("Risk Level:", 65, yPos + 78);
      const rkColor = riskLevel === "Low" || riskLevel === "Minimal" ? "#16A34A" : riskLevel === "Medium" ? "#D97706" : "#DC2626";
      doc.fontSize(9).font("Helvetica-Bold").fillColor(rkColor)
        .text(riskLevel || "N/A", 160, yPos + 78);

      yPos += 125;

      if (details) {
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#1E293B")
          .text("Detailed Analysis", 50, yPos);
        yPos += 18;
        doc.fontSize(9).font("Helvetica").fillColor("#475569")
          .text(details, 50, yPos, { width: pageWidth, lineGap: 4 });
        yPos = doc.y + 18;
      }

      if (flags && flags.length > 0) {
        if (yPos > 650) { doc.addPage(); yPos = 50; }
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#DC2626")
          .text("Red Flags", 50, yPos);
        yPos += 18;
        for (const flag of flags) {
          doc.fontSize(8).font("Helvetica").fillColor("#7F1D1D")
            .text(`X  ${flag}`, 55, yPos, { width: pageWidth - 10, lineGap: 3 });
          yPos = doc.y + 6;
        }
        yPos += 8;
      }

      if (recommendations && recommendations.length > 0) {
        if (yPos > 650) { doc.addPage(); yPos = 50; }
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#16A34A")
          .text("Recommendations", 50, yPos);
        yPos += 18;
        for (const rec of recommendations) {
          doc.fontSize(8).font("Helvetica").fillColor("#14532D")
            .text(`>  ${rec}`, 55, yPos, { width: pageWidth - 10, lineGap: 3 });
          yPos = doc.y + 6;
        }
        yPos += 8;
      }

      if (privacyAudit || trafficMetrics || historicalYear || originalChannel || pricingPlans || marketWorth || saleStatus || isWebTool !== undefined || playStoreStatus || ageYears || userReach || resultAccuracy) {
        if (yPos > 580) { doc.addPage(); yPos = 50; }
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#1E293B")
          .text("Deep Intelligence", 50, yPos);
        yPos += 18;
        doc.rect(50, yPos, pageWidth, 2).fill("#1D4ED8");
        yPos += 10;

        const fields: [string, string][] = [];
        if (historicalYear) fields.push(["Founded", historicalYear]);
        if (originalChannel) fields.push(["Original Channel", originalChannel]);
        if (privacyAudit) fields.push(["Privacy Audit", privacyAudit]);
        if (trafficMetrics) fields.push(["Traffic Metrics", trafficMetrics]);

        for (const [label, value] of fields) {
          doc.fontSize(8).font("Helvetica-Bold").fillColor("#334155")
            .text(`${label}:`, 55, yPos, { continued: true })
            .font("Helvetica").fillColor("#475569")
            .text(`  ${value}`, { width: pageWidth - 60 });
          yPos = doc.y + 6;
        }
        yPos += 8;

        if (pricingPlans || marketWorth || saleStatus) {
          if (yPos > 650) { doc.addPage(); yPos = 50; }
          doc.fontSize(10).font("Helvetica-Bold").fillColor("#1E293B")
            .text("Commercial Metrics", 50, yPos);
          yPos += 16;
          const commercialFields: [string, string][] = [];
          if (pricingPlans) commercialFields.push(["Pricing Plans", pricingPlans]);
          if (marketWorth) commercialFields.push(["Market Worth", marketWorth]);
          if (saleStatus) commercialFields.push(["Sale Status", saleStatus]);
          for (const [label, value] of commercialFields) {
            doc.fontSize(8).font("Helvetica-Bold").fillColor("#334155")
              .text(`${label}:`, 55, yPos, { continued: true })
              .font("Helvetica").fillColor("#475569")
              .text(`  ${value}`, { width: pageWidth - 60 });
            yPos = doc.y + 6;
          }
          yPos += 8;
        }

        if (isWebTool !== undefined || playStoreStatus || ageYears) {
          if (yPos > 650) { doc.addPage(); yPos = 50; }
          doc.fontSize(10).font("Helvetica-Bold").fillColor("#1E293B")
            .text("Existence Check", 50, yPos);
          yPos += 16;
          const existFields: [string, string][] = [];
          if (isWebTool !== undefined) existFields.push(["Web Tool", isWebTool ? "Yes" : "No"]);
          if (playStoreStatus) existFields.push(["App Store Status", playStoreStatus]);
          if (ageYears) existFields.push(["Age", `${ageYears} years`]);
          for (const [label, value] of existFields) {
            doc.fontSize(8).font("Helvetica-Bold").fillColor("#334155")
              .text(`${label}:`, 55, yPos, { continued: true })
              .font("Helvetica").fillColor("#475569")
              .text(`  ${value}`, { width: pageWidth - 60 });
            yPos = doc.y + 6;
          }
          yPos += 8;
        }

        if (userReach || resultAccuracy) {
          if (yPos > 650) { doc.addPage(); yPos = 50; }
          doc.fontSize(10).font("Helvetica-Bold").fillColor("#1E293B")
            .text("Performance Metrics", 50, yPos);
          yPos += 16;
          const perfFields: [string, string][] = [];
          if (userReach) perfFields.push(["User Reach", userReach]);
          if (resultAccuracy) perfFields.push(["Result Accuracy", `${resultAccuracy}%`]);
          for (const [label, value] of perfFields) {
            doc.fontSize(8).font("Helvetica-Bold").fillColor("#334155")
              .text(`${label}:`, 55, yPos, { continued: true })
              .font("Helvetica").fillColor("#475569")
              .text(`  ${value}`, { width: pageWidth - 60 });
            yPos = doc.y + 6;
          }
          yPos += 8;
        }
      }

      if (yPos > 680) { doc.addPage(); yPos = 50; }
      doc.rect(50, yPos, pageWidth, 1).fill("#E2E8F0");
      yPos += 12;

      doc.rect(50, yPos, pageWidth, 65).fill("#FEF9C3");
      doc.roundedRect(50, yPos, pageWidth, 65, 6).stroke("#FDE68A");
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#92400E")
        .text("Legal Disclaimer", 65, yPos + 8);
      doc.fontSize(7).font("Helvetica").fillColor("#78350F")
        .text("This is an AI-generated report for informational purposes only. NeXA 11 AI assumes no legal liability. Zero-Liability for misuse or viral spread. Digital Report Only.", 65, yPos + 22, { width: pageWidth - 30, lineGap: 3 });
      doc.fontSize(7).font("Helvetica-Bold").fillColor("#92400E")
        .text("Issued By: NeXA 11 AI - Global Verification Network  |  Automated AI Analysis", 65, yPos + 48, { width: pageWidth - 30 });

      const footerY = doc.page.height - 50;
      doc.rect(0, footerY - 8, pw, 60).fill("#0A0E1A");
      doc.rect(0, footerY - 8, pw, 3).fill("#F5C518");
      doc.fontSize(7).font("Helvetica").fillColor("#94A3B8")
        .text("NeXA Truth Engine  |  AI-Powered Global Verification  |  nexa11.ai", 50, footerY + 2, { width: pw - 100, align: "center" });
      doc.fontSize(6).font("Helvetica-Bold").fillColor("#F5C518")
        .text("Founder: Kanwar Sallauhuddin Ali Khan", 50, footerY + 16, { width: pw - 100, align: "center" });
      doc.fontSize(5).font("Helvetica").fillColor("#64748B")
        .text("AUTHENTICATED BY NeXA 11 AI", 50, footerY + 28, { width: pw - 100, align: "center" });

      doc.end();
    } catch (err) {
      console.error("Tool PDF generation error:", err);
      res.status(500).json({ error: "Failed to generate tool audit PDF" });
    }
  });

  app.post("/api/generate-media-pdf", async (req, res) => {
    const { mediaName, mediaType, forensicScore, verdict, authenticityProbability, aiDetection, pixelForensics, hdClarityEngine, heatMap, tamperCheck, deepfakeDetection, lipSyncAudit, metadata, riskAssessment, details, flags, recommendations } = req.body;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const timestamp = now.toISOString().replace("T", " ").substring(0, 19);

    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `NeXA Media Forensic Report - ${mediaName || "Unknown"}`,
          Author: "NeXA 11 AI - Global Verification Network",
          Creator: "NeXA Truth Engine v5",
        },
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="NeXA_Media_Forensic_${(mediaName || "report").replace(/\s+/g, "_")}.pdf"`);
      doc.pipe(res);

      const pageWidth = doc.page.width - 100;
      const pw = doc.page.width;

      doc.rect(0, 0, pw, 130).fill("#0A0E1A");
      doc.rect(0, 126, pw, 4).fill("#F5C518");
      doc.fontSize(6).font("Helvetica").fillColor("#475569")
        .text("AUTHENTICATED BY NeXA 11 AI", pw - 200, 112);

      doc.fontSize(26).font("Helvetica-Bold").fillColor("#F5C518")
        .text("NeXA", 50, 30, { continued: true })
        .fillColor("#FFFFFF")
        .text(" MEDIA FORENSICS");

      doc.fontSize(9).font("Helvetica").fillColor("#94A3B8")
        .text("Pixel-Level Forced Audit  |  HD Clarity Engine  |  Heat Map Analysis", 50, 65);

      doc.fontSize(7).fillColor("#64748B")
        .text(`Media: ${mediaName || "Unknown"}  |  Type: ${mediaType || "image"}  |  ${dateStr}  |  ${timestamp}`, 50, 85);

      const verdictColor = verdict === "AUTHENTIC" ? "#16A34A" : verdict === "LIKELY_MANIPULATED" || verdict === "MANIPULATED" || verdict === "SYNTHETIC" ? "#DC2626" : "#D97706";
      const badgeX = pw - 190;
      doc.roundedRect(badgeX, 28, 140, 35, 6).fill(verdictColor);
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#FFFFFF")
        .text(verdict || "UNKNOWN", badgeX, 32, { width: 140, align: "center" });
      doc.fontSize(7).font("Helvetica").fillColor("#FFFFFF")
        .text("Security Verdict", badgeX, 48, { width: 140, align: "center" });
      doc.roundedRect(badgeX, 66, 140, 18, 4).fill("#B8860B");
      doc.fontSize(7).font("Helvetica-Bold").fillColor("#FFFFFF")
        .text("Official NeXA Badge", badgeX, 70, { width: 140, align: "center" });

      doc.fontSize(7).fillColor("#475569")
        .text("Anonymous AI-Generated Report  |  No Human Signature", 50, 100);

      let yPos = 150;

      doc.fontSize(14).font("Helvetica-Bold").fillColor("#1E293B")
        .text("Media Forensic Report", 50, yPos);
      yPos += 25;
      doc.rect(50, yPos, pageWidth, 2).fill("#F5C518");
      yPos += 15;

      doc.rect(50, yPos, pageWidth, 80).fill("#F8FAFC");
      doc.roundedRect(50, yPos, pageWidth, 80, 6).stroke("#E2E8F0");

      const gaugeX = 110;
      const gaugeY = yPos + 40;
      const scoreColor = forensicScore >= 70 ? "#16A34A" : forensicScore >= 40 ? "#D97706" : "#DC2626";
      doc.circle(gaugeX, gaugeY, 28).lineWidth(4).strokeColor(scoreColor).stroke();
      doc.circle(gaugeX, gaugeY, 22).fill("#F8FAFC");
      doc.fontSize(18).font("Helvetica-Bold").fillColor(scoreColor)
        .text(`${forensicScore || 0}`, gaugeX - 18, gaugeY - 10, { width: 36, align: "center" });
      doc.fontSize(6).font("Helvetica").fillColor("#64748B")
        .text("FORENSIC", gaugeX - 18, gaugeY + 9, { width: 36, align: "center" });

      doc.fontSize(9).font("Helvetica-Bold").fillColor("#334155")
        .text("Authenticity:", 160, yPos + 12);
      doc.fontSize(14).font("Helvetica-Bold").fillColor(scoreColor)
        .text(`${authenticityProbability || 0}%`, 240, yPos + 9);

      doc.fontSize(9).font("Helvetica-Bold").fillColor("#334155")
        .text("Risk:", 160, yPos + 35);
      const raColor = riskAssessment === "SAFE" || riskAssessment === "LOW_RISK" ? "#16A34A" : riskAssessment === "MEDIUM_RISK" ? "#D97706" : "#DC2626";
      doc.fontSize(9).font("Helvetica-Bold").fillColor(raColor)
        .text(riskAssessment || "N/A", 200, yPos + 35);

      doc.fontSize(9).font("Helvetica-Bold").fillColor("#334155")
        .text("AI Detection:", 160, yPos + 55);
      doc.fontSize(9).font("Helvetica-Bold").fillColor(aiDetection?.isAiGenerated ? "#DC2626" : "#16A34A")
        .text(aiDetection?.isAiGenerated ? `AI DETECTED (${aiDetection.confidence}%)` : "NO AI DETECTED", 240, yPos + 55);

      yPos += 95;

      if (details) {
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#1E293B")
          .text("Forensic Analysis", 50, yPos);
        yPos += 18;
        doc.fontSize(9).font("Helvetica").fillColor("#475569")
          .text(details, 50, yPos, { width: pageWidth, lineGap: 4 });
        yPos = doc.y + 15;
      }

      if (pixelForensics) {
        if (yPos > 620) { doc.addPage(); yPos = 50; }
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#1D4ED8")
          .text("Pixel-Level Forensics", 50, yPos);
        yPos += 18;
        doc.rect(50, yPos, pageWidth, 2).fill("#1D4ED8");
        yPos += 10;

        const pixelMethods = [
          pixelForensics.ela ? ["ELA (Compression Variance)", pixelForensics.ela.status, pixelForensics.ela.finding] : null,
          pixelForensics.noisePrint ? ["Noise Print Analysis", pixelForensics.noisePrint.status, pixelForensics.noisePrint.finding] : null,
          pixelForensics.luminanceGradient ? ["Luminance Gradient", pixelForensics.luminanceGradient.status, pixelForensics.luminanceGradient.finding] : null,
          pixelForensics.contentDna ? ["Content DNA", pixelForensics.contentDna.visualStyle, pixelForensics.contentDna.finding] : null,
        ].filter(Boolean) as any[];

        for (const [method, status, finding] of pixelMethods) {
          const sColor = status === "FAIL" || status === "ANOMALOUS" || status === "INCONSISTENT" ? "#DC2626" : status === "SUSPICIOUS" ? "#D97706" : "#16A34A";
          doc.fontSize(8).font("Helvetica-Bold").fillColor("#334155")
            .text(`${method}:`, 55, yPos, { continued: true })
            .font("Helvetica-Bold").fillColor(sColor)
            .text(`  [${status}]`);
          yPos = doc.y + 2;
          if (finding) {
            doc.fontSize(7).font("Helvetica").fillColor("#64748B")
              .text(finding, 65, yPos, { width: pageWidth - 20, lineGap: 2 });
            yPos = doc.y + 6;
          }
        }
        yPos += 5;
      }

      if (hdClarityEngine) {
        if (yPos > 580) { doc.addPage(); yPos = 50; }
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#F5C518")
          .text("HD Clarity Engine — Face & Skin Forensics", 50, yPos);
        yPos += 18;
        doc.rect(50, yPos, pageWidth, 2).fill("#F5C518");
        yPos += 10;

        const hdChecks = [
          hdClarityEngine.skinPoreValidation ? ["Skin Pore Validation", hdClarityEngine.skinPoreValidation.status, hdClarityEngine.skinPoreValidation.finding, hdClarityEngine.skinPoreValidation.poreDetail] : null,
          hdClarityEngine.facialMuscleSync ? ["Facial Muscle Sync", hdClarityEngine.facialMuscleSync.status, hdClarityEngine.facialMuscleSync.finding, null] : null,
          hdClarityEngine.edgeBlurDetection ? ["Edge Blur Detection", hdClarityEngine.edgeBlurDetection.status, hdClarityEngine.edgeBlurDetection.finding, hdClarityEngine.edgeBlurDetection.blurType] : null,
          hdClarityEngine.aiTextureMismatch ? ["AI Texture Mismatch", hdClarityEngine.aiTextureMismatch.status, hdClarityEngine.aiTextureMismatch.finding, null] : null,
        ].filter(Boolean) as any[];

        for (const [check, status, finding, detail] of hdChecks) {
          const hColor = status === "FAIL" || status === "DESYNCED" || status === "MISMATCH_DETECTED" || status === "HALO_ARTIFACTS" ? "#DC2626" : status === "SUSPICIOUS" || status === "BLUR_DETECTED" ? "#D97706" : "#16A34A";
          doc.fontSize(8).font("Helvetica-Bold").fillColor("#334155")
            .text(`${check}:`, 55, yPos, { continued: true })
            .font("Helvetica-Bold").fillColor(hColor)
            .text(`  [${status}]`);
          yPos = doc.y + 2;
          if (detail) {
            doc.fontSize(7).font("Helvetica").fillColor("#475569")
              .text(detail, 65, yPos, { width: pageWidth - 20 });
            yPos = doc.y + 2;
          }
          if (finding) {
            doc.fontSize(7).font("Helvetica").fillColor("#64748B")
              .text(finding, 65, yPos, { width: pageWidth - 20, lineGap: 2 });
            yPos = doc.y + 6;
          }
        }
        yPos += 5;
      }

      if (heatMap?.tamperedZones?.length > 0) {
        if (yPos > 580) { doc.addPage(); yPos = 50; }
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#DC2626")
          .text("Tamper Heat Map — Flagged Zones", 50, yPos);
        yPos += 18;
        doc.rect(50, yPos, pageWidth, 2).fill("#DC2626");
        yPos += 10;

        doc.fontSize(8).font("Helvetica-Bold").fillColor("#334155")
          .text(`Integrity: ${heatMap.overallIntegrity?.replace(/_/g, " ")}  |  ${heatMap.tamperedZones.length} zone(s) flagged`, 55, yPos);
        yPos += 16;

        for (const zone of heatMap.tamperedZones) {
          if (yPos > 700) { doc.addPage(); yPos = 50; }
          const zColor = zone.severity === "CRITICAL" || zone.severity === "HIGH" ? "#DC2626" : zone.severity === "MEDIUM" ? "#D97706" : "#16A34A";
          doc.circle(58, yPos + 4, 3).fill(zColor);
          doc.fontSize(8).font("Helvetica-Bold").fillColor("#1E293B")
            .text(zone.zone, 68, yPos, { continued: true })
            .font("Helvetica").fillColor("#64748B")
            .text(`  — ${zone.type}  [${zone.severity}]  ${zone.confidence}%`);
          yPos = doc.y + 6;
        }
        yPos += 5;
      }

      if (deepfakeDetection || tamperCheck) {
        if (yPos > 620) { doc.addPage(); yPos = 50; }
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#1E293B")
          .text("Biometric Sync Log", 50, yPos);
        yPos += 18;
        if (deepfakeDetection) {
          const dfColor = deepfakeDetection.isDeepfake ? "#DC2626" : "#16A34A";
          doc.fontSize(8).font("Helvetica-Bold").fillColor("#334155")
            .text("Deepfake:", 55, yPos, { continued: true })
            .font("Helvetica-Bold").fillColor(dfColor)
            .text(`  ${deepfakeDetection.isDeepfake ? "DETECTED" : "NOT DETECTED"} (${deepfakeDetection.confidence}%)`);
          yPos = doc.y + 4;
          if (deepfakeDetection.biometricFlags?.length > 0) {
            doc.fontSize(7).font("Helvetica").fillColor("#64748B")
              .text(`Flags: ${deepfakeDetection.biometricFlags.join(", ")}`, 65, yPos, { width: pageWidth - 20 });
            yPos = doc.y + 4;
          }
          if (lipSyncAudit) {
            doc.fontSize(8).font("Helvetica-Bold").fillColor("#334155")
              .text("Lip Sync:", 55, yPos, { continued: true })
              .font("Helvetica").fillColor(lipSyncAudit.status === "FAIL" ? "#DC2626" : "#16A34A")
              .text(`  ${lipSyncAudit.status} ${lipSyncAudit.syncScore ? `(${lipSyncAudit.syncScore}%)` : ""}`);
            yPos = doc.y + 4;
          }
          yPos += 4;
        }
        if (tamperCheck) {
          doc.fontSize(8).font("Helvetica-Bold").fillColor("#334155")
            .text("Tamper Check:", 55, yPos, { continued: true })
            .font("Helvetica-Bold").fillColor(tamperCheck.isTampered ? "#DC2626" : "#16A34A")
            .text(`  ${tamperCheck.isTampered ? "TAMPERED" : "CLEAN"} (${tamperCheck.confidence}%)`);
          yPos = doc.y + 8;
        }
      }

      if (flags?.length > 0) {
        if (yPos > 650) { doc.addPage(); yPos = 50; }
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#DC2626")
          .text("Red Flags", 50, yPos);
        yPos += 18;
        for (const flag of flags) {
          doc.fontSize(8).font("Helvetica").fillColor("#7F1D1D")
            .text(`X  ${flag}`, 55, yPos, { width: pageWidth - 10, lineGap: 3 });
          yPos = doc.y + 6;
        }
        yPos += 5;
      }

      if (recommendations?.length > 0) {
        if (yPos > 650) { doc.addPage(); yPos = 50; }
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#16A34A")
          .text("Recommendations", 50, yPos);
        yPos += 18;
        for (const rec of recommendations) {
          doc.fontSize(8).font("Helvetica").fillColor("#14532D")
            .text(`>  ${rec}`, 55, yPos, { width: pageWidth - 10, lineGap: 3 });
          yPos = doc.y + 6;
        }
        yPos += 5;
      }

      if (yPos > 680) { doc.addPage(); yPos = 50; }
      doc.rect(50, yPos, pageWidth, 1).fill("#E2E8F0");
      yPos += 12;
      doc.rect(50, yPos, pageWidth, 65).fill("#FEF9C3");
      doc.roundedRect(50, yPos, pageWidth, 65, 6).stroke("#FDE68A");
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#92400E")
        .text("Legal Disclaimer", 65, yPos + 8);
      doc.fontSize(7).font("Helvetica").fillColor("#78350F")
        .text("This is an AI-generated forensic report for informational purposes only. NeXA 11 AI assumes no legal liability. Zero-Liability for misuse. Digital Report Only.", 65, yPos + 22, { width: pageWidth - 30, lineGap: 3 });
      doc.fontSize(7).font("Helvetica-Bold").fillColor("#92400E")
        .text("Issued By: NeXA 11 AI - Global Verification Network  |  Automated AI Forensic Analysis", 65, yPos + 48, { width: pageWidth - 30 });

      const footerYm = doc.page.height - 50;
      doc.rect(0, footerYm - 8, pw, 60).fill("#0A0E1A");
      doc.rect(0, footerYm - 8, pw, 3).fill("#F5C518");
      doc.fontSize(7).font("Helvetica").fillColor("#94A3B8")
        .text("NeXA Truth Engine  |  AI-Powered Global Verification  |  nexa11.ai", 50, footerYm + 2, { width: pw - 100, align: "center" });
      doc.fontSize(6).font("Helvetica-Bold").fillColor("#F5C518")
        .text("Founder: Kanwar Sallauhuddin Ali Khan", 50, footerYm + 16, { width: pw - 100, align: "center" });
      doc.fontSize(5).font("Helvetica").fillColor("#64748B")
        .text("AUTHENTICATED BY NeXA 11 AI", 50, footerYm + 28, { width: pw - 100, align: "center" });

      doc.end();
    } catch (err) {
      console.error("Media PDF generation error:", err);
      res.status(500).json({ error: "Failed to generate media forensic PDF" });
    }
  });

  app.post("/api/generate-audio-pdf", async (req, res) => {
    const { audioTitle, platform, duration, transcription, smartSummary, voiceAudit, languageAnalysis, speakerAnalysis, audioQuality, contentClassification, riskAssessment, flags, recommendations } = req.body;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const timestamp = now.toISOString().replace("T", " ").substring(0, 19);

    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `NeXA Audio Forensic Report - ${audioTitle || "Unknown"}`,
          Author: "NeXA 11 AI - Global Verification Network",
          Creator: "NeXA Truth Engine v5",
        },
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="NeXA_Audio_Forensic_${(audioTitle || "report").replace(/\s+/g, "_")}.pdf"`);
      doc.pipe(res);

      const pageWidth = doc.page.width - 100;
      const pw = doc.page.width;

      doc.rect(0, 0, pw, 130).fill("#0A0E1A");
      doc.rect(0, 126, pw, 4).fill("#F5C518");
      doc.fontSize(6).font("Helvetica").fillColor("#475569")
        .text("AUTHENTICATED BY NeXA 11 AI", pw - 200, 112);

      doc.fontSize(26).font("Helvetica-Bold").fillColor("#F5C518")
        .text("NeXA", 50, 30, { continued: true })
        .fillColor("#FFFFFF")
        .text(" AUDIO FORENSICS");

      doc.fontSize(9).font("Helvetica").fillColor("#94A3B8")
        .text("Voice Audit  |  Spectrogram Analysis  |  AI Detection Engine", 50, 65);

      doc.fontSize(7).fillColor("#64748B")
        .text(`Audio: ${audioTitle || "Unknown"}  |  Platform: ${platform || "Direct"}  |  Duration: ${duration || "N/A"}  |  ${dateStr}`, 50, 85);

      const vColor = voiceAudit?.verdict === "HUMAN" ? "#16A34A" : voiceAudit?.verdict === "AI_GENERATED" ? "#DC2626" : voiceAudit?.verdict === "MIXED" ? "#D97706" : "#6B7280";
      const badgeX = pw - 190;
      doc.roundedRect(badgeX, 28, 140, 35, 6).fill(vColor);
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#FFFFFF")
        .text(voiceAudit?.verdict || "UNKNOWN", badgeX, 32, { width: 140, align: "center" });
      doc.fontSize(7).font("Helvetica").fillColor("#FFFFFF")
        .text("Voice Security Badge", badgeX, 48, { width: 140, align: "center" });
      doc.roundedRect(badgeX, 66, 140, 18, 4).fill("#B8860B");
      doc.fontSize(7).font("Helvetica-Bold").fillColor("#FFFFFF")
        .text("Official NeXA Badge", badgeX, 70, { width: 140, align: "center" });

      doc.fontSize(7).fillColor("#475569")
        .text("Anonymous AI-Generated Report  |  No Human Signature", 50, 100);

      let yPos = 150;

      doc.fontSize(14).font("Helvetica-Bold").fillColor("#1E293B")
        .text("Audio Intelligence Report", 50, yPos);
      yPos += 25;
      doc.rect(50, yPos, pageWidth, 2).fill("#F5C518");
      yPos += 15;

      if (voiceAudit) {
        doc.rect(50, yPos, pageWidth, 100).fill("#F8FAFC");
        doc.roundedRect(50, yPos, pageWidth, 100, 6).stroke("#E2E8F0");

        doc.fontSize(10).font("Helvetica-Bold").fillColor("#1E293B")
          .text("Spectrogram Analysis — Voice Audit", 65, yPos + 8);

        const gX = 100;
        const gY = yPos + 62;
        doc.circle(gX, gY, 24).lineWidth(4).strokeColor(vColor).stroke();
        doc.circle(gX, gY, 19).fill("#F8FAFC");
        doc.fontSize(14).font("Helvetica-Bold").fillColor(vColor)
          .text(`${voiceAudit.confidence || 0}`, gX - 14, gY - 8, { width: 28, align: "center" });
        doc.fontSize(5).font("Helvetica").fillColor("#64748B")
          .text("CONF%", gX - 14, gY + 6, { width: 28, align: "center" });

        doc.fontSize(8).font("Helvetica-Bold").fillColor("#334155")
          .text("Naturalness:", 150, yPos + 30);
        const natColor = (voiceAudit.naturalness || 0) >= 70 ? "#16A34A" : (voiceAudit.naturalness || 0) >= 40 ? "#D97706" : "#DC2626";
        doc.fontSize(12).font("Helvetica-Bold").fillColor(natColor)
          .text(`${voiceAudit.naturalness || 0}%`, 230, yPos + 28);

        doc.fontSize(8).font("Helvetica-Bold").fillColor("#334155")
          .text("Breathing:", 150, yPos + 50);
        const brColor = voiceAudit.breathingPatterns === "NATURAL" ? "#16A34A" : "#DC2626";
        doc.fontSize(8).font("Helvetica-Bold").fillColor(brColor)
          .text(voiceAudit.breathingPatterns || "N/A", 215, yPos + 50);

        doc.fontSize(8).font("Helvetica-Bold").fillColor("#334155")
          .text("Pitch:", 150, yPos + 66);
        const ptColor = voiceAudit.pitchVariation === "NATURAL" ? "#16A34A" : "#DC2626";
        doc.fontSize(8).font("Helvetica-Bold").fillColor(ptColor)
          .text(voiceAudit.pitchVariation || "N/A", 195, yPos + 66);

        doc.fontSize(8).font("Helvetica-Bold").fillColor("#334155")
          .text("AI Model:", 300, yPos + 30);
        doc.fontSize(8).font("Helvetica").fillColor("#475569")
          .text(voiceAudit.detectedModel || "N/A", 355, yPos + 30);

        doc.fontSize(8).font("Helvetica-Bold").fillColor("#334155")
          .text("Micro-Expressions:", 300, yPos + 50);
        doc.fontSize(8).font("Helvetica").fillColor(voiceAudit.microExpressions === "PRESENT" ? "#16A34A" : "#DC2626")
          .text(voiceAudit.microExpressions || "N/A", 410, yPos + 50);

        if (voiceAudit.finding) {
          doc.fontSize(7).font("Helvetica").fillColor("#64748B")
            .text(voiceAudit.finding, 65, yPos + 85, { width: pageWidth - 30, lineGap: 2 });
        }

        yPos += 115;
      }

      if (smartSummary) {
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#1E293B")
          .text("AI Smart Summary", 50, yPos);
        yPos += 18;
        doc.fontSize(9).font("Helvetica").fillColor("#475569")
          .text(smartSummary, 50, yPos, { width: pageWidth, lineGap: 4 });
        yPos = doc.y + 15;
      }

      if (transcription) {
        if (yPos > 600) { doc.addPage(); yPos = 50; }
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#1E293B")
          .text("Transcription", 50, yPos);
        yPos += 18;
        const truncatedTranscription = transcription.length > 800 ? transcription.substring(0, 800) + "..." : transcription;
        doc.fontSize(8).font("Helvetica").fillColor("#64748B")
          .text(truncatedTranscription, 50, yPos, { width: pageWidth, lineGap: 3 });
        yPos = doc.y + 15;
      }

      if (languageAnalysis || speakerAnalysis) {
        if (yPos > 620) { doc.addPage(); yPos = 50; }
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#1D4ED8")
          .text("Language & Speaker Analysis", 50, yPos);
        yPos += 18;

        if (languageAnalysis) {
          doc.fontSize(8).font("Helvetica-Bold").fillColor("#334155")
            .text(`Primary: ${languageAnalysis.primaryLanguage || "N/A"} (${languageAnalysis.confidence || 0}%)  |  Accent: ${languageAnalysis.accent || "N/A"}`, 55, yPos);
          yPos = doc.y + 8;
        }
        if (speakerAnalysis) {
          doc.fontSize(8).font("Helvetica-Bold").fillColor("#334155")
            .text(`Speakers Detected: ${speakerAnalysis.totalSpeakers || 0}`, 55, yPos);
          yPos = doc.y + 4;
          if (speakerAnalysis.speakers?.length > 0) {
            for (const spk of speakerAnalysis.speakers) {
              doc.fontSize(7).font("Helvetica").fillColor("#475569")
                .text(`${spk.label}: ${spk.gender || "Unknown"}, ${spk.estimatedAge || "Unknown"}, ${spk.speakingTime || "N/A"}`, 65, yPos, { width: pageWidth - 20 });
              yPos = doc.y + 4;
            }
          }
        }
        yPos += 8;
      }

      if (audioQuality) {
        if (yPos > 650) { doc.addPage(); yPos = 50; }
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#1E293B")
          .text("Audio Quality Assessment", 50, yPos);
        yPos += 18;
        const qualFields: [string, string][] = [
          ["Overall Score", `${audioQuality.overallScore || 0}/100`],
          ["Signal-to-Noise", audioQuality.signalToNoise || "N/A"],
          ["Compression", audioQuality.compression || "N/A"],
          ["Background Noise", audioQuality.backgroundNoise || "N/A"],
          ["Sample Rate", audioQuality.sampleRate || "N/A"],
        ];
        for (const [label, value] of qualFields) {
          doc.fontSize(8).font("Helvetica-Bold").fillColor("#334155")
            .text(`${label}:`, 55, yPos, { continued: true })
            .font("Helvetica").fillColor("#475569")
            .text(`  ${value}`, { width: pageWidth - 60 });
          yPos = doc.y + 4;
        }
        yPos += 8;
      }

      if (contentClassification) {
        if (yPos > 650) { doc.addPage(); yPos = 50; }
        doc.fontSize(8).font("Helvetica-Bold").fillColor("#334155")
          .text(`Category: ${contentClassification.category || "N/A"}  |  Sentiment: ${contentClassification.sentiment || "N/A"}  |  Risk: ${riskAssessment || "N/A"}`, 55, yPos);
        yPos = doc.y + 12;
      }

      if (flags?.length > 0) {
        if (yPos > 650) { doc.addPage(); yPos = 50; }
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#DC2626")
          .text("Red Flags", 50, yPos);
        yPos += 18;
        for (const flag of flags) {
          doc.fontSize(8).font("Helvetica").fillColor("#7F1D1D")
            .text(`X  ${flag}`, 55, yPos, { width: pageWidth - 10, lineGap: 3 });
          yPos = doc.y + 6;
        }
        yPos += 5;
      }

      if (recommendations?.length > 0) {
        if (yPos > 650) { doc.addPage(); yPos = 50; }
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#16A34A")
          .text("Recommendations", 50, yPos);
        yPos += 18;
        for (const rec of recommendations) {
          doc.fontSize(8).font("Helvetica").fillColor("#14532D")
            .text(`>  ${rec}`, 55, yPos, { width: pageWidth - 10, lineGap: 3 });
          yPos = doc.y + 6;
        }
        yPos += 5;
      }

      if (yPos > 680) { doc.addPage(); yPos = 50; }
      doc.rect(50, yPos, pageWidth, 1).fill("#E2E8F0");
      yPos += 12;
      doc.rect(50, yPos, pageWidth, 65).fill("#FEF9C3");
      doc.roundedRect(50, yPos, pageWidth, 65, 6).stroke("#FDE68A");
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#92400E")
        .text("Legal Disclaimer", 65, yPos + 8);
      doc.fontSize(7).font("Helvetica").fillColor("#78350F")
        .text("This is an AI-generated audio forensic report for informational purposes only. NeXA 11 AI assumes no legal liability. Zero-Liability for misuse. Digital Report Only.", 65, yPos + 22, { width: pageWidth - 30, lineGap: 3 });
      doc.fontSize(7).font("Helvetica-Bold").fillColor("#92400E")
        .text("Issued By: NeXA 11 AI - Global Verification Network  |  Automated AI Audio Analysis", 65, yPos + 48, { width: pageWidth - 30 });

      const footerYa = doc.page.height - 50;
      doc.rect(0, footerYa - 8, pw, 60).fill("#0A0E1A");
      doc.rect(0, footerYa - 8, pw, 3).fill("#F5C518");
      doc.fontSize(7).font("Helvetica").fillColor("#94A3B8")
        .text("NeXA Truth Engine  |  AI-Powered Global Verification  |  nexa11.ai", 50, footerYa + 2, { width: pw - 100, align: "center" });
      doc.fontSize(6).font("Helvetica-Bold").fillColor("#F5C518")
        .text("Founder: Kanwar Sallauhuddin Ali Khan", 50, footerYa + 16, { width: pw - 100, align: "center" });
      doc.fontSize(5).font("Helvetica").fillColor("#64748B")
        .text("AUTHENTICATED BY NeXA 11 AI", 50, footerYa + 28, { width: pw - 100, align: "center" });

      doc.end();
    } catch (err) {
      console.error("Audio PDF generation error:", err);
      res.status(500).json({ error: "Failed to generate audio forensic PDF" });
    }
  });

  app.post("/api/system-master-sync", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const data = req.body;

    if (data.founder_name !== undefined) config.teamConfig.founder.name = data.founder_name;
    if (data.founder_active !== undefined) config.teamConfig.showSection = data.founder_active;
    if (data.founder_img !== undefined) config.teamConfig.founder.image = data.founder_img;
    if (data.founder_role !== undefined) config.teamConfig.founder.role = data.founder_role;

    if (data.founder_socials) {
      if (data.founder_socials.linkedin !== undefined) config.teamConfig.founder.socials.linkedin = data.founder_socials.linkedin;
      if (data.founder_socials.youtube !== undefined) config.teamConfig.founder.socials.youtube = data.founder_socials.youtube;
      if (data.founder_socials.facebook !== undefined) config.teamConfig.founder.socials.facebook = data.founder_socials.facebook;
    }

    if (data.partner_theme !== undefined) config.partnerSection.theme = data.partner_theme;
    if (data.partner_speed !== undefined) config.partnerSection.scrollingSpeed = Number(data.partner_speed);
    if (data.partner_visible !== undefined) config.partnerSection.showSection = data.partner_visible;
    if (data.partner_limit !== undefined) config.promotionConfig.visibleToolLimit = Number(data.partner_limit);
    if (data.ppc_rate !== undefined) config.promotionConfig.ppcRate = Number(data.ppc_rate);

    if (data.official_partners && Array.isArray(data.official_partners)) {
      (async () => {
        try {
          for (const partner of data.official_partners) {
            if (partner.name) {
              await storage.addVerifiedTool(partner.name, partner.url || partner.link || "#");
            }
          }
        } catch (e) {
          console.error("Partner sync error:", e);
        }
      })();
    }

    if (data.policy_text !== undefined) config.policyText = data.policy_text;
    if (data.policy_on !== undefined) config.policyStatus = data.policy_on;
    if (data.footer_text !== undefined) config.footerText = data.footer_text;

    if (data.system_status) {
      if (data.system_status.news_engine !== undefined) config.systemStatus.news_engine = data.system_status.news_engine;
      if (data.system_status.tool_auditor !== undefined) config.systemStatus.tool_auditor = data.system_status.tool_auditor;
      if (data.system_status.media_intelligence !== undefined) config.systemStatus.media_intelligence = data.system_status.media_intelligence;
      if (data.system_status.audio_intelligence !== undefined) config.systemStatus.audio_intelligence = data.system_status.audio_intelligence;
    }

    if (data.engine !== undefined) config.engineSettings.activeEngine = data.engine;

    if (data.monetization) {
      if (data.monetization.paywallEnabled !== undefined) config.monetizationSettings.paywallEnabled = data.monetization.paywallEnabled;
      if (data.monetization.basicPrice !== undefined) config.monetizationSettings.basicPrice = data.monetization.basicPrice;
      if (data.monetization.starterPrice !== undefined) config.monetizationSettings.starterPrice = data.monetization.starterPrice;
      if (data.monetization.purePrice !== undefined) config.monetizationSettings.purePrice = data.monetization.purePrice;
      if (data.monetization.elitePrice !== undefined) config.monetizationSettings.elitePrice = data.monetization.elitePrice;
    }

    persistConfig();

    res.json({
      status: "All Features Synced & Verified",
      synced: {
        founder: {
          name: config.teamConfig.founder.name,
          active: config.teamConfig.showSection,
          image: config.teamConfig.founder.image,
          role: config.teamConfig.founder.role,
        },
        partners: {
          theme: config.partnerSection.theme,
          speed: config.partnerSection.scrollingSpeed,
          visible: config.partnerSection.showSection,
          limit: config.promotionConfig.visibleToolLimit,
          ppcRate: config.promotionConfig.ppcRate,
        },
        legal: {
          policyActive: config.policyStatus,
          footerText: config.footerText,
        },
        system: config.systemStatus,
        engine: config.engineSettings.activeEngine,
        domain: req.headers.host || "localhost",
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/admin/google-sheets-status", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json({
      enabled: config.googleSheetsIntegration || false,
      auth: config.googleSheetsAuth || { oauthClientId: "", sheetId: "", autoSyncInterval: "Instant" },
    });
  });

  app.post("/api/admin/google-sheets-auth", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { oauthClientId, sheetId, autoSyncInterval } = req.body;
    if (!config.googleSheetsAuth) {
      config.googleSheetsAuth = { oauthClientId: "", sheetId: "", autoSyncInterval: "Instant" };
    }
    if (oauthClientId !== undefined) config.googleSheetsAuth.oauthClientId = oauthClientId;
    if (sheetId !== undefined) config.googleSheetsAuth.sheetId = sheetId;
    if (autoSyncInterval !== undefined) config.googleSheetsAuth.autoSyncInterval = autoSyncInterval;
    persistConfig();
    res.json({ status: "Saved", auth: config.googleSheetsAuth });
  });

  app.post("/api/admin/google-sheets-toggle", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    config.googleSheetsIntegration = !config.googleSheetsIntegration;
    persistConfig();
    res.json({ enabled: config.googleSheetsIntegration });
  });

  app.post("/api/sync-to-sheets", (req, res) => {
    if (!req.session.adminLoggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (config.googleSheetsIntegration) {
      const users = Object.entries(config.userRegistry || {}).map(([email, data]) => ({
        email,
        ...data,
      }));
      res.json({
        status: "Growth Mode Active",
        message: "Data Exported to Sheet",
        totalUsers: users.length,
        data: users,
        exportedAt: new Date().toISOString(),
      });
    } else {
      res.json({
        status: "Manual Mode",
        message: "Integration is OFF. Enable Google Sheets from Admin Panel.",
      });
    }
  });

  return httpServer;
}
