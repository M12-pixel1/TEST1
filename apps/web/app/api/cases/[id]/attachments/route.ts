import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/app/api/data-store'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const role = request.headers.get('x-user-role')

  if (role !== 'AUTHOR') {
    return NextResponse.json(
      { error: 'Only AUTHOR can upload attachments' },
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

  if (caseItem.status === 'APPROVED') {
    return NextResponse.json(
      { error: 'Cannot upload attachments to approved cases' },
      { status: 403 }
    )
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  
  if (!file) {
    return NextResponse.json(
      { error: 'No file provided' },
      { status: 400 }
    )
  }

  const attachment = dataStore.addAttachment(id, file.name)
  
  return NextResponse.json(attachment, { status: 201 })
}
