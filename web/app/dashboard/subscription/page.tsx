"use client";

import { useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardHeader from '../../components/DashboardHeader';
import { useAuthStore } from '../../store/authStore';
import DashboardFooter from '@/app/components/DashboardFooter';

interface CreditTransaction {
  id: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
}

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  bonus?: number;
  isPopular?: boolean;
}

export default function SubscriptionPage() {
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<string>('package2');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // User credit balance (would come from API)
  const [creditBalance, setCreditBalance] = useState(150);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([
    { id: '1', amount: 100, date: '2024-02-01', status: 'completed', reference: 'MPESA-TX123' },
    { id: '2', amount: 50, date: '2024-01-15', status: 'completed', reference: 'MPESA-TX456' },
    { id: '3', amount: 200, date: '2024-01-10', status: 'pending', reference: 'MPESA-TX789' },
  ]);

  // Credit packages
  const creditPackages: CreditPackage[] = [
    {
      id: 'package1',
      credits: 50,
      price: 50, // KES
      bonus: 0
    },
    {
      id: 'package2',
      credits: 100,
      price: 90, // KES
      bonus: 10,
      isPopular: true
    },
    {
      id: 'package3',
      credits: 200,
      price: 170, // KES
      bonus: 30
    },
    {
      id: 'package4',
      credits: 500,
      price: 400, // KES
      bonus: 100
    },
    {
      id: 'package5',
      credits: 1000,
      price: 750, // KES
      bonus: 250
    }
  ];

  // Format Kenyan phone number
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as Kenyan phone number
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    } else if (digits.length <= 9) {
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    } else {
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleTopUp = async () => {
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length !== 10) {
      setMessage({ type: 'error', text: 'Please enter a valid 10-digit Kenyan phone number (e.g., 0712 345 678)' });
      return;
    }

    const selectedPkg = creditPackages.find(pkg => pkg.id === selectedPackage);
    if (!selectedPkg) {
      setMessage({ type: 'error', text: 'Please select a credit package' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Call your API to initiate M-Pesa payment
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/payments/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.replace(/\D/g, ''),
          amount: selectedPkg.price,
          credits: selectedPkg.credits + (selectedPkg.bonus || 0),
          packageId: selectedPkg.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      setMessage({ 
        type: 'success', 
        text: `Payment request sent to ${phoneNumber}. Please check your phone to complete the payment.` 
      });

      // Clear phone number
      setPhoneNumber('');

      // Update balance (in a real app, this would come from WebSocket or polling)
      setCreditBalance(prev => prev + selectedPkg.credits + (selectedPkg.bonus || 0));

      // Add to transactions
      const newTransaction: CreditTransaction = {
        id: Date.now().toString(),
        amount: selectedPkg.credits + (selectedPkg.bonus || 0),
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        reference: data.reference || `MPESA-${Date.now()}`
      };
      setTransactions(prev => [newTransaction, ...prev]);

    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to process payment'
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate total credits (including bonus)
  const getTotalCredits = (pkg: CreditPackage) => {
    return pkg.credits + (pkg.bonus || 0);
  };

  // Calculate price per credit
  const getPricePerCredit = (pkg: CreditPackage) => {
    return (pkg.price / getTotalCredits(pkg)).toFixed(2);
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
            {/* Current Balance Section */}
            <div className="bg-gradient-to-r from-[var(--wakili-primary)] to-[var(--wakili-primary-dark)] rounded-2xl shadow-lg p-6 mb-8 text-white">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-2xl font-bold">Your Credit Balance</h2>
                  <p className="text-[var(--wakili-primary-100)] mt-1">Available credits for legal services</p>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-5xl font-bold mb-2">{creditBalance}</div>
                  <div className="text-[var(--wakili-primary-100)]">Credits</div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-[var(--wakili-primary-100)]">Value</div>
                    <div className="text-lg font-semibold">KES {creditBalance}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--wakili-primary-100)]">Estimated Documents</div>
                    <div className="text-lg font-semibold">{Math.floor(creditBalance / 10)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--wakili-primary-100)]">Last Top-up</div>
                    <div className="text-lg font-semibold">{transactions[0]?.date || 'Never'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top-up Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Credit Packages */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Choose Credit Package</h2>
                
                <div className="space-y-4">
                  {creditPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                        selectedPackage === pkg.id
                          ? 'border-[var(--wakili-primary)] bg-[var(--wakili-primary)]/5'
                          : 'border-gray-200 dark:border-gray-700 hover:border-[var(--wakili-primary)]/50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {getTotalCredits(pkg)} Credits
                            </h3>
                            {pkg.bonus && pkg.bonus > 0 && (
                              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                                +{pkg.bonus} bonus
                              </span>
                            )}
                            {pkg.isPopular && (
                              <span className="text-xs bg-[var(--wakili-primary)] text-white px-2 py-1 rounded-full">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            KES {pkg.price} • KES {getPricePerCredit(pkg)} per credit
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            KES {pkg.price}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Form */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Top Up Credits</h2>
                
                {message && (
                  <div className={`mb-6 p-4 rounded-lg ${
                    message.type === 'success' 
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}>
                    {message.text}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      M-Pesa Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400">+254</span>
                      </div>
                      <input
                        type="text"
                        id="phoneNumber"
                        value={phoneNumber}
                        onChange={handlePhoneNumberChange}
                        placeholder="7XX XXX XXX"
                        className="pl-16 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[var(--wakili-primary)] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        maxLength={13} // 4+1+3+1+3 = 12 + 1 for space
                      />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Enter your Safaricom M-Pesa number (e.g., 0712 345 678)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Selected Package
                    </label>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      {(() => {
                        const selectedPkg = creditPackages.find(pkg => pkg.id === selectedPackage);
                        return selectedPkg ? (
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {getTotalCredits(selectedPkg)} Credits
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {selectedPkg.credits} base + {selectedPkg.bonus || 0} bonus
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              KES {selectedPkg.price}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Package Price</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        KES {creditPackages.find(pkg => pkg.id === selectedPackage)?.price || 0}
                      </span>
                    </div>
                    <div className="flex justify-between mb-4">
                      <span className="text-gray-600 dark:text-gray-400">M-Pesa Fee</span>
                      <span className="font-medium text-gray-900 dark:text-white">KES 0</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-4">
                      <span>Total to Pay</span>
                      <span className="text-[var(--wakili-primary)]">
                        KES {creditPackages.find(pkg => pkg.id === selectedPackage)?.price || 0}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleTopUp}
                    disabled={loading || !phoneNumber}
                    className="w-full py-3 px-4 bg-[var(--wakili-primary)] text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      'Pay with M-Pesa'
                    )}
                  </button>

                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      You&apos;ll receive an M-Pesa prompt on your phone to confirm payment
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Transactions</h2>
              
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-4 text-gray-500 dark:text-gray-400">No transactions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Credits
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Reference
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {transaction.date}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            +{transaction.amount} credits
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            KES {transaction.amount}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {transaction.reference}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              transaction.status === 'completed'
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                                : transaction.status === 'pending'
                                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
                                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                            }`}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
          </div>
        </div>

        <DashboardFooter />
      </div>
    </ProtectedRoute>
  );
}