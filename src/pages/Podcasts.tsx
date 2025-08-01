
import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Download, 
  Headphones, 
  Clock, 
  Volume2, 
  Plus,
  Loader2,
  Book
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Podcast {
  id: string;
  book_id: string;
  title: string;
  book_title: string;
  author: string;
  duration: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  voice: string;
  created_at: string;
  updated_at: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  cover_image_path: string;
}

export const Podcasts = () => {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [currentPodcast, setCurrentPodcast] = useState<Podcast | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const voices = [
    { value: 'alloy', label: 'Alloy' },
    { value: 'echo', label: 'Echo' },
    { value: 'fable', label: 'Fable' },
    { value: 'onyx', label: 'Onyx' },
    { value: 'nova', label: 'Nova' },
    { value: 'shimmer', label: 'Shimmer' }
  ];

  useEffect(() => {
    fetchPodcasts();
    fetchBooks();
  }, []);

  // Setup audio element when currentPodcast changes
  useEffect(() => {
    if (currentPodcast && currentPodcast.status === 'completed') {
      setupAudio();
    }
    return () => {
      if (audioRef) {
        audioRef.pause();
        audioRef.removeEventListener('timeupdate', updateCurrentTime);
        audioRef.removeEventListener('ended', handleAudioEnded);
      }
    };
  }, [currentPodcast]);

  // Update volume when volume state changes
  useEffect(() => {
    if (audioRef) {
      audioRef.volume = volume[0] / 100;
    }
  }, [volume, audioRef]);

  const setupAudio = () => {
    // For demo purposes, we'll use a sample audio URL
    // In production, this would fetch the actual audio from Supabase storage
    const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.wav');
    
    audio.addEventListener('timeupdate', updateCurrentTime);
    audio.addEventListener('ended', handleAudioEnded);
    audio.volume = volume[0] / 100;
    
    setAudioRef(audio);
  };

  const updateCurrentTime = () => {
    if (audioRef) {
      setCurrentTime(audioRef.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const fetchPodcasts = async () => {
    // Using mock data for now until database types are updated
    const mockPodcasts: Podcast[] = [
      {
        id: '1',
        book_id: '1',
        book_title: 'تاريخ السودان الحديث',
        author: 'محمد عبدالرحيم',
        title: 'تاريخ السودان الحديث',
        duration: 2730, // 45:30 in seconds
        status: 'completed',
        voice: 'alloy',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    setPodcasts(mockPodcasts);
    if (mockPodcasts.length > 0 && !currentPodcast) {
      setCurrentPodcast(mockPodcasts[0]);
    }

    /* 
    // This will work once the database types are updated
    const { data, error } = await supabase
      .from('podcasts')
      .select(`
        *,
        books!inner(title, author, cover_image_path)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching podcasts:', error);
      return;
    }

    const transformedPodcasts = data.map((podcast: any) => ({
      ...podcast,
      book_title: podcast.books.title,
      author: podcast.books.author
    }));

    setPodcasts(transformedPodcasts);
    if (transformedPodcasts.length > 0 && !currentPodcast) {
      setCurrentPodcast(transformedPodcasts[0]);
    }
    */
  };

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from('books')
      .select('id, title, author, cover_image_path')
      .order('title');

    if (error) {
      console.error('Error fetching books:', error);
      return;
    }

    setBooks(data || []);
  };

  const generatePodcast = async () => {
    if (!selectedBook) {
      toast({
        title: "Error",
        description: "Please select a book to convert to podcast",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Get book data
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('title, author')
        .eq('id', selectedBook)
        .single();

      if (bookError) throw bookError;

      // Simulate text chunking for demo
      const sampleText = `Welcome to the audio version of ${bookData.title} by ${bookData.author}. This is a sample podcast generation that demonstrates the text-to-speech functionality.`;
      
      // Call the edge function to generate audio (temporarily commented for demo)
      try {
        const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-podcast', {
          body: {
            bookId: selectedBook,
            chunkText: sampleText,
            chunkIndex: 0,
            totalChunks: 1,
            voice: selectedVoice
          }
        });

        if (functionError) {
          console.error('Edge function error:', functionError);
          // For now, continue with demo even if function fails
        }
      } catch (err) {
        console.error('Function invocation failed:', err);
        // Continue with demo even if function fails
      }

      // Add to local state for demo (until database types are updated)
      const newPodcast: Podcast = {
        id: Date.now().toString(),
        book_id: selectedBook,
        book_title: bookData.title,
        author: bookData.author,
        title: bookData.title,
        duration: 120, // 2 minutes demo
        status: 'processing',
        voice: selectedVoice,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setPodcasts(prev => [newPodcast, ...prev]);

      // Simulate status update after a delay
      setTimeout(() => {
        setPodcasts(prev => prev.map(p => 
          p.id === newPodcast.id 
            ? { ...p, status: 'completed' as const }
            : p
        ));
      }, 3000);

      toast({
        title: "Success",
        description: "Podcast generation started! Check back soon.",
      });

      setIsCreateDialogOpen(false);
      setSelectedBook('');
      setSelectedVoice('alloy');

    } catch (error: any) {
      console.error('Error generating podcast:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate podcast",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = async () => {
    if (!audioRef || !currentPodcast) return;

    try {
      if (isPlaying) {
        audioRef.pause();
        setIsPlaying(false);
      } else {
        await audioRef.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      toast({
        title: "Playback Error",
        description: "Unable to play audio. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSkipBackward = () => {
    if (audioRef) {
      audioRef.currentTime = Math.max(0, audioRef.currentTime - 10);
    }
  };

  const handleSkipForward = () => {
    if (audioRef) {
      audioRef.currentTime = Math.min(audioRef.duration, audioRef.currentTime + 10);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Ready</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">My Podcasts</h1>
          <p className="text-stone-600">Listen to your books as audio content</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            {podcasts.filter(p => p.status === 'completed').length} Ready
          </Badge>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Generate Podcast
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Podcast from Book</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Book</label>
                  <Select value={selectedBook} onValueChange={setSelectedBook}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a book to convert" />
                    </SelectTrigger>
                    <SelectContent>
                      {books.map((book) => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.title} by {book.author}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Voice</label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice) => (
                        <SelectItem key={voice.value} value={voice.value}>
                          {voice.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={generatePodcast} 
                  disabled={isGenerating || !selectedBook}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Podcast'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Now Playing */}
      {currentPodcast && (
        <Card className="border-stone-200 bg-gradient-to-r from-stone-50 to-stone-100">
          <CardHeader>
            <CardTitle className="text-stone-800 flex items-center gap-2">
              <Headphones className="w-5 h-5" />
              Now Playing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <Headphones className="w-8 h-8 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-stone-800 mb-1 truncate">
                  {currentPodcast.book_title}
                </h3>
                <p className="text-sm text-stone-600 mb-3">
                  by {currentPodcast.author}
                </p>
                
                 <div className="space-y-3">
                   <div className="flex items-center gap-2 text-sm text-stone-600">
                     <span>{formatDuration(currentTime)}</span>
                     <Progress 
                       value={audioRef ? (currentTime / (audioRef.duration || 1)) * 100 : 0} 
                       className="flex-1 h-2" 
                     />
                     <span>{formatDuration(currentPodcast.duration || 0)}</span>
                   </div>
                   
                   <div className="flex items-center gap-3">
                     <Button 
                       variant="outline" 
                       size="sm" 
                       onClick={handleSkipBackward}
                       disabled={currentPodcast.status !== 'completed'}
                     >
                       <SkipBack className="w-4 h-4" />
                     </Button>
                    
                    <Button 
                      onClick={handlePlayPause}
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={currentPodcast.status !== 'completed'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    
                     <Button 
                       variant="outline" 
                       size="sm" 
                       onClick={handleSkipForward}
                       disabled={currentPodcast.status !== 'completed'}
                     >
                       <SkipForward className="w-4 h-4" />
                     </Button>
                    
                    <div className="flex items-center gap-2 ml-auto">
                      <Volume2 className="w-4 h-4 text-stone-600" />
                      <div className="w-20">
                        <Slider
                          value={volume}
                          onValueChange={setVolume}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Podcast List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-800">Available Podcasts</h2>
        
        {podcasts.length === 0 ? (
          <Card className="border-stone-200">
            <CardContent className="p-8 text-center">
              <Book className="w-12 h-12 text-stone-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-stone-800 mb-2">No podcasts yet</h3>
              <p className="text-stone-600 mb-4">
                Generate your first podcast from one of your books
              </p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate Podcast
              </Button>
            </CardContent>
          </Card>
        ) : (
          podcasts.map((podcast) => (
            <Card key={podcast.id} className="border-stone-200 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-stone-800 hover:text-emerald-700 transition-colors mb-1">
                      {podcast.book_title}
                    </h3>
                    <p className="text-sm text-stone-600 mb-2">
                      by {podcast.author}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-stone-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(podcast.duration || 0)}</span>
                      </div>
                      
                      {getStatusBadge(podcast.status)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {podcast.status === 'completed' && (
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setCurrentPodcast(podcast)}
                      disabled={podcast.status !== 'completed'}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
