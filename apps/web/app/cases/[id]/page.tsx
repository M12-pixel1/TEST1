'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/app/lib/auth-context'
import { apiFetch } from '@/app/lib/api-fetch'
import Link from 'next/link'

interface Case {
  id: string
  title: string
  description: string
  status: 'DRAFT' | 'REVIEW' | 'APPROVED'
  createdBy: string
  createdAt: string
  attachments: Array<{
    id: string
    filename: string
    uploadedAt: string
  }>
}

export default function CaseDetailPage() {
  const params = useParams()
  const caseId = params.id as string
  const { email, role } = useAuth()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)

  const fetchCase = async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/cases/${caseId}`, {
        method: 'GET',
        email,
        role,
      })
      const data = await response.json()
      setCaseData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch case')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCase()
  }, [caseId, email, role])

  const handleStatusChange = async (newStatus: 'REVIEW' | 'APPROVED') => {
    try {
      setActionLoading(true)
      await apiFetch(`/api/cases/${caseId}/status`, {
        method: 'PATCH',
        email,
        role,
        body: JSON.stringify({ status: newStatus }),
      })
      await fetchCase()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    try {
      setUploadLoading(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/cases/${caseId}/attachments`, {
        method: 'POST',
        headers: {
          'x-user-email': email,
          'x-user-role': role,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      setFile(null)
      await fetchCase()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload attachment')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setActionLoading(true)
      const response = await apiFetch(`/api/cases/${caseId}/export`, {
        method: 'POST',
        email,
        role,
      })
      
      const data = await response.json()
      
      // Download the file
      if (data.path) {
        const downloadResponse = await fetch(data.path)
        const blob = await downloadResponse.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `case-${caseId}-export.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export case')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div>Loading case...</div>
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>
  if (!caseData) return <div>Case not found</div>

  const isApproved = caseData.status === 'APPROVED'
  const isAuthor = role === 'AUTHOR'
  const isApprover = role === 'APPROVER'

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/">
          <button style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            ← Back to Case List
          </button>
        </Link>
      </div>

      <h1>Case Details</h1>
      
      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '4px', marginBottom: '20px' }}>
        <p><strong>ID:</strong> {caseData.id}</p>
        <p><strong>Title:</strong> {caseData.title}</p>
        <p><strong>Description:</strong> {caseData.description}</p>
        <p>
          <strong>Status:</strong>{' '}
          <span style={{
            padding: '4px 8px',
            borderRadius: '4px',
            background: caseData.status === 'APPROVED' ? '#4caf50' : caseData.status === 'REVIEW' ? '#ff9800' : '#9e9e9e',
            color: 'white',
            fontSize: '14px'
          }}>
            {caseData.status}
          </span>
        </p>
        <p><strong>Created By:</strong> {caseData.createdBy}</p>
        <p><strong>Created At:</strong> {new Date(caseData.createdAt).toLocaleString()}</p>
      </div>

      {/* Status Change Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <h2>Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* DRAFT -> REVIEW (AUTHOR) */}
          {isAuthor && caseData.status === 'DRAFT' && (
            <button
              onClick={() => handleStatusChange('REVIEW')}
              disabled={actionLoading}
              style={{
                padding: '10px 20px',
                background: actionLoading ? '#ccc' : '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: actionLoading ? 'not-allowed' : 'pointer'
              }}
            >
              Submit for Review
            </button>
          )}

          {/* REVIEW -> APPROVED (APPROVER) */}
          {isApprover && caseData.status === 'REVIEW' && (
            <button
              onClick={() => handleStatusChange('APPROVED')}
              disabled={actionLoading}
              style={{
                padding: '10px 20px',
                background: actionLoading ? '#ccc' : '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: actionLoading ? 'not-allowed' : 'pointer'
              }}
            >
              Approve
            </button>
          )}

          {/* Export (APPROVER, APPROVED only) */}
          {isApprover && isApproved && (
            <button
              onClick={handleExport}
              disabled={actionLoading}
              style={{
                padding: '10px 20px',
                background: actionLoading ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: actionLoading ? 'not-allowed' : 'pointer'
              }}
            >
              Export Case
            </button>
          )}
        </div>
      </div>

      {/* Attachments */}
      <div style={{ marginBottom: '20px' }}>
        <h2>Attachments</h2>
        {caseData.attachments && caseData.attachments.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {caseData.attachments.map((attachment) => (
              <li key={attachment.id} style={{ padding: '10px', background: '#f0f0f0', marginBottom: '5px', borderRadius: '4px' }}>
                <strong>{attachment.filename}</strong> - Uploaded at {new Date(attachment.uploadedAt).toLocaleString()}
              </li>
            ))}
          </ul>
        ) : (
          <p>No attachments</p>
        )}
      </div>

      {/* Upload Form (AUTHOR only, not approved) */}
      {isAuthor && !isApproved && (
        <div>
          <h2>Upload Attachment</h2>
          <form onSubmit={handleUpload} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
              style={{ padding: '10px' }}
            />
            <button
              type="submit"
              disabled={uploadLoading || !file}
              style={{
                padding: '10px 20px',
                background: uploadLoading || !file ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: uploadLoading || !file ? 'not-allowed' : 'pointer'
              }}
            >
              {uploadLoading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </div>
      )}

      {isApproved && (
        <div style={{ background: '#fff3cd', padding: '10px', borderRadius: '4px', marginTop: '20px' }}>
          <strong>Note:</strong> This case is approved. Editing and uploading are disabled.
        </div>
      )}
    </div>
  )
}
