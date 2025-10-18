'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { ConversationsView } from './conversations-view'
import { LeadsView } from './leads-view'
import { CampaignsView } from './campaigns-view'
import { SettingsView } from './settings-view'
import { AnalyticsView } from './analytics-view'

type ViewType = 'conversations' | 'leads' | 'campaigns' | 'analytics' | 'settings'

export function Dashboard() {
  const { user } = useAuth()
  const [activeView, setActiveView] = useState<ViewType>('conversations')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const renderView = () => {
    switch (activeView) {
      case 'conversations':
        return <ConversationsView />
      case 'leads':
        return <LeadsView />
      case 'campaigns':
        return <CampaignsView />
      case 'analytics':
        return <AnalyticsView />
      case 'settings':
        return <SettingsView />
      default:
        return <ConversationsView />
    }
  }

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        <main className="flex-1 overflow-auto">
          {renderView()}
        </main>
      </div>
    </div>
  )
}
