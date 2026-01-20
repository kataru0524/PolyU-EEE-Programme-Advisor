import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo } from '@/app/api/utils/common'

export async function DELETE(request: NextRequest, { params }: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  const { user } = getInfo(request)

  try {
    await client.deleteConversation(conversationId, user)
    return NextResponse.json({ result: 'success' })
  }
  catch (error: any) {
    return NextResponse.json({
      error: error.message,
    }, { status: error.status || 500 })
  }
}
