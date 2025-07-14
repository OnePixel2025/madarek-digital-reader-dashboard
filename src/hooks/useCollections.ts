import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { useToast } from '@/hooks/use-toast';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  cover_color: string;
  is_favorite: boolean;
  book_count: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCollectionData {
  name: string;
  description?: string;
  cover_color?: string;
}

export interface UpdateCollectionData {
  name?: string;
  description?: string;
  cover_color?: string;
  is_favorite?: boolean;
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const { toast } = useToast();

  const fetchCollections = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast({
        title: "Error",
        description: "Failed to load collections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCollection = async (data: CreateCollectionData) => {
    if (!user) return null;

    try {
      const { data: newCollection, error } = await supabase
        .from('collections')
        .insert({
          name: data.name,
          description: data.description,
          cover_color: data.cover_color || 'bg-gradient-to-br from-emerald-400 to-emerald-600',
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setCollections(prev => [newCollection, ...prev]);
      toast({
        title: "Success",
        description: "Collection created successfully",
      });
      return newCollection;
    } catch (error) {
      console.error('Error creating collection:', error);
      toast({
        title: "Error",
        description: "Failed to create collection",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateCollection = async (id: string, data: UpdateCollectionData) => {
    try {
      const { data: updatedCollection, error } = await supabase
        .from('collections')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCollections(prev => 
        prev.map(collection => 
          collection.id === id ? updatedCollection : collection
        )
      );

      toast({
        title: "Success",
        description: "Collection updated successfully",
      });
      return updatedCollection;
    } catch (error) {
      console.error('Error updating collection:', error);
      toast({
        title: "Error",
        description: "Failed to update collection",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteCollection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCollections(prev => prev.filter(collection => collection.id !== id));
      toast({
        title: "Success",
        description: "Collection deleted successfully",
      });
      return true;
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast({
        title: "Error",
        description: "Failed to delete collection",
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleCollectionFavorite = async (id: string) => {
    const collection = collections.find(c => c.id === id);
    if (!collection) return;

    return updateCollection(id, { is_favorite: !collection.is_favorite });
  };

  useEffect(() => {
    fetchCollections();
  }, [user]);

  return {
    collections,
    loading,
    createCollection,
    updateCollection,
    deleteCollection,
    toggleCollectionFavorite,
    refetch: fetchCollections,
  };
}