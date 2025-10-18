import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { createWhatsAppAPIForUser } from '@/lib/whatsapp-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      conversationId, 
      message, 
      type = 'text', 
      mediaUrl, 
      mediaType, 
      buttons, 
      header, 
      footer,
      userId 
    } = body

    if (!conversationId || !message || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: conversationId, message, and userId' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get conversation details
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select(`
        id,
        contact:contacts(
          phone_number,
          name
        )
      `)
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single()

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Create WhatsApp API instance
    const whatsappAPI = await createWhatsAppAPIForUser(userId)
    
    if (!whatsappAPI) {
      return NextResponse.json(
        { error: 'WhatsApp credentials not configured' },
        { status: 400 }
      )
    }

    // Send message via WhatsApp API
    let whatsappResponse
    try {
      // Handle the contact data structure properly
      const contact = Array.isArray(conversation.contact) ? conversation.contact[0] : conversation.contact
      if (!contact || !contact.phone_number) {
        return NextResponse.json(
          { error: 'Contact phone number not found' },
          { status: 404 }
        )
      }
      
      const phoneNumber = contact.phone_number
      
      switch (type) {
        case 'text':
          whatsappResponse = await whatsappAPI.sendTextMessage(phoneNumber, message)
          break
        case 'image':
          if (!mediaUrl) {
            return NextResponse.json({ error: 'Media URL required for image messages' }, { status: 400 })
          }
          whatsappResponse = await whatsappAPI.sendImageMessage(phoneNumber, mediaUrl, message)
          break
        case 'document':
          if (!mediaUrl) {
            return NextResponse.json({ error: 'Media URL required for document messages' }, { status: 400 })
          }
          const filename = message || 'document.pdf'
          whatsappResponse = await whatsappAPI.sendDocumentMessage(phoneNumber, mediaUrl, filename, message)
          break
        case 'audio':
          if (!mediaUrl) {
            return NextResponse.json({ error: 'Media URL required for audio messages' }, { status: 400 })
          }
          whatsappResponse = await whatsappAPI.sendAudioMessage(phoneNumber, mediaUrl)
          break
        case 'video':
          if (!mediaUrl) {
            return NextResponse.json({ error: 'Media URL required for video messages' }, { status: 400 })
          }
          whatsappResponse = await whatsappAPI.sendVideoMessage(phoneNumber, mediaUrl, message)
          break
        case 'sticker':
          if (!mediaUrl) {
            return NextResponse.json({ error: 'Media URL required for sticker messages' }, { status: 400 })
          }
          whatsappResponse = await whatsappAPI.sendStickerMessage(phoneNumber, mediaUrl)
          break
        case 'quick_reply':
          if (!buttons || !Array.isArray(buttons)) {
            return NextResponse.json({ error: 'Buttons array required for quick reply messages' }, { status: 400 })
          }
          whatsappResponse = await whatsappAPI.sendQuickReplyButtons(phoneNumber, message, buttons, header, footer)
          break
        default:
          return NextResponse.json({ error: `Message type '${type}' not supported` }, { status: 400 })
      }
    } catch (whatsappError: unknown) {
      console.error('WhatsApp API error:', whatsappError)
      return NextResponse.json(
        { error: `Failed to send message: ${whatsappError instanceof Error ? whatsappError.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

    // Save message to database
    const { data: savedMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        whatsapp_message_id: whatsappResponse.messages?.[0]?.id,
        type: type,
        direction: 'outbound',
        content: message,
        media_url: mediaUrl || null,
        media_type: mediaType || null,
        status: 'sent'
      })
      .select('*')
      .single()

    if (messageError) {
      console.error('Error saving message:', messageError)
      // Don't fail the request if we can't save to DB, message was sent
    }

    // Update conversation with last message info
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: message,
        unread_count: 0 // Reset unread count since we sent a message
      })
      .eq('id', conversationId)

    if (updateError) {
      console.error('Error updating conversation:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: savedMessage,
      whatsappResponse
    })

  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
