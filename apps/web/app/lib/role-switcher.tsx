'use client'

import { useAuth } from '@/app/lib/auth-context'

export function RoleSwitcher() {
  const { role, email, setRole } = useAuth()

  return (
    <div style={{ position: 'fixed', top: '10px', right: '10px', background: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
      <label htmlFor="role-select">Role: </label>
      <select 
        id="role-select"
        value={role} 
        onChange={(e) => setRole(e.target.value as 'AUTHOR' | 'APPROVER')}
        style={{ padding: '5px', marginLeft: '5px' }}
      >
        <option value="AUTHOR">AUTHOR (author@test.com)</option>
        <option value="APPROVER">APPROVER (approver@test.com)</option>
      </select>
      <div style={{ marginTop: '5px', fontSize: '12px' }}>
        Current: {email}
      </div>
    </div>
  )
}
