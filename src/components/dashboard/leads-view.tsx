'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/components/auth/auth-provider'
import { Users, Search, Plus, Phone, Mail, Building, Tag, Calendar, Filter, Trash2 } from 'lucide-react'

interface Lead {
  id: string
  name: string | null
  phone_number: string
  email: string | null
  company: string | null
  tags: string[] | null
  profile_picture_url: string | null
  lead_status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  last_contacted_at: string | null
  created_at: string
}

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-purple-100 text-purple-800',
  converted: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800'
}

const statusLabels = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  converted: 'Converted',
  lost: 'Lost'
}

export function LeadsView() {
  const { user } = useAuth()
  const supabase = createClient()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchLeads()
    }
  }, [user])

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone_number.includes(searchTerm) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || lead.lead_status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusCounts = () => {
    return leads.reduce((acc, lead) => {
      acc[lead.lead_status] = (acc[lead.lead_status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  const statusCounts = getStatusCounts()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    setUpdatingStatus(leadId)
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ lead_status: newStatus })
        .eq('id', leadId)

      if (error) throw error

      // Update local state
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, lead_status: newStatus as any } : lead
      ))
    } catch (error) {
      console.error('Error updating lead status:', error)
      alert('Failed to update lead status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const deleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead? This will also delete all conversations and messages with this contact.')) {
      return
    }

    setDeleting(leadId)
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', leadId)
        .eq('user_id', user?.id)

      if (error) throw error

      // Remove from local state
      setLeads(leads.filter(lead => lead.id !== leadId))
    } catch (error) {
      console.error('Error deleting lead:', error)
      alert('Failed to delete lead')
    } finally {
      setDeleting(null)
    }
  }

  const deleteAllLeads = async () => {
    setDeleting('all')
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('user_id', user?.id)

      if (error) throw error

      // Clear local state
      setLeads([])
    } catch (error) {
      console.error('Error deleting all leads:', error)
      alert('Failed to delete all leads')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Leads Management</h1>
            <p className="text-gray-600">Track and manage your WhatsApp leads</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Lead</span>
            </Button>
            {leads.length > 0 && (
              <Button 
                variant="outline" 
                className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ALL ${leads.length} leads? This action cannot be undone.`)) {
                    deleteAllLeads()
                  }
                }}
                disabled={deleting === 'all'}
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting === 'all' ? 'Deleting All...' : 'Clear All'}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(statusLabels).map(([status, label]) => (
          <Card key={status}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statusCounts[status] || 0}
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${statusColors[status as keyof typeof statusColors].replace('text-', 'bg-').replace('-800', '-500')}`}></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search leads by name, phone, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Statuses</option>
                {Object.entries(statusLabels).map(([status, label]) => (
                  <option key={status} value={status}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Leads ({filteredLeads.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredLeads.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No leads found</p>
              <p className="text-sm mt-2">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start by adding your first lead or connecting WhatsApp to capture leads automatically'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {lead.profile_picture_url ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={lead.profile_picture_url}
                                alt={lead.name || 'Profile'}
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement
                                  const nextElement = target.nextElementSibling as HTMLElement
                                  target.style.display = 'none'
                                  if (nextElement) nextElement.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <div 
                              className={`h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700 ${lead.profile_picture_url ? 'hidden' : 'flex'}`}
                            >
                              {getInitials(lead.name)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {lead.name || 'Unknown'}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Phone className="w-3 h-3" />
                                <span>{lead.phone_number}</span>
                              </div>
                              {lead.email && (
                                <div className="flex items-center space-x-1">
                                  <Mail className="w-3 h-3" />
                                  <span>{lead.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={lead.lead_status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          disabled={updatingStatus === lead.id}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer ${statusColors[lead.lead_status]} ${updatingStatus === lead.id ? 'opacity-50' : ''}`}
                        >
                          {Object.entries(statusLabels).map(([status, label]) => (
                            <option key={status} value={status} className="bg-white text-gray-900">
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.company || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.tags && lead.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {lead.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </span>
                            ))}
                            {lead.tags.length > 2 && (
                              <span className="text-xs text-gray-500">+{lead.tags.length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.last_contacted_at ? formatDate(lead.last_contacted_at) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(lead.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteLead(lead.id)}
                            disabled={deleting === lead.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deleting === lead.id ? (
                              <span className="flex items-center space-x-1">
                                <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Deleting...</span>
                              </span>
                            ) : (
                              <span className="flex items-center space-x-1">
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </span>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
