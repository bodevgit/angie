
import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../lib/user-context';
import { supabase } from '../lib/supabase';
import { MessageCircle, Send, Bell, BellOff, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { sendPushNotification } from '../lib/onesignal';

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string;
};

export function Messages() {
  const { theme, user, allUsers } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Presence State
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceChannelRef = useRef<any>(null);

  useEffect(() => {
    fetchMessages();
    checkNotificationPermission();

    // 1. Subscribe to new messages (Realtime)
    const channelName = `public:messages:${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Realtime message received:', payload);
          const newMsg = payload.new as Message;
          handleNewMessage(newMsg);
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status: ${status}`);
      });

    // 2. Presence Channel for Typing Indicators
    const presenceChannel = supabase.channel('presence-chat');
    presenceChannelRef.current = presenceChannel;

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const typing = new Set<string>();
        
        Object.keys(state).forEach(key => {
           const presence = state[key] as any[];
           presence.forEach(p => {
             if (p.user !== user && p.isTyping) {
               typing.add(p.user);
             }
           });
        });
        
        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user, isTyping: false });
        }
      });

    // 3. Polling Fallback (every 5 seconds)
    // This ensures that even if Realtime disconnects or is not enabled, we still get messages.
    const interval = setInterval(() => {
      fetchMessages(true); // silent fetch
    }, 5000);

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
      clearInterval(interval);
    };
  }, [user]);

  const handleTyping = () => {
    if (!presenceChannelRef.current) return;

    // Send typing event
    presenceChannelRef.current.track({ user, isTyping: true });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      presenceChannelRef.current?.track({ user, isTyping: false });
    }, 2000);
  };

  const handleNewMessage = (newMsg: Message) => {
    setMessages((prev) => {
       // Deduplicate
       if (prev.some(m => m.id === newMsg.id)) return prev;
       return [...prev, newMsg];
    });
    
    // Show local notification if not sent by current user
    if (newMsg.sender_id !== user) {
       showLocalNotification(newMsg);
    }
    
    // Defer scroll to allow render
    setTimeout(scrollToBottom, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async (silent = false) => {
    try {
      // Only show loading spinner on initial load
      if (!silent) setLoading(true);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (data) {
        setMessages(prev => {
          // If silent update, merge smartly to avoid jitter (though React state batching helps)
          // Actually, replacing the array is fine if we sort it, but checking for length diff helps performance
          if (silent && prev.length === data.length) return prev;
          
          // Check for new messages to notify
          if (silent && data.length > prev.length) {
             const newMessages = data.filter(d => !prev.some(p => p.id === d.id));
             newMessages.forEach(m => {
               if (m.sender_id !== user) showLocalNotification(m);
             });
          }
          return data;
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    // Stop typing immediately when sending
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    presenceChannelRef.current?.track({ user, isTyping: false });

    const content = newMessage.trim();
    setNewMessage(''); // Optimistic clear

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user,
        content: content,
      });

      if (error) throw error;
      
      // Send push notification to the other user
      const targetUser = user === 'angy' ? 'bozy' : 'angy';
      sendPushNotification(content, targetUser);
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setNewMessage(content); // Restore message on error
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const { error } = await supabase.from('messages').delete().eq('id', id);
      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };
  
  // Notification Logic
  const checkNotificationPermission = () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return;
    }
    setNotificationsEnabled(Notification.permission === 'granted');
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Notifications are not supported in this browser.');
      return;
    }
    
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
    
    if (permission === 'granted') {
       new Notification('Notifications Enabled!', {
         body: 'You will now receive alerts for new messages when the app is open.',
         icon: '/favicon.png'
       });
    }
  };

  const showLocalNotification = (msg: Message) => {
    if (Notification.permission === 'granted' && document.visibilityState === 'hidden') {
       const senderName = allUsers[msg.sender_id as 'angy' | 'bozy']?.name || 'Partner';
       new Notification(`New message from ${senderName}`, {
         body: msg.content,
         icon: '/favicon.png',
         tag: 'message'
       });
    }
  };

  const handleTestNotification = () => {
     // For testing, send to MYSELF to verify integration
     const targetUser = user; 
     if (confirm(`Send test push to YOURSELF (${targetUser})? This is the best way to verify it works.`)) {
        sendPushNotification("This is a test push to yourself!", targetUser as string);
        alert("Sent! Check if you receive it (and check console for errors).");
     }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-3xl mx-auto p-4 relative">
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <h1 className={`text-2xl font-bold ${theme.colors.accent} flex items-center gap-2`}>
            <MessageCircle className={theme.colors.text} />
            Chat
          </h1>
          {typingUsers.size > 0 && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs text-gray-400 ml-1 h-4 animate-pulse font-medium"
            >
              {typingUsers.size === 1 
                ? `${allUsers[Array.from(typingUsers)[0] as 'angy' | 'bozy']?.name || 'Someone'} is typing...`
                : 'Multiple people typing...'
              }
            </motion.p>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
             onClick={handleTestNotification}
             className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded hover:bg-gray-700"
          >
            Test Push
          </button>
          <button 
            onClick={requestNotificationPermission}
          className={`p-2 rounded-full transition-colors ${notificationsEnabled ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}
          title={notificationsEnabled ? 'Notifications Enabled' : 'Enable Notifications'}
        >
          {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
        </button>
      </div>
      </div>

      <div className={`flex-1 overflow-y-auto rounded-2xl ${theme.colors.cardBg} backdrop-blur-md shadow-inner p-4 mb-4 border border-white/5`}>
        {loading ? (
          <div className="flex justify-center items-center h-full text-gray-400">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-gray-400 opacity-60">
            <MessageCircle size={48} className="mb-2" />
            <p>No messages yet. Say hi!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMe = msg.sender_id === user;
              const sender = allUsers[msg.sender_id as 'angy' | 'bozy'];
              
              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-gray-800">
                      <img src={sender?.avatar} alt={sender?.name} className="w-full h-full object-cover" />
                    </div>
                    
                    {/* Bubble */}
                    <div 
                      className={`relative group px-4 py-2 rounded-2xl shadow-sm ${
                        isMe 
                          ? `${theme.colors.primary} text-white rounded-br-none` 
                          : 'bg-white/10 text-gray-100 rounded-bl-none border border-white/5'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      <div className={`text-[10px] mt-1 opacity-70 flex items-center gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {format(new Date(msg.created_at), 'HH:mm')}
                        {isMe && (
                          <button 
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-200"
                            title="Delete"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="flex justify-start w-full"
              >
                <div className="flex items-end gap-2 max-w-[80%] flex-row">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-gray-800 shadow-sm">
                    {typingUsers.size === 1 ? (
                       <img src={allUsers[Array.from(typingUsers)[0] as 'angy' | 'bozy']?.avatar} alt="Typing" className="w-full h-full object-cover opacity-80" />
                    ) : (
                       <div className="w-full h-full bg-gray-600 animate-pulse" />
                    )}
                  </div>
                  
                  <div className="bg-white/10 p-4 rounded-2xl rounded-bl-none border border-white/5 flex gap-1.5 shadow-sm items-center h-10">
                    <motion.div 
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                    />
                    <motion.div 
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    />
                    <motion.div 
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="relative flex gap-2 items-center">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..."
          className={`flex-1 p-3 pr-12 rounded-full bg-white/10 border border-white/10 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-${theme.colors.primary.split(' ')[0]}-500/50 backdrop-blur-md`}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className={`absolute right-2 p-2 rounded-full ${
            newMessage.trim() 
              ? `${theme.colors.primary} text-white shadow-lg` 
              : 'bg-gray-600/50 text-gray-400'
          } transition-all duration-200 disabled:opacity-50`}
        >
          <Send size={18} className={newMessage.trim() ? 'ml-0.5' : ''} />
        </button>
      </form>
    </div>
  );
}
