import React, { useState } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, format } from 'date-fns';
import { useUser } from '../lib/user-context';
import { useData } from '../lib/data-context';
import { motion } from 'framer-motion';
import { Edit2, X, Check, MapPin, Clock } from 'lucide-react';

export function Home() {
  const { allUsers } = useUser();
  const { nextMeeting, updateNextMeeting } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState('');
  
  // Default to a future date if not set
  const targetDate = nextMeeting || new Date('2026-03-01T12:00:00');
  
  const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: differenceInDays(targetDate, now),
      hours: differenceInHours(targetDate, now) % 24,
      minutes: differenceInMinutes(targetDate, now) % 60,
      seconds: differenceInSeconds(targetDate, now) % 60
    };
  }

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const handleSave = () => {
    if (editDate) {
      updateNextMeeting(new Date(editDate));
      setIsEditing(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'bg-green-500 shadow-green-500/50';
      case 'idle': return 'bg-yellow-500 shadow-yellow-500/50';
      case 'dnd': return 'bg-red-500 shadow-red-500/50';
      default: return 'bg-gray-500 shadow-gray-500/50';
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] relative p-4 sm:p-6 flex flex-col">
      {/* Top Section: Profiles */}
      <div className="flex justify-between items-start mb-12 sm:mb-20">
        {/* Left Profile (Bozy) - Amsterdam */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex flex-col items-start gap-3"
        >
           <div className="relative group">
              <div className={`absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-500`}></div>
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white/10 overflow-hidden bg-[#2B2D31]">
                <img src={allUsers.bozy?.avatar} alt="Bozy" className="w-full h-full object-cover" />
              </div>
              <div className={`absolute bottom-0 right-0 w-5 h-5 border-4 border-[#111214] rounded-full shadow-lg ${getStatusColor(allUsers.bozy?.status)}`} title={allUsers.bozy?.status || 'offline'} />
           </div>
           <div>
              <h3 className="text-xl font-bold text-gray-100">{allUsers.bozy?.name || 'Bozy'}</h3>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                <MapPin size={12} />
                <span>Amsterdam, NL</span>
              </div>
              <LiveClock timeZone="Europe/Amsterdam" />
           </div>
        </motion.div>

        {/* Right Profile (Angy) - Riga */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex flex-col items-end gap-3 text-right"
        >
           <div className="relative group">
              <div className={`absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-500`}></div>
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white/10 overflow-hidden bg-[#2B2D31]">
                <img src={allUsers.angy?.avatar} alt="Angy" className="w-full h-full object-cover" />
              </div>
              <div className={`absolute bottom-0 right-0 w-5 h-5 border-4 border-[#111214] rounded-full shadow-lg ${getStatusColor(allUsers.angy?.status)}`} title={allUsers.angy?.status || 'offline'} />
           </div>
           <div>
              <h3 className="text-xl font-bold text-gray-100">{allUsers.angy?.name || 'Angy'}</h3>
              <div className="flex items-center justify-end gap-1.5 text-xs text-gray-400 mt-1">
                <span>Riga, LV</span>
                <MapPin size={12} />
              </div>
              <LiveClock timeZone="Europe/Riga" align="right" />
           </div>
        </motion.div>
      </div>

      {/* Center Section: Timer */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center space-y-8 w-full max-w-2xl"
        >
           <div className="space-y-2">
             <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">Next Meeting In</h2>
             {!isEditing && (
               <div className="group relative inline-block">
                 <h1 className="text-xl sm:text-2xl font-medium text-gray-400 hover:text-gray-200 transition-colors cursor-pointer" onClick={() => {
                    setIsEditing(true);
                    setEditDate(targetDate.toISOString().slice(0, 16));
                 }}>
                   {format(targetDate, 'MMMM do, yyyy h:mm a')}
                 </h1>
                 <div className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Edit2 size={14} className="text-gray-500" />
                 </div>
               </div>
             )}
             
             {isEditing && (
                <div className="flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-200">
                  <input 
                    type="datetime-local" 
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="text-sm p-2 rounded bg-[#1E1F22] text-white border border-gray-700 focus:outline-none focus:border-blue-500"
                  />
                  <button onClick={handleSave} className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setIsEditing(false)} className="p-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">
                    <X size={16} />
                  </button>
                </div>
             )}
           </div>

           <div className="grid grid-cols-4 gap-4 sm:gap-8">
              <TimeBox value={timeLeft.days} label="Days" />
              <TimeBox value={timeLeft.hours} label="Hours" />
              <TimeBox value={timeLeft.minutes} label="Minutes" />
              <TimeBox value={timeLeft.seconds} label="Seconds" />
           </div>
        </motion.div>
      </div>
    </div>
  );
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div className="text-4xl sm:text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 font-mono tracking-tighter">
          {value.toString().padStart(2, '0')}
        </div>
      </div>
      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-600">{label}</span>
    </div>
  );
}

function LiveClock({ timeZone, align = 'left' }: { timeZone: string; align?: 'left' | 'right' }) {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    timeZone,
  }).format(time);

  return (
    <div className={`flex items-center gap-1.5 text-sm font-medium text-gray-300 mt-0.5 ${align === 'right' ? 'justify-end' : ''}`}>
      <Clock size={12} className="text-gray-500" />
      <span>{formattedTime}</span>
    </div>
  );
}
