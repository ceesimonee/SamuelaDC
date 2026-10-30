import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { MessageSquare, Send, UserCircle2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Message = {
  id: string;
  user_id: string;
  sender_role: 'patient' | 'admin';
  message: string;
  is_read: boolean;
  created_at: string;
};

type ChatSession = {
  user_id: string;
  latestMessage: Message;
  unreadCount: number;
};

export default function AdminMessages() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  useEffect(() => {
    fetchSessions();

    // 👉 FIXED: Appended Date.now() to prevent the exact 'postgres_changes' error in your console
    const channel = supabase
      .channel(`admin_inbox_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new as Message;
          
          fetchSessions();

          if (newMsg.user_id === selectedUserIdRef.current) {
            setActiveMessages(prev => [...prev, newMsg]);
            if (newMsg.sender_role === 'patient') {
              markMessagesAsRead(newMsg.user_id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      const groupMap = new Map<string, ChatSession>();
      
      data.forEach((msg: Message) => {
        if (!groupMap.has(msg.user_id)) {
          groupMap.set(msg.user_id, {
            user_id: msg.user_id,
            latestMessage: msg,
            unreadCount: 0
          });
        }
        if (msg.sender_role === 'patient' && !msg.is_read) {
          groupMap.get(msg.user_id)!.unreadCount += 1;
        }
      });

      setSessions(Array.from(groupMap.values()));
    }
  };

  const handleSelectSession = async (userId: string) => {
    setSelectedUserId(userId);
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (data && !error) {
      setActiveMessages(data);
    }

    markMessagesAsRead(userId);
  };

  const markMessagesAsRead = async (userId: string) => {
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('sender_role', 'patient')
      .eq('is_read', false);
      
    setSessions(prev => prev.map(s => s.user_id === userId ? { ...s, unreadCount: 0 } : s));
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedUserId) return;
    setIsSending(true);

    const { error } = await supabase
      .from('chat_messages')
      .insert([{
        user_id: selectedUserId,
        sender_role: 'admin',
        message: replyText.trim()
      }]);

    if (!error) {
      setReplyText('');
    } else {
      alert("Failed to send reply: " + error.message);
    }
    setIsSending(false);
  };

  return (
    <div className="fade-in h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#0c4a6e]">Patient Inbox</h1>
          <p className="text-gray-500 mt-1">Manage and respond to live patient inquiries.</p>
        </div>
        <button 
          onClick={() => navigate('/admin')} 
          className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>

      <div className="flex-1 bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
        <div className="w-full md:w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/50">
          <div className="p-4 border-b border-gray-100 bg-white shrink-0">
            <h3 className="font-bold text-[#0c4a6e] flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Active Conversations
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {sessions.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                No active conversations.
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.user_id}
                  onClick={() => handleSelectSession(session.user_id)}
                  className={`w-full text-left p-4 transition flex items-start gap-3 hover:bg-sky-50 ${
                    selectedUserId === session.user_id ? 'bg-sky-50 border-l-4 border-[#0c4a6e]' : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="bg-gray-200 p-2 rounded-full shrink-0">
                    <UserCircle2 className="w-6 h-6 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <p className="font-bold text-gray-900 text-sm truncate">
                        Patient-{session.user_id.substring(0, 4).toUpperCase()}
                      </p>
                      <span className="text-[10px] text-gray-400">
                        {new Date(session.latestMessage.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${session.unreadCount > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                      {session.latestMessage.sender_role === 'admin' ? 'You: ' : ''}{session.latestMessage.message}
                    </p>
                  </div>
                  {session.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                      {session.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white">
          {!selectedUserId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a conversation from the left to start replying.</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-100 bg-white flex items-center gap-3 shrink-0 shadow-sm z-10">
                <div className="bg-[#0c4a6e] p-2 rounded-full">
                  <UserCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    Patient-{selectedUserId.substring(0, 4).toUpperCase()}
                  </h3>
                  <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </p>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50 space-y-6">
                {activeMessages.map((msg, idx) => {
                  const isAdmin = msg.sender_role === 'admin';
                  return (
                    <div key={msg.id || idx} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                      <div 
                        className={`max-w-[70%] px-5 py-3 text-sm shadow-sm ${
                          isAdmin 
                            ? 'bg-[#0c4a6e] text-white rounded-2xl rounded-tr-sm' 
                            : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm'
                        }`}
                      >
                        {msg.message}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1.5 px-1 font-medium">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                <form onSubmit={handleSendReply} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply to the patient..."
                    className="flex-1 bg-gray-50 border border-gray-200 px-5 py-3 rounded-full text-sm outline-none focus:ring-2 focus:ring-[#0c4a6e] transition"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSending}
                    className="bg-[#0c4a6e] text-white p-3 rounded-full hover:bg-[#075985] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}