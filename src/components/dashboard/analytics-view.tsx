'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/components/auth/auth-provider'
import { BarChart3, MessageSquare, Users, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react'

interface AnalyticsData {
  totalConversations: number
  totalLeads: number
  totalMessages: number
  activeConversations: number
  newLeadsToday: number
  messagesToday: number
  conversionRate: number
  responseTime: number
}

export function AnalyticsView() {
  const { user } = useAuth()
  const supabase = createClient()
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalConversations: 0,
    totalLeads: 0,
    totalMessages: 0,
    activeConversations: 0,
    newLeadsToday: 0,
    messagesToday: 0,
    conversionRate: 0,
    responseTime: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user])

  const fetchAnalytics = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Fetch conversations
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, status, created_at')
        .eq('user_id', user?.id)

      // Fetch leads
      const { data: leads } = await supabase
        .from('contacts')
        .select('id, created_at, lead_status')
        .eq('user_id', user?.id)

      // Fetch messages
      const { data: messages } = await supabase
        .from('messages')
        .select('id, created_at, direction')
        .eq('direction', 'outbound')

      // Calculate analytics
      const totalConversations = conversations?.length || 0
      const totalLeads = leads?.length || 0
      const totalMessages = messages?.length || 0
      const activeConversations = conversations?.filter(c => c.status === 'active').length || 0
      const newLeadsToday = leads?.filter(l => l.created_at.startsWith(today)).length || 0
      const messagesToday = messages?.filter(m => m.created_at.startsWith(today)).length || 0
      
      // Calculate conversion rate (leads that became customers)
      const convertedLeads = leads?.filter(l => l.lead_status === 'converted').length || 0
      const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0

      setAnalytics({
        totalConversations,
        totalLeads,
        totalMessages,
        activeConversations,
        newLeadsToday,
        messagesToday,
        conversionRate,
        responseTime: 0 // This would need more complex calculation
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Track your WhatsApp CRM performance and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Conversations</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalConversations}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {analytics.activeConversations} active
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalLeads}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {analytics.newLeadsToday} new today
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages Sent</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalMessages}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {analytics.messagesToday} today
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.conversionRate}%</p>
                <p className="text-sm text-gray-500 mt-1">
                  Leads to customers
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Lead Status Distribution</span>
            </CardTitle>
            <CardDescription>
              Breakdown of leads by their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { status: 'New', count: 0, color: 'bg-blue-500' },
                { status: 'Contacted', count: 0, color: 'bg-yellow-500' },
                { status: 'Qualified', count: 0, color: 'bg-purple-500' },
                { status: 'Converted', count: 0, color: 'bg-green-500' },
                { status: 'Lost', count: 0, color: 'bg-red-500' }
              ].map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium text-gray-700">{item.status}</span>
                  </div>
                  <span className="text-sm text-gray-500">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Response Time</span>
            </CardTitle>
            <CardDescription>
              Average time to respond to new messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {analytics.responseTime}m
              </div>
              <p className="text-sm text-gray-500">Average response time</p>
              <div className="mt-4 text-xs text-gray-400">
                <p>• Under 5 minutes: Excellent</p>
                <p>• 5-15 minutes: Good</p>
                <p>• Over 15 minutes: Needs improvement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest conversations and lead interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { type: 'New lead', message: 'John Doe contacted via WhatsApp', time: '2 minutes ago', icon: Users },
              { type: 'Message sent', message: 'Follow-up sent to Sarah Wilson', time: '15 minutes ago', icon: MessageSquare },
              { type: 'Lead converted', message: 'Mike Johnson became a customer', time: '1 hour ago', icon: CheckCircle },
              { type: 'New conversation', message: 'Started chat with Emma Brown', time: '2 hours ago', icon: MessageSquare }
            ].map((activity, index) => {
              const Icon = activity.icon
              return (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.type} • {activity.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
