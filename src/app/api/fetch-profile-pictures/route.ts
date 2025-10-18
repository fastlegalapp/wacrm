import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { createWhatsAppAPIForUser } from '@/lib/whatsapp-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get all contacts for the user that don't have profile pictures
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, phone_number, name, profile_picture_url')
      .eq('user_id', userId)
      .is('profile_picture_url', null)

    if (contactsError) {
      throw contactsError
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No contacts without profile pictures found',
        updated: 0
      })
    }

    // Create WhatsApp API instance
    const whatsappAPI = await createWhatsAppAPIForUser(userId)
    
    if (!whatsappAPI) {
      return NextResponse.json(
        { error: 'WhatsApp credentials not configured' },
        { status: 400 }
      )
    }

    let updatedCount = 0
    const results = []

    // Fetch profile pictures for each contact
    for (const contact of contacts) {
      try {
        console.log(`Fetching profile picture for contact: ${contact.name} (${contact.phone_number})`)
        
        const profileInfo = await whatsappAPI.getProfileInfo(contact.phone_number)
        
        if (profileInfo && profileInfo.profile_picture_url) {
          // Update the contact with the profile picture URL
          const { error: updateError } = await supabase
            .from('contacts')
            .update({ profile_picture_url: profileInfo.profile_picture_url })
            .eq('id', contact.id)

          if (updateError) {
            console.error(`Error updating contact ${contact.id}:`, updateError)
            results.push({
              contactId: contact.id,
              name: contact.name,
              phone: contact.phone_number,
              success: false,
              error: updateError.message
            })
          } else {
            console.log(`Successfully updated profile picture for ${contact.name}`)
            updatedCount++
            results.push({
              contactId: contact.id,
              name: contact.name,
              phone: contact.phone_number,
              success: true,
              profilePictureUrl: profileInfo.profile_picture_url
            })
          }
        } else {
          console.log(`No profile picture found for ${contact.name}`)
          results.push({
            contactId: contact.id,
            name: contact.name,
            phone: contact.phone_number,
            success: false,
            error: 'No profile picture available'
          })
        }
      } catch (error) {
        console.error(`Error fetching profile picture for ${contact.name}:`, error)
        results.push({
          contactId: contact.id,
          name: contact.name,
          phone: contact.phone_number,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Profile picture fetching completed`,
      updated: updatedCount,
      total: contacts.length,
      results
    })

  } catch (error) {
    console.error('Fetch profile pictures error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
