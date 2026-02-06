"use client";

import { useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardHeader from '../../components/DashboardHeader';
import { useAuthStore } from '../../store/authStore';
import DashboardFooter from '@/app/components/DashboardFooter';

interface FAQ {
  question: string;
  answer: string;
}

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function SupportPage() {
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'status'>('faq');
  const [formData, setFormData] = useState<ContactForm>({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const faqs: FAQ[] = [
    {
      question: 'How do I upload legal documents for review?',
      answer: 'You can upload documents by clicking the "Attach File" button in the chat interface. Supported formats include PDF, DOC, DOCX, and TXT files up to 10MB.'
    },
    {
      question: 'Is my data secure and private?',
      answer: 'Yes, all data is encrypted in transit and at rest. We follow industry best practices for security and privacy. Your documents are never shared with third parties.'
    },
    {
      question: 'What types of legal questions can Wakili AI help with?',
      answer: 'Wakili AI can assist with contract reviews, legal research, document analysis, compliance questions, and general legal guidance. However, it does not provide formal legal advice.'
    },
    {
      question: 'How accurate are the AI responses?',
      answer: 'Our AI is trained on extensive legal data and is regularly updated. However, always verify critical information with a qualified legal professional.'
    },
    {
      question: 'Can I export my chat history?',
      answer: 'Yes, Pro and Enterprise subscribers can export chat history in PDF or TXT format from the chat interface options menu.'
    }
  ];

  const systemStatus = [
    { service: 'AI Chat Service', status: 'operational', uptime: '99.9%' },
    { service: 'Document Processing', status: 'operational', uptime: '99.8%' },
    { service: 'User Authentication', status: 'operational', uptime: '99.95%' },
    { service: 'Database', status: 'operational', uptime: '99.99%' },
    { service: 'API Services', status: 'operational', uptime: '99.9%' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitMessage({
        type: 'success',
        text: 'Your message has been sent! We\'ll respond within 24 hours.'
      });
      
      // Reset form
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: ''
      });
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        text: 'Failed to send message. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <DashboardHeader 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={user}
          onLogout={() => {}}
        />
        
        <div className="pt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Get help with Wakili AI, report issues, or contact our support team
              </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('faq')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'faq'
                      ? 'border-[var(--wakili-primary)] text-[var(--wakili-primary)]'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  FAQ
                </button>
                <button
                  onClick={() => setActiveTab('contact')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'contact'
                      ? 'border-[var(--wakili-primary)] text-[var(--wakili-primary)]'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Contact Support
                </button>
                <button
                  onClick={() => setActiveTab('status')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'status'
                      ? 'border-[var(--wakili-primary)] text-[var(--wakili-primary)]'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  System Status
                </button>
              </nav>
            </div>

            {/* FAQ Content */}
            {activeTab === 'faq' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="space-y-6">
                  {faqs.map((faq, index) => (
                    <div key={index} className="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Didn&apos;t find what you were looking for?{' '}
                        <button onClick={() => setActiveTab('contact')} className="font-medium underline">
                          Contact our support team
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Form */}
            {activeTab === 'contact' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                {submitMessage && (
                  <div className={`mb-6 p-4 rounded-lg ${
                    submitMessage.type === 'success' 
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}>
                    {submitMessage.text}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[var(--wakili-primary)] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[var(--wakili-primary)] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[var(--wakili-primary)] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="">Select a subject</option>
                      <option value="technical">Technical Issue</option>
                      <option value="billing">Billing Question</option>
                      <option value="feature">Feature Request</option>
                      <option value="account">Account Issue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[var(--wakili-primary)] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      required
                      placeholder="Please describe your issue or question in detail..."
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-[var(--wakili-primary)] text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      {submitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </form>

                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Email Support</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">support@wakiliai.com</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Response time: 24-48 hours</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Status */}
            {activeTab === 'status' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="mb-6">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-3"></div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">All Systems Operational</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {systemStatus.map((service, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{service.service}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Uptime: {service.uptime}</p>
                      </div>
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${
                          service.status === 'operational' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className={`text-sm font-medium ${
                          service.status === 'operational' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    System status is updated in real-time. Subscribe to our{' '}
                    <a href="#" className="text-[var(--wakili-primary)] hover:underline">
                      status page
                    </a>{' '}
                    for notifications.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

         <DashboardFooter />
      </div>
    </ProtectedRoute>
  );
}