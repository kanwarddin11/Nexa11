# NeXA Truth Engine

## Overview
AI-powered fake news detection and verification tool with dual-mode operation: News Verification and Tool Auditing. Users paste news content/claims or tool names and receive AI-powered analysis results. Features admin Command Center with system control switches, AI engine selection, monetization, promotion/revenue management, and policy management.

## Tech Stack
- **Frontend**: React + TypeScript, Vite, TailwindCSS, shadcn/ui, wouter routing, TanStack Query
- **Backend**: Express.js, Drizzle ORM, PostgreSQL, express-session
- **AI**: OpenAI via Replit AI Integrations (gpt-5-mini for verification and audit analysis)

## Architecture
- `shared/schema.ts` - Drizzle schema with `verifications` and `verified_tools` tables
- `server/index.ts` - Express setup with session middleware (SESSION_SECRET)
- `server/routes.ts` - API routes including admin auth, system control, verification, tool audit, verified tools, promotion endpoints
- `server/storage.ts` - Database CRUD via Drizzle ORM
- `server/db.ts` - PostgreSQL connection pool
- `server/seed.ts` - Seeds 4 example verifications and 6 verified partner tools on first startup
- `client/src/pages/home.tsx` - Main page with 2-column side-by-side layout (News Verifier left, Tool Auditor right) + scrolling marquee footer
- `client/src/pages/history.tsx` - Past verifications list with search, bookmark, delete
- `client/src/pages/admin-login.tsx` - Admin login page (glassmorphism design)
- `client/src/pages/admin.tsx` - Admin dashboard with stats, Command Center (system switches, AI hub, monetization, promotion/revenue manager, policy)
- `client/src/components/` - Navbar, ThemeToggle, ScoreRing

## Key Features
- **News Verification**: AI-powered credibility scoring (0-100), claim analysis, flagging, source references, deep analytics (Source Origin, Year Timestamp, Platform Reach, Sentiment Summary), Content DNA Analysis (Writing Style, Timestamp Audit, Content Distortion, Viral Pathway), Scientific Scrutiny (Biology Fact Check, Misleading Claims, Expert Summary), Deep Contextual Motive Analysis (Detected Motive, Confidence, Beneficiary, Narrative Alignment, Manipulation Techniques, Target Audience), Content Style Intelligence (Matched Pattern, Language Tone, Original Language), red-highlighted flagged claims
- **Tool Auditor**: AI-powered software safety audit with AAA+++ to F rating (Safety Grade, Privacy Audit, Country Origin, Traffic Metrics), legitimacy, trust, risk level, Commercial Metrics (Pricing Plans, Market Worth, Sale Status), Existence Check (Web Tool, Play Store Status, Age Years), Performance Metrics (User Reach, Result Accuracy)
- **Media Intelligence v7**: Deep forensic analysis with Pixel-Level Forced Audit — 4 Forensic Methods: ELA (Deep Compression Variance Analysis), Noise Print (Sub-pixel Digital Noise Mapping), Luminance Gradient (Lighting & Shadow Direction Check), Content DNA (Style & Intent Analysis); Tamper Heat Map with red zones (severity: LOW/MEDIUM/HIGH/CRITICAL); Authenticity Probability (0-100%); AI Detection (Deep Neural Scan), Tamper Check, Chat Verification, Deepfake Detection, Lip Sync Audit, Metadata Extraction, Forensic Score (0-100%), Risk Assessment
- **Audio Intelligence**: AI-powered audio forensics — Speech-to-Text transcription, Contextual AI Summary, Voice Audit (AI vs Human detection with confidence, naturalness, breathing patterns, pitch variation, detected AI model), Language Analysis (primary/secondary languages, accent detection), Speaker Analysis (count, gender, age, speaking time %), Audio Quality (score, signal-to-noise, compression, background noise, clipping, sample rate), Content Classification (category, sentiment, topics, key phrases), Risk Assessment; Platform bypass for YouTube, Instagram, Facebook, TikTok, Spotify, Direct Upload
- **Multi-Input Analyzer**: Unified `/api/analyze-any` master router — auto-detects content type from URL patterns (YouTube→audio, image extensions→media, URLs→tool, text→news), routes to appropriate engine, returns unified response with engine/type detection
- **System Control**: Admin toggles to enable/disable News Engine, Tool Auditor, Media Intelligence, and Audio Intelligence independently
- **Home page layout**: 2-column side-by-side - News Verifier (left, textarea) and Tool Auditor (right, single input); full-width Media Intelligence panel below with image/video toggle; full-width Audio Intelligence panel with platform selector; shows offline banner per panel when engine is disabled
- **Verified Partners Footer**: Scrolling marquee of verified partner tools with click tracking (PPC)
- **Promotion & Revenue Manager**: Admin section to manage verified partner tools, set display limits (10/20/40), track clicks and PPC revenue, add/remove partners
- URL vs text input detection with visual indicator
- Verification history with search and bookmarking
- Admin login protection (username: Admin, password: NeXA786)
- Admin Command Center: glassmorphism system switch cards with router paths, AI engine selector, monetization/paywall controls, promotion manager, policy editor
- Dynamic SEO keyword tracking per verification
- Dark mode support, responsive design

