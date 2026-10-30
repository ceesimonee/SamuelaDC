import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { MessageSquare, X, Send } from 'lucide-react';

type Message = {
  id: string;
  sender_role: 'patient' | 'admin';
  message: string;
  created_at: string;
};

export default function PatientChat({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (data && !error) {
        setMessages(data);
        const unread = data.filter(m => m.sender_role === 'admin' && !m.is_read).length;
        setUnreadCount(unread);
      }
    };

    fetchMessages();

    // Listen for new incoming messages in real-time
    const channel = supabase
      .channel('patient_chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const incomingMessage = payload.new as Message;
          setMessages(prev => [...prev, incomingMessage]);
          
          // If chat is closed and admin replies, bump the notification badge
          if (!isOpen && incomingMessage.sender_role === 'admin') {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isOpen]);

  const handleOpenChat = async () => {
    setIsOpen(true);
    setUnreadCount(0);
    
    // Mark messages as read in the database when the patient opens the window
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('sender_role', 'admin')
      .eq('is_read', false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageText = newMessage.trim();
    setNewMessage(''); 

    const { error } = await supabase
      .from('chat_messages')
      .insert([{
        user_id: user.id,
        sender_role: 'patient',
        message: messageText
      }]);

    if (error) {
      alert('Failed to send message: ' + error.message);
    }
  };

  // Only render the chat widget if the user is actually logged in
  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[150] flex flex-col items-end">
      
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-80 sm:w-96 h-[500px] mb-4 flex flex-col overflow-hidden animate-fade-in-up">
          <div className="bg-[#0c4a6e] p-4 text-white flex justify-between items-center shrink-0">
            <div>
              <h3 className="font-bold font-serif text-lg">Clinic Support</h3>
              <p className="text-[11px] text-sky-200">We typically reply within 24 hours.</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                <MessageSquare className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm font-medium text-gray-500">Have a question?</p>
                <p className="text-xs mt-1">Send us a message and we'll get back to you.</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isPatient = msg.sender_role === 'patient';
                return (
                  <div key={msg.id || idx} className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'}`}>
                    <div 
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                        isPatient 
                          ? 'bg-[#0c4a6e] text-white rounded-tr-none' 
                          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                      }`}
                    >
                      {msg.message}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-100 shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-full text-sm outline-none focus:ring-2 focus:ring-[#0c4a6e] transition"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-[#0c4a6e] text-white p-2.5 rounded-full hover:bg-[#075985] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={handleOpenChat}
          className="bg-[#0c4a6e] hover:bg-[#075985] text-white p-4 rounded-full shadow-2xl transition hover:-translate-y-1 relative"
        >
          <MessageSquare className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}