import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

// Webhook verification (GET request)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // For now, we'll use a simple verification token
  // In production, you should store this per user and verify against their credentials
  const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || '12345678'

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified successfully')
    return new NextResponse(challenge, { status: 200 })
  } else {
    console.log('Webhook verification failed')
    return new NextResponse('Forbidden', { status: 403 })
  }
}

// Handle incoming messages (POST request)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('=== WEBHOOK RECEIVED ===')
    console.log('Body:', JSON.stringify(body, null, 2))
    console.log('Headers:', Object.fromEntries(request.headers.entries()))

    // Verify the webhook signature (optional but recommended)
    // const signature = request.headers.get('x-hub-signature-256')
    // if (!verifyWebhookSignature(body, signature)) {
    //   return new NextResponse('Unauthorized', { status: 401 })
    // }

      const supabase = createServiceClient()

    // Process each entry in the webhook
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            await processMessageChange(change, supabase)
          }
        }
      }
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

async function processMessageChange(change: any, supabase: any) {
  try {
    const messages = change.value.messages || []
    const statuses = change.value.statuses || []
    const contacts = change.value.contacts || []

    // Process incoming messages
    for (const message of messages) {
      await processIncomingMessage(message, supabase, contacts)
    }

    // Process message status updates
    for (const status of statuses) {
      await processMessageStatus(status, supabase)
    }
  } catch (error) {
    console.error('Error processing message change:', error)
  }
}

