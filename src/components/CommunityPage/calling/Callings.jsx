import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { CirclePlus, MoreVertical, MessageSquare, Plus, Video, Phone, Users, Shield } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useSupabase } from '@/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useUser } from '@clerk/clerk-react';
import { Checkbox } from '@/components/ui/checkbox';

const Chat = () => {
  const { id: communityId } = useParams();
  const [communityMembers, setCommunityMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const supabase = useSupabase();
  const { user } = useUser();

  // Helper to toggle selection
  const toggleMemberSelection = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
    console.log(selectedMembers);
  };

  const isCallEnabled = selectedMembers.length >= 2;

  useEffect(() => {
    const fetchCommunityMembers = async () => {
      const { error, data } = await supabase
        .from("community_members")
        .select(`role, users(id, name, email, about, avatar_url)`)
        .eq('community_id', communityId);

      if (error) return;
      
      const formattedMembers = data.map((row) => ({
        ...row.users,
        role: row.role
      }));
      
      setCommunityMembers(formattedMembers);
      if (formattedMembers.length > 0) setActiveChat(formattedMembers[0]);
    };

    if (communityId) fetchCommunityMembers();
  }, [communityId, supabase]);

  return (
    <div className="flex h-screen w-full bg-gray-50/20 overflow-hidden">
      
      {/* LEFT PART: Sidebar */}
      <div className="hidden md:flex flex-col w-full max-w-[350px] border-r bg-white">
        <div className="p-6 h-20 border-b flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-blue-800">Members</h1>
            <p className="text-xs text-muted-foreground">{communityMembers.length} members available</p>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {communityMembers.map((member) => (
              <div 
                key={member.id}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 group border ${
                  selectedMembers.includes(member.id) 
                    ? "bg-primary/5 border-primary/20 shadow-sm" 
                    : "bg-transparent border-transparent hover:bg-slate-100"
                }`}
              >
                <div className="relative">
                  <Avatar className="h-11 w-11 ring-2 ring-offset-2 ring-transparent group-hover:ring-slate-200 transition-all">
                    <AvatarImage src={member.avatar_url} />
                    <AvatarFallback className="bg-slate-100 text-slate-600 font-medium">
                      {member.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                <div className="flex-1 min-w-0" onClick={() => toggleMemberSelection(member.id)}>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-slate-800 truncate">{member.name}</p>
                    {member.role === 'admin' && (
                      <Shield className="h-3 w-3 text-blue-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {member.about || "Active now"}
                  </p>
                </div>

                <Checkbox 
                  checked={selectedMembers.includes(member.id)}
                  onCheckedChange={() => toggleMemberSelection(member.id)}
                  className="rounded-full h-5 w-5"
                />
        
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* RIGHT PART: Main Area */}
      <div className="flex flex-col flex-1 h-full items-center justify-center p-6 lg:p-12 overflow-x-scroll">
        <div className="w-full max-w-2xl bg-white rounded-3xl border shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col items-center p-12 text-center space-y-8">
          
          <div className="space-y-4">
             <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2">
                <Users className="h-8 w-8 text-primary" />
             </div>
             <h2 className="text-3xl font-bold text-slate-900 tracking-tight"><span className='text-blue-500'>Group</span> Connection</h2>
             <p className="text-slate-500 max-w-sm mx-auto">
               Select at least two members from the sidebar to start a professional high-quality call.
             </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Button 
              disabled={!isCallEnabled}
              className="flex-1 h-14 rounded-2xl text-md font-semibold gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Video className="h-5 w-5" />
              Video Call
            </Button>
            <Button 
              variant="outline"
              disabled={!isCallEnabled}
              className="flex-1 h-14 rounded-2xl text-md font-semibold gap-2 border-2 hover:bg-slate-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Phone className="h-5 w-5" />
              Audio Call
            </Button>
          </div>

          {/* Status Indicator */}
          <div className="pt-4">
            {selectedMembers.length > 0 ? (
              <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-slate-600 bg-slate-100 border-none">
                {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
              </Badge>
            ) : (
              <p className="text-xs text-slate-400 italic">No one selected yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;