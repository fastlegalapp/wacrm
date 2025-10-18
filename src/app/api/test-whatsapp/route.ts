import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createWhatsAppAPIForUser } from '@/lib/whatsapp-api'

export async function POST() {
  try {
    const supabase = await createClient()

    // Get the current user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create WhatsApp API instance
    const whatsappAPI = await createWhatsAppAPIForUser(user.id)
    
    if (!whatsappAPI) {
      return NextResponse.json(
        { error: 'WhatsApp credentials not configured' },
        { status: 400 }
      )
    }

    // Test the connection by getting phone number info
    try {
      const phoneInfo = await whatsappAPI.getPhoneNumberInfo()
      return NextResponse.json({
        success: true,
        message: 'WhatsApp API connection successful!',
        phoneInfo
      })
    } catch (whatsappError: unknown) {
      return NextResponse.json(
        { error: `WhatsApp API Error: ${whatsappError instanceof Error ? whatsappError.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Test WhatsApp error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
