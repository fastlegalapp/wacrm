import { createClient } from '@/lib/supabase-client'
import { createServiceClient } from '@/lib/supabase-server'

export interface WhatsAppMessage {
  to: string
  type: 'text' | 'template' | 'image' | 'document' | 'audio' | 'video' | 'sticker'
  messaging_product: 'whatsapp'
  text?: {
    body: string
  }
  template?: {
    name: string
    language: {
      code: string
    }
    components?: Array<{
      type: string
      parameters: Array<{
        type: string
        text: string
      }>
    }>
  }
  image?: {
    link: string
    caption?: string
  }
  document?: {
    link: string
    filename: string
    caption?: string
  }
  audio?: {
    link: string
  }
  video?: {
    link: string
    caption?: string
  }
  sticker?: {
    link: string
  }
  interactive?: {
    type: 'button' | 'list'
    header?: {
      type: 'text' | 'image' | 'video' | 'document'
      text?: string
      image?: { link: string }
      video?: { link: string }
      document?: { link: string; filename: string }
    }
    body: {
      text: string
    }
    footer?: {
      text: string
    }
    action: {
      buttons?: Array<{
        type: 'reply'
        reply: {
          id: string
          title: string
        }
      }>
      sections?: Array<{
        title: string
        rows: Array<{
          id: string
          title: string
          description?: string
        }>
      }>
    }
  }
}

export interface WhatsAppCredentials {
  access_token: string
  phone_number_id: string
  business_account_id: string
  app_id: string
}

export class WhatsAppAPI {
  private credentials: WhatsAppCredentials

  constructor(credentials: WhatsAppCredentials) {
    this.credentials = credentials
  }

