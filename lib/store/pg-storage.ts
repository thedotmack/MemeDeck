import { StateStorage } from 'zustand/middleware'

export const createPgStorage = (getAccessToken?: () => Promise<string>): StateStorage => {
  
  let lastSavedValue: string | null = null
  
  const storage: StateStorage = {
    async getItem(key: string): Promise<string | null> {
    try {
      
      let token: string | null = null
      if (getAccessToken) {
        try {
          token = await getAccessToken()
        } catch (error) {
          console.warn('[PgStorage] Could not get access token:', error)
          return null
        }
      }

      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/store/${encodeURIComponent(key)}`, {
        headers
      })

      if (response.status === 404) {
        return null 
      }

      if (!response.ok) {
        throw new Error(`Storage GET failed: ${response.status}`)
      }

      const data = await response.text()
      
      
      lastSavedValue = data || null
      return data || null
    } catch (error) {
      console.error('[PgStorage] Failed to get item:', error)
      return null
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      
      if (lastSavedValue === value) {
        return 
      }
      
      
      let token: string | null = null
      if (getAccessToken) {
        try {
          token = await getAccessToken()
        } catch (error) {
          console.warn('[PgStorage] Could not get access token for save:', error)
          return 
        }
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/store/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers,
        body: value
      })

      if (!response.ok) {
        throw new Error(`Storage POST failed: ${response.status}`)
      }
      
      
      lastSavedValue = value
    } catch (error) {
      console.error('[PgStorage] Failed to set item:', error)
      
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      
      let token: string | null = null
      if (getAccessToken) {
        try {
          token = await getAccessToken()
        } catch (error) {
          console.warn('[PgStorage] Could not get access token for delete:', error)
          return
        }
      }

      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/store/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        throw new Error(`Storage DELETE failed: ${response.status}`)
      }

    } catch (error) {
      console.error('[PgStorage] Failed to remove item:', error)
    }
  }
  }

  return storage
}

