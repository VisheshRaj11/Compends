import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trophy, 
  Target, 
  Users, 
  Github, 
  Code2, 
  Terminal, 
  ExternalLink
} from "lucide-react";
import { useSupabase } from "@/supabase/client";
import { useUser, useAuth } from "@clerk/clerk-react";
import { extractUsername } from "@/utils/ExtractUsername";

// ---------- Podium Component ----------
const Podium = ({ users }) => {
  const displayOrder = [users[1], users[0], users[2]];

  return (
    <div className="flex items-end justify-center gap-2 md:gap-6 lg:gap-10 mb-12 mt-6">
      {displayOrder.map((user, index) => {
        if (!user) return null;
        const isFirst = user.rank === 1;
        
        return (
          <div 
            key={user.id} 
            className={`relative flex flex-col items-center flex-1 transition-all duration-300 ${isFirst ? 'scale-110 z-10' : 'scale-90 opacity-70'}`}
          >
            <div className="relative mb-4">
              {isFirst && (
                <Trophy className="absolute -top-8 left-1/2 -translate-x-1/2 h-8 w-8 text-yellow-500 fill-yellow-500 drop-shadow-md animate-bounce" />
              )}
              <div className={`p-1 rounded-full bg-white shadow-xl border-2 ${isFirst ? 'border-yellow-400 ring-8 ring-yellow-50' : 'border-slate-200'}`}>
                <Avatar className={`${isFirst ? 'h-20 w-20 md:h-32 md:w-32' : 'h-14 w-14 md:h-24 md:w-24'}`}>
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
              </div>
              <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black shadow-lg ${isFirst ? 'bg-yellow-500 text-white' : 'bg-slate-800 text-white'}`}>
                #{user.rank}
              </div>
            </div>
            <div className="text-center hidden sm:block">
              <p className="font-bold text-slate-800 text-sm md:text-lg line-clamp-1">{user.name}</p>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-tighter">{user.solved} Points</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------- List Row Component ----------
const LeaderboardRow = ({ user, isCurrentUser }) => (
  <div className={`
    group flex items-center gap-4 p-4 mb-3 rounded-2xl border transition-all
    ${isCurrentUser ? 'bg-green-50 border-green-200 ring-1 ring-blue-100' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5'}
  `}>
    <div className="w-6 text-sm font-black text-slate-300 group-hover:text-blue-500">{user.rank}</div>
    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
      <AvatarImage src={user.avatar} />
      <AvatarFallback>{user.name[0]}</AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <h4 className={`font-bold truncate ${isCurrentUser ? 'text-blue-700' : 'text-slate-800'}`}>{user.name}</h4>
      <div className="flex items-center gap-2 mt-0.5">
        <Badge variant="outline" className="text-[9px] px-1.5 h-4 border-slate-200 text-slate-500 uppercase">Level {Math.floor(user.solved/100) + 1}</Badge>
        {isCurrentUser && <span className="text-[10px] font-bold text-blue-500 uppercase animate-pulse">That's You</span>}
      </div>
    </div>
    <div className="flex items-center gap-6">
      <div className="text-right">
        <div className="text-lg font-black text-slate-900 leading-none">{user.solved}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Solved</div>
      </div>
     <a href={user.leetcode}
      target="_blank" 
      rel="noopener noreferrer"
      className="hidden sm:block"
     >
       <ExternalLink 
      
      className="h-4 w-4 text-slate-500 hidden sm:block " />
     </a>
  
    </div>
  </div>
);

const Rank = () => {
  const supabase = useSupabase();
  const {user} =  useUser();
  const {getToken} = useAuth();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [leetcodeStats, setLeetcodeStats] = useState(null);
  const [error, setError] = useState(null);
  const [leetCodeUsers, setLeetCodeUsers] = useState([]);
  const [githubUsers, setGithubUsers] = useState([]);

  // const 

  useEffect(() => {
      if (!user?.id) return;
    const fetchCurrentUser = async() => {
       const {data, error} = await supabase.from('users').select('*').eq('clerk_id', user.id);
       if(error) {
        console.log("Falied to fetch the user data");
       }
      //  console.log(data[0]);
       setUserData(data[0])
    }

    fetchCurrentUser();
  },[supabase,user?.id]);
  
  //This is for user leetcode stats and upsert in db>
  useEffect(() => {
    if (!userData?.leetcode) return;

    const myLeetcodeStats = async() => {
      setLoading(true);
      setError(null);

      const leetcodeUserName = extractUsername(userData?.leetcode);
      if(!leetcodeUserName) {
        setError("Invalid LeetCode profile URL");
        setLoading(false);
        return;
      }
      
      try {
        const token = await getToken({ template: "supabase" });
        // console.log(token?.split(".").length);
        // console.log(leetcodeUserName);

         const { data:leet, error } = await supabase.functions.invoke(
          'fetch-leetcode_stats',
          {
            body: { username: leetcodeUserName },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

         if (error) {
          console.error("Edge function error:", error);
          setError(error.message);
        } else {
          // console.log("LeetCode stats:", leet);
          setLeetcodeStats(leet.data);
          // Optionally update your local state or global store with the stats
        }
      } catch (error) {
         console.error("Unexpected error:", error);
        setError("Failed to fetch LeetCode stats.");
      } finally {
         setLoading(false);
      }
    }
    myLeetcodeStats();
  },[supabase,getToken, userData]);

  
  //Leetcode fetching;
  useEffect(() => {
    const fetchLeetUsers = async() => {
      const {data, error} = await supabase.from('leetcode_stats').select(`user_id,
        total_solved,
        easy_solved,
        medium_solved,
        hard_solved,
        streak,
        users !inner (
          name,
          avatar_url,
          leetcode
        )`).order('total_solved', {ascending:false});
      if(error) {
        console.log("Failed to fetch leetcode users: ", error.message);
        return ;
      }
      // console.log(data);

      const formattedUsers = data.map((stat, index) => ({
        id: stat.id,
        name: stat.users.name,
        avatar: stat.users.avatar_url || 'https://i.pravatar.cc/150?img=default',
        solved: stat.total_solved,
        leetcode: stat.users.leetcode,
        rank: index + 1,
        isCurrentUser: stat.user_id === user?.id,
      }))
      setLeetCodeUsers(formattedUsers);
      // console.log(formattedUsers);
    }
    fetchLeetUsers();
  },[supabase, user?.id]);

  //This is for user github stats and upsert in db>
  useEffect(() => {
      if (!userData?.github) return;

      const fetchGithubStats = async() => {
        setLoading(true);
        setError(null);

        const githubUsername = extractUsername(userData.github);

         if (!githubUsername) {
          setError("Invalid GitHub profile URL");
          setLoading(false);
          return;
        }

        try {
          const token = await getToken();

          const {data, error} = await supabase.functions.invoke('fetch-github_stats',{
            body:{username: githubUsername},
            headers:{Authorization: `Bearer ${token}`}
          })

           if (error) {
            console.error("GitHub edge function error:", error);
            setError(error.message);
            return;
          }

          console.log("GitHub stats:", data);

          fetchAllGitHubStats ();

        } catch (error) {
          console.error("Unexpected error:", err);
          setError("Failed to fetch GitHub stats.");
        } finally {
          setLoading(false);
        }
      }
      fetchGithubStats();
  },[supabase, getToken, userData]);

const fetchAllGitHubStats  = async() => {
    const {data, error} = await supabase.from('github_stats')
          .select(`
            user_id,
            github_username,
            public_repos,
            followers,
            total_stars,
            contributions,
            users!inner(name, avatar_url, github)  
          `).order('contributions', {ascending:false})

      if(error) {
            console.log("Failed to fetch github users: ", error.message);
            return ;
      }

      const formattedUsers = data?.map((item, index) => ({
          id: item.user_id,
          name: item.users.name,
          avatar: item.users.avatar_url,
          solved: item.contributions,
          github: item.users.github,
          rank: index + 1,
          isCurrentUser: item.user_id === user?.id,
      }))
       setGithubUsers(formattedUsers);
       console.log(formattedUsers);
}

  useEffect(() => {
  fetchAllGitHubStats();
}, [user?.id, supabase]);


  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 py-6 md:py-12 px-4 md:px-10 lg:px-20">
      <div className="w-full max-w-[1400px] mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900">
              ELITE<span className="text-blue-800">RANK.</span>
            </h1>
            <p className="text-slate-500 font-medium">Measuring technical excellence across the community.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-1 md:flex-none min-w-[140px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Members</p>
              <p className="text-2xl font-black text-slate-900">1,284</p>
            </div>
          </div>
        </header>

        <Tabs defaultValue="leetcode" className="w-full">
          <TabsList className="flex bg-white border border-slate-200 w-full md:w-max p-1 rounded-2xl mb-12 shadow-sm overflow-x-auto">
            <TabsTrigger value="leetcode" className="px-8 py-3 rounded-xl font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">
              <Code2 className="mr-2 h-4 w-4" /> LeetCode
            </TabsTrigger>
            <TabsTrigger value="github" className="px-8 py-3 rounded-xl font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">
              <Github className="mr-2 h-4 w-4" /> GitHub
            </TabsTrigger>
          </TabsList>

          {['leetcode', 'geeksforgeeks', 'github'].map((platform) => {
            const users = platform === 'leetcode' ? leetCodeUsers: githubUsers;
            return (
              <TabsContent key={platform} value={platform} className="outline-none">
                {users?.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left/Top Section: Podium (Span 5) */}
                    <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-12 h-fit">
                      <div className="bg-white/40 border border-white p-8 rounded-[3rem] backdrop-blur-md shadow-sm">
                        <div className="text-center mb-6">
                          <Badge className="bg-blue-100 text-blue-600 border-none hover:bg-blue-100 mb-2 uppercase text-[10px] font-bold">Top Performers</Badge>
                          <h2 className="text-2xl font-black text-slate-900 uppercase italic">The Podium</h2>
                        </div>
                        <Podium users={users} />
                        <div className="mt-8 p-4 bg-white rounded-2xl border border-slate-100 text-center">
                          <p className="text-xs text-slate-500 font-medium italic">"The harder you work, the luckier you get."</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Section: The Rest of the List (Span 7) */}
                    <div className="lg:col-span-7 xl:col-span-8">
                      <div className="flex items-center justify-between mb-6 px-4">
                        <h3 className="text-lg font-bold text-slate-800">All Rankings</h3>
                        <span className="text-xs font-bold text-slate-400">{users.length} Competitors</span>
                      </div>
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6">
                        {users.map((user) => (
                          <LeaderboardRow key={user.id} user={user} isCurrentUser={user.isCurrentUser} />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full py-32 text-center bg-white rounded-[3rem] border border-slate-200">
                    <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Users className="h-10 w-10 text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-300 uppercase">No Data Found</h3>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

export default Rank;