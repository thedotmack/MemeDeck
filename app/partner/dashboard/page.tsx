'use client';

import { PartnerDashboard } from '@/components/partners/partner-dashboard';
import { useStore } from '@/lib/store';

export default function PartnerDashboardPage() {
  const auth = useStore.use.auth() || { user: null, isAuthenticated: false };
  
  if (!auth.isAuthenticated || !auth.user?.walletAddress) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Partner Dashboard</h1>
          <p className="text-gray-600">Please connect your wallet to view partner dashboard</p>
        </div>
      </div>
    );
  }
  
  
  return <PartnerDashboard />;
}