
import React from 'react';
import { BookOpen, Clock, Star, ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const stats = [
  { label: 'Books Read', value: '24', icon: BookOpen, color: 'text-emerald-600' },
  { label: 'Reading Hours', value: '156', icon: Clock, color: 'text-blue-600' },
  { label: 'Favorites', value: '8', icon: Star, color: 'text-amber-600' },
  { label: 'This Month', value: '+12%', icon: TrendingUp, color: 'text-green-600' },
];

const recentBooks = [
  { title: 'تاريخ السودان الحديث', author: 'محمد عبدالرحيم', progress: 75, cover: 'bg-gradient-to-br from-blue-500 to-blue-600' },
  { title: 'الأدب السوداني المعاصر', author: 'فاطمة النور', progress: 45, cover: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
  { title: 'جغرافية السودان', author: 'أحمد محمد علي', progress: 90, cover: 'bg-gradient-to-br from-purple-500 to-purple-600' },
];

export const Dashboard = () => {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-8">
        <h1 className="text-3xl font-bold text-stone-800 mb-2">
          Welcome back, Ahmed! 👋
        </h1>
        <p className="text-stone-600 mb-6">
          Continue your learning journey. You've read 3 books this month!
        </p>
        <div className="flex gap-4">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <BookOpen className="w-4 h-4 mr-2" />
            Continue Reading
          </Button>
          <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            Browse Library
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-stone-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-stone-800">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Continue Reading */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-stone-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Continue Reading
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentBooks.map((book, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer">
                <div className={`w-12 h-16 rounded ${book.cover} flex items-center justify-center`}>
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-stone-800 mb-1">{book.title}</h4>
                  <p className="text-sm text-stone-600 mb-2">{book.author}</p>
                  <div className="flex items-center gap-2">
                    <Progress value={book.progress} className="flex-1 h-2" />
                    <span className="text-xs text-stone-500">{book.progress}%</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-stone-800">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start h-auto p-4 border-stone-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-stone-800">Browse New Books</div>
                  <div className="text-sm text-stone-500">Discover latest additions</div>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="w-full justify-start h-auto p-4 border-stone-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-stone-800">Listen to Podcasts</div>
                  <div className="text-sm text-stone-500">Audio learning on the go</div>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="w-full justify-start h-auto p-4 border-stone-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-stone-800">AI Tutor Session</div>
                  <div className="text-sm text-stone-500">Get personalized help</div>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
