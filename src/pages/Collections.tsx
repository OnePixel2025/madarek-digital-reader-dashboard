import React, { useState } from 'react';
import { Plus, BookOpen, Edit, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const initialCollections = [
  {
    id: 1,
    title: 'History of Sudan',
    description: 'Comprehensive collection about Sudanese historical periods',
    bookCount: 8,
    cover: 'bg-gradient-to-br from-amber-500 to-orange-600',
    books: ['تاريخ السودان الحديث', 'الحضارة النوبية', 'المهدية والحكم الثنائي']
  },
  {
    id: 2,
    title: 'Sudanese Literature',
    description: 'Best works of contemporary Sudanese authors',
    bookCount: 12,
    cover: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    books: ['الأدب السوداني المعاصر', 'الشعر الشعبي', 'الرواية السودانية']
  },
  {
    id: 3,
    title: 'Science & Technology',
    description: 'Educational resources for modern technology',
    bookCount: 6,
    cover: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    books: ['علوم الحاسوب', 'الذكاء الاصطناعي', 'هندسة البرمجيات']
  },
  {
    id: 4,
    title: 'Cultural Studies',
    description: 'Understanding Sudanese culture and traditions',
    bookCount: 5,
    cover: 'bg-gradient-to-br from-purple-500 to-pink-600',
    books: ['الثقافة السودانية', 'التراث الشعبي', 'الفنون التقليدية']
  }
];

const coverColors = [
  'bg-gradient-to-br from-red-500 to-pink-600',
  'bg-gradient-to-br from-blue-500 to-indigo-600',
  'bg-gradient-to-br from-green-500 to-emerald-600',
  'bg-gradient-to-br from-purple-500 to-violet-600',
  'bg-gradient-to-br from-orange-500 to-amber-600',
  'bg-gradient-to-br from-teal-500 to-cyan-600',
  'bg-gradient-to-br from-slate-500 to-stone-600'
];

export const Collections = () => {
  const [collections, setCollections] = useState(initialCollections);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCollection, setNewCollection] = useState({ title: '', description: '' });

  const handleCreateCollection = () => {
    if (newCollection.title.trim() === '') return;
    
    const randomColor = coverColors[Math.floor(Math.random() * coverColors.length)];
    
    const collection = {
      id: Date.now(), // Simple ID generation
      title: newCollection.title,
      description: newCollection.description,
      bookCount: 0,
      cover: randomColor,
      books: []
    };
    
    setCollections(prev => [...prev, collection]);
    setNewCollection({ title: '', description: '' });
    setIsDialogOpen(false);
  };

  const handleDeleteCollection = (id) => {
    setCollections(prev => prev.filter(collection => collection.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">My Collections</h1>
          <p className="text-stone-600">Organize your books into custom collections</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">
                  Collection Name
                </label>
                <Input
                  placeholder="Enter collection name..."
                  value={newCollection.title}
                  onChange={(e) => setNewCollection({ ...newCollection, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">
                  Description
                </label>
                <Textarea
                  placeholder="Describe your collection..."
                  value={newCollection.description}
                  onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateCollection}
                  disabled={!newCollection.title.trim()}
                >
                  Create Collection
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <Card key={collection.id} className="border-stone-200 hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={`w-16 h-20 rounded-lg ${collection.cover} flex items-center justify-center mb-4`}>
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteCollection(collection.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <CardTitle className="text-lg text-stone-800 group-hover:text-emerald-700 transition-colors">
                {collection.title}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-sm text-stone-600 mb-4 line-clamp-2">
                {collection.description}
              </p>
              
              <div className="flex items-center justify-between mb-4">
                <Badge variant="secondary" className="text-xs">
                  {collection.bookCount} books
                </Badge>
                <Star className="w-4 h-4 text-stone-400 hover:text-yellow-500 transition-colors cursor-pointer" />
              </div>
              
              {collection.books.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-stone-500 font-medium">Sample Books:</p>
                  <div className="space-y-1">
                    {collection.books.slice(0, 3).map((book, index) => (
                      <div key={index} className="text-xs text-stone-600 truncate">
                        • {book}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {collection.books.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-xs text-stone-500">No books added yet</p>
                </div>
              )}
              
              <Button variant="outline" size="sm" className="w-full mt-4 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                View Collection
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State for new users */}
      {collections.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-medium text-stone-800 mb-2">No collections yet</h3>
          <p className="text-stone-600 mb-6">Create your first collection to organize your books</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Collection
          </Button>
        </div>
      )}
    </div>
  );
};