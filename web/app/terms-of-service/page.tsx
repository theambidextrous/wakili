"use client";

import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function TermsOfServicePage() {

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--wakili-primary)/5,_transparent)]">
      <main className="mx-2 w-full max-w-6xl min-h-screen bg-white dark:bg-gray-900 py-8 px-6 md:px-12 lg:px-20 rounded-none side-shadow">
        <Header activePage="terms" />

        <section className="mt-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Terms of Service</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
              Effective Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  By accessing or using Wakili AI (&quot;the Platform&quot;), you agree to be bound by these Terms of Service 
                  and our Privacy Policy. If you do not agree to these terms, please do not use our services.
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  We reserve the right to modify these terms at any time. Continued use of the Platform after changes 
                  constitutes acceptance of the modified terms.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Description of Service</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  Wakili AI provides AI-powered legal assistance services including:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>Legal document review and analysis</li>
                  <li>Legal research and case law referencing</li>
                  <li>General legal guidance and consultations</li>
                  <li>Document template generation</li>
                  <li>Legal terminology explanations</li>
                </ul>
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        <strong>Important Disclaimer:</strong> Wakili AI provides informational assistance only and 
                        does not constitute formal legal advice. Our services are not a substitute for professional 
                        legal counsel. Always consult with a qualified attorney for legal matters.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. User Accounts</h2>
                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">3.1 Registration</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  To use our services, you must:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>Be at least 18 years old</li>
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized access</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">3.2 Account Termination</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  We reserve the right to suspend or terminate accounts that:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>Violate these terms</li>
                  <li>Engage in fraudulent activities</li>
                  <li>Attempt to reverse engineer or hack the Platform</li>
                  <li>Use the service for illegal purposes</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Payment and Credits</h2>
                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">4.1 Credit System</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  Our services operate on a credit-based system:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>Credits are purchased through M-Pesa payments</li>
                  <li>Different services consume different credit amounts</li>
                  <li>Credits are non-transferable and non-refundable</li>
                  <li>Unused credits expire after 12 months of inactivity</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">4.2 Pricing</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  We reserve the right to change credit prices at any time. Current prices are displayed on the 
                  subscription page. Price changes do not affect previously purchased credits.
                </p>

                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">4.3 Refund Policy</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Credits are generally non-refundable. In exceptional circumstances, refunds may be granted at our 
                  sole discretion. Contact support for refund requests.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. User Responsibilities</h2>
                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">5.1 Acceptable Use</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  You agree not to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>Use the service for illegal activities</li>
                  <li>Upload malicious content or viruses</li>
                  <li>Attempt to gain unauthorized access</li>
                  <li>Use automated systems to access the service</li>
                  <li>Impersonate others or provide false information</li>
                  <li>Share your account credentials</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">5.2 Content Guidelines</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  When uploading documents or asking questions:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>Ensure you have the right to share the content</li>
                  <li>Do not upload confidential third-party information</li>
                  <li>Remove sensitive personal information when possible</li>
                  <li>Comply with all applicable laws and regulations</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Intellectual Property</h2>
                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">6.1 Our Rights</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  Wakili AI and all related content, features, and functionality are owned by us and protected by 
                  copyright, trademark, and other intellectual property laws.
                </p>

                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">6.2 Your Rights</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  You retain ownership of the documents and content you upload. However, by using our service, you grant us:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>A license to process your content to provide our services</li>
                  <li>Permission to use anonymized data to improve our AI models</li>
                  <li>The right to store your content for service delivery</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">6.3 AI Output</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  AI-generated responses and analyses are provided for your personal use. Commercial use may require 
                  additional licensing. The AI output does not constitute legal advice.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Limitation of Liability</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  To the maximum extent permitted by law:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>We are not liable for any indirect, incidental, or consequential damages</li>
                  <li>Our total liability is limited to the amount you paid for services in the last 6 months</li>
                  <li>We are not responsible for decisions made based on AI-generated content</li>
                  <li>We do not guarantee the accuracy or completeness of AI responses</li>
                </ul>
                <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 dark:border-red-600 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400 dark:text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        <strong>No Legal Liability:</strong> Wakili AI is an informational tool only. We are not 
                        a law firm, and our services do not create an attorney-client relationship. You are solely 
                        responsible for any legal decisions or actions taken based on our services.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Indemnification</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  You agree to indemnify and hold harmless Wakili AI, its affiliates, officers, and employees from 
                  any claims, damages, losses, or expenses arising from:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>Your use of the Platform</li>
                  <li>Your violation of these terms</li>
                  <li>Your violation of any laws or third-party rights</li>
                  <li>Any content you submit</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Service Modifications</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  We reserve the right to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>Modify, suspend, or discontinue any part of the service</li>
                  <li>Change feature availability</li>
                  <li>Update AI models and algorithms</li>
                  <li>Implement usage limits or restrictions</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300">
                  We will provide reasonable notice of significant changes that affect your use of the service.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Governing Law</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  These terms are governed by and construed in accordance with the laws of Kenya. Any disputes shall 
                  be subject to the exclusive jurisdiction of the courts of Nairobi, Kenya.
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  We comply with the Data Protection Act, 2019 of Kenya and other applicable data protection regulations.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">11. Contact Information</h2>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    For questions about these Terms of Service, please contact:
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Wakili AI</strong><br />
                    Email: <Link href="mailto:legal@wakiliai.com" className="text-[var(--wakili-primary)] hover:underline">legal@wakiliai.com</Link><br />
                    Address: Nairobi, Kenya<br />
                    Phone: +254 700 000 000
                  </p>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  By using Wakili AI, you acknowledge that you have read, understood, and agree to be bound by these 
                  Terms of Service and our Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}