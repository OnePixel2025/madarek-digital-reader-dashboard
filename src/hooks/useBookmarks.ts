
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { toast } from '@/hooks/use-toast';

interface Bookmark {
  id: string;
  page: number;
  note: string;
  created_at: string;
}

interface UseBookmarksProps {
  bookId: string;
}

export const useBookmarks = ({ bookId }: UseBookmarksProps) => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  // This will need a bookmarks table - we'll use local storage for now
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  // Load bookmarks from localStorage
  useEffect(() => {
    if (bookId && user?.id) {
      const savedBookmarks = localStorage.getItem(`bookmarks-${bookId}-${user.id}`);
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
    }
  }, [bookId, user?.id]);

  // Save bookmarks to localStorage
  const saveBookmarks = (newBookmarks: Bookmark[]) => {
    if (bookId && user?.id) {
      localStorage.setItem(`bookmarks-${bookId}-${user.id}`, JSON.stringify(newBookmarks));
      setBookmarks(newBookmarks);
    }
  };

  const addBookmark = (page: number, note: string = '') => {
    const newBookmark: Bookmark = {
      id: crypto.randomUUID(),
      page,
      note,
      created_at: new Date().toISOString()
    };

    const updatedBookmarks = [...bookmarks, newBookmark].sort((a, b) => a.page - b.page);
    saveBookmarks(updatedBookmarks);
    
    toast({
      title: "Bookmark added",
      description: `Page ${page} bookmarked successfully`,
    });
  };

  const removeBookmark = (id: string) => {
    const updatedBookmarks = bookmarks.filter(bookmark => bookmark.id !== id);
    saveBookmarks(updatedBookmarks);
    
    toast({
      title: "Bookmark removed",
      description: "Bookmark deleted successfully",
    });
  };

  const updateBookmark = (id: string, note: string) => {
    const updatedBookmarks = bookmarks.map(bookmark =>
      bookmark.id === id ? { ...bookmark, note } : bookmark
    );
    saveBookmarks(updatedBookmarks);
    
    toast({
      title: "Bookmark updated",
      description: "Note updated successfully",
    });
  };

  const getBookmarkForPage = (page: number) => {
    return bookmarks.find(bookmark => bookmark.page === page);
  };

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    updateBookmark,
    getBookmarkForPage
  };
};
