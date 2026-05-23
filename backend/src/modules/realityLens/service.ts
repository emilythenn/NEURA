import { GoogleGenAI } from "@google/genai";
import type {
  RealityLensScanRequest,
  RealityLensScanResponse,
  RealityLensState,
} from "./types";

let geminiAI: GoogleGenAI | null = null;

export function setGeminiAI(client: GoogleGenAI | null) {
  geminiAI = client;
}

function normalizeLabel(raw?: string): string {
  return (raw || "").trim().toLowerCase();
}

function slugifyForPlatformSearch(value: string): string {
  return encodeURIComponent(value.trim().replace(/\s+/g, " "));
}

function buildMarketplaceUrl(platform: "Lazada" | "Shopee", productName: string): string {
  const keyword = slugifyForPlatformSearch(productName || "product");
  return platform === "Lazada"
    ? `https://www.lazada.com.my/catalog/?q=${keyword}`
    : `https://shopee.com.my/search?keyword=${keyword}`;
}

function buildFallbackScanResponse(state: RealityLensState, req: RealityLensScanRequest, reason: string): RealityLensScanResponse {
  const productName = normalizeLabel(req.label || req.attachmentLabel || "Default scan result") || "default scan result";
  const storePrice = Number(req.overridePrice || 149.9);
  const onlinePrice = Math.max(1, Math.round(storePrice * 0.88));
  const savings = Math.max(0, storePrice - onlinePrice);
  const impactPct = storePrice > 0 ? (storePrice / Math.max(1, state.discretionaryBudget)) * 100 : 0;
  const impactLevel: RealityLensScanResponse["budgetImpact"]["level"] =
    impactPct >= 100 ? "CRITICAL" : impactPct >= 80 ? "HIGH" : impactPct >= 50 ? "MODERATE" : "LOW";
  const impactColor = impactLevel === "CRITICAL" || impactLevel === "HIGH" ? "🔴" : impactLevel === "MODERATE" ? "🟡" : "🟢";

  return {
    matchedProduct: productName,
    detectedLabel: productName,
    details: {
      name: productName,
      storePrice,
      onlinePrice,
      onlineSourceName: "Default market estimate",
      onlineSourceUrl: buildMarketplaceUrl("Lazada", productName),
      category: "General",
      halalStatus: "Review manually",
      shariahAudit: `Default scan response used because the live vision scan was unavailable (${reason}).`,
      marketplaceComparisons: defaultMarketplaceComparisons(productName, onlinePrice),
    },
    verdict: {
      status: savings > 0 ? "EXPENSIVE" : "FAIR",
      badgeColor: savings > 0 ? "🔴" : "🟢",
      message: savings > 0 ? `You may be overpaying by RM ${savings.toFixed(2)}.` : "Price looks aligned with market estimate.",
      overpayAmount: savings,
    },
    savings,
    budgetImpact: {
      category: "General",
      level: impactLevel,
      remaining: state.discretionaryBudget,
      impactPct,
      message: `This purchase uses about ${Math.round(impactPct)}% of your Wants budget.`,
      color: impactColor,
    },
    timeValue: {
      hours: Math.max(1, Math.round(storePrice / 25)),
      statement: `This purchase equals about ${Math.max(1, Math.round(storePrice / 25))} hours of work at RM 25/hour.`,
    },
    shariahShield: {
      status: "Default response",
      message: "Live scan was unavailable, so the system returned a default result.",
      safeToProceed: true,
    },
    bottomSheetActions: {
      canSaveDifference: savings > 0,
      canDelayLock: true,
      canProceedSafely: true,
      suggestedTransferAmount: onlinePrice,
    },
    coolingSeconds: 15,
  };
}

function defaultMarketplaceComparisons(productName: string, onlinePrice: number) {
  const lazadaPrice = Math.max(1, Math.round(onlinePrice * 1.02));
  const shopeePrice = Math.max(1, Math.round(onlinePrice * 0.98));

  return [
    {
      platform: "Lazada" as const,
      price: lazadaPrice,
      url: buildMarketplaceUrl("Lazada", productName),
    },
    {
      platform: "Shopee" as const,
      price: shopeePrice,
      url: buildMarketplaceUrl("Shopee", productName),
    },
  ];
}

function ensureGeminiConfigured() {
  if (!process.env.GEMINI_API_KEY || !geminiAI) {
    throw new Error("Gemini API key is not configured. Please set GEMINI_API_KEY in the backend.");
  }
}

