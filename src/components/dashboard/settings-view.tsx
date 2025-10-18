'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/components/auth/auth-provider'
import { Save, Check, AlertCircle, Eye, EyeOff } from 'lucide-react'

interface WhatsAppCredentials {
  access_token: string
  phone_number_id: string
  business_account_id: string
  app_id: string
  webhook_verify_token?: string
}

export function SettingsView() {
  const { user } = useAuth()
  const supabase = createClient()
  const [credentials, setCredentials] = useState<WhatsAppCredentials>({
    access_token: '',
    phone_number_id: '',
    business_account_id: '',
    app_id: '',
    webhook_verify_token: ''
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showToken, setShowToken] = useState(false)

  useEffect(() => {
    if (user) {
      fetchCredentials()
    }
  }, [user])

  const fetchCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_credentials')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        setCredentials({
          access_token: data.access_token,
          phone_number_id: data.phone_number_id,
          business_account_id: data.business_account_id,
          app_id: data.app_id,
          webhook_verify_token: data.webhook_verify_token || ''
        })
      }
    } catch (err: any) {
      console.error('Error fetching credentials:', err)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // First, check if credentials already exist
      const { data: existingCredentials } = await supabase
        .from('whatsapp_credentials')
        .select('id')
        .eq('user_id', user.id)
        .single()

      let error
      if (existingCredentials) {
        // Update existing credentials
        console.log('Updating existing credentials for user:', user.id)
        const { error: updateError } = await supabase
          .from('whatsapp_credentials')
          .update({
            access_token: credentials.access_token,
            phone_number_id: credentials.phone_number_id,
            business_account_id: credentials.business_account_id,
            app_id: credentials.app_id,
            webhook_verify_token: credentials.webhook_verify_token || null,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
        error = updateError
        console.log('Update result:', { updateError })
      } else {
        // Insert new credentials
        console.log('Inserting new credentials for user:', user.id)
        const { data: insertData, error: insertError } = await supabase
          .from('whatsapp_credentials')
          .insert({
            user_id: user.id,
            access_token: credentials.access_token,
            phone_number_id: credentials.phone_number_id,
            business_account_id: credentials.business_account_id,
            app_id: credentials.app_id,
            webhook_verify_token: credentials.webhook_verify_token || null,
            is_active: true
          })
          .select()
        error = insertError
        console.log('Insert result:', { insertData, insertError })
      }

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof WhatsAppCredentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure your WhatsApp Business API credentials to start managing conversations and campaigns.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-bold">W</span>
            </div>
            <span>WhatsApp Business API Configuration</span>
          </CardTitle>
          <CardDescription>
            Enter your WhatsApp Business API credentials. These will be used to send and receive messages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="access_token">Access Token</Label>
              <div className="relative">
                <Input
                  id="access_token"
                  type={showToken ? 'text' : 'password'}
                  value={credentials.access_token}
                  onChange={(e) => handleInputChange('access_token', e.target.value)}
                  placeholder="Enter your WhatsApp access token"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number_id">Phone Number ID</Label>
              <Input
                id="phone_number_id"
                type="text"
                value={credentials.phone_number_id}
                onChange={(e) => handleInputChange('phone_number_id', e.target.value)}
                placeholder="Enter your phone number ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_account_id">Business Account ID</Label>
              <Input
                id="business_account_id"
                type="text"
                value={credentials.business_account_id}
                onChange={(e) => handleInputChange('business_account_id', e.target.value)}
                placeholder="Enter your business account ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="app_id">App ID</Label>
              <Input
                id="app_id"
                type="text"
                value={credentials.app_id}
                onChange={(e) => handleInputChange('app_id', e.target.value)}
                placeholder="Enter your app ID"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook_verify_token">Webhook Verify Token (Optional)</Label>
            <Input
              id="webhook_verify_token"
              type="text"
              value={credentials.webhook_verify_token}
              onChange={(e) => handleInputChange('webhook_verify_token', e.target.value)}
              placeholder="Enter webhook verify token"
            />
            <p className="text-sm text-gray-500">
              This token is used to verify webhook requests from WhatsApp.
            </p>
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}


          {saved && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">Credentials saved successfully!</span>
            </div>
          )}

          <div className="flex justify-between">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={async () => {
                  setLoading(true)
                  setError(null)
                  
                  
                  if (!credentials.access_token || !credentials.phone_number_id) {
                    setError('Please save your WhatsApp credentials first')
                    setLoading(false)
                    return
                  }
                  
                  try {
                    // Test the credentials by making a direct API call to WhatsApp
                    const response = await fetch(
                      `https://graph.facebook.com/v18.0/${credentials.phone_number_id}`,
                      {
                        headers: {
                          'Authorization': `Bearer ${credentials.access_token}`,
                        },
                      }
                    )
                    
                    if (response.ok) {
                      const data = await response.json()
                      setSaved(true)
                      setTimeout(() => setSaved(false), 3000)
                    } else {
                      const errorData = await response.json()
                      setError(`WhatsApp API Error: ${errorData.error?.message || 'Connection failed'}`)
                    }
                  } catch (err: any) {
                    console.error('Test connection error:', err)
                    setError('Failed to test connection. Please check your credentials.')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading || !credentials.access_token || !credentials.phone_number_id}
                className="flex items-center space-x-2"
              >
                <span>Test Connection</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  if (confirm('This will attempt to fetch profile pictures for all your contacts. This may take a few minutes. Continue?')) {
                    try {
                      setLoading(true)
                      setError('')
                      
                      const response = await fetch('/api/fetch-profile-pictures', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ userId: user?.id }),
                      })
                      
                      const result = await response.json()
                      
                      if (!response.ok) {
                        throw new Error(result.error || 'Failed to fetch profile pictures')
                      }
                      
                      alert(`Profile picture fetching completed!\n\nUpdated: ${result.updated} contacts\nTotal processed: ${result.total} contacts`)
                      
                    } catch (err: any) {
                      setError(err.message)
                    } finally {
                      setLoading(false)
                    }
                  }
                }}
                disabled={loading || !credentials.access_token || !credentials.phone_number_id}
                className="flex items-center space-x-2"
              >
                <span>Fetch Profile Pictures</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  if (confirm('Are you sure you want to clear your WhatsApp credentials? This will disable all WhatsApp functionality.')) {
                    try {
                      const { error } = await supabase
                        .from('whatsapp_credentials')
                        .delete()
                        .eq('user_id', user?.id)
                      
                      if (error) throw error
                      
                      setCredentials({
                        access_token: '',
                        phone_number_id: '',
                        business_account_id: '',
                        app_id: '',
                        webhook_verify_token: ''
                      })
                      
                      setSaved(true)
                      setTimeout(() => setSaved(false), 3000)
                    } catch (err: any) {
                      setError(err.message)
                    }
                  }
                }}
                className="flex items-center space-x-2"
              >
                <span>Clear Credentials</span>
              </Button>
            </div>
            
            <Button
              onClick={handleSave}
              disabled={loading || !credentials.access_token || !credentials.phone_number_id || !credentials.business_account_id || !credentials.app_id}
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Credentials'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>1. Create a WhatsApp Business API app in Meta for Developers</p>
              <p>2. Get your access token from the app dashboard</p>
              <p>3. Find your Phone Number ID and Business Account ID</p>
              <p>4. Enter all credentials above and save</p>
              <p>5. Start receiving and sending messages!</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Webhook Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• Set webhook URL to: <code className="bg-gray-100 px-1 rounded">your-domain.com/api/webhook</code></p>
              <p>• Use the verify token above for webhook verification</p>
              <p>• Subscribe to messages and message_deliveries events</p>
              <p>• Test your webhook with WhatsApp's test tool</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
