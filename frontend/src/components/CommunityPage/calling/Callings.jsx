import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Video, Users, Shield, PhoneOff, MicOff, ScreenShare, VideoOff, ScreenShareOff, Mic } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useSupabase } from '@/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@clerk/clerk-react';
import { Checkbox } from '@/components/ui/checkbox';
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { joinLiveKit } from '@/utils/JoinLivekit';
import { Track } from "livekit-client";
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
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isMute, setIsMute] = useState(false);
  const [isScreenShare, setIsScreenShare] = useState(false);

  const [isPanelOpen, setIsPanelOpen] = useState(false);

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

  const addTrack = (track, publication) => {
    track.source = publication.source;
    if (track.kind === "video") {
      if(publication.source === Track.Source.ScreenShare) {
        setRemoteTracks(prev => {
          const filtered = prev.filter(t => t.source !== Track.Source.ScreenShare);
          return [...filtered, track]
        })
      }else{
        setRemoteTracks(prev => {
          const filtered = prev.filter(t => t.source !== Track.Source.Camera);
          return [...filtered, track]
        })
      }
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
        addTrack(publication.track, publication);
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
    addTrack(track, publication);
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
      if (selectedMembers.length <= 1) return;

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

 const toggleVideo = async() => {
    if (!activeRoom) return;

    const participant = activeRoom.localParticipant;

    await participant.setCameraEnabled(!isVideoOff);

    setIsVideoOff(prev => !prev);
 }

 const screenTrack = remoteTracks.find(t => t.source === Track.Source.ScreenShare);
 const cameraTrack = remoteTracks.find(t => t.source === Track.Source.Camera);
 const displayTrack = screenTrack || cameraTrack;

 const toggleScreenShare = async() => {
    if (!activeRoom) return;

    const participant = activeRoom.localParticipant;

    await participant.setScreenShareEnabled(!isScreenShare);

    setIsScreenShare(prev => !prev);
 }

 const toggleMic = async() => {
    if (!activeRoom) return;

    const participant = activeRoom.localParticipant;

    await participant.setMicrophoneEnabled(!isMute);

    setIsMute(prev => !prev);
 }

  // Manage local track
  useEffect(() => {
    if (!activeRoom) return;
    const localParticipant = activeRoom.localParticipant;
    const updateLocalTrack = () => {
      const tracks = Array.from(localParticipant.videoTrackPublications.values());
      const screen = tracks.find(
        t => t.source === Track.Source.ScreenShare
      )?.track;
        const camera = tracks.find(
        t => t.source === Track.Source.Camera
      )?.track;
      setLocalVideoTrack(screen || camera || null);
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
    <div className="flex h-screen w-full bg-gradient-to-br from-white to-slate-100 bg-[radial-gradient(#1e337d_1px,transparent_1px)] [background-size:26px_26px] overflow-hidden relative">
      {/* Sidebar */}
     {/* Sidebar toggle button (when closed) */}
<AnimatePresence>
  {!isPanelOpen && (
    <motion.button
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -50, opacity: 0 }}
      onClick={() => setIsPanelOpen(true)}
      className="fixed left-0 top-1/2 -translate-y-1/2 z-[100] bg-white border-2 border-l-0 border-black p-3 rounded-r-xl shadow hover:bg-gray-50 transition-all group"
    >
      <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform"/>
    </motion.button>
  )}
</AnimatePresence>


{/* Members Sidebar */}
<AnimatePresence mode="wait">
  {isPanelOpen && (
    <motion.div
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      exit={{ x: -320 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="w-80 h-full bg-[#f2f0e1] border-r border-gray-200 flex flex-col z-[110] shadow-xl"
    >

      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">

        <div>
          <h1 className="text-xl font-bold text-blue-800">Members</h1>
          <p className="text-xs text-muted-foreground">
            {communityMembers.length} members
          </p>
        </div>

        <button
          onClick={() => setIsPanelOpen(false)}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <ChevronLeft size={20} className="text-gray-500"/>
        </button>

      </div>


      {/* Members list */}
      <ScrollArea className="flex-1">

        <div className="p-4 space-y-2">

          {communityMembers.map((member) => (

            <div
              key={member.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition
              ${
                selectedMembers.includes(member.id)
                ? "bg-blue-50 border-blue-200"
                : "hover:bg-slate-100 border-transparent"
              }`}
            >

              <Avatar className="h-10 w-10">
                <AvatarImage src={member.avatar_url}/>
                <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
              </Avatar>

              <div
                className="flex-1 cursor-pointer"
                onClick={() => toggleMemberSelection(member.id)}
              >
                <p className="text-sm font-semibold">{member.name}</p>
                <p className="text-xs text-slate-500">{member.about}</p>
              </div>

              <Checkbox
                checked={selectedMembers.includes(member.id)}
                onCheckedChange={() => toggleMemberSelection(member.id)}
              />

            </div>

          ))}

        </div>

      </ScrollArea>

    </motion.div>
  )}
</AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-col flex-1 h-full items-center justify-center p-6 lg:p-12 relative">
        {!activeRoom ? (
         <div className='flex flex-col justify-center'>
            <div className="flex items-center justify-center h-full">
            <div className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200 p-8 sm:p-10 text-center space-y-6 transition-all duration-300">
              {/* Icon */}
              <div className="flex items-center justify-center">
                <div className="p-4 rounded-full bg-blue-950 shadow-lg">
                  <Users className="text-white w-8 h-8 sm:w-9 sm:h-9" />
                </div>
              </div>

              {/* Title */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                  Start a Group Call
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  Instantly connect with members of your community through a secure video call.
                </p>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-3 border">
                  <Video className="mx-auto text-blue-600 mb-1 w-5 h-5"/>
                  <p className="text-slate-600 text-xs">HD Video</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border">
                  <Mic className="mx-auto text-green-600 mb-1 w-5 h-5"/>
                  <p className="text-slate-600 text-xs">Clear Audio</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border">
                  <ScreenShare className="mx-auto text-indigo-600 mb-1 w-5 h-5"/>
                  <p className="text-slate-600 text-xs">Screen Share</p>
                </div>
              </div>

              {/* Selected members indicator */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-sm text-blue-700 font-medium">
                  {selectedMembers.length} member(s) selected
                </p>
                <p className="text-xs text-blue-500">
                  Select at least 2 members to start a call
                </p>
              </div>

              {/* Start Call Button */}
              <Button
                onClick={startVideoCall}
                disabled={selectedMembers.length === 0}
                className="w-full h-12 sm:h-13 rounded-xl bg-blue-950 text-white font-medium text-base shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Video className="mr-2 h-5 w-5" />
                Start Video Call
              </Button>
            </div>
          </div>
          <div className="pt-4 mx-auto">
            <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-slate-600 bg-slate-100 border-none">
              {selectedMembers.length} member(s) selected
            </Badge>
          </div>
         </div>
        ) : (
          <div className="w-full h-full flex flex-col">
            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 md:flex-1 min-h-[320px]">
              {/* <VideoTile track={localVideoTrack} local={true} /> */}
              {localVideoTrack && ( <VideoTile track={localVideoTrack} local={true} />)}
              {displayTrack && (<VideoTile key={displayTrack.sid} track={displayTrack} />)}
            </div>
            <div className='w-full flex justify-center lg:gap-12 md:gap-8 gap-5 absolute bottom-12'>
              <Button
              variant="destructive"
              onClick={endCall}
              className="mt-4 rounded-full w-16 h-16 self-center cursor-pointer"
            >
              <PhoneOff />
            </Button>
            <Button 
            onClick={toggleVideo}
            className={`mt-4 rounded-full w-16 h-16 self-center cursor-pointer bg-slate-500`}>
             {isVideoOff ? <Video/> : <VideoOff/>}
            </Button>
            <Button 
            onClick={toggleMic}
            className={`mt-4 rounded-full w-16 h-16 self-center cursor-pointer`}>
              {isMute ? <Mic/> : <MicOff/>}
            </Button>
            <Button 
            onClick={toggleScreenShare}
            className={`mt-4 rounded-full w-16 h-16 self-center cursor-pointer bg-blue-900`}>
              {isScreenShare ? <ScreenShareOff/> : <ScreenShare/>}
            </Button>
            </div>
          </div>
        )}
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