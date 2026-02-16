
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

  useEffect(() => {
    fetchMessages();
    checkNotificationPermission();

    // Subscribe to new messages
    // Use a unique channel name per session to avoid conflicts
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
          setMessages((prev) => {
             // Deduplicate messages just in case
             if (prev.some(m => m.id === newMsg.id)) return prev;
             return [...prev, newMsg];
          });
          
          // Show local notification if not sent by current user
          if (newMsg.sender_id !== user) {
             showLocalNotification(newMsg);
          }
          
          scrollToBottom();
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status: ${status}`);
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

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
     const targetUser = user === 'angy' ? 'bozy' : 'angy';
     if (confirm(`Send test push to ${targetUser}?`)) {
        sendPushNotification("This is a test push!", targetUser);
        alert("Sent! If they don't receive it, check the console logs.");
     }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-3xl mx-auto p-4 relative">
      <div className="flex justify-between items-center mb-4">
        <h1 className={`text-2xl font-bold ${theme.colors.accent} flex items-center gap-2`}>
          <MessageCircle className={theme.colors.text} />
          Chat
        </h1>
        
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
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="relative flex gap-2 items-center">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
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
