'use client';

import React, { useContext, useState } from 'react';
import { BarChart2, User, Share2, Star, Users, List } from 'lucide-react';
import { UserContext } from '../context/UserContext';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export const Sidebar = ({ activePage, setActivePage }: SidebarProps) => {
  const { username, setUsername } = useContext(UserContext);
  const [inputValue, setInputValue] = useState(username);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      setUsername(inputValue);
    }
  };

  const navItems = [
    {
      title: 'Analytics Page',
      icon: BarChart2,
      subItems: [
        { name: 'Network Graph', page: 'network-graph', icon: Share2 },
        { name: 'Network Strength', page: 'network-strength', icon: Star },
        { name: 'Referral Points', page: 'referral-points', icon: Users },
      ],
    },
    {
      title: 'User Profile',
      icon: User,
      subItems: [
        { name: 'User Profile', page: 'user-profile', icon: User },
        { name: 'Influential Friends', page: 'influential-friends', icon: Star },
        { name: 'Friends List', page: 'paginated-friends', icon: List },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-gray-900/70 backdrop-blur-md border-r border-gray-800 flex-shrink-0 p-4 flex flex-col">
      <div className="mb-6">
        <label htmlFor="username-input" className="text-sm font-medium text-gray-400 mb-2 block">
          Username
        </label>
        <input
          id="username-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter username"
          className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <nav className="flex-grow">
        {navItems.map((item) => (
          <div key={item.title} className="mb-4">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
              <item.icon className="w-4 h-4 mr-2" />
              {item.title}
            </h3>
            <ul className="mt-1">
              {item.subItems.map((subItem) => (
                <li key={subItem.page}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setActivePage(subItem.page);
                    }}
                    className={`flex items-center pl-12 pr-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                      activePage === subItem.page
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <subItem.icon className="w-4 h-4 mr-3" />
                    {subItem.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
};