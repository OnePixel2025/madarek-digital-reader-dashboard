
import React, { useState } from 'react';
import { BookOpen, Grid, List, Search, Filter, Star, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const filters = [
  { label: 'All Books', value: 'all', count: 45 },
  { label: 'In Progress', value: 'progress', count: 8 },
  { label: 'Completed', value: 'completed', count: 24 },
  { label: 'Favorites', value: 'favorites', count: 13 },
];

const books = [
  {
    id: 1,
    title: 'تاريخ السودان الحديث',
    author: 'محمد عبدالرحيم',
    progress: 75,
    status: 'progress',
    category: 'History',
    rating: 4.5,
    cover: 'bg-gradient-to-br from-blue-500 to-blue-600',
    favorite: true
  },
  {
    id: 2,
    title: 'الأدب السوداني المعاصر',
    author: 'فاطمة النور',
    progress: 100,
    status: 'completed',
    category: 'Literature',
    rating: 4.8,
    cover: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    favorite: false
  },
  {
    id: 3,
    title: 'جغرافية السودان',
    author: 'أحمد محمد علي',
    progress: 45,
    status: 'progress',
    category: 'Geography',
    rating: 4.2,
    cover: 'bg-gradient-to-br from-purple-500 to-purple-600',
    favorite: true
  },
  {
    id: 4,
    title: 'الاقتصاد السوداني',
    author: 'سارة أحمد',
    progress: 100,
    status: 'completed',
    category: 'Economics',
    rating: 4.6,
    cover: 'bg-gradient-to-br from-orange-500 to-orange-600',
    favorite: false
  },
  {
    id: 5,
    title: 'الثقافة السودانية',
    author: 'عبدالله محمد',
    progress: 20,
    status: 'progress',
    category: 'Culture',
    rating: 4.3,
    cover: 'bg-gradient-to-br from-teal-500 to-teal-600',
    favorite: true
  },
  {
    id: 6,
    title: 'علوم الحاسوب',
    author: 'نور الدين',
    progress: 0,
    status: 'new',
    category: 'Technology',
    rating: 4.7,
    cover: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    favorite: false
  }
];

export const Library = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBooks = books.filter(book => {
    const matchesFilter = activeFilter === 'all' || 
      (activeFilter === 'favorites' && book.favorite) ||
      book.status === activeFilter;
    
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status: string, progress: number) => {
    if (progress === 100 || status === 'completed') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (progress > 0) return <Clock className="w-4 h-4 text-blue-600" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">My Library</h1>
          <p className="text-stone-600">Manage your book collection</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
            <Input 
              placeholder="Search books or authors..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              variant={activeFilter === filter.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(filter.value)}
              className="whitespace-nowrap"
            >
              {filter.label}
              <Badge variant="secondary" className="ml-2">
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Books Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="border-stone-200 hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-4">
                <div className="relative mb-4">
                  <div className={`w-full h-48 rounded-lg ${book.cover} flex items-center justify-center relative overflow-hidden`}>
                    <BookOpen className="w-12 h-12 text-white" />
                    {book.favorite && (
                      <Star className="absolute top-2 right-2 w-4 h-4 text-yellow-400 fill-current" />
                    )}
                    <div className="absolute bottom-2 left-2 right-2">
                      {book.progress > 0 && (
                        <div className="bg-white/20 rounded-full h-1">
                          <div 
                            className="bg-white h-1 rounded-full transition-all"
                            style={{ width: `${book.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-stone-800 group-hover:text-emerald-700 transition-colors leading-tight">
                      {book.title}
                    </h3>
                    {getStatusIcon(book.status, book.progress)}
                  </div>
                  
                  <p className="text-sm text-stone-600">{book.author}</p>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {book.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-stone-600">{book.rating}</span>
                    </div>
                  </div>
                  
                  {book.progress > 0 && book.progress < 100 && (
                    <div className="text-xs text-stone-500">
                      {book.progress}% complete
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="border-stone-200 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-20 rounded ${book.cover} flex items-center justify-center flex-shrink-0 relative`}>
                    <BookOpen className="w-6 h-6 text-white" />
                    {book.favorite && (
                      <Star className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 fill-current" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-stone-800 hover:text-emerald-700 transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-sm text-stone-600 mb-2">{book.author}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-stone-500">
                          <Badge variant="secondary">{book.category}</Badge>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span>{book.rating}</span>
                          </div>
                          {book.progress > 0 && (
                            <span>{book.progress}% complete</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusIcon(book.status, book.progress)}
                        <Button variant="ghost" size="sm">
                          Open
                        </Button>
                      </div>
                    </div>
                    
                    {book.progress > 0 && (
                      <div className="mt-3 w-full bg-stone-200 rounded-full h-1">
                        <div 
                          className="bg-emerald-600 h-1 rounded-full transition-all"
                          style={{ width: `${book.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
