/// <reference types="vite/client" />
import axios, { AxiosError } from 'axios'

const BASE_URL = import.meta.env.DEV
  ? 'http://localhost:8000'
  : 'https://fraud-detector-3-s47q.onrender.com'

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

export interface PredictResponse {
  text: string
  label: 'fraud' | 'legitimate'
  fraud_probability: number
  legitimate_probability: number
  confidence: number
  inference_ms: number
}

export interface PredictRequest {
  text: string
}

export async function predictText(text: string): Promise<PredictResponse> {
  try {
    const { data } = await client.post<PredictResponse>('/predict', { text })
    return data
  } catch (err) {
    const axiosErr = err as AxiosError<{ detail: string }>
    const detail = axiosErr.response?.data?.detail
    if (detail) throw new Error(detail)
    if (axiosErr.message) throw new Error(axiosErr.message)
    throw new Error('Failed to reach fraud detection API')
  }
}

export async function checkHealth(): Promise<{
  status: string
  model_loaded: boolean
  tfidf_loaded: boolean
}> {
  const { data } = await client.get('/health')
  return data
}

export async function predictBatch(texts: string[]): Promise<PredictResponse[]> {
  try {
    const requests = texts.map(t => ({ text: t }))
    const { data } = await client.post<PredictResponse[]>('/predict/batch', requests)
    return data
  } catch (err) {
    const axiosErr = err as AxiosError<{ detail: string }>
    const detail = axiosErr.response?.data?.detail
    if (detail) throw new Error(detail)
    if (axiosErr.message) throw new Error(axiosErr.message)
    throw new Error('Failed to reach fraud detection API (batch)')
  }
}
