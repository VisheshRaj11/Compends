import React, { useEffect, useMemo, useState } from 'react';
import { useSupabase } from '../../supabase/client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Plus, Search, UserPlus, Loader2, MoveLeft } from 'lucide-react';
import { toast } from 'react-toastify';

const AddUser = ({communityId, setAddMemberOpen}) => {
  const [searchUser, setSearchUser] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberIds, setMemberIds] = useState([]);
  const supabase = useSupabase();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { error, data } = await supabase.from('users').select('*');
      if (error) {
        console.error("User Fetch Error: ", error);
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    };
    fetchUsers();
  }, [supabase]);

  useEffect(() => {
    const fetchCommunityMembers = async() => {
      const {error, data} = await supabase.from("community_members").select("user_id").eq('community_id', communityId);
      if(error) {
        console.log("Fetch members error ", error);
      }else{
        setMemberIds(data.map(m => m.user_id))
      }
    }
    if(communityId) fetchCommunityMembers();
  },[communityId, supabase]);

  useEffect(() => {
    const channel = supabase.channel('add-user-channel')
    .on('postgres_changes', {
      event:'*',
      schema:'public',
      table:'community_members',
      filter:`community_id=eq.${communityId}`
    },
  (payload) => {
    if(payload.eventType === "INSERT") {
      setMemberIds(prev => [...prev, payload.new.user_id])
    }
  }).subscribe((status) => {
      console.log("Channel status:", status);
  });

  return () => supabase.removeChannel(channel);
  },[communityId])
  
  const filteredUsers = useMemo(() => {
  const query = searchUser.toLowerCase();

  return users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query);

    const notMember = !memberIds.includes(user.id);

    return matchesSearch && notMember;
  });
}, [searchUser, users, memberIds]);


  const userAddedToCommuntiy = async(id) => {
    if(!id) return ;
    setLoading(true);
    const {error} = await supabase.from('community_members').
                    insert({user_id: id, community_id:communityId, role:'member'});
    if(error) {
      console.log("UserAddedToCommuntiy error: ", error.message);
      setLoading(false);
      return;
    }

    toast.success("User added to community");
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 ">
      {/* Header Section */}
     <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 -ml-2"> 
            {/* -ml-2 offsets the button padding so the icon aligns with the text below it */}
            <Button
              onClick={() => setAddMemberOpen(false)}
              variant="ghost" 
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-accent"
            >
              <MoveLeft size={20} className="text-foreground" />
            </Button>
            <h2 className="text-2xl font-bold tracking-tight">Add Users</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Find and invite new team members.
          </p>
        </div>
        <UserPlus className="text-primary h-6 w-6" />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-10 bg-muted/50 focus-visible:ring-primary"
          placeholder="Search by name or email..."
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
        />
      </div>

      {/* User List Area */}
      <ScrollArea className="h-[400px] rounded-md border p-4 bg-card/50 backdrop-blur-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading users...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="overflow-hidden border-none bg-background/60 hover:bg-accent transition-colors">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold leading-none">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                  <Button
                  onClick={() => userAddedToCommuntiy(user.id)}
                  size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full hover:bg-primary hover:text-primary-foreground cursor-pointer">
                    {loading ? <Loader2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground italic text-sm">
            No users found matching "{searchUser}"
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default AddUser;