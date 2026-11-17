"use client";

import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function PrivacyPolicyPage() {

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--wakili-primary)/5,_transparent)]">
      <main className="mx-2 w-full max-w-6xl min-h-screen bg-white dark:bg-gray-900 py-8 px-6 md:px-12 lg:px-20 rounded-none side-shadow">
        <Header activePage="privacy" />

        <section className="mt-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Privacy Policy</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Introduction</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Welcome to Wakili AI. We respect your privacy and are committed to protecting your personal data. 
                  This privacy policy explains how we collect, use, disclose, and safeguard your information when you use 
                  our AI-powered legal assistance platform.
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Please read this privacy policy carefully. By accessing or using our services, you acknowledge that 
                  you have read, understood, and agree to be bound by all the terms outlined in this policy.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Information We Collect</h2>
                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">2.1 Personal Information</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  When you register for an account, we collect:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>Full name and contact details</li>
                  <li>Email address</li>
                  <li>Phone number (for M-Pesa transactions)</li>
                  <li>Payment information (processed securely via M-Pesa)</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">2.2 Legal Documents & Queries</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  To provide our services, we process:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>Legal documents you upload for review</li>
                  <li>Legal questions and queries submitted</li>
                  <li>Chat history and conversations with our AI</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">2.3 Usage Data</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  We automatically collect information about your interaction with our platform, including:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>IP address and device information</li>
                  <li>Browser type and version</li>
                  <li>Pages visited and time spent</li>
                  <li>Feature usage patterns</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. How We Use Your Information</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  We use the collected information for:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>Providing and improving our AI legal assistance services</li>
                  <li>Processing payments and managing your credits</li>
                  <li>Personalizing your experience and recommendations</li>
                  <li>Communicating important updates and service changes</li>
                  <li>Ensuring platform security and preventing fraud</li>
                  <li>Complying with legal obligations</li>
                  <li>Training and improving our AI models (anonymized data only)</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Data Security</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>End-to-end encryption for all data transmissions</li>
                  <li>Secure storage with access controls</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Employee training on data protection</li>
                  <li>Secure payment processing via M-Pesa</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300">
                  While we strive to use commercially acceptable means to protect your personal information, 
                  no method of transmission over the Internet or electronic storage is 100% secure.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Data Retention</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  We retain your personal information only for as long as necessary:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>Account information: Retained while your account is active</li>
                  <li>Legal documents: Deleted 30 days after processing</li>
                  <li>Chat history: Available for your reference, can be deleted upon request</li>
                  <li>Payment records: Retained for 7 years for legal compliance</li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Your Rights</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  You have the right to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to data processing</li>
                  <li>Data portability</li>
                  <li>Withdraw consent</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300">
                  To exercise these rights, please contact us at{' '}
                  <Link href="mailto:privacy@wakiliai.com" className="text-[var(--wakili-primary)] hover:underline">
                    privacy@wakiliai.com
                  </Link>
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Third-Party Services</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  We use trusted third-party services for:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>Payment processing (M-Pesa)</li>
                  <li>Cloud hosting and storage</li>
                  <li>Analytics and monitoring</li>
                  <li>Customer support</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300">
                  These services have their own privacy policies, and we recommend you review them.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Children&apos;s Privacy</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  Our services are not intended for individuals under 18 years of age. We do not knowingly 
                  collect personal information from children. If you are a parent or guardian and believe your 
                  child has provided us with personal information, please contact us immediately.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Changes to This Policy</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  We may update this privacy policy periodically. We will notify you of any changes by:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>Posting the new policy on this page</li>
                  <li>Sending an email notification</li>
                  <li>Displaying a notice in the application</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300">
                  Your continued use of our services after changes constitutes acceptance of the updated policy.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Contact Us</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  If you have questions about this privacy policy, please contact us at:
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Wakili AI</strong><br />
                    Email: <Link href="mailto:privacy@wakiliai.com" className="text-[var(--wakili-primary)] hover:underline">privacy@wakiliai.com</Link><br />
                    Address: Nairobi, Kenya<br />
                    Phone: +254 700 000 000
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}