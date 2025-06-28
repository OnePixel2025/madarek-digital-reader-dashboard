
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText } from 'lucide-react';

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
    publication_year: '',
    category: '',
    language: 'Arabic',
    page_count: '',
    file_size_mb: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Error",
          description: "Please select a PDF file",
          variant: "destructive",
        });
        return;
      }
      console.log('Selected file:', file.name, 'Size:', file.size, 'Type:', file.type);
      setSelectedFile(file);
      // Auto-populate file size
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
      setFormData(prev => ({
        ...prev,
        file_size_mb: fileSizeMB
      }));
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const fileName = `${Date.now()}-${file.name}`;
    console.log('Uploading file to bucket "books" with name:', fileName);
    
    const { data, error } = await supabase.storage
      .from('books')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    console.log('File uploaded successfully:', data);
    return data.path;
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

    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a PDF file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log('Starting book upload process...');

    try {
      // Upload the PDF file
      console.log('Step 1: Uploading PDF file...');
      const filePath = await uploadFile(selectedFile);
      console.log('File uploaded with path:', filePath);

      const bookData = {
        title: formData.title.trim(),
        author: formData.author.trim() || null,
        description: formData.description.trim() || null,
        publication_year: formData.publication_year ? parseInt(formData.publication_year) : null,
        category: formData.category.trim() || null,
        language: formData.language,
        page_count: formData.page_count ? parseInt(formData.page_count) : null,
        file_size_mb: formData.file_size_mb ? parseFloat(formData.file_size_mb) : null,
        file_path: filePath,
        status: 'active'
      };

      console.log('Step 2: Inserting book data:', bookData);

      const { data: insertedBook, error } = await supabase
        .from('books')
        .insert([bookData])
        .select();

      if (error) {
        console.error('Error inserting book data:', error);
        throw error;
      }

      console.log('Book inserted successfully:', insertedBook);

      toast({
        title: "Success",
        description: "Book uploaded successfully",
      });

      // Reset form
      setFormData({
        title: '',
        author: '',
        description: '',
        publication_year: '',
        category: '',
        language: 'Arabic',
        page_count: '',
        file_size_mb: ''
      });
      setSelectedFile(null);

      onSuccess();
    } catch (error) {
      console.error('Error in upload process:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload book",
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
            Upload New Book
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

          <div>
            <Label htmlFor="file">PDF File *</Label>
            <div className="border-2 border-dashed border-stone-300 rounded-lg p-6 text-center">
              <input
                id="file"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label 
                htmlFor="file" 
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <FileText className="w-8 h-8 text-stone-400" />
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-medium text-stone-800">{selectedFile.name}</p>
                    <p className="text-xs text-stone-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-stone-800">Click to upload PDF</p>
                    <p className="text-xs text-stone-500">PDF files only</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="Auto-filled when file selected"
                readOnly
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Uploading...' : 'Upload Book'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
