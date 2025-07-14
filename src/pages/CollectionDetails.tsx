import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Heart, MoreVertical, Edit, Trash2, Star, UserPlus, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useUser } from '@clerk/clerk-react';
import { useCollections } from '@/hooks/useCollections';
import { useFavorites } from '@/hooks/useFavorites';
import { useCollectionBooks } from '@/hooks/useCollectionBooks';
import { CollectionDialog } from '@/components/CollectionDialog';
import { AddBooksDialog } from '@/components/AddBooksDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const CollectionDetails = () => {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  
  const { 
    collections, 
    loading: collectionsLoading, 
    updateCollection, 
    deleteCollection,
    toggleCollectionFavorite 
  } = useCollections();
  
  const { isFavorite: isBookFavorite, toggleFavorite: toggleBookFavorite } = useFavorites();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddBooksDialogOpen, setIsAddBooksDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { 
    books, 
    availableBooks, 
    loading: booksLoading,
    addBookToCollection,
    removeBookFromCollection 
  } = useCollectionBooks(collectionId || '');

  // Find the current collection
  const collection = collections.find(c => c.id === collectionId);

  // Filter books based on search query
  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-stone-800 mb-2">Please sign in</h2>
          <p className="text-stone-600">You need to be signed in to view collections.</p>
        </div>
      </div>
    );
  }

  if (collectionsLoading || booksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-stone-800 mb-2">Collection not found</h2>
          <p className="text-stone-600 mb-4">The collection you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/collections')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Collections
          </Button>
        </div>
      </div>
    );
  }

  const handleEditCollection = async (data) => {
    const success = await updateCollection(collection.id, data);
    if (success) {
      setIsEditDialogOpen(false);
    }
  };

  const handleDeleteCollection = async () => {
    const success = await deleteCollection(collection.id);
    if (success) {
      navigate('/collections');
    }
  };

  const handleAddBooks = async (bookIds) => {
    for (const bookId of bookIds) {
      await addBookToCollection(bookId);
    }
    setIsAddBooksDialogOpen(false);
  };

  const handleRemoveBook = async (bookId) => {
    await removeBookFromCollection(bookId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/collections')}
            className="mt-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-start gap-4">
            <div className={`w-20 h-24 rounded-lg ${collection.cover_color} flex items-center justify-center flex-shrink-0`}>
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-stone-800">{collection.name}</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCollectionFavorite(collection.id)}
                  className={`${
                    collection.is_favorite 
                      ? 'text-yellow-500 hover:text-yellow-600' 
                      : 'text-stone-400 hover:text-yellow-500'
                  } transition-colors`}
                >
                  <Star className={`w-5 h-5 ${collection.is_favorite ? 'fill-current' : ''}`} />
                </Button>
              </div>
              
              {collection.description && (
                <p className="text-stone-600 mb-3">{collection.description}</p>
              )}
              
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {collection.book_count} book{collection.book_count !== 1 ? 's' : ''}
                </Badge>
                {collection.is_favorite && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                    Favorite
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setIsAddBooksDialogOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Books
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Collection
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      {books.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search books in this collection..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Books Grid */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="border-stone-200 hover:shadow-lg transition-shadow group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-16 bg-stone-100 rounded flex items-center justify-center mb-3">
                    <BookOpen className="w-6 h-6 text-stone-400" />
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBookFavorite(book.id)}
                      className={`${
                        isBookFavorite(book.id) 
                          ? 'text-red-500 hover:text-red-600' 
                          : 'text-stone-400 hover:text-red-500'
                      } transition-colors`}
                    >
                      <Heart className={`w-4 h-4 ${isBookFavorite(book.id) ? 'fill-current' : ''}`} />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/read-book/${book.id}`)}>
                          <BookOpen className="w-4 h-4 mr-2" />
                          Read Book
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleRemoveBook(book.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove from Collection
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <CardTitle className="text-sm text-stone-800 line-clamp-2 leading-tight">
                  {book.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                {book.author && (
                  <p className="text-xs text-stone-600 mb-2">by {book.author}</p>
                )}
                
                {book.category && (
                  <Badge variant="outline" className="text-xs">
                    {book.category}
                  </Badge>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => navigate(`/read-book/${book.id}`)}
                >
                  Read Book
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-medium text-stone-800 mb-2">
            {searchQuery ? 'No books found' : 'No books in this collection'}
          </h3>
          <p className="text-stone-600 mb-6">
            {searchQuery 
              ? 'Try adjusting your search terms' 
              : 'Add some books to get started'
            }
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsAddBooksDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Books to Collection
            </Button>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CollectionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleEditCollection}
        collection={collection}
        title="Edit Collection"
      />

      <AddBooksDialog
        open={isAddBooksDialogOpen}
        onOpenChange={setIsAddBooksDialogOpen}
        availableBooks={availableBooks}
        onAddBooks={handleAddBooks}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{collection.name}"? This action cannot be undone.
              The books in this collection will not be deleted, only removed from the collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCollection}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};