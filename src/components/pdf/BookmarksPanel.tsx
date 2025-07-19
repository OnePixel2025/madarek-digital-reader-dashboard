
import React, { useState } from 'react';
import { Bookmark, Edit2, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useBookmarks } from '@/hooks/useBookmarks';

interface BookmarksPanelProps {
  bookId: string;
  currentPage: number;
  onPageJump: (page: number) => void;
}

export const BookmarksPanel: React.FC<BookmarksPanelProps> = ({
  bookId,
  currentPage,
  onPageJump
}) => {
  const { bookmarks, addBookmark, removeBookmark, updateBookmark, getBookmarkForPage } = useBookmarks({ bookId });
  const [newBookmarkNote, setNewBookmarkNote] = useState('');
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');

  const currentPageBookmark = getBookmarkForPage(currentPage);

  const handleAddBookmark = () => {
    addBookmark(currentPage, newBookmarkNote);
    setNewBookmarkNote('');
  };

  const handleEditBookmark = (id: string, currentNote: string) => {
    setEditingBookmark(id);
    setEditNote(currentNote);
  };

  const handleSaveEdit = () => {
    if (editingBookmark) {
      updateBookmark(editingBookmark, editNote);
      setEditingBookmark(null);
      setEditNote('');
    }
  };

  const handleCancelEdit = () => {
    setEditingBookmark(null);
    setEditNote('');
  };

  return (
    <Card className="border-stone-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-stone-800">
          <Bookmark className="w-4 h-4" />
          Bookmarks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add bookmark for current page */}
        <div className="space-y-2">
          {!currentPageBookmark ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Bookmark Page {currentPage}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Bookmark</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-stone-600">
                    Adding bookmark for page {currentPage}
                  </p>
                  <Input
                    placeholder="Add a note (optional)"
                    value={newBookmarkNote}
                    onChange={(e) => setNewBookmarkNote(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAddBookmark} className="flex-1">
                      Add Bookmark
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-700">
                Page {currentPage} is bookmarked
              </p>
            </div>
          )}
        </div>

        {/* Bookmarks list */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {bookmarks.length === 0 ? (
            <p className="text-sm text-stone-500 text-center py-4">
              No bookmarks yet
            </p>
          ) : (
            bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="p-3 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => onPageJump(bookmark.page)}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700 text-left"
                    >
                      Page {bookmark.page}
                    </button>
                    {editingBookmark === bookmark.id ? (
                      <div className="mt-2 space-y-2">
                        <Input
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="Add a note"
                          className="text-xs"
                        />
                        <div className="flex gap-1">
                          <Button size="sm" onClick={handleSaveEdit}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      bookmark.note && (
                        <p className="text-xs text-stone-600 mt-1 break-words">
                          {bookmark.note}
                        </p>
                      )
                    )}
                    <p className="text-xs text-stone-400 mt-1">
                      {new Date(bookmark.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditBookmark(bookmark.id, bookmark.note)}
                      disabled={editingBookmark === bookmark.id}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeBookmark(bookmark.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