## API Endpoints
- `GET /api/system-status` - Public; returns { news_engine, tool_auditor, media_intelligence, audio_intelligence } booleans
- `POST /api/admin/control` - Toggle system switches (body: { target: "news"|"tool"|"media"|"audio" }), requires auth
- `POST /api/verify` - Analyze news content (returns 503 if news_engine off)
- `POST /api/audit-tool` - Audit tool/software (returns 503 if tool_auditor off)
- `POST /api/audit-media` - Forensic media audit (body: { content, mediaType: "image"|"video" }), returns 503 if media_intelligence off
- `POST /api/audit-audio` - Audio intelligence audit (body: { content, platform?: "YouTube"|"Instagram"|"Facebook"|"Direct Upload" }), returns 503 if audio_intelligence off; includes transcription, smart summary, voice audit, language/speaker analysis, audio quality, content classification
- `POST /api/analyze-any` - Unified master router (body: { content, type?: string, mediaType? }); auto-detects content type from URL patterns (YouTube→audio, image→media, URL→tool, text→news); routes to appropriate engine; returns { status, engine, detectedType, result }
- `POST /api/audit-intel` - Unified Master Router (body: { content, type: "news"|"tool"|"media", email?, mediaType? }); checks user subscription lock, runs intelligence audit, auto-syncs to Google Sheets if enabled, saves to auditHistory config; returns 403 if paywall locked, 503 if engine offline
- `POST /api/forensic-scan` - Forensic Master Engine (body: { content, mediaType: "image"|"video" }); 4-layer deep scan: Digital Fingerprint, Pixel-Level Tampering, AI Signature Scan, Final Verdict (FAKE/ORIGINAL/SUSPICIOUS); saves to auditHistory; returns 503 if media_intelligence off
- `GET /api/verifications` - List all past verifications
- `PATCH /api/verifications/:id` - Toggle bookmark (isBookmarked only)
- `DELETE /api/verifications/:id` - Remove a verification
- `POST /api/admin/login` - Admin login (body: { username, password })
- `GET /api/admin/session` - Check admin session status
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/stats` - Admin dashboard stats (requires auth)
- `GET /api/admin/engine` - Get active AI engine (requires auth)
- `POST /api/admin/engine` - Set active AI engine (requires auth)
- `GET /api/admin/monetization` - Get monetization settings (public for pricing display) — returns { paywallEnabled, basicPrice, starterPrice, purePrice, elitePrice }
- `POST /api/admin/monetization` - Save monetization settings (requires auth)
- `GET /api/admin/google-sheets-status` - Admin only; returns { enabled } for Google Sheets integration
- `POST /api/admin/google-sheets-toggle` - Admin only; toggle Google Sheets integration on/off
- `POST /api/sync-to-sheets` - Admin only; export user data when integration is ON
- `GET /api/admin/policy` - Get policy text (requires auth)
- `POST /api/admin/policy` - Save policy text (requires auth)
- `GET /api/verified-tools` - Public; returns tools limited by display limit
- `GET /api/verified-tools/all` - Admin only; returns all verified tools
- `POST /api/verified-tools` - Admin only; add verified tool (body: { name, link })
- `DELETE /api/verified-tools/:id` - Admin only; remove verified tool
- `GET /api/track-click/:id` - Public; increments click count, returns { redirect: url }
- `GET /api/admin/promotion` - Admin only; returns { visibleToolLimit, ppcRate }
- `POST /api/admin/promotion` - Admin only; update promotion config
- `POST /api/submit-ticket` - Public; submit inquiry (body: { name, phone, subject, link, message })
- `GET /api/admin/inquiries` - Admin only; returns all submitted inquiries
- `DELETE /api/admin/inquiries/:id` - Admin only; remove inquiry
- `GET /api/admin/payment-config` - Admin only; returns { currency, stripeKey, activeGateways }
- `POST /api/admin/payment-config` - Admin only; update payment config (body: { currency, stripeKey, activeGateways })
- `POST /api/initiate-payment` - Public; returns checkout URL for plan (body: { plan: "basic"|"pro"|"enterprise" })
- `POST /api/pay-per-report` - Public; returns checkout URL for single report payment
- `POST /api/audit-master` - Public; unified AI audit router (body: { content, type: "news"|"tool" }) returns corporate intelligence audit with global authority score
- `GET /api/get-audit-result/:id` - Public; returns deep intelligence report for verification (id, title, summary, verdict, legal, disclaimer)
- `GET /api/generate-pdf-result/:id` - Public; generates professional PDF report with v5 branding (watermark, founder signature, yellow/black theme), blue verified badge, dark header, score display, flagged claims, sources, legal disclaimer
- `POST /api/generate-tool-pdf` - Public; generates tool audit PDF with v5 branding (body: { toolName, safetyRating, legitimacy, userTrust, riskLevel, details, flags, recommendations })
- `POST /api/generate-media-pdf` - Public; generates media forensic PDF with pixel forensics, HD Clarity Engine, heat-map zones, deepfake/tamper detection, security verdict badge, v5 branding (body: { mediaName, mediaType, forensicScore, verdict, authenticityProbability, aiDetection, pixelForensics, hdClarityEngine, heatMap, tamperCheck, deepfakeDetection, lipSyncAudit, metadata, riskAssessment, details, flags, recommendations })
- `POST /api/generate-audio-pdf` - Public; generates audio forensic PDF with spectrogram analysis, voice audit security badge, speaker analysis, audio quality, v5 branding (body: { audioTitle, platform, duration, transcription, smartSummary, voiceAudit, languageAnalysis, speakerAnalysis, audioQuality, contentClassification, riskAssessment, flags, recommendations })
- `GET /api/sync-official-logos` - Admin only; matches partner tool names against 25+ official brand logos (Google, OpenAI, Meta, etc.) and updates logoUrl in database
- `POST /api/full-audit-report` - Public; deep intelligence audit (body: { content, type: "news"|"tool" }) returns statusMarks, newsChannels, toolInfo/contentInfo, liveStatus, globalAuthorityScore; saves history to config
- `POST /api/system-master-sync` - Admin only; unified sync endpoint for founder profile, partner slider, policy/footer, system status, engine, monetization - all saved permanently
- `POST /api/admin/viral-post` - Admin only; post content to social media (body: { content })
- `GET /api/founder-socials` - Public; returns { linkedin, youtube, facebook } URLs
- `POST /api/admin/founder-socials` - Admin only; update founder social links (body: { linkedin, youtube, facebook })
- `POST /api/upgrade-user` - Public; permanently upgrade user (body: { email, name, plan }) saves to userRegistry
- `GET /api/user-status/:email` - Public; returns user subscription status (status, tier, plan, accessLevel)
- `GET /api/admin/users` - Admin only; returns all registered/upgraded users
- `DELETE /api/admin/users/:email` - Admin only; remove user from registry

## Design Tokens
- Primary color: Yellow (hsl 45 100% 50%)
- Dark background: Dark navy (hsl 222 20% 7%)
- Font: Inter
- Bold, high-contrast branding with yellow accents
- Glassmorphism containers: bg-card/50, backdrop-blur-xl, rounded-[2rem], border-border/50

## Persistent Settings (saved to nexa_config.json on disk)
All admin settings are permanently saved and survive server restarts via `server/config.ts`:
- paymentConfig: { currency, stripeKey, activeGateways } - payment gateway configuration
- systemStatus: { news_engine, tool_auditor, media_intelligence, audio_intelligence } - controls which AI routers are active
- engineSettings: { activeEngine } - selected AI engine
- monetizationSettings: { paywallEnabled, basicPrice, starterPrice, purePrice, elitePrice }
- googleSheetsIntegration: boolean - Google Sheets data export toggle
- promotionConfig: { visibleToolLimit, ppcRate } - partner display limit and pay-per-click rate
- policyText: legal/policy framework text
- teamConfig: { showSection, founder: { name, role, image, socials } } - founder/team display
- dynamicStats: { showStats, newsCount, toolsCount, certType } - stats banner config
- founderSocials: { linkedin, youtube, facebook } - social links
- partnerSection: { theme, scrollingSpeed, showSection } - partner hub display config
- userRegistry: { [email]: { status, tier, plan, accessLevel, joinedDate } } - permanently saved user subscriptions
