import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/app/api/data-store'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const role = request.headers.get('x-user-role')

  if (role !== 'APPROVER') {
    return NextResponse.json(
      { error: 'Only APPROVER can export cases' },
      { status: 403 }
    )
  }

  const caseItem = dataStore.getCase(id)
  if (!caseItem) {
    return NextResponse.json(
      { error: 'Case not found' },
      { status: 404 }
    )
  }

  if (caseItem.status !== 'APPROVED') {
    return NextResponse.json(
      { error: 'Can only export approved cases' },
      { status: 403 }
    )
  }

  // In a real implementation, this would generate a ZIP file
  // For now, we'll return a mock path
  const exportData = {
    path: `/exports/case-${id}-export.zip`,
    caseId: id,
    exportedAt: new Date().toISOString(),
  }

  return NextResponse.json(exportData)
}
