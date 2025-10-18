'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/components/auth/auth-provider'
import { Megaphone, Plus, Play, Pause, Calendar, Users, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  message: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  scheduled_at: string | null
  sent_at: string | null
  total_contacts: number
  sent_count: number
  delivered_count: number
  read_count: number
  failed_count: number
  created_at: string
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  sending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800'
}

const statusLabels = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  sending: 'Sending',
  sent: 'Sent',
  failed: 'Failed'
}

const statusIcons = {
  draft: Clock,
  scheduled: Calendar,
  sending: Play,
  sent: CheckCircle,
  failed: XCircle
}

export function CampaignsView() {
  const { user } = useAuth()
  const supabase = createClient()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchCampaigns()
    }
  }, [user])

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDeliveryRate = (campaign: Campaign) => {
    if (campaign.sent_count === 0) return 0
    return Math.round((campaign.delivered_count / campaign.sent_count) * 100)
  }

  const getReadRate = (campaign: Campaign) => {
    if (campaign.delivered_count === 0) return 0
    return Math.round((campaign.read_count / campaign.delivered_count) * 100)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bulk Campaigns</h1>
            <p className="text-gray-600">Create and manage WhatsApp bulk messaging campaigns</p>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </Button>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
              </div>
              <Megaphone className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length}
                </p>
              </div>
              <Play className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.filter(c => c.status === 'sent').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.reduce((sum, c) => sum + c.sent_count, 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Megaphone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first bulk messaging campaign to reach multiple contacts at once.
              </p>
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Create Your First Campaign</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => {
            const StatusIcon = statusIcons[campaign.status]
            return (
              <Card key={campaign.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusColors[campaign.status]}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusLabels[campaign.status]}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">{campaign.message}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Total Contacts</p>
                          <p className="text-lg font-semibold text-gray-900">{campaign.total_contacts}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Sent</p>
                          <p className="text-lg font-semibold text-gray-900">{campaign.sent_count}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Delivered</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {campaign.delivered_count} ({getDeliveryRate(campaign)}%)
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Read</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {campaign.read_count} ({getReadRate(campaign)}%)
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>Created: {formatDate(campaign.created_at)}</span>
                          {campaign.scheduled_at && (
                            <span>Scheduled: {formatDate(campaign.scheduled_at)}</span>
                          )}
                          {campaign.sent_at && (
                            <span>Sent: {formatDate(campaign.sent_at)}</span>
                          )}
                        </div>
                        {campaign.failed_count > 0 && (
                          <span className="text-red-600">
                            {campaign.failed_count} failed
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {campaign.status === 'draft' && (
                        <Button size="sm" variant="outline">
                          <Play className="w-4 h-4 mr-1" />
                          Send
                        </Button>
                      )}
                      {campaign.status === 'scheduled' && (
                        <Button size="sm" variant="outline">
                          <Pause className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
