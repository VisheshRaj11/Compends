import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Video, Users, Shield, PhoneOff } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useSupabase } from '@/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useUser } from '@clerk/clerk-react';
import { Checkbox } from '@/components/ui/checkbox';
import { joinLiveKit } from '@/utils/JoinLivekit';
import { Track } from 'livekit-client';
import VideoTile from './VideoTile';

const Chat = () => {
  const { id: communityId } = useParams();
  const [communityMembers, setCommunityMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const supabase = useSupabase();
  const { user } = useUser();

  const [incomingCallId, setIncomingCallId] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [remoteTracks, setRemoteTracks] = useState([]);

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
  if(!user) return ;
  
  const channel = supabase.channel(`incoming-calls-${user.id}`);

  channel.on(
    "postgres_changes",
    {
      event: "INSERT",
      schema:'public',
      table: 'call_invites',
      filter: `user_id=eq.${user.id}`
    },
    (payload) => {
      console.log("Incoming Call", payload.new.call_id);
      setIncomingCallId(payload.new.call_id);
    }
  )
  channel.subscribe();
  return () => supabase.removeChannel(channel);
},[user, supabase]);

// 2. Setup LiveKit Listeners
  const handleRoomEvents = (room) => {
    room.on('trackSubscribed', (track) => {
      setRemoteTracks((prev) => [...prev, track]);
    });
    room.on('trackUnsubscribed', (track) => {
      setRemoteTracks((prev) => prev.filter((t) => t !== track));
      track.detach();
    });
    setActiveRoom(room);
  };

  const startVideoCall = async() => {
      try {
        if(selectedMembers.length < 1) return;

        const  {data, error} = await supabase.functions.invoke("start-call",{
          body: {
            community_id: communityId,
            invitees: selectedMembers,
          }
        })

        if (error) throw error;

        const callId = data.call_id;
        console.log("Call Created: ", callId);

        const tokenRes = await supabase.functions.invoke('generate-token',{
          body:{call_id:callId},
        })

        if(tokenRes.error) throw tokenRes.error;

        const room = await joinLiveKit(tokenRes.data.token);
        handleRoomEvents(room);

      } catch (error) {
         console.error( error.message);
         alert("failed to start call");
      }
  }

  const acceptCall = async(callId) => {
    try {
      const {data, error} = await supabase.functions.invoke("generate-token",{
        body:{call_id:callId},
      })

      if (error) throw error; 

      const room = await joinLiveKit(data.token);
      handleRoomEvents(room);

      await supabase
        .from("call_invites")
        .update({ status: "accepted" })
        .eq("call_id", callId)
        .eq("user_id", user.id);

    } catch (error) {
       alert("Failed to join call");
       console.log(error.message);
    }
  }

  const endCall = async() => {
    if(activeRoom) {
      await activeRoom.disconnect();
      setActiveRoom(null);
      setRemoteTracks([]);
    }
  }

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
       
          {!activeRoom ? (
              <div className="max-w-2xl bg-white rounded-3xl border p-12 text-center space-y-8 shadow-xl">
                <Users className="h-12 w-12 text-primary mx-auto" />
                <h2 className="text-3xl font-bold">Group Connection</h2>
                <Button 
                    onClick={startVideoCall} 
                    disabled={selectedMembers.length === 0}
                    className="w-full h-14 rounded-2xl"
                >
                  <Video className="mr-2" /> Start Call
                </Button>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col">
                <div className="grid grid-cols-2 gap-4 flex-1">
                  {/* Local Video */}
                  <VideoTile track={null} local={true} room={activeRoom} />
                  {/* Remote Videos */}
                  {remoteTracks.map((track) => (
                    <VideoTile key={track.sid} track={track} />
                  ))}
                </div>
                <Button variant="destructive" onClick={endCall} className="mt-4 rounded-full w-16 h-16 self-center">
                  <PhoneOff />
                </Button>
              </div>
            )}

            {/* Video interface */}
            <div
              id="video-grid"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-6"
            ></div>

            {/* Incoming Call Modal */}
            {incomingCallId && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-3xl shadow-2xl text-center space-y-6">
                  <div className="animate-bounce bg-green-100 p-4 rounded-full inline-block">
                    <Video className="text-green-600 h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold">Incoming Call</h3>
                  <div className="flex gap-4">
                    <Button onClick={() => { acceptCall(incomingCallId); setIncomingCallId(null); }} className="bg-green-500 hover:bg-green-600 px-8">Accept</Button>
                    <Button onClick={() => setIncomingCallId(null)} variant="outline">Decline</Button>
                  </div>
                </div>
              </div>
            )}


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
    // </div>
  );
}

export default Chat;