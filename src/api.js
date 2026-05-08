import axios from 'axios'
import { API_BASE_DISPLAY, API_ROOT_URL } from './config/apiBase'
import { waitForApiHealth } from './lib/apiClient'

const api = axios.create({
  baseURL: API_ROOT_URL,
  timeout: 15000,
})

api.interceptors.request.use(async (config) => {
  await waitForApiHealth({ retries: 4, retryDelayMs: 700 })

  const token = localStorage.getItem('taxsync.token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config
    const isNetworkError = !error.response

    if (isNetworkError && config && !config.__taxsyncRetried) {
      config.__taxsyncRetried = true
      await waitForApiHealth({ retries: 6, retryDelayMs: 700 })
      return api(config)
    }

    if (isNetworkError) {
      return Promise.reject(new Error(`Cannot reach the TaxSync API (${API_BASE_DISPLAY}). Start the backend and try again.`))
    }

    const message = error.response?.data?.debug?.reason || error.response?.data?.message || error.message
    return Promise.reject(new Error(message))
  },
)

export default api
