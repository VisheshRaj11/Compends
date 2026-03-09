import React, { useEffect, useRef } from 'react';

const VideoTile = ({ track, local }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !track) return;

    // Attach the track to the video element
    track.attach(element);

    // Clean up on unmount or track change
    return () => {
      track.detach(element);
    };
  }, [track]);

  return (
    <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video border-2 border-white shadow-lg">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted={local} // Mute local to avoid echo
      />
      <div className="absolute bottom-3 left-3 bg-black/50 px-2 py-1 rounded text-white text-xs">
        {local ? 'You' : 'Remote Participant'}
      </div>
    </div>
  );
};

export default VideoTile;