async function processIncomingMessage(message: any, supabase: any, contacts: any[] = []) {
  try {
    console.log('Processing incoming message:', message)
    const phoneNumber = message.from
    const messageId = message.id
    const timestamp = message.timestamp
    const messageType = message.type
    
    // Extract profile info from webhook contacts data
    let profileName = null
    let profilePictureUrl = null
    if (contacts && contacts.length > 0) {
      const contact = contacts.find(c => c.wa_id === phoneNumber)
      if (contact && contact.profile) {
        profileName = contact.profile.name
        profilePictureUrl = contact.profile.picture_url
        console.log('Using profile info from webhook:', contact.profile)
        console.log('Profile picture URL from webhook:', profilePictureUrl)
      }
    }
    
    // Extract media info from message
    let mediaUrl = null
    let mediaType = null
    if (message.image) {
      mediaUrl = message.image.id
      mediaType = 'image'
    } else if (message.document) {
      mediaUrl = message.document.id
      mediaType = 'document'
    } else if (message.audio) {
      mediaUrl = message.audio.id
      mediaType = 'audio'
    } else if (message.video) {
      mediaUrl = message.video.id
      mediaType = 'video'
    } else if (message.sticker) {
      mediaUrl = message.sticker.id
      mediaType = 'sticker'
    }

    // We'll fetch the media URL later after we have the userId

    // Find or create contact
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, user_id')
      .eq('phone_number', phoneNumber)
      .single()

    if (contactError && contactError.code !== 'PGRST116') {
      throw contactError
    }

    let contactId: string
    let userId: string

    if (contact) {
      contactId = contact.id
      userId = contact.user_id
      
      // Update last_contacted_at and profile info for existing contact
      const updateData: any = {
        last_contacted_at: new Date(parseInt(timestamp) * 1000).toISOString()
      }
      
      // Update profile info if we have it and it's different
      if (profileName) {
        updateData.name = profileName
      }
      if (profilePictureUrl) {
        updateData.profile_picture_url = profilePictureUrl
      }
      
      console.log('Updating existing contact with profile info:', {
        contactId,
        updateData
      })
      
      await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId)
    } else {
      // Create new contact - we need to determine which user this belongs to
      // For now, we'll use a default user or the first user with WhatsApp credentials
      console.log('Looking for WhatsApp credentials...')
      
      // First, let's see all credentials in the database
      const { data: allCredentials, error: allCredError } = await supabase
        .from('whatsapp_credentials')
        .select('*')
      
      console.log('All credentials in database:', { allCredentials, allCredError })
      
      // Then look for active ones
      const { data: credentials, error: credError } = await supabase
        .from('whatsapp_credentials')
        .select('user_id')
        .eq('is_active', true)
        .limit(1)
        .single()

      console.log('Active credentials query result:', { credentials, credError })

      if (!credentials) {
        console.error('No active WhatsApp credentials found')
        return
      }

      userId = credentials.user_id

      console.log('Creating new contact with profile info:', {
        phoneNumber,
        profileName,
        profilePictureUrl,
        userId
      })
      
      const { data: newContact, error: newContactError } = await supabase
        .from('contacts')
        .insert({
          user_id: userId,
          phone_number: phoneNumber,
          name: profileName,
          profile_picture_url: profilePictureUrl,
          lead_status: 'new',
          last_contacted_at: new Date(parseInt(timestamp) * 1000).toISOString()
        })
        .select('id')
        .single()

      if (newContactError) {
        throw newContactError
      }

      contactId = newContact.id
    }

    // Get actual media URL from WhatsApp if we have a media ID
    if (mediaUrl && userId) {
      try {
        const { createWhatsAppAPIForUser } = await import('@/lib/whatsapp-api')
        const whatsappAPI = await createWhatsAppAPIForUser(userId)
        if (whatsappAPI) {
          const mediaInfo = await whatsappAPI.getMediaUrl(mediaUrl)
          if (mediaInfo && mediaInfo.url) {
            mediaUrl = mediaInfo.url
            console.log('Fetched media URL:', mediaUrl)
          }
        }
      } catch (error) {
        console.log('Could not fetch media URL:', error)
      }
    }

    // Fetch profile picture if not provided in webhook
    if (!profilePictureUrl && userId) {
      try {
        const { createWhatsAppAPIForUser } = await import('@/lib/whatsapp-api')
        const whatsappAPI = await createWhatsAppAPIForUser(userId)
        if (whatsappAPI) {
          const profileInfo = await whatsappAPI.getProfileInfo(phoneNumber)
          if (profileInfo && profileInfo.profile_picture_url) {
            profilePictureUrl = profileInfo.profile_picture_url
            console.log('Fetched profile picture URL from API:', profilePictureUrl)
          }
        }
      } catch (error) {
        console.log('Could not fetch profile picture:', error)
      }
    }

    // Find or create conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', contactId)
      .eq('user_id', userId)
      .single()

    if (conversationError && conversationError.code !== 'PGRST116') {
      throw conversationError
    }

    let conversationId: string

    if (conversation) {
      conversationId = conversation.id
    } else {
      const { data: newConversation, error: newConversationError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          contact_id: contactId,
          status: 'active'
        })
        .select('id')
        .single()

      if (newConversationError) {
        throw newConversationError
      }

      conversationId = newConversation.id
    }

    // Extract message content based on type
    let content = ''
    
    switch (messageType) {
      case 'text':
        content = message.text.body
        break
      case 'image':
        content = message.image.caption || ''
        break
      case 'document':
        content = message.document.caption || ''
        break
      case 'audio':
        content = '[Audio message]'
        break
      case 'video':
        content = message.video.caption || '[Video message]'
        break
      case 'location':
        content = `Location: ${message.location.latitude}, ${message.location.longitude}`
        break
      case 'contact':
        content = `Contact: ${message.contact.name} - ${message.contact.phones?.[0]?.phone || 'No phone'}`
        break
      default:
        content = `Unsupported message type: ${messageType}`
    }

    // Save message to database
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        whatsapp_message_id: messageId,
        type: messageType,
        direction: 'inbound',
        content: content || null,
        media_url: mediaUrl || null,
        media_type: mediaType || null,
        status: 'received'
      })

    if (messageError) {
      throw messageError
    }

    // Update conversation with last message info
    // First get the current unread count
    const { data: currentConversation } = await supabase
      .from('conversations')
      .select('unread_count')
      .eq('id', conversationId)
      .single()

    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        last_message_at: new Date(parseInt(timestamp) * 1000).toISOString(),
        last_message_preview: content || `[${messageType}]`,
        unread_count: (currentConversation?.unread_count || 0) + 1
      })
      .eq('id', conversationId)

    if (updateError) {
      console.error('Error updating conversation:', updateError)
    }

    // Update contact's last contacted time and profile picture if we have one
    const contactUpdateData: any = {
      last_contacted_at: new Date(parseInt(timestamp) * 1000).toISOString()
    }
    
    // Update profile picture if we fetched one and the contact doesn't have one
    if (profilePictureUrl) {
      contactUpdateData.profile_picture_url = profilePictureUrl
    }
    
    const { error: contactUpdateError } = await supabase
      .from('contacts')
      .update(contactUpdateData)
      .eq('id', contactId)

    if (contactUpdateError) {
      console.error('Error updating contact:', contactUpdateError)
    }

    // Log webhook event
    await supabase
      .from('webhook_events')
      .insert({
        user_id: userId,
        event_type: 'message_received',
        whatsapp_message_id: messageId,
        contact_phone: phoneNumber,
        payload: message,
        processed: true
      })

    console.log(`Processed incoming message from ${phoneNumber}`)
  } catch (error) {
    console.error('Error processing incoming message:', error)
  }
}

async function processMessageStatus(status: any, supabase: any) {
  try {
    const messageId = status.id
    const statusType = status.status
    const timestamp = status.timestamp

    // Update message status in database
    const updateData: any = {
      status: statusType
    }

    if (statusType === 'delivered') {
      updateData.delivered_at = new Date(parseInt(timestamp) * 1000).toISOString()
    } else if (statusType === 'read') {
      updateData.read_at = new Date(parseInt(timestamp) * 1000).toISOString()
    }

    const { error } = await supabase
      .from('messages')
      .update(updateData)
      .eq('whatsapp_message_id', messageId)

    if (error) {
      console.error('Error updating message status:', error)
    }

    console.log(`Updated message status: ${messageId} -> ${statusType}`)
  } catch (error) {
    console.error('Error processing message status:', error)
  }
}

// Function to verify webhook signature (implement if needed)
function verifyWebhookSignature(body: any, signature: string | null): boolean {
  // Implement webhook signature verification here
  // This is important for security in production
  return true // For now, we'll skip verification
}
