import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { useToast } from '@/hooks/use-toast';

export interface Book {
  id: string;
  title: string;
  author?: string;
  cover_image_path?: string;
  category?: string;
  description?: string;
}

export function useCollectionBooks(collectionId?: string) {
  const [books, setBooks] = useState<Book[]>([]);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const { toast } = useToast();

  const fetchCollectionBooks = async () => {
    if (!collectionId || !user) return;

    try {
      const { data, error } = await supabase
        .from('collection_books')
        .select(`
          book_id,
          books (
            id,
            title,
            author,
            cover_image_path,
            category,
            description
          )
        `)
        .eq('collection_id', collectionId);

      if (error) throw error;
      setBooks(data?.map(item => item.books).filter(Boolean) || []);
    } catch (error) {
      console.error('Error fetching collection books:', error);
      toast({
        title: "Error",
        description: "Failed to load collection books",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBooks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('books')
        .select('id, title, author, cover_image_path, category, description')
        .order('title');

      if (error) throw error;
      setAvailableBooks(data || []);
    } catch (error) {
      console.error('Error fetching available books:', error);
    }
  };

  const addBookToCollection = async (bookId: string) => {
    if (!collectionId || !user) return false;

    try {
      const { error } = await supabase
        .from('collection_books')
        .insert({
          collection_id: collectionId,
          book_id: bookId,
        });

      if (error) throw error;

      await fetchCollectionBooks();
      toast({
        title: "Success",
        description: "Book added to collection",
      });
      return true;
    } catch (error) {
      console.error('Error adding book to collection:', error);
      toast({
        title: "Error",
        description: "Failed to add book to collection",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeBookFromCollection = async (bookId: string) => {
    if (!collectionId || !user) return false;

    try {
      const { error } = await supabase
        .from('collection_books')
        .delete()
        .eq('collection_id', collectionId)
        .eq('book_id', bookId);

      if (error) throw error;

      setBooks(prev => prev.filter(book => book.id !== bookId));
      toast({
        title: "Success",
        description: "Book removed from collection",
      });
      return true;
    } catch (error) {
      console.error('Error removing book from collection:', error);
      toast({
        title: "Error",
        description: "Failed to remove book from collection",
        variant: "destructive",
      });
      return false;
    }
  };

  const getAvailableBooksForCollection = () => {
    const collectionBookIds = new Set(books.map(book => book.id));
    return availableBooks.filter(book => !collectionBookIds.has(book.id));
  };

  useEffect(() => {
    fetchCollectionBooks();
  }, [collectionId, user]);

  useEffect(() => {
    fetchAvailableBooks();
  }, [user]);

  return {
    books,
    availableBooks: getAvailableBooksForCollection(),
    loading,
    addBookToCollection,
    removeBookFromCollection,
    refetch: fetchCollectionBooks,
  };
}