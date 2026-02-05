"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import ChatInterface from '../components/ChatInterface';
import DashboardFooter from '../components/DashboardFooter';
import { useAuthStore } from '../store/authStore';
import { Chat } from '../types/auth';
import { checkAuth, getAuthToken, getUserFromStorage } from '../utils/auth';

export default function DashboardPage() {

  const initialChats = [
    { id: 1, title: 'Legal Document Review', date: '2024-01-15', preview: 'Can you review this contract?' },
    { id: 2, title: 'Case Research', date: '2024-01-14', preview: 'Research on intellectual property laws...' },
    { id: 3, title: 'Client Consultation', date: '2024-01-13', preview: 'Questions about employment law...' },
  ];

  const { user, accessToken, setUser, logout, setAccessToken } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [currentChat, setCurrentChat] = useState<Chat | null>(initialChats[0]);

  useEffect(() => {
    const initializeAuth = () => {
      if (checkAuth() && (!accessToken || !user)) {
        const token = getAuthToken();
        const storedUser = getUserFromStorage();
        
        if (token && storedUser) {
          setAccessToken(token);
          setUser(storedUser);
          console.log('Auth initialized from storage');
        }
      }
    };
    
    initializeAuth();
  }, [accessToken, user, setUser, setAccessToken]);

  
  const startNewChat = () => {
    const newChat = {
      id: chats.length + 1,
      title: `New Chat ${chats.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      preview: 'Start a new conversation...'
    };
    setChats([newChat, ...chats]);
    setCurrentChat(newChat);
    setSidebarOpen(false);
  };

  const deleteChat = (chatId: number) => {
    setChats(chats.filter(chat => chat.id !== chatId));
    if (currentChat?.id === chatId) {
      setCurrentChat(chats.length > 1 ? chats[1] : null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <DashboardHeader 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={user}
          onLogout={logout}
        />
        
        <div className="flex pt-16">
          {/* Sidebar for mobile */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>
              <div className="relative flex-1 flex flex-col max-w-xs w-full h-full bg-white dark:bg-gray-800">
                <DashboardSidebar
                  chats={chats}
                  currentChat={currentChat}
                  onSelectChat={setCurrentChat}
                  onNewChat={startNewChat}
                  onDeleteChat={deleteChat}
                  onClose={() => setSidebarOpen(false)}
                />
              </div>
            </div>
          )}

          {/* Sidebar for desktop */}
          <div className="hidden lg:flex lg:flex-shrink-0">
            <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-[calc(100vh-4rem)]">
              <DashboardSidebar
                chats={chats}
                currentChat={currentChat}
                onSelectChat={setCurrentChat}
                onNewChat={startNewChat}
                onDeleteChat={deleteChat}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
            <main className="flex-1 overflow-y-auto">
              <div className="py-6">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                  <ChatInterface 
                    onSendMessage={(message) => {
                      console.log('Sending message:', message);
                    }}
                  />
                </div>
              </div>
            </main>
            
            <DashboardFooter />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}