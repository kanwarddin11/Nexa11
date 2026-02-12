import { db } from "./db";
import { verifications, verifiedTools } from "@shared/schema";

export async function seedDatabase() {
  const existingTools = await db.select().from(verifiedTools).limit(1);
  if (existingTools.length === 0) {
    await db.insert(verifiedTools).values([
      { name: "Gemini Pro", link: "https://gemini.google.com", clicks: 0, status: "Verified" },
      { name: "OpenAI Sora", link: "https://openai.com/sora", clicks: 0, status: "Verified" },
      { name: "Claude AI", link: "https://claude.ai", clicks: 0, status: "Verified" },
      { name: "Midjourney", link: "https://midjourney.com", clicks: 0, status: "Verified" },
      { name: "Perplexity AI", link: "https://perplexity.ai", clicks: 0, status: "Verified" },
      { name: "Runway ML", link: "https://runwayml.com", clicks: 0, status: "Verified" },
    ]);
  }

  const existing = await db.select().from(verifications).limit(1);
  if (existing.length > 0) return;

  await db.insert(verifications).values([
    {
      inputText: "Scientists discover high levels of microplastics in bottled water brands worldwide, with studies showing up to 240,000 particles per liter.",
      inputType: "text",
      originSource: "User Provided Text",
      verdict: "Mostly True - Supported by Research",
      credibilityScore: 82,
      seoKeyword: "Verified News 2026",
      summary: "Multiple peer-reviewed studies, including a major 2024 study published in the Proceedings of the National Academy of Sciences, have confirmed the presence of significant microplastic contamination in bottled water. The 240,000 figure aligns with recent nanoplastics research findings.",
      sources: [
        "PNAS Study on Nanoplastics in Bottled Water (2024)",
        "WHO Report on Microplastics in Drinking Water",
        "Environmental Science & Technology Letters"
      ],
      claimsAnalyzed: [
        "High levels of microplastics found in bottled water - Verified",
        "Up to 240,000 particles per liter - Consistent with PNAS study",
        "Worldwide occurrence - Confirmed across multiple brands and countries"
      ],
      flaggedClaims: [],
      isBookmarked: true,
    },
    {
      inputText: "Eating chocolate before bed helps you lose weight faster by boosting overnight metabolism by 300%.",
      inputType: "text",
      originSource: "User Provided Text",
      verdict: "False - No Scientific Basis",
      credibilityScore: 12,
      seoKeyword: "Fake News Detection 2026",
      summary: "There is no credible scientific evidence supporting the claim that eating chocolate before bed boosts metabolism by 300% or leads to weight loss. While dark chocolate contains compounds with minor metabolic effects, consuming it before sleep is more likely to contribute to weight gain due to caloric intake and sleep disruption.",
      sources: [
        "Mayo Clinic - Metabolism and Weight Loss Facts",
        "National Sleep Foundation - Food and Sleep Guidelines",
        "American Journal of Clinical Nutrition"
      ],
      claimsAnalyzed: [
        "Chocolate boosts metabolism - Highly exaggerated",
        "300% metabolic increase - No supporting evidence",
        "Eating before bed aids weight loss - Contradicts established nutrition science"
      ],
      flaggedClaims: [
        "300% metabolism boost is a fabricated statistic with no scientific backing",
        "Eating high-calorie foods before sleep generally promotes weight gain",
        "The claim appears designed to promote chocolate products"
      ],
      isBookmarked: false,
    },
    {
      inputText: "The Eiffel Tower grows approximately 6 inches taller during summer due to thermal expansion of iron.",
      inputType: "text",
      originSource: "User Provided Text",
      verdict: "True - Well-Documented Phenomenon",
      credibilityScore: 95,
      seoKeyword: "Fact Check 2026",
      summary: "This is a well-documented physical phenomenon. The Eiffel Tower is made of iron, which expands when heated. During hot summer days, the tower can grow by approximately 6 inches (15 cm) due to thermal expansion. This is confirmed by the official Eiffel Tower website and physics principles.",
      sources: [
        "Official Eiffel Tower Website - Technical Documentation",
        "Physics Today - Thermal Expansion in Structures",
        "Smithsonian Magazine"
      ],
      claimsAnalyzed: [
        "Tower grows in summer - Verified physical phenomenon",
        "Approximately 6 inches of growth - Accurate measurement",
        "Caused by thermal expansion of iron - Correct scientific explanation"
      ],
      flaggedClaims: [],
      isBookmarked: true,
    },
    {
      inputText: "5G cell towers are responsible for causing COVID-19 and were deployed as a bioweapon by global elites.",
      inputType: "text",
      originSource: "User Provided Text",
      verdict: "False - Debunked Conspiracy Theory",
      credibilityScore: 3,
      seoKeyword: "AI Truth 2026",
      summary: "This is a thoroughly debunked conspiracy theory with no scientific basis. COVID-19 is caused by the SARS-CoV-2 virus, not radio waves. 5G technology operates on radio frequencies that cannot create or spread viruses. Multiple international health organizations and scientific bodies have confirmed there is no connection between 5G and COVID-19.",
      sources: [
        "World Health Organization - COVID-19 Origins",
        "IEEE - 5G Technology Safety Assessment",
        "Full Fact - 5G Conspiracy Debunking"
      ],
      claimsAnalyzed: [
        "5G causes COVID-19 - Completely false",
        "Deployed as bioweapon - Conspiracy theory with no evidence",
        "Global elites orchestrated it - Unfounded claim"
      ],
      flaggedClaims: [
        "5G radio frequencies cannot create or transmit biological viruses",
        "COVID-19 is caused by SARS-CoV-2 virus, identified and sequenced by multiple labs worldwide",
        "The bioweapon claim contradicts all available scientific evidence"
      ],
      isBookmarked: false,
    },
  ]);
}
