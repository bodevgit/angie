import React, { useState } from 'react';
import { List as ListIcon, Clock, MapPin, Plus, X, Trash2 } from 'lucide-react';
import { useUser } from '../lib/user-context';
import { useData } from '../lib/data-context';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export function Itinerary() {
  const { theme, user, allUsers } = useUser();
  const { dates, addDate, deleteDate } = useData();
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    date: '',
    location: ''
  });
  
  // Filter only itinerary items and sort by date
  const itineraryItems = dates
    .filter(d => d.type === 'itinerary')
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Group by date
  const groupedItinerary: Record<string, typeof itineraryItems> = {};
  itineraryItems.forEach(item => {
    const dayKey = format(item.date, 'EEEE, MMMM do');
    if (!groupedItinerary[dayKey]) {
      groupedItinerary[dayKey] = [];
    }
    groupedItinerary[dayKey].push(item);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title || !newItem.date) return;
    
    await addDate({
      title: newItem.title,
      date: new Date(newItem.date),
      location: newItem.location,
      type: 'itinerary',
      created_by: user || undefined
    });
    
    setIsAdding(false);
    setNewItem({ title: '', date: '', location: '' });
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <h1 className={`text-2xl font-bold ${theme.colors.accent} flex items-center gap-2`}>
        <ListIcon className={theme.colors.text} />
        Daily Itinerary
      </h1>

      <div className="space-y-8">
        {Object.keys(groupedItinerary).length === 0 ? (
           <div className="text-center py-10 opacity-50">
             <p>No itinerary items yet.</p>
             <p className="text-sm">Start building your schedule!</p>
           </div>
        ) : (
          Object.entries(groupedItinerary).map(([day, items], index) => (
            <motion.div 
              key={day} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className={`relative pl-8 border-l-2 ${theme.colors.primary.replace('bg-', 'border-').replace('500', '200').replace('600', '200')} ml-2`}
            >
              <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${theme.colors.primary} border-4 border-white shadow-sm`}></div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 sticky top-0 bg-white/80 backdrop-blur-sm py-2 z-10 rounded-r-lg">{day}</h2>
              
              <div className="space-y-4">
                {items.map((activity, actIndex) => (
                  <motion.div 
                    key={activity.id}
                    whileHover={{ scale: 1.02 }}
                    className={`${theme.colors.cardBg} backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-100 relative group hover:shadow-md transition-all`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{activity.title}</h3>
                        {activity.created_by && (
                          <img 
                            src={allUsers[activity.created_by]?.avatar} 
                            alt={activity.created_by} 
                            className="w-5 h-5 rounded-full border border-gray-200" 
                            title={`Added by ${activity.created_by}`}
                          />
                        )}
                      </div>
                      <span className={`text-xs font-bold ${theme.colors.accent} ${theme.colors.background} px-2 py-1 rounded-md flex items-center gap-1`}>
                        <Clock size={12} /> {format(activity.date, 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin size={12} /> {activity.location}
                    </p>
                    
                    <button 
                      onClick={() => deleteDate(activity.id)}
                      className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </div>
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
                <h2 className="text-xl font-bold text-gray-800">Add Itinerary Item</h2>
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
                    value={newItem.title}
                    onChange={e => setNewItem({...newItem, title: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white/50 focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="e.g. Dinner at De Kas"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={newItem.date}
                    onChange={e => setNewItem({...newItem, date: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white/50 focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input 
                    type="text" 
                    value={newItem.location}
                    onChange={e => setNewItem({...newItem, location: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white/50 focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="e.g. Amsterdam"
                  />
                </div>

                <button 
                  type="submit"
                  className={`w-full py-3 rounded-xl text-white font-bold ${theme.colors.primary} shadow-lg hover:opacity-90 transition-opacity`}
                >
                  Add to Itinerary
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
