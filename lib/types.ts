import type { RiskReport } from '@/lib/core/risk'

export interface ClickInfo {
  device: string
  browser: string
  os: string
  referrer: string
}

export interface CreatedLinkResponse {
  code: string
  shortUrl: string
  url: string
  isCustom: boolean
  expiresAt: string | null
  createdAt: string
  risk: RiskReport
}

export interface RecentLink {
  code: string
  url: string
  isCustom: boolean
  riskScore: number
  clickCount: number
  createdAt: string
  expiresAt: string | null
}

export interface RiskCheckResponse extends RiskReport {
  url: string
  blocked: boolean
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown }
}
