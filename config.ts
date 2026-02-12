import fs from "fs";
import path from "path";

const CONFIG_FILE = path.join(process.cwd(), "nexa_config.json");

interface UserRecord {
  status: string;
  tier: string;
  plan: string;
  accessLevel: number;
  joinedDate: string;
}

interface NexaConfig {
  systemStatus: { news_engine: boolean; tool_auditor: boolean; media_intelligence: boolean; audio_intelligence: boolean };
  promotionConfig: { visibleToolLimit: number; ppcRate: number };
  teamConfig: {
    showSection: boolean;
    founder: {
      name: string;
      role: string;
      image: string;
      socials: { linkedin: string; youtube: string; facebook: string };
    };
  };
  dynamicStats: {
    showStats: boolean;
    newsCount: string;
    toolsCount: string;
    certType: string;
  };
  policyText: string;
  policyStatus: boolean;
  footerText: string;
  engineSettings: { activeEngine: string };
  monetizationSettings: {
    paywallEnabled: boolean;
    basicPrice: string;
    starterPrice: string;
    purePrice: string;
    elitePrice: string;
  };
  googleSheetsIntegration: boolean;
  googleSheetsAuth: {
    oauthClientId: string;
    sheetId: string;
    autoSyncInterval: string;
  };
  paymentConfig: {
    currency: string;
    stripeKey: string;
    activeGateways: string[];
    webhookUrl: string;
    paymentSuccessAction: string;
    currencyLock: boolean;
  };
  founderSocials: { linkedin: string; youtube: string; facebook: string };
  partnerSection: {
    theme: string;
    scrollingSpeed: number;
    showSection: boolean;
  };
  userRegistry: Record<string, UserRecord>;
  auditHistory: any[];
}

const DEFAULT_CONFIG: NexaConfig = {
  systemStatus: { news_engine: true, tool_auditor: true, media_intelligence: true, audio_intelligence: true },
  promotionConfig: { visibleToolLimit: 10, ppcRate: 0.50 },
  teamConfig: {
    showSection: true,
    founder: {
      name: "KANWAR SALLAUHUDDIN ALI KHAN",
      role: "VISIONARY LEAD & FOUNDER | NeXA 11 AI",
      image: "",
      socials: {
        linkedin: "https://linkedin.com/in/yourprofile",
        youtube: "https://youtube.com/@yourchannel",
        facebook: "https://facebook.com/yourpage",
      },
    },
  },
  dynamicStats: {
    showStats: true,
    newsCount: "1.2M+",
    toolsCount: "500+",
    certType: "Official NeXA Authenticity Certificate",
  },
  policyText: `Our Privacy Policy ensures that user data is never stored. NeXA Truth Engine follows International Data Protection Standards (GDPR). All verifications are processed via encrypted AI channels. No personal data is collected, sold, or shared with third parties. By using this service, you agree to our Terms of Service.`,
  policyStatus: true,
  footerText: "Verified by NeXA Truth Engine",
  engineSettings: { activeEngine: "OpenAI GPT-4o" },
  monetizationSettings: {
    paywallEnabled: false,
    basicPrice: "0",
    starterPrice: "10",
    purePrice: "25",
    elitePrice: "49",
  },
  googleSheetsIntegration: false,
  googleSheetsAuth: {
    oauthClientId: "",
    sheetId: "",
    autoSyncInterval: "Instant",
  },
  paymentConfig: {
    currency: "USD",
    stripeKey: "",
    activeGateways: ["Stripe", "GooglePay", "LocalBank"],
    webhookUrl: "",
    paymentSuccessAction: "Unlock_Elite_Features",
    currencyLock: true,
  },
  founderSocials: {
    linkedin: "https://linkedin.com/in/yourprofile",
    youtube: "https://youtube.com/@yourchannel",
    facebook: "https://facebook.com/yourpage",
  },
  partnerSection: {
    theme: "LIGHT",
    scrollingSpeed: 40,
    showSection: true,
  },
  userRegistry: {},
  auditHistory: [],
};

function loadConfig(): NexaConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      const merged = { ...DEFAULT_CONFIG, ...parsed };
      if (merged.systemStatus && merged.systemStatus.media_intelligence === undefined) {
        merged.systemStatus.media_intelligence = true;
      }
      if (merged.systemStatus && merged.systemStatus.audio_intelligence === undefined) {
        merged.systemStatus.audio_intelligence = true;
      }
      if (merged.monetizationSettings) {
        const m = merged.monetizationSettings as any;
        if (m.proPrice && !m.purePrice) {
          m.starterPrice = m.basicPrice || "10";
          m.purePrice = m.proPrice;
          m.basicPrice = "0";
        }
        if (m.enterprisePrice && !m.elitePrice) {
          m.elitePrice = m.enterprisePrice;
        }
        delete m.proPrice;
        delete m.enterprisePrice;
      }
      return merged;
    }
  } catch (err) {
    console.error("Failed to load config, using defaults:", err);
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(config: NexaConfig): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save config:", err);
  }
}

export const config = loadConfig();

export function persistConfig(): void {
  saveConfig(config);
}
