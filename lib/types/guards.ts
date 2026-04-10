


export const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

const hasString = <K extends string>(v: unknown, k: K): v is Record<K, string> => isRecord(v) && typeof (v as Record<string, unknown>)[k] === 'string'

export function safeJsonParse<T>(raw: string, validate: (v: unknown) => v is T): T | null {
  try { const parsed = JSON.parse(raw); return validate(parsed) ? parsed : null } catch { return null }
}


export interface StoredReferralCode { code: string; detectedAt: number; appliedAt?: number }
export function isStoredReferralCode(v: unknown): v is StoredReferralCode {
  if (!isRecord(v) || !hasString(v, 'code')) return false
  return typeof (v as Record<string, unknown>).detectedAt === 'number'
}


export interface TTSCacheEntry {
  textHash: string
  voiceId: string
  filePath: string
  duration: number
  timestamps: { characters: string[]; characterStartTimes: number[]; characterEndTimes: number[] }
  fileSize: number
  createdAt: number
  version: string
}
export function isTTSCacheEntry(v: unknown): v is TTSCacheEntry {
  if (!isRecord(v)) return false
  if (!hasString(v, 'textHash') || !hasString(v, 'voiceId') || !hasString(v, 'filePath') || !hasString(v, 'version')) return false
  const rec = v as Record<string, unknown>
  if (typeof rec.duration !== 'number' || typeof rec.fileSize !== 'number' || typeof rec.createdAt !== 'number') return false
  const ts = rec.timestamps
  if (!isRecord(ts)) return false
  return Array.isArray((ts as Record<string, unknown>).characters) &&
    Array.isArray((ts as Record<string, unknown>).characterStartTimes) &&
    Array.isArray((ts as Record<string, unknown>).characterEndTimes)
}


interface BalanceEntry { uiAmount?: number; amount?: number }
type BalancesMap = Record<string, BalanceEntry>
export function isBalancesMap(v: unknown): v is BalancesMap {
  if (!isRecord(v)) return false
  return Object.values(v).every(entry => isRecord(entry))
}


type JupiterMessage =
  | { type: 'prices'; data: Array<{ assetId: string; price: number }> }
  | { type: 'updates'; data: unknown[] }
  | { type: 'pool_update'; data: unknown }

export function isJupiterMessage(v: unknown): v is JupiterMessage {
  if (!isRecord(v) || !hasString(v, 'type')) return false
  const type = v.type
  if (type === 'prices' || type === 'updates') return Array.isArray((v as Record<string, unknown>).data)
  if (type === 'pool_update') return 'data' in v
  return false
}


interface PythPriceMessage { parsed?: Array<{ id?: string; price?: { price?: number; expo?: number } }> }
export function isPythPriceMessage(v: unknown): v is PythPriceMessage {
  if (!isRecord(v)) return false
  if (!('parsed' in v)) return true
  const parsed = (v as Record<string, unknown>).parsed
  return Array.isArray(parsed)
}


interface ActivityTokenShape {
  tokenId?: string;
  symbol?: string;
  name?: string;
  price?: number;
  icon?: string;
  liquidity?: number;
  volume24h?: number;
  createdAt?: string;
  oneMinGain?: number;
  twoMinGain?: number;
  threeMinGain?: number;
  fourMinGain?: number;
  fiveMinGain?: number;
  updatesPerMinute?: number;
  signal?: string;
  buyPressure5m?: number;
  winRate?: number;
  tokenBeingAnalyzed?: boolean;
  firstSeen?: number;
}
interface JupiterActivityMessage { type: 'update'; data: ActivityTokenShape[]; timestamp: number }
export function isJupiterActivityMessage(v: unknown): v is JupiterActivityMessage {
  if (!isRecord(v)) return false
  if ((v as Record<string, unknown>).type !== 'update') return false
  if (!Array.isArray((v as Record<string, unknown>).data)) return false
  if (typeof (v as Record<string, unknown>).timestamp !== 'number') return false
  return true
}


