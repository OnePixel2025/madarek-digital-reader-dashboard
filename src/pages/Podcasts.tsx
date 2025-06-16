
import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Download, Headphones, Clock, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

const podcasts = [
  {
    id: 1,
    title: 'تاريخ السودان الحديث - الفصل الأول',
    book: 'تاريخ السودان الحديث',
    author: 'محمد عبدالرحيم',
    duration: '45:30',
    progress: 75,
    currentTime: '34:05',
    isPlaying: false,
    downloadStatus: 'downloaded',
    cover: 'bg-gradient-to-br from-blue-500 to-blue-600'
  },
  {
    id: 2,
    title: 'الأدب السوداني المعاصر - مقدمة',
    book: 'الأدب السوداني المعاصر',
    author: 'فاطمة النور',
    duration: '32:15',
    progress: 100,
    currentTime: '32:15',
    isPlaying: false,
    downloadStatus: 'downloaded',
    cover: 'bg-gradient-to-br from-emerald-500 to-emerald-600'
  },
  {
    id: 3,
    title: 'جغرافية السودان - الجزء الثاني',
    book: 'جغرافية السودان',
    author: 'أحمد محمد علي',
    duration: '52:45',
    progress: 0,
    currentTime: '00:00',
    isPlaying: false,
    downloadStatus: 'available',
    cover: 'bg-gradient-to-br from-purple-500 to-purple-600'
  }
];

export const Podcasts = () => {
  const [currentPodcast, setCurrentPodcast] = useState(podcasts[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([75]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (timeStr: string) => timeStr;

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
            {podcasts.filter(p => p.downloadStatus === 'downloaded').length} Downloaded
          </Badge>
        </div>
      </div>

      {/* Now Playing */}
      <Card className="border-stone-200 bg-gradient-to-r from-stone-50 to-stone-100">
        <CardHeader>
          <CardTitle className="text-stone-800 flex items-center gap-2">
            <Headphones className="w-5 h-5" />
            Now Playing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className={`w-20 h-20 rounded-lg ${currentPodcast.cover} flex items-center justify-center flex-shrink-0`}>
              <Headphones className="w-8 h-8 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-stone-800 mb-1 truncate">
                {currentPodcast.title}
              </h3>
              <p className="text-sm text-stone-600 mb-3">
                {currentPodcast.book} • {currentPodcast.author}
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <span>{formatTime(currentPodcast.currentTime)}</span>
                  <Progress value={currentPodcast.progress} className="flex-1 h-2" />
                  <span>{currentPodcast.duration}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm">
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    onClick={handlePlayPause}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  
                  <Button variant="outline" size="sm">
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

      {/* Podcast List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-800">Available Podcasts</h2>
        
        {podcasts.map((podcast) => (
          <Card key={podcast.id} className="border-stone-200 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-lg ${podcast.cover} flex items-center justify-center flex-shrink-0 relative`}>
                  <Headphones className="w-6 h-6 text-white" />
                  {podcast.progress > 0 && podcast.progress < 100 && (
                    <div className="absolute inset-0 border-2 border-white rounded-lg">
                      <div 
                        className="bg-white/30 h-full rounded-md transition-all"
                        style={{ width: `${podcast.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-stone-800 hover:text-emerald-700 transition-colors mb-1">
                    {podcast.title}
                  </h3>
                  <p className="text-sm text-stone-600 mb-2">
                    {podcast.book} • {podcast.author}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-stone-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{podcast.duration}</span>
                    </div>
                    
                    {podcast.progress > 0 && (
                      <span>{podcast.progress}% listened</span>
                    )}
                    
                    <Badge 
                      variant={podcast.downloadStatus === 'downloaded' ? 'default' : 'secondary'} 
                      className="text-xs"
                    >
                      {podcast.downloadStatus === 'downloaded' ? 'Downloaded' : 'Available'}
                    </Badge>
                  </div>
                  
                  {podcast.progress > 0 && (
                    <div className="mt-2 w-full bg-stone-200 rounded-full h-1">
                      <div 
                        className="bg-emerald-600 h-1 rounded-full transition-all"
                        style={{ width: `${podcast.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {podcast.downloadStatus === 'available' && (
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setCurrentPodcast(podcast)}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
