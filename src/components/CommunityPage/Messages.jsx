import { DownloadIcon, Edit, Trash, FileText, Check, X, User, Pause, AlertCircle } from "lucide-react";
import { useSupabase } from "../../supabase/client";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Messages = ({ communityId, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const supabase = useSupabase();
  const scrollRef = useRef(null);

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const navigate = useNavigate();

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const forceDownload = async (url, filename) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const startEdit = (msg) => {
    setEditingId(msg.id);
    setEditText(msg.content || "");
  };

  const saveEdit = async () => {
  if (!editText.trim()) return;

  const id = editingId;
  const newContent = editText.trim();

  // close editor immediately
  setEditingId(null);
  setEditText("");
  
  try {
    const { error, data } = await supabase
      .from("messages")
      .update({ content:newContent, type: "text" })
      .eq("id", id)
      .select("*")
      .single();
      
      if (error || !data) throw error || new Error("No data returned");
      
      
      setMessages((prev) =>
        prev.map((m) => {
          if (!m || m.id !== id) return m;
          
          return {
            ...m,
            content: data.content,
            type: data.type,
            updated_at: data.updated_at,
          };
        })
      );
      toast.success('Message updated successfully');
  } catch (error) {
    console.error("Update error:", error);
  }
};

const confirmDelete = (onConfirm) => {
  toast(
    ({ closeToast }) => (
      <div className="confirm-toast">
        <p className="confirm-text flex items-center gap-2"><AlertCircle size={18}/><span className="font-semibold">Are you sure you want to delete?</span></p>

        <div className="confirm-actions mt-2">
          <button
            className="bg-green-700 rounded p-1 mr-2 text-white cursor-pointer"
            onClick={() => {
              onConfirm();
              closeToast();
            }}
          >
            Yes, Delete
          </button>

          <button className="bg-blue-700 rounded p-1 text-white cursor-pointer" onClick={closeToast}>
            Cancel
          </button>
        </div>
      </div>
    ),
    {
      position: "top-right",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      className: "toast-container-custom",
    }
  );
};

  const deleteMessage = async (msg) => {
    confirmDelete(async() => {
      try {
        const { error } = await supabase.from("messages").delete().eq("id", msg.id);
        if (error) throw error;
      } catch (err) {
        alert("Delete failed");
      }
    })
    // if (!confirm("Delete this message?")) return;
  };

  useEffect(() => {
    const fetchMessages = async () => {
      const { error, data } = await supabase
        .from("messages")
        .select(`id, content, type, file_url, file_name, mime_type, created_at, user:users(id, name, clerk_id), user_id`)
        .eq("community_id", communityId)
        .order("created_at", { ascending: true });
      if (!error) setMessages(data || []);
    };

  const channel = supabase
  .channel(`community-${communityId}`)
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "messages",
      filter:`community_id=eq.${communityId}`
    },
    async(payload) => {
      if(payload.eventType === 'INSERT') {
        const {data} = await supabase.from('messages')
        .select('id, content, type, file_url, file_name, mime_type, created_at, user:users(id, name, clerk_id), user_id')
        .eq('id',payload.new.id).single();

        console.log(data);

        if(data) {
          setMessages((prev) => [...prev, data[0]])
        }
      }
      if(payload.eventType === 'UPDATE') {
        const {data} = await supabase.from('messages')
        .select(`id, content, type, file_url, file_name, mime_type, created_at,
          user:users(id, name, clerk_id),
          user_id`)
          .eq('id', payload.new.id).single();
          
          if(data)  {
            setMessages((prev) => (
              prev.map((item) => item.id === data[0].id ? data[0]: item)
            ));
          }
          toast.success('Message updated successfully');
      }
      if(payload.eventType === 'DELETE') {
        setMessages((prev) => (
          prev.filter((item) => item.id !== payload.old.id)
        ))
      }
      console.log("Realtime event:", payload);
    }
  )
  .subscribe((status) => console.log("status:", status));
    fetchMessages();
    return () => supabase.removeChannel(channel);
  }, [communityId]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-6 sm:px-6 space-y-6 scroll-smooth"
      >
        {messages.map((msg) => {
          if (!msg) return null;
          const isMe = msg.user?.clerk_id === currentUserId;
          const isEditing = editingId === msg.id;
          const hasFile = msg.type === "file" || msg.type === "mixed";

          return (
            <div
              key={msg.id}
              className={`flex w-full group ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex flex-col items-start ${isMe ? "items-end" : "items-start"} max-w-[90%] sm:max-w-[75%]`}>
                
                {/* User Info Label */}
                {!isMe && (
                  <span className="ml-1 mb-1 text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                    {msg.user?.name}
                  </span>
                )}

                <div className={`flex items-end gap-2 ${isMe ? "flex-row" : "flex-row-reverse"}`}>
                  
                  {/* EXTERNAL ACTION BUTTONS */}
                  <div className={`flex flex-col gap-1 transition-opacity duration-200 ${isEditing ? "opacity-0" : "opacity-0 group-hover:opacity-100"}`}>
                    {hasFile && (
                      <button 
                        onClick={() => forceDownload(msg.file_url, msg.file_name)}
                        className="p-1.5 bg-white border border-slate-200 shadow-sm rounded-full text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Download file"
                      >
                        <DownloadIcon size={14} />
                      </button>
                    )}
                    {isMe && (
                      <>
                        {msg.type !== 'file' && <button onClick={() => startEdit(msg)} className="p-1.5 bg-white border border-slate-200 shadow-sm rounded-full text-slate-500 hover:bg-slate-50 transition-colors">
                          <Edit size={14} />
                        </button>}
                        <button onClick={() => deleteMessage(msg)} className="p-1.5 bg-white border border-slate-200 shadow-sm rounded-full text-red-500 hover:bg-red-50 transition-colors">
                          <Trash size={14} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* MESSAGE BUBBLE */}
                 <div
                      className={`
                        flex flex-col gap-1 w-fit px-4 py-2.5 rounded-2xl shadow-sm text-[15px] leading-relaxed
                        ${isMe 
                          ? "bg-blue-950 text-white rounded-tr-none" 
                          : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"}
                      `}
                    >
                    {isEditing ? (
                      <div className="flex flex-col gap-2 min-w-[200px] sm:min-w-[300px]">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex justify-end gap-1.5">
                          <button className="text-xs font-semibold px-2 py-1 text-indigo-100 hover:text-white" onClick={() => setEditingId(null)}>Cancel</button>
                          <button className="text-xs font-bold bg-white text-indigo-600 px-3 py-1 rounded-md shadow-sm" onClick={saveEdit}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Text Content */}
                        {(msg.type === "text" || msg.type === "mixed") && (
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        )}

                        {/* File Visuals */}
                       {/* File Visuals */}
                    {hasFile && msg.file_url && (
                      <div className={`mt-2 rounded-xl overflow-hidden border ${
                        isMe ? "bg-black border-indigo-400/30" : "bg-slate-50 border-slate-200"
                      }`}>
                        {msg.mime_type?.startsWith("image") ? (
                          <div className="relative group/img">
                            <img 
                              src={msg.file_url} // Fixed: was msg.file_name
                              alt={msg.file_name} 
                              className="max-h-80 w-full object-cover cursor-pointer hover:brightness-90 transition-all" 
                              onClick={() => window.open(msg.file_url, "_blank")} 
                            />
                          </div>
                        ) : (
                          /* Big Bubble Style for Documents */
                          <div className="flex flex-col min-w-[220px]">
                            <div className={`flex items-center gap-4 p-4 ${isMe ? "bg-indigo-500/20" : "bg-white"}`}>
                              <div className={`p-3 rounded-xl ${isMe ? "bg-indigo-500" : "bg-indigo-50"}`}>
                                <FileText size={28} className={isMe ? "text-white" : "text-indigo-600"} />
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-bold truncate max-w-[180px]">
                                  {msg.file_name}
                                </span>
                                <span className={`text-[10px] uppercase font-bold tracking-widest ${isMe ? "text-indigo-200" : "text-slate-400"}`}>
                                  {msg.mime_type?.split('/')[1] || 'Document'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Action Bar for the file */}
                            <button 
                              onClick={() => forceDownload(msg.file_url, msg.file_name)}
                              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold border-t transition-colors ${
                                isMe 
                                ? "border-indigo-400/30 hover:bg-indigo-500/30 text-white" 
                                : "border-slate-200 hover:bg-slate-100 text-indigo-600"
                              }`}
                            >
                              <DownloadIcon size={14} />
                              DOWNLOAD
                            </button>
                            
                          </div>
                          
                        )}
                      </div>
                    )}
                      </div>
                      
                    )}
                  </div>
                </div>
                    <span
                  className={`text-[10px] font-semibold tracking-tight self-end ${
                    isMe ? "text-indigo-500" : "text-slate-400"
                  }`}
                >
                  {msg.created_at && new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Messages;