import React, { useEffect, useRef } from 'react';
// Import Track if you are using LiveKit
// import { Track } from 'livekit-client'; 

const VideoTile = ({ track, local, room }) => {
  const videoRef = useRef();

  useEffect(() => {
    const element = videoRef.current;
    if (!track || !element) return;

    if (local && room) {
      // FIX: Use track.source directly or the Track.Source.Camera constant
      // Do NOT use track.source.Camera
      const localTrack = room.localParticipant.getTrack(track.source); 
      
      if (localTrack?.videoTrack) {
        localTrack.videoTrack.attach(element);
      } else if (localTrack?.track) {
        localTrack.track.attach(element);
      }
    } else {
      // Remote tracks attach directly
      track.attach(element);
    }

    return () => {
      track.detach(element);
    };
  }, [track, local, room]);

  return (
    <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video border-2 border-white shadow-lg">
      {/* Added muted={local} to prevent audio feedback loops */}
      <video 
        ref={videoRef} 
        className="w-full h-full object-cover" 
        autoPlay 
        playsInline 
        muted={local} 
      />
      <div className="absolute bottom-3 left-3 bg-black/50 px-2 py-1 rounded text-white text-xs">
        {local ? "You" : "Remote Participant"}
      </div>
    </div>
  );
};

export default VideoTile;