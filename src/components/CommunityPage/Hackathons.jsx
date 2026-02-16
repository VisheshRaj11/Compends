import { Calendar, MapPin, ExternalLink, Trophy, Layers } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from 'react';
import { useSupabase } from '@/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";

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
    <Card
      className="       
        bg-blue-950
        group
        rounded-xl
        border border-zinc-200
        p-5
        transition
        hover:border-zinc-300
        text-white
        hover:shadow-sm
      "
    >
      {/* Meta */}
      <div className="mb-3 flex items-center justify-between">
        <Badge
          variant="outline"
          className="border-zinc-300 bg-zinc-50 text-[11px] uppercase tracking-widest text-zinc-600"
        >
          {platform || "Hackathon"}
        </Badge>

        {!end_date && start_date && (
          <span className="text-xs font-medium text-zinc-500">
            Live
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="mb-4 line-clamp-2 text-base font-semibol leading-snug  min-h-[3rem] ">
        {title}
      </h3>

      {/* Info */}
      <div className="space-y-2 text-sm text-zinc-400">
        {start_date && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-zinc-200" />
            <span>
              {formatDate(start_date)}
              {end_date && ` – ${formatDate(end_date)}`}
            </span>
          </div>
        )}

        {location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-zinc-200" />
            <span className="truncate">{location}</span>
          </div>
        )}
      </div>

      {/* Action */}
      <div className="mt-5">
        <Button
          asChild
          variant="outline"
          className="
            w-full
            border-zinc-300
            bg-white
            text-zinc-800
            hover:bg-zinc-900
            hover:text-white
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
  );
};


// ---------- Main Page ----------
const Hackathons = () => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabase();

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

  return (
    <div className="min-h-screen bg-white/50 px-4 py-16 selection:bg-slate-900 selection:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="relative mb-12 sm:mb-16 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
            <Trophy className="h-4 w-4" />
            <span>Opportunities 2026</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-slate-900 sm:text-5xl lg:text-6xl">
            Latest Hackathons
          </h1>
          <p className="max-w-2xl text-base sm:text-lg text-slate-500 sm:text-xl">
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