import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { useToast } from '@/hooks/use-toast';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const { toast } = useToast();

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('book_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavorites(new Set(data?.map(fav => fav.book_id) || []));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (bookId: string) => {
    if (!user) return;

    const isFavorite = favorites.has(bookId);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('book_id', bookId);

        if (error) throw error;
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(bookId);
          return newSet;
        });
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            book_id: bookId,
          });

        if (error) throw error;
        setFavorites(prev => new Set([...prev, bookId]));
      }

      toast({
        title: "Success",
        description: isFavorite ? "Removed from favorites" : "Added to favorites",
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    }
  };

  const isFavorite = (bookId: string) => favorites.has(bookId);

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  return {
    favorites: Array.from(favorites),
    loading,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites,
  };
}