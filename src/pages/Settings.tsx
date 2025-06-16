
import React, { useState } from 'react';
import { User, Globe, Moon, Sun, Bell, Book, Shield, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export const Settings = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoDownload, setAutoDownload] = useState(false);
  const [language, setLanguage] = useState('ar');

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Settings</h1>
        <p className="text-stone-600">Manage your account and application preferences</p>
      </div>

      {/* Profile Settings */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-stone-800 flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" defaultValue="Ahmed" />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" defaultValue="Hassan" />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" defaultValue="ahmed.hassan@email.com" />
          </div>
          
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Input id="bio" placeholder="Tell us about yourself..." />
          </div>
          
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            Save Profile Changes
          </Button>
        </CardContent>
      </Card>

      {/* Language & Display */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-stone-800 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Language & Display
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Language</Label>
              <p className="text-sm text-stone-600">Choose your preferred language</p>
            </div>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية (Arabic)</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Dark Mode</Label>
              <p className="text-sm text-stone-600">Switch between light and dark themes</p>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-stone-600" />
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              <Moon className="w-4 h-4 text-stone-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reading Preferences */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-stone-800 flex items-center gap-2">
            <Book className="w-5 h-5" />
            Reading Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Default Font Size</Label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="xlarge">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Reading Theme</Label>
              <Select defaultValue="light">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="sepia">Sepia</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Auto-scroll Reading</Label>
              <p className="text-sm text-stone-600">Automatically scroll while reading</p>
            </div>
            <Switch />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Highlight Sync</Label>
              <p className="text-sm text-stone-600">Sync highlights across devices</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-stone-800 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Push Notifications</Label>
              <p className="text-sm text-stone-600">Receive notifications about new books and updates</p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Reading Reminders</Label>
              <p className="text-sm text-stone-600">Daily reminders to continue reading</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">New Book Alerts</Label>
              <p className="text-sm text-stone-600">Get notified when new books are added</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Downloads & Storage */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-stone-800 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Downloads & Storage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Auto-download Podcasts</Label>
              <p className="text-sm text-stone-600">Automatically download podcast episodes</p>
            </div>
            <Switch checked={autoDownload} onCheckedChange={setAutoDownload} />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Storage Used</Label>
              <p className="text-sm text-stone-600">245 MB of 2 GB used</p>
            </div>
            <Button variant="outline" size="sm">
              Manage Storage
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Clear Cache</Label>
              <p className="text-sm text-stone-600">Free up space by clearing temporary files</p>
            </div>
            <Button variant="outline" size="sm">
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-stone-800 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Reading Analytics</Label>
              <p className="text-sm text-stone-600">Allow collection of reading statistics</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Change Password</Label>
              <p className="text-sm text-stone-600">Update your account password</p>
            </div>
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Two-Factor Authentication</Label>
              <p className="text-sm text-stone-600">Add an extra layer of security</p>
            </div>
            <Button variant="outline" size="sm">
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium text-red-800">Delete Account</Label>
              <p className="text-sm text-red-600">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
