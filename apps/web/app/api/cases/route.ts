import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/app/api/data-store'

export async function GET(request: NextRequest) {
  // Return all cases
  const cases = dataStore.getCases()
  return NextResponse.json(cases)
}

export async function POST(request: NextRequest) {
  const email = request.headers.get('x-user-email')
  const role = request.headers.get('x-user-role')

  if (role !== 'AUTHOR') {
    return NextResponse.json(
      { error: 'Only AUTHOR can create cases' },
      { status: 403 }
    )
  }

  const body = await request.json()
  const newCase = dataStore.createCase(
    body.title,
    body.description,
    email || 'unknown'
  )

  return NextResponse.json(newCase, { status: 201 })
}
