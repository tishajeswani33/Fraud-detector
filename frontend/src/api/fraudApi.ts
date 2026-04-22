/// <reference types="vite/client" />
import axios, { AxiosError } from 'axios'

// Advanced API Client Configuration
// In development, we use Vite's proxy (/api) to avoid CORS issues.
// In production, we point directly to the Render-deployed backend.
// In development and local production, we point to /api/
// since the backend now serves both. Add VITE_API_URL for external deployments.
const BASE_URL = import.meta.env.VITE_API_URL || '/api/'

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
})

export interface PredictResponse {
  text: string
  label: 'fraud' | 'legitimate'
  fraud_probability: number
  legitimate_probability: number
  confidence: number
  inference_ms: number
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE'
  signals: string[]
  extracted_urls?: string[]
  model_version: string
}

export interface PredictRequest {
  text: string
}

export interface HealthResponse {
  status: string
  model_loaded: boolean
  tfidf_loaded: boolean
  bundle_loaded: boolean
  model_version: string | null
}

export interface AnalyticsResponse {
  total_scans: number
  fraud_detected: number
  avg_inference_ms: number
  risk_distribution: Record<string, number>
  status: string
}

export async function predictText(text: string): Promise<PredictResponse> {
  try {
    const { data } = await client.post<PredictResponse>('predict', { text })
    return data
  } catch (err) {
    const axiosErr = err as AxiosError<{ detail: string }>
    const detail = axiosErr.response?.data?.detail
    if (detail) throw new Error(detail)
    if (axiosErr.message) throw new Error(axiosErr.message)
    throw new Error('Failed to reach fraud detection API')
  }
}

export async function checkHealth(): Promise<HealthResponse> {
  try {
    const { data } = await client.get<HealthResponse>('health')
    return data
  } catch {
    return {
      status: 'offline',
      model_loaded: false,
      tfidf_loaded: false,
      bundle_loaded: false,
      model_version: null
    }
  }
}

export async function getAnalytics(): Promise<AnalyticsResponse> {
  const { data } = await client.get<AnalyticsResponse>('system-metrics')
  return data
}

export async function predictBatch(texts: string[]): Promise<PredictResponse[]> {
  try {
    const requests = texts.map(t => ({ text: t }))
    const { data } = await client.post<PredictResponse[]>('predict/batch', requests)
    return data
  } catch (err) {
    const axiosErr = err as AxiosError<{ detail: string }>
    const detail = axiosErr.response?.data?.detail
    if (detail) throw new Error(detail)
    if (axiosErr.message) throw new Error(axiosErr.message)
    throw new Error('Failed to reach fraud detection API (batch)')
  }
}