export async function scanRealityLens(
  req: RealityLensScanRequest,
  state: RealityLensState,
): Promise<RealityLensScanResponse> {
  if (!req.imageBase64) {
    throw new Error("Capture a live image before scanning.");
  }
  if (!process.env.GEMINI_API_KEY || !geminiAI) {
    return buildFallbackScanResponse(state, req, "Gemini not configured");
  }
  const activeGemini = geminiAI!;

  const hourlyRate = req.hourlyRate && req.hourlyRate > 0 ? req.hourlyRate : 25;
  const prompt = `You are SmartScan AI for a banking app.
Analyze the shopping image and return STRICT JSON only.
Your job is to identify the actual item and estimate a conservative, generic market price.
Do not invent a premium brand, sport edition, bundle, or luxury version unless it is clearly visible in the image.
If the item is common and unbranded, prefer the lowest normal retail price range from everyday local marketplace listings.

Required fields:
{
  "detectedLabel": "short product name or investment flyer name",
  "details": {
    "name": "clear product name",
    "storePrice": 1499,
    "onlinePrice": 1150,
    "onlineSourceName": "market average or marketplace name",
    "onlineSourceUrl": "https://example.com/proof-link",
    "category": "category name",
    "halalStatus": "brief halal or ethical status",
    "shariahAudit": "one sentence ethics note",
    "marketplaceComparisons": [
      { "platform": "Lazada", "price": 1150, "url": "https://example.com/lazada-proof" },
      { "platform": "Shopee", "price": 1129, "url": "https://example.com/shopee-proof" }
    ]
  },
  "verdict": {
    "status": "EXPENSIVE|FAIR|CHEAPER_IN_STORE",
    "badgeColor": "🔴|🟡|🟢",
    "message": "one sentence verdict",
    "overpayAmount": 349
  },
  "budgetImpact": {
    "category": "category name",
    "level": "LOW|MODERATE|HIGH|CRITICAL",
    "remaining": ${state.discretionaryBudget},
    "impactPct": 0,
    "message": "one sentence budget note",
    "color": "🔴|🟡|🟢"
  },
  "timeValue": {
    "hours": 35,
    "statement": "one sentence time-value note using RM ${hourlyRate}/hour"
  },
  "shariahShield": {
    "status": "brief halal/ethical status",
    "message": "one sentence shariah note",
    "safeToProceed": true
  }
}

Rules:
- Use storePrice and onlinePrice as positive numbers.
- Estimate the normal market price for the exact visible item, not a premium variant.
- For common unbranded items like water bottles, mugs, lunch boxes, pens, or basic household goods, stay conservative and use a generic market estimate rather than a branded premium estimate.
- If the item appears to be a generic bottle or drinkware, do not price it like a sports, insulated, smart, or branded bottle unless those features are visible.
- Include a real platform proof URL in onlineSourceUrl and two marketplace comparisons with platform, price, and url.
- If price is missing, estimate conservatively from everyday marketplace listings.
- If the item is a suspicious investment flyer, set verdict.status to EXPENSIVE, category to Investment, and shariahShield.safeToProceed to false.
- Keep all text concise.
`;

  try {
    const responsePromise = activeGemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: req.imageBase64,
          },
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Reality Lens scan timed out after 12 seconds.")), 12000);
    });

    const response = await Promise.race([responsePromise, timeoutPromise]);

    const parsed = response.text ? JSON.parse(response.text) : null;
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Gemini returned invalid scan JSON.");
    }

    const storePrice = Number(parsed?.details?.storePrice || req.overridePrice || 0) || 0;
    const onlinePrice = Number(parsed?.details?.onlinePrice || Math.max(1, Math.round(storePrice * 0.85))) || 1;
    const savings = Math.max(0, storePrice - onlinePrice);
    const impactPct = storePrice > 0 ? (storePrice / Math.max(1, state.discretionaryBudget)) * 100 : 0;
    const impactLevel: RealityLensScanResponse["budgetImpact"]["level"] =
      impactPct >= 100 ? "CRITICAL" : impactPct >= 80 ? "HIGH" : impactPct >= 50 ? "MODERATE" : "LOW";
    const impactColor = impactLevel === "CRITICAL" || impactLevel === "HIGH" ? "🔴" : impactLevel === "MODERATE" ? "🟡" : "🟢";

    return {
      matchedProduct: normalizeLabel(parsed.detectedLabel || parsed?.details?.name || "product"),
      detectedLabel: normalizeLabel(parsed.detectedLabel || parsed?.details?.name || "product"),
      details: {
        name: parsed?.details?.name || parsed.detectedLabel || "Unknown Product",
        storePrice,
        onlinePrice,
        onlineSourceName: parsed?.details?.onlineSourceName || "Gemini market estimate",
        onlineSourceUrl: parsed?.details?.onlineSourceUrl || buildMarketplaceUrl("Lazada", parsed?.details?.name || parsed.detectedLabel || "product"),
        category: parsed?.details?.category || "General",
        halalStatus: parsed?.details?.halalStatus || "Review manually",
        shariahAudit: parsed?.details?.shariahAudit || "Scan result generated from Gemini 2.5 Flash.",
        marketplaceComparisons: Array.isArray(parsed?.details?.marketplaceComparisons) && parsed.details.marketplaceComparisons.length
          ? parsed.details.marketplaceComparisons.map((item: any) => ({
              platform: item.platform === "Shopee" ? "Shopee" : "Lazada",
              price: Number(item.price || onlinePrice),
              url: String(item.url || buildMarketplaceUrl(item.platform === "Shopee" ? "Shopee" : "Lazada", parsed?.details?.name || parsed.detectedLabel || "product")),
            }))
          : defaultMarketplaceComparisons(parsed?.details?.name || parsed.detectedLabel || "product", onlinePrice),
      },
      verdict: {
        status: parsed?.verdict?.status || (savings > 0 ? "EXPENSIVE" : "FAIR"),
        badgeColor: parsed?.verdict?.badgeColor || (savings > 0 ? "🔴" : "🟢"),
        message: parsed?.verdict?.message || (savings > 0 ? `You are overpaying by RM ${savings.toFixed(2)}.` : "Price looks aligned with market estimate."),
        overpayAmount: Number(parsed?.verdict?.overpayAmount || savings),
      },
      savings,
      budgetImpact: {
        category: parsed?.budgetImpact?.category || parsed?.details?.category || "General",
        level: parsed?.budgetImpact?.level || impactLevel,
        remaining: state.discretionaryBudget,
        impactPct: Number(parsed?.budgetImpact?.impactPct || impactPct),
        message: parsed?.budgetImpact?.message || `This will use about ${Math.round(impactPct)}% of your Wants budget.`,
        color: parsed?.budgetImpact?.color || impactColor,
      },
      timeValue: {
        hours: Number(parsed?.timeValue?.hours || Math.max(1, Math.round(storePrice / hourlyRate))),
        statement: parsed?.timeValue?.statement || `This purchase equals ${Math.max(1, Math.round(storePrice / hourlyRate))} hours of work at RM ${hourlyRate}/hour.`,
      },
      shariahShield: {
        status: parsed?.shariahShield?.status || "Review complete",
        message: parsed?.shariahShield?.message || "Shariah guidance generated by Gemini vision analysis.",
        safeToProceed: Boolean(parsed?.shariahShield?.safeToProceed ?? true),
      },
      bottomSheetActions: {
        canSaveDifference: savings > 0,
        canDelayLock: true,
        canProceedSafely: Boolean(parsed?.shariahShield?.safeToProceed ?? true),
        suggestedTransferAmount: onlinePrice,
      },
      coolingSeconds: 15,
    };
  } catch (error: any) {
    console.error("Reality lens Gemini scan failed:", error);
    const message = String(error?.message || error || "");
    const reason = message.includes("timed out")
      ? "scan timeout"
      : message.includes("Unable to process input image")
        ? "invalid input image"
        : message || "Gemini scan failure";

    return buildFallbackScanResponse(state, req, reason);
  }
}

export function saveDifference(state: RealityLensState, amount: number) {
  if (!(amount > 0) || state.totalBalance < amount) {
    return { success: false, error: "Unable to deposit money to Mudharabah vault." };
  }

  state.totalBalance -= amount;
  const vault = state.lockedVaults.find((v) => v.id === "v-1");
  if (vault) {
    vault.amount += amount;
  }

  return { success: true, state };
}

export function delayLock(state: RealityLensState, amount: number) {
  if (!(amount > 0) || state.totalBalance < amount) {
    return { success: false, error: "Insufficient balance to lock in Delay Vault." };
  }

  state.totalBalance -= amount;
  const vault = state.lockedVaults.find((v) => v.id === "v-2");
  if (vault) {
    vault.amount += amount;
  }

  return { success: true, state };
}