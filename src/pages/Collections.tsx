import React, { useState } from 'react';
import { Plus, BookOpen, Heart, MoreVertical, Edit, Trash2, Star, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useNavigate } from 'react-router-dom';

export const Collections = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  
  const { 
    collections, 
    loading: collectionsLoading, 
    createCollection, 
    updateCollection, 
    deleteCollection,
    toggleCollectionFavorite 
  } = useCollections();
  
  const { isFavorite: isBookFavorite, toggleFavorite: toggleBookFavorite } = useFavorites();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddBooksDialogOpen, setIsAddBooksDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');

  const { 
    availableBooks, 
    addBookToCollection 
  } = useCollectionBooks(selectedCollectionId);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-stone-800 mb-2">Please sign in</h2>
          <p className="text-stone-600">You need to be signed in to view your collections.</p>
        </div>
      </div>
    );
  }

  const handleCreateCollection = async (data) => {
    const success = await createCollection(data);
    if (success) {
      setIsCreateDialogOpen(false);
    }
  };

  const handleEditCollection = async (data) => {
    if (!selectedCollection) return;
    
    const success = await updateCollection(selectedCollection.id, data);
    if (success) {
      setIsEditDialogOpen(false);
      setSelectedCollection(null);
    }
  };

  const handleDeleteCollection = async () => {
    if (!selectedCollection) return;
    
    const success = await deleteCollection(selectedCollection.id);
    if (success) {
      setIsDeleteDialogOpen(false);
      setSelectedCollection(null);
    }
  };

  const handleAddBooks = async (bookIds) => {
    for (const bookId of bookIds) {
      await addBookToCollection(bookId);
    }
    setIsAddBooksDialogOpen(false);
  };

  const openEditDialog = (collection) => {
    setSelectedCollection(collection);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (collection) => {
    setSelectedCollection(collection);
    setIsDeleteDialogOpen(true);
  };

  const openAddBooksDialog = (collectionId) => {
    setSelectedCollectionId(collectionId);
    setIsAddBooksDialogOpen(true);
  };

  if (collectionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">My Collections</h1>
          <p className="text-stone-600">Organize your books into custom collections</p>
        </div>
        
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Collection
        </Button>
      </div>

      {/* Collections Grid */}
      {collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <Card key={collection.id} className="border-stone-200 hover:shadow-lg transition-shadow group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`w-16 h-20 rounded-lg ${collection.cover_color} flex items-center justify-center mb-4`}>
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="flex items-center gap-1">
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
                      <Star className={`w-4 h-4 ${collection.is_favorite ? 'fill-current' : ''}`} />
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
                        <DropdownMenuItem onClick={() => openAddBooksDialog(collection.id)}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Books
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(collection)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(collection)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <CardTitle className="text-lg text-stone-800 group-hover:text-emerald-700 transition-colors break-words">
                  {collection.name}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                {collection.description && (
                  <p className="text-sm text-stone-600 mb-4 line-clamp-2">
                    {collection.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary" className="text-xs">
                    {collection.book_count} book{collection.book_count !== 1 ? 's' : ''}
                  </Badge>
                  {collection.is_favorite && (
                    <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-200">
                      Favorite
                    </Badge>
                  )}
                </div>
                
                {collection.book_count === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-stone-500 mb-3">No books added yet</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openAddBooksDialog(collection.id)}
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Books
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => navigate(`/collections/${collection.id}`)}
                  >
                    View Collection
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-medium text-stone-800 mb-2">No collections yet</h3>
          <p className="text-stone-600 mb-6">Create your first collection to organize your books</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Collection
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <CollectionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={handleCreateCollection}
        title="Create New Collection"
      />

      <CollectionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleEditCollection}
        collection={selectedCollection}
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
              Are you sure you want to delete "{selectedCollection?.name}"? This action cannot be undone.
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