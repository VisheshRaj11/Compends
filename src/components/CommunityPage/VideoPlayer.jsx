import React, { useState } from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Loader2, Search, PlayCircle, Film } from 'lucide-react'
import { useSupabase } from '@/supabase/client'

const VideoPlayer = () => {
  const [query, setQuery] = useState('');
  const [videoList, setVideoList] = useState([]);
  const [selectVideo, setSelectVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const supabase = useSupabase();

  const searchVideos = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-videos', {
        body: { query },
      });
      if (error) throw new Error(error);
      setVideoList(data.videos);
      if (data.videos.length > 0 && !selectVideo) setSelectVideo(data.videos[0]);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen  w-full bg-gradient-to-br from-white to-slate-100 bg-[radial-gradient(#2ec972_1px,transparent_1px)] [background-size:26px_26px] text-foreground">
      
      {/* --- Sticky Search Bar --- */}
      <nav className="z-30 sticky top-0 bg-background/95 backdrop-blur-md border-b p-3 md:p-4">
        <form onSubmit={searchVideos} className="flex max-w-4xl mx-auto w-full gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search videos..."
              className="pl-10 bg-secondary/50 border-none focus-visible:ring-1"
            />
          </div>
          <Button type="submit" disabled={loading} className="px-4 md:px-8">
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Search"}
          </Button>
        </form>
      </nav>

      {/* --- Main Content Layout --- */}
      <main className={`flex flex-col flex-1 ${videoList.length ? 'lg:flex-row' : ''} lg:h-[calc(100vh-73px)] lg:overflow-hidden p-4 lg:p-6 gap-6 md:gap-8`}>
        
        {/* LEFT: Video Player Section */}
        <div className="flex-1 lg:overflow-y-auto scrollbar-hide">
          <div className="w-full max-w-5xl mx-auto">
            {!selectVideo ? (
              <div className="aspect-video w-full bg-secondary/20 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-950">
                <Film className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">Search to find amazing content</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/5">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${selectVideo.id}?autoplay=1`}
                    title={selectVideo.title}
                    allowFullScreen
                  />
                </div>
                <div className="pb-4 border-b border-muted">
                  <h1 className="text-xl md:text-2xl font-bold line-clamp-2 leading-tight">
                    {selectVideo.title}
                  </h1>
                  <p className="text-primary font-semibold text-sm mt-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    {selectVideo.channelTitle}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Sidebar / Video List */}
        <div className="w-full  lg:w-[380px] xl:w-[420px] flex flex-col h-full overflow-hidden">
            {videoList.length !== 0 && (
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 px-1">
                <PlayCircle className="h-5 w-5 text-primary" />
                Up Next
              </h3>
            )}
           
          {/* This container handles the scrollbar. 
              On mobile, we limit max-height so it doesn't scroll forever. 
          */}
          <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar max-h-[64vh] lg:flex-1">
            {videoList.length !== 0 && (
              videoList.map((video) => (
                <button
                  key={video.id}
                  onClick={() => {
                    setSelectVideo(video);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`group flex items-start gap-3 p-2 rounded-xl transition-all hover:bg-secondary/80 text-left ${
                    selectVideo?.id === video.id ? 'bg-secondary ring-1 ring-primary/30' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0 w-32 md:w-36 aspect-video">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-full h-full object-cover rounded-lg shadow-sm group-hover:opacity-90 transition-opacity" 
                    />
                    {selectVideo?.id === video.id && (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center rounded-lg">
                        <PlayCircle className="text-primary h-6 w-6" fill="white" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 py-0.5">
                    <h4 className="text-[13px] md:text-sm font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {video.title}
                    </h4>
                    <p className="text-[11px] md:text-xs text-muted-foreground mt-1 truncate">
                      {video.channelTitle}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default VideoPlayer