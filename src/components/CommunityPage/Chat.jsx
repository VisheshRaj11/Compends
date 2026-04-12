import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/button';
import { CirclePlus, MoreVertical, MessageSquare, Plus,ChevronRight, ChevronLeft, Trash, UserMinus } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import AddUser from './AddUser';
import { useSupabase } from '../../supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Badge } from "../../components/ui/badge";
import { useUser } from '@clerk/clerk-react';
import Messages from './Messages';
import { uploadFile } from '../../utils/UploadFile';
import { AnimatePresence, motion } from "framer-motion";
import { toast } from 'react-toastify';

const Chat = () => {
  const { id: communityId } = useParams();
  // const location = useLocation();
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [communityMembers, setCommunityMembers] = useState([]);
  const [communityDetails, setCommunityDetails] = useState({});
  const [activeChat, setActiveChat] = useState(null); // Track selected user
  const supabase = useSupabase();
  const [messageText, setMessageText] = useState('');
  const fileRef = useRef(null);
  const [supabaseUserId, setSupabaseUserId] = useState(null);
  const {user} = useUser();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const navigate = useNavigate();
  // const [userMenuButton, setUserMenuButton] = useState(false);
  const [activeUserId, setActiveUserId] = useState(null);
  const [userMenu, setUserMenu] = useState(false);

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) setAddMemberOpen(false);
  };

 const sendMessage = async () => {
  const hasText = messageText && messageText.trim().length > 0;
  const hasFile = fileRef.current?.files?.length > 0;

  if (!hasText && !hasFile) return;
    if (!supabaseUserId) {
      console.log(supabaseUserId);
      alert("User not synced yet. Please wait a second and try again.");
    return;
  }

  try {
    const file = fileRef.current?.files?.[0];
    console.log(file);
    let fileData = null;

   if (file) {
      try {
        fileData = await uploadFile(file, supabase);
      } catch (error) {
        alert("File upload failed. Try again.", error.message);
        return;
      }
    }

    const messageType =
      file && hasText ? "mixed" : file ? "file" : "text";

    const { error } = await supabase.from("messages").insert({
      community_id: communityId,
      user_id: supabaseUserId,
      type: messageType,
      content: hasText ? messageText.trim() : null,
      file_url: fileData?.url || null,
      file_name: fileData?.name || null,
      file_size: fileData?.size || null,
      mime_type: fileData?.type || null
    });

    if (error) throw error;
    toast.success('Message send successfully');
    // Cleanup
    setMessageText("");
    if (fileRef.current) fileRef.current.value = "";
  } catch (err) {
    console.error("Send failed:", err.message || err);
  }
};

  const removeUser = async() => {
     try {
      const id = activeUserId;
      const {error} = await supabase.from('community_members')
      .delete().eq('user_id', id).eq('community_id',communityId)
      if(error) {
        throw new Error(error);
      }
      toast.success("Member remove successfully");
      setActiveUserId(null);
      setTimeout(() => {
            navigate(0);
      },2000)
     } catch (error) {
        console.log('Failed to remove the user: ', error);
     }
  }
// Fetch userId:
  useEffect(() => {
     const fetchSupabaseUser = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

      if (!error) setSupabaseUserId(data[0].id);
    };

    fetchSupabaseUser();
  },[user, supabase])

  useEffect(() => {
    const fetchCommunityDetail = async() => {
      const {error, data} = await supabase.from('communities').select('*').eq('id', communityId);
      if(error) {
        console.log("FetchCommunity details error", error.message);
        return;
      }
      setCommunityDetails(data[0]);
    }
    if(communityId) fetchCommunityDetail();
  },[communityId, supabase])

  useEffect(() => {
    const fetchCommunityMembers = async () => {
      const { error, data } = await supabase
        .from("community_members")
        .select(`role, users(id, name, email, about, avatar_url, clerk_id)`)
        .eq('community_id', communityId);

      if (error) {
        console.error("Community member fetch error: ", error.message);
        return;
      }
      
      const formattedMembers = data.map((row) => ({
        ...row.users,
        role: row.role,
        // user_id: row.user_id
      }));
      
      setCommunityMembers(formattedMembers);
      
      if (formattedMembers.length > 0) setActiveChat(formattedMembers[0]);
    };

    if (communityId) fetchCommunityMembers();
  }, [communityId, supabase]);


  // console.log(communityDetails.owner_id)
  //Remove User Channel: 
