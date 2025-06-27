
import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BookUploadDialog } from '@/components/BookUploadDialog';
import { useToast } from '@/hooks/use-toast';

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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 border-green-200';
    case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'inactive': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active': return <CheckCircle className="w-4 h-4" />;
    case 'processing': return <Clock className="w-4 h-4" />;
    case 'inactive': return <XCircle className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return 'Active';
    case 'processing': return 'Processing';
    case 'inactive': return 'Inactive';
    default: return 'Unknown';
  }
};

export const Uploads = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();

  const { data: books = [], isLoading, refetch } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching books:', error);
        throw error;
      }
      
      return data as Book[];
    }
  });

  const handleDeleteBook = async (bookId: string) => {
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Book deleted successfully",
      });
      
      refetch();
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({
        title: "Error",
        description: "Failed to delete book",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading books...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">My Uploads</h1>
          <p className="text-stone-600">Manage your uploaded books and their status</p>
        </div>
        
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => setShowUploadDialog(true)}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload New Book
        </Button>
      </div>

      {/* Upload Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-stone-600">Active</p>
                <p className="text-lg font-semibold text-stone-800">
                  {books.filter(b => b.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-stone-600">Processing</p>
                <p className="text-lg font-semibold text-stone-800">
                  {books.filter(b => b.status === 'processing').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-stone-600">Inactive</p>
                <p className="text-lg font-semibold text-stone-800">
                  {books.filter(b => b.status === 'inactive').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-stone-600" />
              </div>
              <div>
                <p className="text-sm text-stone-600">Total Books</p>
                <p className="text-lg font-semibold text-stone-800">
                  {books.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Books List */}
      <div className="space-y-4">
        {books.map((book) => (
          <Card key={book.id} className="border-stone-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-16 bg-gradient-to-br from-stone-400 to-stone-500 rounded flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-stone-800 mb-1">
                        {book.title}
                      </h3>
                      <p className="text-sm text-stone-600 mb-2">
                        by {book.author || 'Unknown Author'}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-stone-500">
                        {book.category && (
                          <span className="bg-stone-100 px-2 py-1 rounded">
                            {book.category}
                          </span>
                        )}
                        {book.language && (
                          <span className="bg-stone-100 px-2 py-1 rounded">
                            {book.language}
                          </span>
                        )}
                        {book.file_size_mb && (
                          <span>{book.file_size_mb} MB</span>
                        )}
                        {book.page_count && (
                          <span>{book.page_count} pages</span>
                        )}
                      </div>
                    </div>
                    
                    <Badge className={getStatusColor(book.status || 'unknown')}>
                      {getStatusIcon(book.status || 'unknown')}
                      <span className="ml-1">{getStatusText(book.status || 'unknown')}</span>
                    </Badge>
                  </div>
                  
                  {book.description && (
                    <p className="text-sm text-stone-600 mb-3 line-clamp-2">
                      {book.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-stone-500">
                      Uploaded on {new Date(book.upload_date).toLocaleDateString()}
                    </p>
                    
                    <div className="flex gap-2">
                      {book.status === 'active' && (
                        <Button variant="outline" size="sm">
                          View Book
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteBook(book.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {books.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-medium text-stone-800 mb-2">No books uploaded yet</h3>
          <p className="text-stone-600 mb-6">Upload your first book to get started</p>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Upload Your First Book
          </Button>
        </div>
      )}

      {/* Upload Dialog */}
      <BookUploadDialog 
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onSuccess={() => {
          setShowUploadDialog(false);
          refetch();
        }}
      />
    </div>
  );
};
