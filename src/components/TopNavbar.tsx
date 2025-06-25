
import React from 'react';
import { Bell, Search } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const TopNavbar = () => {
  return (
    <header className="bg-white border-b border-stone-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
            <Input 
              placeholder="Search books, authors, or topics..."
              className="pl-10 bg-stone-50 border-stone-200"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
          
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-8 h-8"
              }
            }}
          />
        </div>
      </div>
    </header>
  );
};
