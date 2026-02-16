import React, { useState } from 'react';
import { format, isPast } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Plus, Trash2, X } from 'lucide-react';
import { useUser } from '../lib/user-context';
import { useData } from '../lib/data-context';
import { motion, AnimatePresence } from 'framer-motion';

export function Dates() {
  const { theme, user, allUsers } = useUser();
  const { dates, addDate, deleteDate } = useData();
  const [isAdding, setIsAdding] = useState(false);
  const [newDate, setNewDate] = useState({
    title: '',
    date: '',
    location: '',
    type: 'meetup'
  });

  const sortedDates = [...dates]
    .filter(d => d.type !== 'itinerary') // Filter out itinerary items
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate.title || !newDate.date) return;
    
    await addDate({
      title: newDate.title,
      date: new Date(newDate.date),
      location: newDate.location,
      type: newDate.type,
      created_by: user || undefined
    });
    
    setIsAdding(false);
    setNewDate({ title: '', date: '', location: '', type: 'meetup' });
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <h1 className={`text-2xl font-bold ${theme.colors.accent} flex items-center gap-2`}>
        <CalendarIcon className={theme.colors.text} />
        Important Dates
      </h1>

      <div className="space-y-4">
        {sortedDates.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <p>No upcoming dates found.</p>
            <p className="text-sm">Tap the + button to add one!</p>
          </div>
        ) : (
          sortedDates.map((event, index) => (
            <motion.div 
              key={event.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${theme.colors.cardBg} backdrop-blur-sm p-4 rounded-xl shadow-sm border-l-4 transition-all group relative ${isPast(event.date) ? 'border-gray-300 opacity-60' : `border-${theme.colors.primary.split('-')[1]}-500`}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{event.title}</h3>
                    {event.created_by && (
                      <img 
                        src={allUsers[event.created_by]?.avatar} 
                        alt={event.created_by} 
                        className="w-5 h-5 rounded-full border border-gray-200" 
                        title={`Added by ${event.created_by}`}
                      />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin size={14} /> {event.location}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`block text-lg font-bold ${theme.colors.accent}`}>{format(event.date, 'MMM d')}</span>
                  <span className="block text-xs text-gray-400">{format(event.date, 'yyyy')}</span>
                </div>
              </div>
              
              <button 
                onClick={() => deleteDate(event.id)}
                className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))
        )}
      </div>
      
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsAdding(true)}
        className={`fixed bottom-24 right-6 ${theme.colors.primary} text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-40`}
      >
        <Plus size={24} />
      </motion.button>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className={`${theme.colors.cardBg} w-full max-w-md rounded-2xl p-6 shadow-2xl`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Add New Date</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input 
                    type="text" 
                    required
                    value={newDate.title}
                    onChange={e => setNewDate({...newDate, title: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white/50 focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="e.g. Anniversary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={newDate.date}
                    onChange={e => setNewDate({...newDate, date: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white/50 focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input 
                    type="text" 
                    value={newDate.location}
                    onChange={e => setNewDate({...newDate, location: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white/50 focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="e.g. Paris"
                  />
                </div>

                <button 
                  type="submit"
                  className={`w-full py-3 rounded-xl text-white font-bold ${theme.colors.primary} shadow-lg hover:opacity-90 transition-opacity`}
                >
                  Add Date
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
