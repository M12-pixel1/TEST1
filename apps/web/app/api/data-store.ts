// Simple in-memory store for demo purposes
export interface Case {
  id: string
  title: string
  description: string
  status: 'DRAFT' | 'REVIEW' | 'APPROVED'
  createdBy: string
  createdAt: string
  attachments: Attachment[]
}

export interface Attachment {
  id: string
  filename: string
  uploadedAt: string
}

class DataStore {
  private cases: Case[] = []
  private idCounter = 1
  private attachmentIdCounter = 1

  getCases(): Case[] {
    return this.cases
  }

  getCase(id: string): Case | undefined {
    return this.cases.find((c) => c.id === id)
  }

  createCase(title: string, description: string, createdBy: string): Case {
    const newCase: Case = {
      id: String(this.idCounter++),
      title,
      description,
      status: 'DRAFT',
      createdBy,
      createdAt: new Date().toISOString(),
      attachments: [],
    }
    this.cases.push(newCase)
    return newCase
  }

  updateCaseStatus(id: string, status: 'DRAFT' | 'REVIEW' | 'APPROVED'): Case | null {
    const caseItem = this.getCase(id)
    if (!caseItem) return null
    caseItem.status = status
    return caseItem
  }

  addAttachment(caseId: string, filename: string): Attachment | null {
    const caseItem = this.getCase(caseId)
    if (!caseItem) return null

    const attachment: Attachment = {
      id: String(this.attachmentIdCounter++),
      filename,
      uploadedAt: new Date().toISOString(),
    }
    caseItem.attachments.push(attachment)
    return attachment
  }
}

// Singleton instance
export const dataStore = new DataStore()
