import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/app/api/data-store'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const caseItem = dataStore.getCase(id)
  
  if (!caseItem) {
    return NextResponse.json(
      { error: 'Case not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(caseItem)
}
