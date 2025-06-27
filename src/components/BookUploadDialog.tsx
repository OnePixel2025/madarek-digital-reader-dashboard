
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

interface BookUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookUploadDialog = ({ open, onClose, onSuccess }: BookUploadDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    isbn: '',
    publication_year: '',
    category: '',
    language: 'Arabic',
    page_count: '',
    file_size_mb: '',
    status: 'active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const bookData = {
        title: formData.title.trim(),
        author: formData.author.trim() || null,
        description: formData.description.trim() || null,
        isbn: formData.isbn.trim() || null,
        publication_year: formData.publication_year ? parseInt(formData.publication_year) : null,
        category: formData.category.trim() || null,
        language: formData.language,
        page_count: formData.page_count ? parseInt(formData.page_count) : null,
        file_size_mb: formData.file_size_mb ? parseFloat(formData.file_size_mb) : null,
        status: formData.status
      };

      const { error } = await supabase
        .from('books')
        .insert([bookData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Book added successfully",
      });

      // Reset form
      setFormData({
        title: '',
        author: '',
        description: '',
        isbn: '',
        publication_year: '',
        category: '',
        language: 'Arabic',
        page_count: '',
        file_size_mb: '',
        status: 'active'
      });

      onSuccess();
    } catch (error) {
      console.error('Error adding book:', error);
      toast({
        title: "Error",
        description: "Failed to add book",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Add New Book
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter book title"
                required
              />
            </div>

            <div>
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
                placeholder="Enter author name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter book description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                value={formData.isbn}
                onChange={(e) => handleInputChange('isbn', e.target.value)}
                placeholder="Enter ISBN"
              />
            </div>

            <div>
              <Label htmlFor="publication_year">Publication Year</Label>
              <Input
                id="publication_year"
                type="number"
                value={formData.publication_year}
                onChange={(e) => handleInputChange('publication_year', e.target.value)}
                placeholder="e.g., 2024"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                placeholder="e.g., History, Literature"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="language">Language</Label>
              <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arabic">Arabic</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="page_count">Page Count</Label>
              <Input
                id="page_count"
                type="number"
                value={formData.page_count}
                onChange={(e) => handleInputChange('page_count', e.target.value)}
                placeholder="Number of pages"
              />
            </div>

            <div>
              <Label htmlFor="file_size_mb">File Size (MB)</Label>
              <Input
                id="file_size_mb"
                type="number"
                step="0.1"
                value={formData.file_size_mb}
                onChange={(e) => handleInputChange('file_size_mb', e.target.value)}
                placeholder="File size in MB"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Book'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
