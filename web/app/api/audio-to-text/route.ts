import { NextRequest, NextResponse } from 'next/server'
import { API_KEY, API_URL } from '@/config'

export async function POST(request: NextRequest) {
  try {
    const url = `${API_URL}/audio-to-text`

    const formData = await request.formData()
    const file = formData.get('file')
    const user = formData.get('user')

    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Forward the request to Dify API
    const difyFormData = new FormData()
    difyFormData.append('file', file)
    if (user) {
      difyFormData.append('user', user as string)
    }

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Dify API key not configured' },
        { status: 500 }
      )
    }
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        // Do NOT set Content-Type - let fetch set it automatically with boundary
      },
      body: difyFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Dify API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to convert audio to text' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Audio to text error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
