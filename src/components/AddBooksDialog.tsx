import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Book } from '@/hooks/useCollectionBooks';

interface AddBooksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBooks: Book[];
  onAddBooks: (bookIds: string[]) => void;
}

export function AddBooksDialog({ 
  open, 
  onOpenChange, 
  availableBooks, 
  onAddBooks 
}: AddBooksDialogProps) {
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBooks = availableBooks.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBookToggle = (bookId: string) => {
    setSelectedBooks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookId)) {
        newSet.delete(bookId);
      } else {
        newSet.add(bookId);
      }
      return newSet;
    });
  };

  const handleAddBooks = () => {
    if (selectedBooks.size === 0) return;
    onAddBooks(Array.from(selectedBooks));
    setSelectedBooks(new Set());
    setSearchQuery('');
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedBooks(new Set());
      setSearchQuery('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Add Books to Collection</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col min-h-0 flex-1">
          <div className="shrink-0 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex-1 min-h-0">
            {filteredBooks.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                {searchQuery ? 'No books found matching your search' : 'No books available to add'}
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-3 pr-4">
                  {filteredBooks.map((book) => (
                    <div
                      key={book.id}
                      className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedBooks.has(book.id)}
                        onCheckedChange={() => handleBookToggle(book.id)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium text-sm leading-tight break-words">
                          {book.title}
                        </h4>
                        {book.author && (
                          <p className="text-sm text-muted-foreground">
                            by {book.author}
                          </p>
                        )}
                        {book.category && (
                          <p className="text-xs text-muted-foreground">
                            {book.category}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
        
        <DialogFooter className="shrink-0 mt-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddBooks} 
            disabled={selectedBooks.size === 0}
          >
            Add {selectedBooks.size} Book{selectedBooks.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}