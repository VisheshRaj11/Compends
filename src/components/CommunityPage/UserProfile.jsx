import React, { useEffect, useState } from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress"; // shadcn progress
import {
  Code,
  GitCommit,
  Github,
  Linkedin,
  Mail,
  BrainCircuit,
  CalendarDays,
  Flame,
  Link2,
  LaptopMinimalCheck,
  BarChart3,
  PieChart,
  TrendingUp,
  Pencil
} from "lucide-react";
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '@/supabase/client';

// Recharts imports
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import { useParams, useSearchParams } from 'react-router-dom';
import EditUserForm from './EditUserForm';

const UserProfile = () => {
  const { user } = useUser();
  const supabase = useSupabase();
  const [userInfo, setUserInfo] = useState(null);
  const [leetCodeInfo, setLeetCodeInfo] = useState(null);
  const [githubInfo, setGithubInfo] = useState(null);
  const [editUser, setIsEditUser] = useState(false);
  // const [searchParams] = useParams();
  const {id} = useParams();
  console.log(id);
  // Data fetching (same as before)
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('clerk_id', id);
        if (error) throw new Error(error);
        setUserInfo(data[0]);
      } catch (error) {
        console.log(error);
      }
    };
    fetchUserInfo();
  }, [user, supabase]);

  useEffect(() => {
    const fetchLeetUsers = async () => {
      const { data, error } = await supabase.from('leetcode_stats').select(`
        user_id,
        total_solved,
        easy_solved,
        medium_solved,
        hard_solved,
        streak,
        users!inner (name, avatar_url, leetcode)
      `).eq('user_id', id).order('total_solved', { ascending: false });
      if (error) {
        console.log("Failed to fetch leetcode users: ", error.message);
        return;
      }
      const formattedUsers = data.map((stat) => ({
        id: stat.id,
        name: stat.users.name,
        avatar: stat.users.avatar_url || 'https://i.pravatar.cc/150?img=default',
        solved: stat.total_solved,
        easy: stat.easy_solved,
        medium: stat.medium_solved,
        hard: stat.hard_solved,
        streak: stat.streak,
        leetcode: stat.users.leetcode,
        isCurrentUser: stat.user_id === user?.id,
      }));
      setLeetCodeInfo(formattedUsers[0]);
    };
    fetchLeetUsers();
  }, [supabase, user?.id]);

  useEffect(() => {
    const fetchUserGithub = async () => {
      try {
        const { data, error } = await supabase.from('github_stats').select('*').eq('user_id',id);
        if (error) throw new Error(error);
        setGithubInfo(data[0]);
      } catch (error) {
        console.log(error);
      }
    };
    fetchUserGithub();
  }, [supabase, user?.id]);

  useEffect(() => {
    const channel = supabase.channel('users-channel')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema:'public',
      table: 'users'
    }, (payload) => {
        if(payload.eventType === "UPDATE") {
          setUserInfo(payload.new);
        }
    }).subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  },[userInfo]);

  // Prepare data for charts
  const leetcodePieData = leetCodeInfo ? [
    { name: 'Easy', value: leetCodeInfo.easy, color: '#22c55e' },
    { name: 'Medium', value: leetCodeInfo.medium, color: '#eab308' },
    { name: 'Hard', value: leetCodeInfo.hard, color: '#ef4444' },
  ] : [];

  // Social links
  const socialLinks = [
    { icon: Linkedin, href: userInfo?.linkedin, label: "LinkedIn" },
    { icon: Github, href: userInfo?.github, label: "GitHub" },
    { icon: LaptopMinimalCheck, href: userInfo?.leetcode, label: "LeetCode" },
    { icon: Mail, href: '', label: `Email ${user?.emailAddresses}` },
  ];

  // Helper to get initials
  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';
  };

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) setIsEditUser(false);
  };
  // Calculate solved percentage
  // const totalSolved = leetCodeInfo?.solved || 0;
  // const totalProblems = totalSolved + (leetCodeInfo?.easy || 0) + (leetCodeInfo?.medium || 0) + (leetCodeInfo?.hard || 0); // This is just a placeholder; ideally you'd know total problems per platform. For now we use solved as total.
  // // Actually totalProblems is not known, so we skip progress for now.

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-2">
      <div className="max-w-9xl mx-auto bg-purple-950/5 rounded-b-2xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="space-y-6">
          {/* Profile Header */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 ring-4 ring-primary/10 transition-transform duration-300 hover:scale-105">
                <AvatarImage src={userInfo?.avatar_url} alt={userInfo?.name} />
                <AvatarFallback className="text-2xl sm:text-4xl bg-gradient-to-br from-primary/20 to-primary/5">
                  {getInitials(userInfo?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left space-y-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {userInfo?.name.split(" ").map(n => n[0].toUpperCase() + n.slice(1)).join("") }
                </h1>
                <div className="flex flex-wrap gap-4 justify-center sm:justify-start text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" />
                    <span>Joined {new Date(userInfo?.created_at).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
                <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
                  <span className="font-semibold">Bio:</span> {userInfo?.about || "No bio added yet."}
                </p>
              </div>
             {
              id === user?.id && ( <div 
                onClick={() => setIsEditUser(prev => !prev)}
                className='flex items-center gap-2 bg-gray-950/5 hover:bg-gray-950/10 hover:border hover:border-purple-300 rounded-md p-2 cursor-pointer duration-300 transition'><Pencil size={18}/> Edit Profile</div>)
             }
            </div>
          </Card>

          {editUser &&
            (<div 
                  onClick={handleOverlay}
                  className="fixed h-full inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                >
                  <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                   <EditUserForm userInfo={userInfo} setIsEditUser={setIsEditUser}/>
                  </div>
                </div>)
          }

          {/* Stats Row: LeetCode & GitHub */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LeetCode Card with Donut Chart */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-yellow-500" />
                    LeetCode Progress
                  </CardTitle>
                  <Badge variant="secondary" className="gap-1">
                    <Flame className="w-3 h-3 text-orange-500" />
                    {leetCodeInfo?.streak || 0} day streak
                  </Badge>
                </div>
                <CardDescription>Problem solving journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Donut Chart */}
                  <div className="w-full md:w-1/2 h-48">
       <ResponsiveContainer width="100%" height="100%">
        <RePieChart>
          <Pie
            data={leetcodePieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {leetcodePieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>

        {/* ✅ CENTER TEXT (FIXED) */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-gray-800 dark:fill-white"
          style={{ fontSize: "18px", fontWeight: "bold" }}
        >
          {leetCodeInfo?.solved || 0}
        </text>

        {/* optional label */}
        <text
          x="50%"
          y="65%"
          textAnchor="middle"
          className="fill-gray-500 font-bold"
          style={{ fontSize: "12px" }}
        >
          Solved
        </text>

        <Tooltip />
      </RePieChart>
    </ResponsiveContainer>
                  </div>
                  {/* Stats Grid */}
                  <div className="w-full md:w-1/2 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">{leetCodeInfo?.easy || 0}</div>
                        <div className="text-xs text-muted-foreground">Easy</div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{leetCodeInfo?.medium || 0}</div>
                        <div className="text-xs text-muted-foreground">Medium</div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-red-600">{leetCodeInfo?.hard || 0}</div>
                        <div className="text-xs text-muted-foreground">Hard</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-orange-600">{leetCodeInfo?.streak || 0}</div>
                        <div className="text-xs text-muted-foreground">Streak</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* GitHub Card with Area Chart */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div
                    className="lg:col-span-2 bg-white/[0.03] border border-white/10 px-6 py-2 rounded-3xl backdrop-blur-md flex flex-col justify-center"
                  >
                    <h1 className='text-xl font-semibold'>Github Stats</h1>
                    <h3 className="text-gray-400 text-xs font-mono mb-6 uppercase tracking-widest">Commit Consistency</h3>
                     <img
                      src={`https://github-readme-streak-stats.herokuapp.com/?user=${githubInfo?.github_username}&theme=tokyonight&hide_border=true&background=00000000`}
                      alt="Streak"
                      loading="lazy"
                      className="
                        w-full 
                        max-w-[500px] 
                        sm:max-w-[600px] 
                        md:max-w-[700px] 
                        lg:max-w-full 
                        h-auto 
                        object-contain
                      "
                    />
                  </div>
              </div>
              <CardContent>
                <div className="space-y-4">
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{githubInfo?.contributions || 0}</div>
                      <div className="text-xs text-muted-foreground">total commits</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-500">{githubInfo?.pull_requests || 0}</div>
                      <div className="text-xs text-muted-foreground">PRs</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-500">{githubInfo?.total_stars || 0}</div>
                      <div className="text-xs text-muted-foreground">stars</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-500">{githubInfo?.public_repos || 0}</div>
                      <div className="text-xs text-muted-foreground">repos</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Section: Heatmap & Social Links */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Heatmap Card */}
            <Card className="lg:col-span-2 border-0 shadow-md hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Contribution Graph
                  </CardTitle>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span>Less</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-sm bg-[#ebedf0]"></div> {/* empty */}
                      <div className="w-3 h-3 rounded-sm bg-[#c6e0f5]"></div> {/* very light blue */}
                      <div className="w-3 h-3 rounded-sm bg-[#8cc6ec]"></div> {/* light blue */}
                      <div className="w-3 h-3 rounded-sm bg-[#4a90e2]"></div> {/* medium blue */}
                      <div className="w-3 h-3 rounded-sm bg-[#2c5aa0]"></div> {/* dark blue */}
                    </div>
                    <span>More</span>
                  </div>
                </div>
                <CardDescription>GitHub contributions over the year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto pb-2 custom-scrollbar">
                  <img
                    src={`https://ghchart.rshah.org/3b82f6/${githubInfo?.github_username}`}
                    alt={`${githubInfo?.github_username} GitHub Contribution Chart`}
                    className="min-w-[600px] w-full h-auto"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Social Links Card */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Connect
                </CardTitle>
                <CardDescription>Find me on social platforms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {socialLinks.map((link) => (
                  <Button
                    key={link.label}
                    variant="outline"
                    className="w-full justify-start gap-3 hover:bg-accent transition-all duration-200"
                    asChild
                  >
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      <link.icon className="w-4 h-4" />
                      <span className="flex-1 text-left">{link.label}</span>
                    </a>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Custom scrollbar for heatmap */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default UserProfile;