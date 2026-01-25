import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getInfo } from '@/app/api/utils/common'
import { API_KEY, API_URL } from '@/config'

export async function POST(request: NextRequest) {
  const { user } = getInfo(request)
  const body = await request.json()
  const { message_id, text } = body

  try {
    const url = `${API_URL}/text-to-audio`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message_id,
        ...(text && { text }),
        user,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.blob()
    
    return new NextResponse(data, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
      },
    })
  }
  catch (error: any) {
    return NextResponse.json({
      error: error.message,
    }, { status: error.status || 500 })
  }
}
