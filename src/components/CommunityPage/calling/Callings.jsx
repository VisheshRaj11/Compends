import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Video, Users, Shield, PhoneOff } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useSupabase } from '@/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@clerk/clerk-react';
import { Checkbox } from '@/components/ui/checkbox';
import { joinLiveKit } from '@/utils/JoinLivekit';
import VideoTile from './VideoTile';


const Chat = () => {
  const { id: communityId } = useParams();
  const [communityMembers, setCommunityMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const supabase = useSupabase();
  const { user } = useUser();
  const [currentUserDb, setCurrentUserDb] = useState(null);

  const [incomingCallId, setIncomingCallId] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [remoteTracks, setRemoteTracks] = useState([]);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);

  // 1. Listen for incoming call invites
//   useEffect(() => {
//   if (!user) return;

//   const channel = supabase
//     .channel(`incoming-calls-${user.id}`)
//     .on(
//       'postgres_changes',
//       {
//         event: 'INSERT',
//         schema: 'public',
//         table: 'call_invites',
//         filter: `user_id=eq.${user.id}`,
//       },
//       (payload) => {
//         console.log('🔥 Incoming call payload:', payload);
//           console.log('payload.new.call_id:', payload.new?.call_id);
//           alert('Call received! ID: ' + payload.new?.call_id);
//         setIncomingCallId(payload.new.call_id);
//       }
//     )
//     .subscribe((status, err) => {
//       console.log('📡 Subscription status:', status, err);
//       if (status === 'SUBSCRIBED') {
//         console.log('Listening for calls on channel:', `incoming-calls-${user.id}`);
//       }
//       if (status === 'CHANNEL_ERROR') {
//         console.error('Subscription error:', err);
//       }
//     });

//   return () => {
//     supabase.removeChannel(channel);
//   };
// }, [user, supabase]);

// useEffect(() => {
//   if (!user) return;
//   console.log("Invitee Clerk user:", user.id);
//   const channel = supabase
//     .channel("debug-calls")
//     .on(
//       "postgres_changes",
//       {
//         event: "*",
//         schema: "public",
//         table: "call_invites",
//       },
//       (payload) => {
//         console.log("🔥 REALTIME EVENT:", payload);
//       }
//     )
//     .subscribe((status) => {
//       console.log("Realtime status:", status);
//     });

//   return () => {
//     supabase.removeChannel(channel);
//   };
// }, [user]);

useEffect(() => {
  const fetchCurrentUser = async() => {
    const {data} = await supabase.from("users").
          select('id').eq('clerk_id', user.id).single();

    if(data) {
      console.log(data[0].id);
      setCurrentUserDb(data[0].id);
    }
  }
  fetchCurrentUser();
},[user]);

// useEffect(() => {
//   const fetchCommunityMembers = async () => {
//     const { error, data } = await supabase
//       .from('community_members')
//       .select(`role, users(id, name, email, about, avatar_url)`)
//       .eq('community_id', communityId);

//     if (error) return;

//     const formattedMembers = data.map((row) => ({
//       ...row.users,
//       role: row.role,
//     }));

//     setCommunityMembers(formattedMembers);

//     // build lookup map
//     const map = {};
//     formattedMembers.forEach((m) => {
//       map[m.id] = m;
//     });

//     setMemberMap(map);
//   };

//   if (communityId) fetchCommunityMembers();
// }, [communityId, supabase]);

useEffect(() => {
  if (!user) return;

  const channel = supabase
    .channel(`incoming-calls-${user.id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "call_invites",
      },
      (payload) => {
        // console.log("Invite event:", payload);
        console.log(payload.new.user_id+" "+user.id);
        // Only show modal if invite is for this user
        if (payload.new.user_id === currentUserDb) {
          console.log("Incoming call for this user!");

          setIncomingCallId(payload.new.call_id);
        }
      }
    )
    .subscribe((status) => {
      console.log("Realtime status:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, [currentUserDb]);

useEffect(() => {
  const fetchPendingInvite = async () => {
    const { data } = await supabase
      .from("call_invites")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .limit(1)
      .single();

    if (data) {
      setIncomingCallId(data.call_id);
    }
  };

  if (user) fetchPendingInvite();
}, [user]);

  // 2. Handle LiveKit room events
 const handleRoomEvents = (room) => {

  const addTrack = (track) => {
    if (track.kind === "video") {
      setRemoteTracks(prev => {
        if (prev.find(t => t.sid === track.sid)) return prev;
        return [...prev, track];
      });
    }
    if (track.kind === "audio") {
      const audioElement = track.attach();
      audioElement.style.display = "none";
      document.body.appendChild(audioElement);
    }
  };

  // Existing participants
  room.remoteParticipants.forEach((participant) => {
    participant.trackPublications.forEach((publication) => {
      if (publication.isSubscribed && publication.track) {
        addTrack(publication.track);
      }
    });
  });

  // New participant joins
  room.on("participantConnected", (participant) => {
    console.log("Participant joined:", participant.identity);
  });

  // Track subscribed
  room.on("trackSubscribed", (track, publication, participant) => {
    console.log("Track subscribed:", participant.identity);
    addTrack(track);
  });

  room.on("trackUnsubscribed", (track) => {
    setRemoteTracks(prev => prev.filter(t => t.sid !== track.sid));
    track.detach();
  });

  setActiveRoom(room);
};
  // 3. Start a new call
  const startVideoCall = async () => {
    try {
      if (selectedMembers.length < 1) return;

      const invitees = selectedMembers.filter((id) => id !== currentUserDb);

      console.log("Inviting users:", invitees);

      const { data, error } = await supabase.functions.invoke('start-call', {
        body: {
          community_id: communityId,
          invitees,
        },
      });

      if (error) throw error;

      const callId = data.call_id;

      const tokenRes = await supabase.functions.invoke('generate-token', {
        body: { call_id: callId, user_id: currentUserDb },
      });

      if (tokenRes.error) throw tokenRes.error;

      const room = await joinLiveKit(tokenRes.data.token);
      handleRoomEvents(room);
    } catch (error) {
      console.error("Start call failed:", error.message);
      alert('Failed to start call', error);
    }
  };

  // 4. Accept an incoming call
  const acceptCall = async (callId) => {
    try {
      
       await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error } = await supabase.functions.invoke('generate-token', {
        body: { call_id: callId, user_id: currentUserDb },
      });

      if (error) throw error;

      const room = await joinLiveKit(data.token);
      handleRoomEvents(room);

      // Update status to accepted in DB
      await supabase
        .from('call_invites')
        .update({ status: 'accepted' })
        .eq('call_id', callId)
        .eq('user_id', currentUserDb);

      console.log("Accept Call");

      setIncomingCallId(null);
    } catch (error) {
      console.error("Join call failed:", error.message);
      alert("Join call error: " +(error.message));
      setIncomingCallId(null);
    }
  };

  const endCall = async () => {
    if (activeRoom) {
      await activeRoom.disconnect();
      setActiveRoom(null);
      setRemoteTracks([]);
      setLocalVideoTrack(null);
    }
  };

  // Manage local track
  useEffect(() => {
    if (!activeRoom) return;
    const localParticipant = activeRoom.localParticipant;
    const updateLocalTrack = () => {
      const tracks = Array.from(localParticipant.videoTrackPublications.values());
      setLocalVideoTrack(tracks[0]?.track || null);
    };
    updateLocalTrack();
    localParticipant.on('trackPublished', updateLocalTrack);
    localParticipant.on('trackUnpublished', updateLocalTrack);
    return () => {
      localParticipant.off('trackPublished', updateLocalTrack);
      localParticipant.off('trackUnpublished', updateLocalTrack);
    };
  }, [activeRoom]);

  // Fetch community members
  useEffect(() => {
    const fetchCommunityMembers = async () => {
      const { error, data } = await supabase
        .from('community_members')
        .select(`role, users(id, name, email, about, avatar_url)`)
        .eq('community_id', communityId);

      if (error) return;
      const formattedMembers = data.map((row) => ({
        ...row.users,
        role: row.role,
      }));
      setCommunityMembers(formattedMembers);
    };

    if (communityId) fetchCommunityMembers();
  }, [communityId, supabase]);

  const toggleMemberSelection = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  return (
    <div className="flex h-screen w-full bg-gray-50/20 overflow-hidden relative">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-full max-w-[350px] border-r bg-white">
        <div className="p-6 h-20 border-b flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-blue-800">Members</h1>
            <p className="text-xs text-muted-foreground">{communityMembers.length} members</p>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {communityMembers.map((member) => (
              <div
                key={member.id}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all border ${
                  selectedMembers.includes(member.id) ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-100'
                }`}
              >
                <div className="relative">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={member.avatar_url} />
                    <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0" onClick={() => toggleMemberSelection(member.id)}>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-slate-800 truncate">{member.name}</p>
                    {member.role === 'admin' && <Shield className="h-3 w-3 text-blue-500" />}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{member.about || 'Active now'}</p>
                </div>
                <Checkbox
                  checked={selectedMembers.includes(member.id)}
                  onCheckedChange={() => toggleMemberSelection(member.id)}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 h-full items-center justify-center p-6 lg:p-12 relative">
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
            <div className="grid grid-cols-2 gap-4 flex-1 min-h-[300px]">
              <VideoTile track={localVideoTrack} local={true} />
              {remoteTracks.map((track) => (
                <VideoTile key={track.sid} track={track} />
              ))}
            </div>
            <Button
              variant="destructive"
              onClick={endCall}
              className="mt-4 rounded-full w-16 h-16 self-center"
            >
              <PhoneOff />
            </Button>
          </div>
        )}

        <div className="pt-4">
          <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-slate-600 bg-slate-100 border-none">
            {selectedMembers.length} member(s) selected
          </Badge>
        </div>
      </div>

      {/* Incoming Call Modal - Fixed to viewport */}
      {incomingCallId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center space-y-6 max-w-sm w-full mx-4">
            <div className="animate-bounce bg-green-100 p-4 rounded-full inline-block">
              <Video className="text-green-600 h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold">Incoming Call</h3>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => acceptCall(incomingCallId)}
                className="bg-green-500 hover:bg-green-600 w-full h-12 text-lg"
              >
                Accept
              </Button>
              <Button onClick={() => setIncomingCallId(null)} variant="outline" className="w-full h-12">
                Decline
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;