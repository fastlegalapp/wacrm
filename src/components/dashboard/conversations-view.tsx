'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/components/auth/auth-provider'
import { MessageSquare, Search, Phone, Mail, Clock, MoreVertical, Send, User, MessageCircle, Trash2 } from 'lucide-react'

interface Conversation {
  id: string
  contact: {
    id: string
    name: string | null
    phone_number: string
    email: string | null
    lead_status: string
    profile_picture_url: string | null
  }
  last_message_preview: string | null
  last_message_at: string | null
  unread_count: number
  status: string
}

interface Message {
  id: string
  content: string
  direction: 'inbound' | 'outbound'
  created_at: string
  type: string
  status: string
  whatsapp_message_id?: string
  media_url?: string
  media_type?: string
}

export function ConversationsView() {
  const { user } = useAuth()
  const supabase = createClient()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'quick_reply'>('text')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [quickReplyButtons, setQuickReplyButtons] = useState<Array<{id: string, title: string}>>([])
  const [showQuickReplyBuilder, setShowQuickReplyBuilder] = useState(false)

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user])

  // Real-time updates for messages
  useEffect(() => {
    if (!selectedConversation) return

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        () => {
          fetchMessages(selectedConversation.id)
          fetchConversations() // Also refresh conversations list
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          last_message_preview,
          last_message_at,
          unread_count,
          status,
      contact:contacts(
        id,
        name,
        phone_number,
        email,
        lead_status,
        profile_picture_url
      )
        `)
        .eq('user_id', user?.id)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (error) throw error
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(conv => ({
        ...conv,
        contact: Array.isArray(conv.contact) ? conv.contact[0] : conv.contact
      }))
      
      setConversations(transformedData)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    setMessagesLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }

  const sendMessage = async () => {
    if ((!newMessage.trim() && messageType === 'text') || !selectedConversation || sending) return
    if (messageType !== 'text' && !mediaFile) {
      alert('Please select a media file for this message type')
      return
    }

    setSending(true)
    try {
      const mediaUrl = null
      const mediaType = null

      // Handle media upload if needed
      if (mediaFile && messageType !== 'text') {
        // For now, we'll show an alert that media upload needs to be implemented
        // In production, you'd upload to a CDN and get a public URL
        alert('Media upload functionality is currently being implemented. Please use text messages for now, or try the quick reply feature.')
        setSending(false)
        return
      }

      const requestBody: Record<string, unknown> = {
        conversationId: selectedConversation.id,
        message: newMessage.trim() || '',
        type: messageType,
        userId: user?.id,
      }

      if (mediaUrl) {
        requestBody.mediaUrl = mediaUrl
        requestBody.mediaType = mediaType
      }

      if (messageType === 'quick_reply' && quickReplyButtons.length > 0) {
        requestBody.buttons = quickReplyButtons
      }

      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      // Clear the input and refresh messages
      setNewMessage('')
      setMediaFile(null)
      setMessageType('text')
      setQuickReplyButtons([])
      setShowQuickReplyBuilder(false)
      await fetchMessages(selectedConversation.id)
      await fetchConversations() // Refresh conversations to update last message
    } catch (error) {
      console.error('Error sending message:', error)
      alert(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSending(false)
    }
  }

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    fetchMessages(conversation.id)
  }

  const addQuickReplyButton = () => {
    const id = `btn_${Date.now()}`
    const title = prompt('Enter button title:')
    if (title && title.trim()) {
      setQuickReplyButtons([...quickReplyButtons, { id, title: title.trim() }])
    }
  }

  const removeQuickReplyButton = (id: string) => {
    setQuickReplyButtons(quickReplyButtons.filter(btn => btn.id !== id))
  }

  const handleMediaFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setMediaFile(file)
      // Auto-detect message type based on file type
      if (file.type.startsWith('image/')) {
        setMessageType('image')
      } else if (file.type.startsWith('video/')) {
        setMessageType('video')
      } else if (file.type.startsWith('audio/')) {
        setMessageType('audio')
      } else {
        setMessageType('document')
      }
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.contact.phone_number.includes(searchTerm) ||
    conv.contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'No messages'
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation? This will also delete all messages in this conversation.')) {
      return
    }

    setDeleting(conversationId)
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user?.id)

      if (error) throw error

      // Remove from local state
      setConversations(conversations.filter(conv => conv.id !== conversationId))
      
      // If this was the selected conversation, clear it
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      alert('Failed to delete conversation')
    } finally {
      setDeleting(null)
    }
  }

  const deleteAllConversations = async () => {
    setDeleting('all')
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', user?.id)

      if (error) throw error

      // Clear local state
      setConversations([])
      setSelectedConversation(null)
      setMessages([])
    } catch (error) {
      console.error('Error deleting all conversations:', error)
      alert('Failed to delete all conversations')
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Conversations</h1>
        <p className="text-gray-600">Manage your WhatsApp conversations and leads</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Active Conversations</CardTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{conversations.length} total</span>
                  {conversations.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ALL ${conversations.length} conversations? This action cannot be undone.`)) {
                          deleteAllConversations()
                        }
                      }}
                      disabled={deleting === 'all'}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      {deleting === 'all' ? 'Deleting...' : 'Clear All'}
                    </Button>
                  )}
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No conversations found</p>
                    {searchTerm && (
                      <p className="text-sm mt-2">Try adjusting your search terms</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => handleConversationSelect(conversation)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              {conversation.contact.profile_picture_url ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={conversation.contact.profile_picture_url}
                                  alt={conversation.contact.name || 'Profile'}
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement
                                    const nextElement = target.nextElementSibling as HTMLElement
                                    target.style.display = 'none'
                                    if (nextElement) nextElement.style.display = 'flex'
                                  }}
                                />
                              ) : null}
                              <div 
                                className={`h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center ${conversation.contact.profile_picture_url ? 'hidden' : 'flex'}`}
                              >
                                <span className="text-sm font-medium text-gray-600">
                                  {getInitials(conversation.contact.name)}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-gray-900 truncate">
                                  {conversation.contact.name || conversation.contact.phone_number}
                                </h3>
                                {conversation.unread_count > 0 && (
                                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                    {conversation.unread_count}
                                  </span>
                                )}
                              </div>
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {conversation.last_message_preview || 'No messages yet'}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Phone className="w-3 h-3" />
                                <span>{conversation.contact.phone_number}</span>
                              </div>
                              {conversation.contact.email && (
                                <div className="flex items-center space-x-1">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate">{conversation.contact.email}</span>
                                </div>
                              )}
                            </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.last_message_at)}
                            </span>
                            <div className="relative">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="w-6 h-6"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const menu = e.currentTarget.nextElementSibling as HTMLElement
                                  menu.style.display = menu.style.display === 'block' ? 'none' : 'block'
                                }}
                              >
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                              <div 
                                className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 hidden"
                                style={{ minWidth: '120px' }}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteConversation(conversation.id)
                                    const menu = e.currentTarget.closest('div') as HTMLElement
                                    menu.style.display = 'none'
                                  }}
                                  disabled={deleting === conversation.id}
                                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 disabled:opacity-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>{deleting === conversation.id ? 'Deleting...' : 'Delete'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {selectedConversation.contact.profile_picture_url ? (
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={selectedConversation.contact.profile_picture_url}
                          alt={selectedConversation.contact.name || 'Profile'}
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement
                            const nextElement = target.nextElementSibling as HTMLElement
                            target.style.display = 'none'
                            if (nextElement) nextElement.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div 
                        className={`h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center ${selectedConversation.contact.profile_picture_url ? 'hidden' : 'flex'}`}
                      >
                        <span className="text-sm font-medium text-white">
                          {getInitials(selectedConversation.contact.name)}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {selectedConversation.contact.name || selectedConversation.contact.phone_number}
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{selectedConversation.contact.phone_number}</span>
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            selectedConversation.contact.lead_status === 'new' ? 'bg-green-100 text-green-800' :
                            selectedConversation.contact.lead_status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                            selectedConversation.contact.lead_status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedConversation.contact.lead_status}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                {/* Messages Area */}
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <div className="h-96 overflow-y-auto p-4 space-y-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-pulse text-gray-500">Loading messages...</div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No messages yet</p>
                          <p className="text-sm mt-2">Start the conversation!</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.direction === 'outbound'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {/* Media content */}
                            {message.media_url && (
                              <div className="mb-2">
                                {message.media_type === 'image' && (
                                  <img 
                                    src={message.media_url} 
                                    alt="Media" 
                                    className="max-w-full h-auto rounded"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                )}
                                {message.media_type === 'video' && (
                                  <video 
                                    src={message.media_url} 
                                    controls 
                                    className="max-w-full h-auto rounded"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                )}
                                {message.media_type === 'audio' && (
                                  <audio 
                                    src={message.media_url} 
                                    controls 
                                    className="w-full"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                )}
                                {message.media_type === 'document' && (
                                  <div className="flex items-center space-x-2 p-2 bg-gray-200 rounded">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm">Document</span>
                                  </div>
                                )}
                                {message.media_type === 'sticker' && (
                                  <div className="text-center">
                                    <span className="text-2xl">🎭</span>
                                    <p className="text-xs">Sticker</p>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Text content */}
                            {message.content && (
                              <p className="text-sm">{message.content}</p>
                            )}
                            
                            {/* Timestamp */}
                            <p className={`text-xs mt-1 ${
                              message.direction === 'outbound' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatMessageTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>

                {/* Message Input */}
                <div className="border-t p-4">
                  {/* Message Type Selector */}
                  <div className="flex items-center space-x-2 mb-3">
                    <select 
                      value={messageType} 
                      onChange={(e) => setMessageType(e.target.value as 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'quick_reply')}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="text">Text</option>
                      <option value="image" disabled>Image (Coming Soon)</option>
                      <option value="document" disabled>Document (Coming Soon)</option>
                      <option value="audio" disabled>Audio (Coming Soon)</option>
                      <option value="video" disabled>Video (Coming Soon)</option>
                      <option value="sticker" disabled>Sticker (Coming Soon)</option>
                      <option value="quick_reply">Quick Reply</option>
                    </select>
                    
                    {messageType !== 'text' && messageType !== 'quick_reply' && (
                      <input
                        type="file"
                        accept={
                          messageType === 'image' ? 'image/*' :
                          messageType === 'video' ? 'video/*' :
                          messageType === 'audio' ? 'audio/*' :
                          messageType === 'document' ? '*' :
                          messageType === 'sticker' ? 'image/*' : '*'
                        }
                        onChange={handleMediaFileChange}
                        className="text-sm"
                      />
                    )}
                    
                    {messageType === 'quick_reply' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowQuickReplyBuilder(!showQuickReplyBuilder)}
                      >
                        {showQuickReplyBuilder ? 'Hide' : 'Show'} Quick Reply Builder
                      </Button>
                    )}
                  </div>

                  {/* Quick Reply Builder */}
                  {showQuickReplyBuilder && messageType === 'quick_reply' && (
                    <div className="mb-3 p-3 border rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">Quick Reply Buttons</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addQuickReplyButton}
                        >
                          Add Button
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {quickReplyButtons.map((button) => (
                          <div key={button.id} className="flex items-center space-x-2">
                            <span className="text-sm">{button.title}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeQuickReplyButton(button.id)}
                              className="text-red-600"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* File Preview */}
                  {mediaFile && (
                    <div className="mb-3 p-2 border rounded-lg bg-blue-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700">
                          {mediaFile.name} ({messageType})
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setMediaFile(null)}
                          className="text-red-600"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Input
                      placeholder={
                        messageType === 'quick_reply' ? "Enter message text for quick reply buttons..." :
                        messageType !== 'text' ? "Optional caption..." :
                        "Type your message..."
                      }
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={
                        sending || 
                        (messageType === 'text' && !newMessage.trim()) ||
                        (messageType !== 'text' && messageType !== 'quick_reply' && !mediaFile) ||
                        (messageType === 'quick_reply' && quickReplyButtons.length === 0)
                      }
                      size="icon"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <CardHeader>
                  <CardTitle className="text-lg">Select a conversation</CardTitle>
                  <CardDescription>
                    Choose a conversation from the list to start chatting
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No conversation selected</p>
                    <p className="text-sm mt-2">Select a conversation to view messages</p>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
