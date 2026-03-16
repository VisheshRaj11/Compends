import { Calendar, MapPin, ExternalLink, Trophy, Layers, RefreshCcw } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import React, { useCallback, useEffect, useState } from 'react';
import { useSupabase } from '@/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-toastify";

// --- Sub-Components ---

const SkeletonGrid = () => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <Card key={i} className="overflow-hidden border-slate-200">
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full rounded-lg" />
        </CardFooter>
      </Card>
    ))}
  </div>
);

// ---------- Hackathon Card ----------
const HackathonCard = ({ hackathon }) => {
  const { title, platform, url, start_date, end_date, location } = hackathon;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="group relative">
      {/* Gradient border */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-200 via-purple-200 to-indigo-200 opacity-0 blur-sm transition group-hover:opacity-100" />

      <Card
        className="
        relative
        h-full
        rounded-2xl
        border
        border-slate-200
        bg-white/80
        backdrop-blur-xl
        shadow-sm
        transition
        hover:-translate-y-1
        hover:shadow-xl
        p-6
      "
      >
        {/* Platform */}
        <div className="flex items-center justify-between mb-4">
          <Badge
            variant="outline"
            className="bg-slate-50 text-xs uppercase tracking-widest"
          >
            {platform || "Hackathon"}
          </Badge>

          {!end_date && start_date && (
            <span className="text-xs font-medium text-green-600">
              ● Live
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-slate-900 leading-snug line-clamp-2 min-h-[3rem]">
          {title}
        </h3>

        {/* Info */}
        <div className="mt-4 space-y-2 text-sm text-slate-500">
          {start_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>
                {formatDate(start_date)}
                {end_date && ` – ${formatDate(end_date)}`}
              </span>
            </div>
          )}

          {location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>

        {/* Button */}
        <div className="mt-6">
          <Button
            asChild
            className="
            w-full
            rounded-xl
            bg-slate-900
            text-white
            hover:bg-slate-800
            transition
          "
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              <span className="flex items-center justify-center gap-2">
                View Details
                <ExternalLink className="h-4 w-4 opacity-70" />
              </span>
            </a>
          </Button>
        </div>
      </Card>
    </div>
  );
};

// ---------- Main Page ----------
const Hackathons = () => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabase();
  const [cronHackathons, setCronHackathons] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  const fetchHackathons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("hackathons")
      .select("*")
      .order("last_scraped", { ascending: false });
    
    if (!error) setHackathons(data);
    setLoading(false);
  };


  useEffect(() => {
    fetchHackathons();
  }, []);

  useEffect(() => {
    const scrapHackathons = async() => {
        const {data} = await supabase.functions.invoke('scrape-hackathons');
        console.log(data);
    }
    scrapHackathons();
  },[supabase])
  
  const cronHackathonsFunc = useCallback(async() => {
    setCronHackathons(true);
    try{
      const {error:deleteErr} = await supabase.from('hackathons').delete().not('id','is', null);
      if(deleteErr) {
        toast.error("Failed to fetch hackathons");
        throw new Error("Not able to fetch the hackathons");
      }
      const {error:fetchErr} = await supabase.functions.invoke('scrape-hackathons');
      if(fetchErr) {
        toast.error("Failed to fetch hackathons");
        throw new Error("Not able to fetch the hackathons");
      }
      localStorage.setItem('hackathonFetchCool',(Date.now() + 15 * 60 * 1000).toString()); 
      toast.success("Hackathon fetched successfully!");
      setDisabled(true);
      }catch(error){
        console.log('Failed to fetch hackathons',error);
      } finally{
        setCronHackathons(false);
      }
  },[supabase]);

  useEffect(() => {
    const coolDown = localStorage.getItem('hackathonFetchCool');
    if(coolDown) {
      const remainTime = Number(coolDown) - Date.now();
      setRemainingTime(remainTime);
      setDisabled(true);
    }
  },[]);

  const formatTime = (time) => {
    const totalSeconds = Math.floor(time / 1000);
    const minutes  = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  useEffect(() => {
    if(!disabled) return;
    const interval = setInterval(() =>  {
      setRemainingTime((prev) => {
        if(prev <= 1000) {
          clearInterval(interval);
          setDisabled(false);
          localStorage.removeItem('hackathonFetchCool');
          return 0;
        } 
        return prev - 1000;
      })
    },1000);
    return () => clearInterval(interval);
  },[disabled]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white to-slate-100 bg-[radial-gradient(#043a5e_1px,transparent_1px)] [background-size:26px_26px] px-4 py-16 selection:bg-slate-900 selection:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="relative mb-12 sm:mb-16 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em]">
            <Trophy className="h-4 w-4" />
            <span>Opportunities 2026</span>
          </div>
          <div className="flex items-center gap-4 md:gap-6 lg:gap-12">
            <h1 className="text-4xl font-extrabold tracking-tighter text-slate-900 sm:text-5xl lg:text-6xl">
            Latest Hackathons
            </h1>
            <Button 
            onClick={cronHackathonsFunc}
            disabled={disabled || cronHackathons}
            className={`bg-black px-4 w-fit py-5 lg:px-4 lg:py-6 hover:scale-105 cursor-pointer border-none`}>
              <span>
                <RefreshCcw
                className={`${cronHackathons ? 'animate-spin' : ''}`}/>
              </span>
              <h2>
                {disabled ? formatTime(remainingTime) : 'Fetch New One'}
              </h2>
            </Button>
          </div>
          <p className="max-w-2xl text-base sm:text-lg text-slate-500 sm:text-xl font-semibold z-10">
            Building the future, one commit at a time. Explore curated events from around the globe.
          </p>
          <div className="absolute -left-4 -top-4 h-24 w-24 rounded-full bg-blue-50/50 blur-3xl -z-10" />
        </div>

        {/* Content */}
        {loading ? (
          <SkeletonGrid />
        ) : hackathons.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 py-24 text-center">
            <Layers className="mb-4 h-12 w-12 text-slate-300" />
            <h2 className="text-xl font-semibold text-slate-900">Quiet for now...</h2>
            <p className="mt-1 text-slate-500">Check back soon for new challenges.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {hackathons.map((hackathon) => (
              <HackathonCard key={hackathon.id} hackathon={hackathon} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hackathons;