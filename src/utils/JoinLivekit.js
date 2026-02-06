import { Room, RoomEvent } from "livekit-client";
export const joinLiveKit = async(token) => {
    const url = import.meta.env.VITE_LIVEKIT_URL;
    if(!url) throw new Error("VITE_LIVEKIT_URL is missing");

    const room = new Room({
        adaptiveStream: true,
        dynacast: true
    });

    await room.connect(url, token);
    await room.localParticipant.enableCameraAndMicrophone();

    return room;
}