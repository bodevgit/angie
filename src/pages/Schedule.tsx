import { useState, useMemo } from 'react';
import { School, Briefcase, ChevronLeft, ChevronRight, Clock, Edit2, Save, X } from 'lucide-react';
import { useUser } from '../lib/user-context';
import { useData } from '../lib/data-context';
import { motion, AnimatePresence } from 'framer-motion';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

export function Schedule() {
  const { theme } = useUser();
  const { schedules, updateSchedule } = useData();
  const [activeTab, setActiveTab] = useState<'angy' | 'bozy'>('angy');
  const [isEditing, setIsEditing] = useState(false);
  const [editingCell, setEditingCell] = useState<{day: string, period: string} | null>(null);
  const [editValue, setEditValue] = useState('');

  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date().getDay(); // 0 is Sunday, 1 is Monday...
    if (today === 0 || today === 6) return 0;
    return today - 1;
  });

  // Transform flat schedule data into structured format
  const currentSchedule = useMemo(() => {
    return DAYS.map(day => {
      const dayItems = PERIODS.map(period => {
        // Find in DB
        const found = schedules.find(s => 
          s.user_profile === activeTab && 
          s.day === day && 
          s.period === period
        );

        if (found) {
          return { period, subject: found.subject, time: found.time };
        }

        return { period, subject: 'Free' };
      });

      return { day, items: dayItems };
    });
  }, [schedules, activeTab]);

  const handlePrevDay = () => {
    setSelectedDayIndex((prev) => (prev > 0 ? prev - 1 : DAYS.length - 1));
  };

  const handleNextDay = () => {
    setSelectedDayIndex((prev) => (prev < DAYS.length - 1 ? prev + 1 : 0));
  };

  const currentDay = currentSchedule[selectedDayIndex];

  const handleSaveCell = async () => {
    if (!editingCell) return;
    
    await updateSchedule({
      user_profile: activeTab,
      day: editingCell.day,
      period: editingCell.period,
      subject: editValue
    });
    
    setEditingCell(null);
    setEditValue('');
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${theme.colors.accent} flex items-center gap-2`}>
          {activeTab === 'angy' ? <School className={theme.colors.text} /> : <Briefcase className={theme.colors.text} />}
          Schedules
        </h1>
        <div className="flex gap-2 items-center">
           <button
            onClick={() => setIsEditing(!isEditing)}
            className={`p-2 rounded-full transition-colors ${isEditing ? 'bg-green-100 text-green-600' : 'bg-white/50 text-gray-500 hover:bg-white/80'}`}
          >
            {isEditing ? <Save size={20} /> : <Edit2 size={20} />}
          </button>
          <div className="bg-white/50 backdrop-blur-sm p-1 rounded-xl flex shadow-sm">
            <button
              onClick={() => setActiveTab('angy')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'angy' ? 'bg-white text-pink-600 shadow-sm scale-105' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Angy
            </button>
            <button
              onClick={() => setActiveTab('bozy')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'bozy' ? 'bg-white text-blue-600 shadow-sm scale-105' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Bozy
            </button>
          </div>
        </div>
      </header>

      {/* Day Selector */}
      <div className={`${theme.colors.cardBg} backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-4 flex items-center justify-between`}>
        <button onClick={handlePrevDay} className="p-2 hover:bg-black/5 rounded-full text-gray-500 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentDay?.day}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-bold text-gray-800">{currentDay?.day}</h2>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                {activeTab === 'angy' ? 'School Schedule' : 'Work Schedule'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
        <button onClick={handleNextDay} className="p-2 hover:bg-black/5 rounded-full text-gray-500 transition-colors">
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Schedule List */}
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${selectedDayIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {currentDay?.items.length > 0 ? (
              currentDay.items.map((item, index) => {
                const isCellEditing = editingCell?.day === currentDay.day && editingCell?.period === item.period;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center p-4 rounded-xl border backdrop-blur-sm shadow-sm hover:shadow-md transition-all ${
                      activeTab === 'angy' ? 'bg-white/60 border-pink-100 hover:bg-white/80' : 'bg-white/60 border-blue-100 hover:bg-white/80'
                    } ${isEditing ? 'cursor-pointer hover:border-indigo-300 ring-2 ring-transparent hover:ring-indigo-100' : ''}`}
                    onClick={() => {
                      if (isEditing) {
                        setEditingCell({ day: currentDay.day, period: item.period });
                        setEditValue(item.subject);
                      }
                    }}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mr-4 shadow-inner ${
                        activeTab === 'angy' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {item.period.replace(/\D/g, '')}
                    </div>
                    <div className="flex-1">
                      {isCellEditing ? (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <input 
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="w-full p-1 rounded border border-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveCell();
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                          />
                          <button onClick={handleSaveCell} className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600">
                            <Save size={16} />
                          </button>
                          <button onClick={() => setEditingCell(null)} className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-semibold text-gray-800">{item.subject}</h3>
                          {item.time && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Clock size={12} /> {item.time}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    {isEditing && !isCellEditing && (
                       <Edit2 size={16} className="text-gray-400 opacity-50" />
                    )}
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white/40 backdrop-blur-sm rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-500 font-medium">No schedule items for this day.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}