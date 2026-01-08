'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/lib/auth-context'
import { apiFetch } from '@/app/lib/api-fetch'
import Link from 'next/link'

interface Case {
  id: string
  title: string
  status: 'DRAFT' | 'REVIEW' | 'APPROVED'
  createdBy: string
  createdAt: string
}

export default function CaseListPage() {
  const { email, role } = useAuth()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCases() {
      try {
        setLoading(true)
        const response = await apiFetch('/api/cases', {
          method: 'GET',
          email,
          role,
        })
        const data = await response.json()
        setCases(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch cases')
      } finally {
        setLoading(false)
      }
    }

    fetchCases()
  }, [email, role])

  if (loading) return <div>Loading cases...</div>
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>

  return (
    <div>
      <h1>Case List</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <Link href="/cases/new">
          <button style={{ padding: '10px 20px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Create New Case
          </button>
        </Link>
      </div>

      {cases.length === 0 ? (
        <p>No cases found. Create your first case!</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Title</th>
              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Created By</th>
              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Created At</th>
              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((caseItem) => (
              <tr key={caseItem.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{caseItem.id}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{caseItem.title}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: caseItem.status === 'APPROVED' ? '#4caf50' : caseItem.status === 'REVIEW' ? '#ff9800' : '#9e9e9e',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    {caseItem.status}
                  </span>
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{caseItem.createdBy}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {new Date(caseItem.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <Link href={`/cases/${caseItem.id}`}>
                    <button style={{ padding: '5px 10px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      View
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
