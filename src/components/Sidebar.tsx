
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Library, 
  Headphones, 
  Upload, 
  Settings,
  List,
  User,
  Book,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Book },
  { name: 'Read Book', href: '/read', icon: BookOpen },
  { name: 'My Library', href: '/library', icon: Library },
  
  { name: 'My Collections', href: '/collections', icon: List },
  { name: 'My Podcasts', href: '/podcasts', icon: Headphones },
  { name: 'My Uploads', href: '/uploads', icon: Upload },
  { name: 'AI Chat', href: '/ai-chat', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className={cn(
      "bg-white border-r border-stone-200 transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold text-stone-800">Madarek</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || (item.href === '/dashboard' && location.pathname === '/');
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                  : "text-stone-600 hover:bg-stone-100"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="font-medium">{item.name}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-stone-200">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center px-3 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <span className={cn(
            "transform transition-transform",
            collapsed ? "rotate-180" : ""
          )}>
            ←
          </span>
        </button>
      </div>
    </div>
  );
};
