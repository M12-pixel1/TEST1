'use client'

import { useState } from 'react'
import { useAuth } from '@/app/lib/auth-context'
import { apiFetch } from '@/app/lib/api-fetch'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewCasePage() {
  const { email, role } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (role !== 'AUTHOR') {
      setError('Only AUTHOR can create cases')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await apiFetch('/api/cases', {
        method: 'POST',
        email,
        role,
        body: JSON.stringify({ title, description }),
      })
      
      const data = await response.json()
      router.push(`/cases/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case')
    } finally {
      setLoading(false)
    }
  }

  if (role !== 'AUTHOR') {
    return (
      <div>
        <h1>Create New Case</h1>
        <p style={{ color: 'red' }}>Only AUTHOR role can create cases. Please switch to AUTHOR role.</p>
        <Link href="/">
          <button style={{ padding: '10px 20px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Back to Case List
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1>Create New Case</h1>
      
      {error && <div style={{ color: 'red', marginBottom: '20px' }}>Error: {error}</div>}
      
      <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="title" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Description *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={6}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: loading ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creating...' : 'Create Case'}
          </button>
          
          <Link href="/">
            <button
              type="button"
              style={{
                padding: '10px 20px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </Link>
        </div>
      </form>
    </div>
  )
}
