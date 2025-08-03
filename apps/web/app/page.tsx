'use client'; 

import React, { useState } from 'react';
import { UserProvider } from '../context/UserContext';
import { Sidebar } from '../components/SideBar';
import { NetworkGraphPage } from '../pages/NetworkGraphPage';
import { LeaderboardPage } from '../pages/LeaderboardPage';
import { UserProfilePage } from '../pages/UserProfilePage';
import { InfluentialFriendsPage } from '../pages/InfluentialFriendsPage';
import { PaginatedFriendsPage } from '../pages/PaginatedFriendsPage';
import { PageTitle } from '../components/ui/PageTitle';

export default function HomePage() {
  const [activePage, setActivePage] = useState('network-graph');

  const renderPage = () => {
    switch (activePage) {
      case 'network-graph':
        return <NetworkGraphPage />;
      case 'network-strength':
        return <LeaderboardPage type="strength" />;
      case 'referral-points':
        return <LeaderboardPage type="referral" />;
      case 'user-profile':
        return <UserProfilePage />;
      case 'influential-friends':
        return <InfluentialFriendsPage />;
      case 'paginated-friends':
        return <PaginatedFriendsPage />;
      default:
        return <PageTitle title="Welcome" subtitle="Select an option from the sidebar to begin." />;
    }
  };

  return (
    <UserProvider>
      <div className="grid grid-cols-[256px_1fr] h-screen">
        
        <div>
          <Sidebar activePage={activePage} setActivePage={setActivePage} />
        </div>
      
        <main className="p-8 overflow-y-auto overflow-x-hidden">
          {renderPage()}
        </main>
      </div>
    </UserProvider>
  );
}