useEffect(() => {
  if (!communityId) return;

  const channel = supabase
    .channel(`community-members-${communityId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // 👈 listen to ALL events
        schema: 'public',
        table: 'community_members',
        filter: `community_id=eq.${communityId}`
      },
      async (payload) => {
        console.log("REALTIME EVENT:", payload);

        if (payload.eventType === "INSERT") {
          // fetch new user details (because payload only has IDs)
          const { data } = await supabase
            .from("users")
            .select("*")
            .eq("id", payload.new.user_id)
            .single();

          if (data) {
            setCommunityMembers(prev => [...prev, data[0]]);
          }
        }

        if (payload.eventType === "DELETE") {
          console.log("Deleted User")
          setCommunityMembers(prev => prev.filter((m) => m.user_id !== payload.old.user_id))
          
        }
      }
    )
    .subscribe((status) => {
      console.log("CHANNEL STATUS:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, [communityId]);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden rounded-2xl">
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

      <AnimatePresence mode="wait">
        {isPanelOpen && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className=" h-full bg-white border-r border-gray-200 flex flex-col z-[110] shadow-xl"
          >
            <div className="hidden md:flex md:w-80 lg:w-96 flex-col border-r bg-card">
              <div className="p-4 h-20 border-b flex items-center justify-between bg-card/50 backdrop-blur-md">
                <h1 className="text-xl font-bold tracking-tight">Members</h1>
                <div className='flex items-center'>
                  <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddMemberOpen(true)}
                  className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-all text-xs font-semibold"
                >
                  <CirclePlus size={18} />
                  Add User
                </Button>
                <Button
                className={`bg-white text-stone-800 hover:bg-gray-300`}
                onClick={() => setIsPanelOpen(false)}>
                  <ChevronLeft size={18}/>
                </Button>
                </div>
              </div>

              {/* Modal Overlay */}
              {addMemberOpen && (
                <div 
                  onClick={handleOverlay}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                >
                  <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                    <AddUser communityId={communityId} setAddMemberOpen={setAddMemberOpen}/>
                  </div>
                </div>
              )}

              {/* Members List */}
              <ScrollArea 
              // onClick={() => setUserMenu(false)}
              className="flex-1">
                <div 
                className="p-3 space-y-1">
                  {communityMembers.length > 0 ? (
                    communityMembers.map((member) => (
                      <div 
                        key={member.id}
                        onMouseEnter={() => {setUserMenu(true); setActiveUserId(member.id)}}
                        onMouseLeave={() => {setUserMenu(false);}}
                        onClick={() => setActiveChat(member)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                          activeChat?.id === member.id ? "bg-primary/10 shadow-sm" : "hover:bg-accent"
                        }`}
                      >
                        <div className="relative">
                          <Avatar 
                          onClick={() => navigate(`/community/userProfile/${member?.clerk_id}`)}
                          className="h-12 w-12 border-2 border-background shadow-sm">
                            <AvatarImage src={member.avatar_url} alt={member.name} />
                            <AvatarFallback className="bg-primary/5 text-primary font-bold">
                              {member.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                          {/* <Button></Button> */}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm truncate">{member.name}</p>
                            {communityDetails?.owner_id === member?.clerk_id && (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1 leading-none uppercase tracking-wider">
                                Admin
                                {console.log(communityDetails.owner_id)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate leading-relaxed">
                            {member.about || "Hey there! I am using the community."}
                          </p>
                        </div>
                        { communityDetails?.owner_id === user?.id &&
                          userMenu &&
                          activeUserId === member.id && 
                            <div>
                              <Button
                              onClick={removeUser}
                              className={'cursor-pointer z-10'}
                              ><UserMinus size={18}/></Button>
                            </div>
                        }
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                      <MessageSquare className="h-10 w-10 opacity-20 mb-2" />
                      <p className="text-sm">No members found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RIGHT PART: Main Chat Area */}
      <div className="flex flex-col flex-1 h-full bg-gradient-to-br from-white to-slate-100 bg-[radial-gradient(#2ec972_1px,transparent_1px)] [background-size:26px_26px]">
        {/* Chat Header */}
        <header className="h-20 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur-md">
          {communityDetails?.name ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border">
                <AvatarFallback>{communityDetails.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-sm leading-none">{communityDetails.name}</p>
                <p className="text-[11px] text-green-600 font-medium"><span className='text-black'>About</span>: {communityDetails.about}</p>
              </div>
            </div>
          ) : (
            <div></div>
          )}
        </header>

        {/* Message Feed */}
        <main className="flex-1 p-6 space-y-6 bg-accent/30">
          <Messages communityId={communityId} currentUserId={user.id}/>
        </main>

        {/* Input Area */}
        <footer className="p-4">
          <div className="max-w-4xl mx-auto flex items-center gap-2 bg-accent/50 p-2 rounded-2xl border focus-within:ring-2 ring-primary/20 transition-all">
            
            {/* The Hidden File Input */}
            <label className="cursor-pointer p-2 hover:bg-accent rounded-xl transition-colors group">
              <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
              <input 
                type="file" 
                className="hidden" 
                ref={fileRef}
              />
            </label>

            <input 
              type="text" 
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message..." 
              className="flex-1 bg-transparent border-none focus:outline-none px-2 text-sm"
            />

            <Button 
              onClick={sendMessage}
              className="rounded-xl px-6 shadow-lg shadow-primary/20"
            >
              Send
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Chat;