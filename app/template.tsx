'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './components/layout/sidebar';
import Topbar from './components/layout/topbar';


interface DashboardTemplateProps {
  children: ReactNode;
}

export default function DashboardTemplate({ children }: DashboardTemplateProps) {
  const pathname = usePathname();

  // Define routes where sidebar and topbar should be hidden
  const hiddenRoutes = ['/', '/sign-up', '/forgot-password'];

  // Check if current route is in hiddenRoutes
  const shouldHideLayout = hiddenRoutes.includes(pathname || '');

  // If it's a public route, render without protection
  if (shouldHideLayout) {
    return children;
  }

  // For all other routes, wrap with ProtectedRoute
  return (
    
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar - only show if not on hidden route */}
        {!shouldHideLayout && <Sidebar />}
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Topbar - only show if not on hidden route */}
          {!shouldHideLayout && <Topbar />}
          
          {/* Main Content */}
          <main className={`flex-1 overflow-y-auto ${shouldHideLayout ? '' : 'p-6'}`}>
            {children}
          </main>
        </div>
      </div>
    
  );
}