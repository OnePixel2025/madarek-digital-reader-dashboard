import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Collection } from '@/hooks/useCollections';

const coverColors = [
  'bg-gradient-to-br from-emerald-400 to-emerald-600',
  'bg-gradient-to-br from-blue-400 to-blue-600',
  'bg-gradient-to-br from-purple-400 to-purple-600',
  'bg-gradient-to-br from-pink-400 to-pink-600',
  'bg-gradient-to-br from-amber-400 to-amber-600',
  'bg-gradient-to-br from-red-400 to-red-600',
  'bg-gradient-to-br from-indigo-400 to-indigo-600',
  'bg-gradient-to-br from-teal-400 to-teal-600',
];

interface CollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; description?: string; cover_color: string }) => void;
  collection?: Collection | null;
  title: string;
}

export function CollectionDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  collection, 
  title 
}: CollectionDialogProps) {
  const [name, setName] = useState(collection?.name || '');
  const [description, setDescription] = useState(collection?.description || '');
  const [selectedColor, setSelectedColor] = useState(
    collection?.cover_color || coverColors[0]
  );

  // Update form values when collection changes (for editing)
  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setDescription(collection.description || '');
      setSelectedColor(collection.cover_color || coverColors[0]);
    } else {
      // Reset form for creating new collection
      setName('');
      setDescription('');
      setSelectedColor(coverColors[0]);
    }
  }, [collection]);

  const handleSave = () => {
    if (!name.trim()) return;
    
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      cover_color: selectedColor,
    });
    
    // Reset form
    setName('');
    setDescription('');
    setSelectedColor(coverColors[0]);
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setName(collection?.name || '');
      setDescription(collection?.description || '');
      setSelectedColor(collection?.cover_color || coverColors[0]);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Collection Name</Label>
            <Input
              id="name"
              placeholder="Enter collection name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter collection description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Cover Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {coverColors.map((color, index) => (
                <button
                  key={index}
                  type="button"
                  className={`w-12 h-12 rounded-lg ${color} border-2 transition-all ${
                    selectedColor === color 
                      ? 'border-stone-800 scale-105' 
                      : 'border-stone-200 hover:scale-105'
                  }`}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {collection ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}