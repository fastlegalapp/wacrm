import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // For development, we'll create a simple file serving solution
    // In production, you'd upload to AWS S3, Cloudinary, or similar
    
    // Convert file to base64 for now (this is not ideal for production)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const mimeType = file.type
    
    // Create a data URL that can be used by WhatsApp API
    const dataUrl = `data:${mimeType};base64,${base64}`
    
    return NextResponse.json({ 
      success: true, 
      url: dataUrl,
      filename: file.name,
      size: file.size,
      type: mimeType
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
