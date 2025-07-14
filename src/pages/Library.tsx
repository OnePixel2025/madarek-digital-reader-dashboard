
import React, { useState } from 'react';
import { BookOpen, Grid, List, Search, Filter, Star, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Book {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  isbn: string | null;
  publication_year: number | null;
  category: string | null;
  language: string | null;
  page_count: number | null;
  file_size_mb: number | null;
  file_path: string | null;
  cover_image_path: string | null;
  status: string | null;
  upload_date: string;
  created_at: string;
}

export const Library = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: books = [], isLoading, error } = useQuery({
    queryKey: ['library-books'],
    queryFn: async () => {
      console.log('Fetching books from database...');
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching books:', error);
        throw error;
      }
      
      console.log('Fetched books:', data);
      return data as Book[];
    }
  });

  // Calculate filter counts based on actual data
  const filterCounts = {
    all: books.length,
    active: books.filter(book => book.status === 'active').length,
    processing: books.filter(book => book.status === 'processing').length,
    inactive: books.filter(book => book.status === 'inactive').length,
  };

  const filters = [
    { label: 'All Books', value: 'all', count: filterCounts.all },
    { label: 'Active', value: 'active', count: filterCounts.active },
    { label: 'Processing', value: 'processing', count: filterCounts.processing },
    { label: 'Inactive', value: 'inactive', count: filterCounts.inactive },
  ];

  const filteredBooks = books.filter(book => {
    const matchesFilter = activeFilter === 'all' || book.status === activeFilter;
    
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.author && book.author.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'inactive': return <Clock className="w-4 h-4 text-red-600" />;
      default: return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
  };

  const getBookCoverColor = (index: number) => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-emerald-500 to-emerald-600',
      'bg-gradient-to-br from-purple-500 to-purple-600',
      'bg-gradient-to-br from-orange-500 to-orange-600',
      'bg-gradient-to-br from-teal-500 to-teal-600',
      'bg-gradient-to-br from-indigo-500 to-indigo-600'
    ];
    return colors[index % colors.length];
  };

  const handleBookClick = (bookId: string) => {
    navigate(`/read-book/${bookId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading your library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading library</p>
          <p className="text-stone-600">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">My Library</h1>
          <p className="text-stone-600">Manage your book collection ({books.length} books)</p>
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
      {filteredBooks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-medium text-stone-800 mb-2">No books found</h3>
          <p className="text-stone-600">
            {searchQuery ? 'Try adjusting your search terms' : 'Start building your library by uploading some books'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book, index) => (
            <Card key={book.id} className="border-stone-200 hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => handleBookClick(book.id)}>
              <CardContent className="p-4">
                <div className="relative mb-4">
                  <div className={`w-full h-48 rounded-lg ${getBookCoverColor(index)} flex items-center justify-center relative overflow-hidden`}>
                    <BookOpen className="w-12 h-12 text-white" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-stone-800 group-hover:text-emerald-700 transition-colors leading-tight">
                      {book.title}
                    </h3>
                    {getStatusIcon(book.status)}
                  </div>
                  
                  <p className="text-sm text-stone-600">{book.author || 'Unknown Author'}</p>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {book.category || 'Uncategorized'}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-stone-600">{book.language || 'Arabic'}</span>
                    </div>
                  </div>
                  
                  {book.page_count && (
                    <div className="text-xs text-stone-500">
                      {book.page_count} pages
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBooks.map((book, index) => (
            <Card key={book.id} className="border-stone-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleBookClick(book.id)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-20 rounded ${getBookCoverColor(index)} flex items-center justify-center flex-shrink-0 relative`}>
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-stone-800 hover:text-emerald-700 transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-sm text-stone-600 mb-2">{book.author || 'Unknown Author'}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-stone-500">
                          <Badge variant="secondary">{book.category || 'Uncategorized'}</Badge>
                          <span>{book.language || 'Arabic'}</span>
                          {book.page_count && (
                            <span>{book.page_count} pages</span>
                          )}
                          {book.file_size_mb && (
                            <span>{book.file_size_mb} MB</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusIcon(book.status)}
                      </div>
                    </div>
                    
                    {book.description && (
                      <p className="text-sm text-stone-600 mt-2 line-clamp-2">
                        {book.description}
                      </p>
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
