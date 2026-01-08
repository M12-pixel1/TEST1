import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/app/api/data-store'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const email = request.headers.get('x-user-email')
  const role = request.headers.get('x-user-role')
  const body = await request.json()
  const newStatus = body.status

  const caseItem = dataStore.getCase(id)
  if (!caseItem) {
    return NextResponse.json(
      { error: 'Case not found' },
      { status: 404 }
    )
  }

  // Validate status transitions
  if (newStatus === 'REVIEW') {
    // DRAFT -> REVIEW (AUTHOR only)
    if (role !== 'AUTHOR') {
      return NextResponse.json(
        { error: 'Only AUTHOR can submit for review' },
        { status: 403 }
      )
    }
    if (caseItem.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only submit DRAFT cases for review' },
        { status: 400 }
      )
    }
  } else if (newStatus === 'APPROVED') {
    // REVIEW -> APPROVED (APPROVER only)
    if (role !== 'APPROVER') {
      return NextResponse.json(
        { error: 'Only APPROVER can approve cases' },
        { status: 403 }
      )
    }
    if (caseItem.status !== 'REVIEW') {
      return NextResponse.json(
        { error: 'Can only approve cases in REVIEW status' },
        { status: 400 }
      )
    }
  } else {
    return NextResponse.json(
      { error: 'Invalid status' },
      { status: 400 }
    )
  }

  const updatedCase = dataStore.updateCaseStatus(id, newStatus)
  return NextResponse.json(updatedCase)
}