  private getApiUrl() {
    return `https://graph.facebook.com/v18.0/${this.credentials.phone_number_id}/messages`
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.credentials.access_token}`,
      'Content-Type': 'application/json',
    }
  }

  async sendMessage(message: WhatsAppMessage) {
    try {
      const response = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(message),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`WhatsApp API Error: ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      throw error
    }
  }

  async sendTextMessage(to: string, text: string) {
    const message: WhatsAppMessage = {
      to,
      type: 'text',
      messaging_product: 'whatsapp',
      text: { body: text }
    }

    return this.sendMessage(message)
  }

  async sendTemplateMessage(to: string, templateName: string, parameters: string[] = []) {
    const message: WhatsAppMessage = {
      to,
      type: 'template',
      messaging_product: 'whatsapp',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: parameters.length > 0 ? [{
          type: 'body',
          parameters: parameters.map(param => ({
            type: 'text',
            text: param
          }))
        }] : undefined
      }
    }

    return this.sendMessage(message)
  }

  async sendImageMessage(to: string, imageUrl: string, caption?: string) {
    const message: WhatsAppMessage = {
      to,
      type: 'image',
      messaging_product: 'whatsapp',
      image: {
        link: imageUrl,
        caption
      }
    }

    return this.sendMessage(message)
  }

  async sendDocumentMessage(to: string, documentUrl: string, filename: string, caption?: string) {
    const message: WhatsAppMessage = {
      to,
      type: 'document',
      messaging_product: 'whatsapp',
      document: {
        link: documentUrl,
        filename,
        caption
      }
    }

    return this.sendMessage(message)
  }

  async sendAudioMessage(to: string, audioUrl: string) {
    const message: WhatsAppMessage = {
      to,
      type: 'audio',
      messaging_product: 'whatsapp',
      audio: {
        link: audioUrl
      }
    }

    return this.sendMessage(message)
  }

  async sendVideoMessage(to: string, videoUrl: string, caption?: string) {
    const message: WhatsAppMessage = {
      to,
      type: 'video',
      messaging_product: 'whatsapp',
      video: {
        link: videoUrl,
        caption
      }
    }

    return this.sendMessage(message)
  }

  async sendStickerMessage(to: string, stickerUrl: string) {
    const message: WhatsAppMessage = {
      to,
      type: 'sticker',
      messaging_product: 'whatsapp',
      sticker: {
        link: stickerUrl
      }
    }

    return this.sendMessage(message)
  }

  async sendQuickReplyButtons(to: string, text: string, buttons: Array<{id: string, title: string}>, header?: string, footer?: string) {
    const message: WhatsAppMessage = {
      to,
      type: 'interactive',
      messaging_product: 'whatsapp',
      interactive: {
        type: 'button',
        header: header ? { type: 'text', text: header } : undefined,
        body: { text },
        footer: footer ? { text: footer } : undefined,
        action: {
          buttons: buttons.map(button => ({
            type: 'reply' as const,
            reply: {
              id: button.id,
              title: button.title
            }
          }))
        }
      }
    }

    return this.sendMessage(message)
  }

  async sendListMessage(to: string, text: string, buttonText: string, sections: Array<{
    title: string
    rows: Array<{id: string, title: string, description?: string}>
  }>, header?: string, footer?: string) {
    const message: WhatsAppMessage = {
      to,
      type: 'interactive',
      messaging_product: 'whatsapp',
      interactive: {
        type: 'list',
        header: header ? { type: 'text', text: header } : undefined,
        body: { text },
        footer: footer ? { text: footer } : undefined,
        action: {
          sections
        }
      }
    }

    return this.sendMessage(message)
  }

  async getMessageStatus(messageId: string) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${messageId}`,
        {
          headers: this.getHeaders(),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`WhatsApp API Error: ${errorData.error?.message || 'Unknown error'}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting message status:', error)
      throw error
    }
  }

  async getPhoneNumberInfo() {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.credentials.phone_number_id}`,
        {
          headers: this.getHeaders(),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`WhatsApp API Error: ${errorData.error?.message || 'Unknown error'}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting phone number info:', error)
      throw error
    }
  }

  async getBusinessProfile() {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.credentials.business_account_id}`,
        {
          headers: this.getHeaders(),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`WhatsApp API Error: ${errorData.error?.message || 'Unknown error'}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting business profile:', error)
      throw error
    }
  }

  async getProfileInfo(phoneNumber: string) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumber}`,
        {
          headers: this.getHeaders(),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        // Profile info might not be available for all numbers
        if (errorData.error?.code === 100) {
          return null
        }
        throw new Error(`WhatsApp API Error: ${errorData.error?.message || 'Unknown error'}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting profile info:', error)
      return null
    }
  }

  async getMediaUrl(mediaId: string) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${mediaId}`,
        {
          headers: this.getHeaders(),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`WhatsApp API Error: ${errorData.error?.message || 'Unknown error'}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting media URL:', error)
      return null
    }
  }
}

// Utility function to get user's WhatsApp credentials
export async function getUserWhatsAppCredentials(userId: string): Promise<WhatsAppCredentials | null> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('whatsapp_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return null
    }

    return {
      access_token: data.access_token,
      phone_number_id: data.phone_number_id,
      business_account_id: data.business_account_id,
      app_id: data.app_id
    }
  } catch (error) {
    console.error('Error fetching WhatsApp credentials:', error)
    return null
  }
}

// Utility function to get user's WhatsApp credentials using service client (for API routes)
export async function getUserWhatsAppCredentialsService(userId: string): Promise<WhatsAppCredentials | null> {
  const supabase = createServiceClient()
  
  try {
    const { data, error } = await supabase
      .from('whatsapp_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      console.log('No credentials found for user:', userId, error)
      return null
    }

    return {
      access_token: data.access_token,
      phone_number_id: data.phone_number_id,
      business_account_id: data.business_account_id,
      app_id: data.app_id
    }
  } catch (error) {
    console.error('Error fetching WhatsApp credentials:', error)
    return null
  }
}

// Utility function to create WhatsApp API instance for user
export async function createWhatsAppAPIForUser(userId: string): Promise<WhatsAppAPI | null> {
  const credentials = await getUserWhatsAppCredentialsService(userId)
  
  if (!credentials) {
    return null
  }

  return new WhatsAppAPI(credentials)
}
