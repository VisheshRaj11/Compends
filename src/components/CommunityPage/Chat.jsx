import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { CirclePlus, MoreVertical, MessageSquare } from 'lucide-react';
import { useParams } from 'react-router-dom';
import AddUser from './AddUser';
import { useSupabase } from '../../supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Badge } from "../../components/ui/badge";

const Chat = () => {
  const { id: communityId } = useParams();
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [communityMembers, setCommunityMembers] = useState([]);
  const [communtiyDetails, setCommunityDetails] = useState({});
  const [activeChat, setActiveChat] = useState(null); // Track selected user
  const supabase = useSupabase();

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) setAddMemberOpen(false);
  };

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
        .select(`role, users(id, name, email, about, avatar_url)`)
        .eq('community_id', communityId);

      if (error) {
        console.error("Community member fetch error: ", error.message);
        return;
      }
      
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
    <div className="flex h-screen w-full bg-background overflow-hidden">
      
      {/* LEFT PART: Sidebar */}
      <div className="hidden md:flex md:w-80 lg:w-96 flex-col border-r bg-card">
        <div className="p-4 h-20 border-b flex items-center justify-between bg-card/50 backdrop-blur-md">
          <h1 className="text-xl font-bold tracking-tight">Messages</h1>
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => setAddMemberOpen(true)}
            className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-all text-xs font-semibold"
          >
            <CirclePlus size={18} />
            Add User
          </Button>
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
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            {communityMembers.length > 0 ? (
              communityMembers.map((member) => (
                <div 
                  key={member.id}
                  onClick={() => setActiveChat(member)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                    activeChat?.id === member.id ? "bg-primary/10 shadow-sm" : "hover:bg-accent"
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                      <AvatarImage src={member.avatar_url} alt={member.name} />
                      <AvatarFallback className="bg-primary/5 text-primary font-bold">
                        {member.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm truncate">{member.name}</p>
                      {member.role === 'admin' && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1 leading-none uppercase tracking-wider">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate leading-relaxed">
                      {member.about || "Hey there! I am using the community."}
                    </p>
                  </div>
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

      {/* RIGHT PART: Main Chat Area */}
      <div className="flex flex-col flex-1 h-full bg-background">
        {/* Chat Header */}
        <header className="h-20 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur-md">
          {activeChat ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border">
                <AvatarFallback>{communtiyDetails.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-sm leading-none">{communtiyDetails.name}</p>
                <p className="text-[11px] text-green-600 font-medium"><span className='text-black'>About</span>: {communtiyDetails.about}</p>
              </div>
            </div>
          ) : (
            <div></div>
          )}
          <Button variant="ghost" size="icon" className="rounded-full">
             <MoreVertical size={20} className="text-muted-foreground" />
          </Button>
        </header>

        {/* Message Feed */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-accent/30">
           <div className="flex justify-start">
             <div className="max-w-[70%] bg-card p-4 rounded-2xl rounded-tl-none shadow-sm border text-sm leading-relaxed">
               How is the project going?
             </div>
           </div>
           <div className="flex justify-end">
             <div className="max-w-[70%] bg-primary text-primary-foreground p-4 rounded-2xl rounded-tr-none shadow-md text-sm leading-relaxed">
               Almost finished! Just fixing the CSS responsiveness now.
             </div>
           </div>
        </main>

        {/* Input Area */}
        <footer className="p-4 bg-background">
          <div className="max-w-4xl mx-auto flex items-center gap-3 bg-accent/50 p-2 rounded-2xl border focus-within:ring-2 ring-primary/20 transition-all">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="flex-1 bg-transparent border-none focus:outline-none px-4 text-sm"
            />
            <Button className="rounded-xl px-6 shadow-lg shadow-primary/20">
              Send
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Chat;