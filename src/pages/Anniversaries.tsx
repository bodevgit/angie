import { Heart as HeartIcon } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { useUser } from '../lib/user-context';
import { motion } from 'framer-motion';

const anniversaries = [
  { id: 1, title: 'First Date', date: new Date('2024-02-14'), icon: '❤️' },
  { id: 2, title: 'First Kiss', date: new Date('2024-03-01'), icon: '💋' },
  { id: 3, title: 'First Time Meeting', date: new Date('2024-01-01'), icon: '✈️' },
];

export function Anniversaries() {
  const { theme } = useUser();
  const sorted = anniversaries.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="p-6 space-y-6">
      <h1 className={`text-2xl font-bold ${theme.colors.accent} flex items-center gap-2`}>
        <HeartIcon className={theme.colors.text} />
        Our Story
      </h1>

      <div className="space-y-6">
        {sorted.map((anniversary, index) => {
          const days = differenceInDays(new Date(), anniversary.date);
          
          return (
            <motion.div 
              key={anniversary.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ scale: 1.03 }}
              className={`${theme.colors.cardBg} backdrop-blur-sm p-6 rounded-xl shadow-sm border ${theme.colors.primary.replace('bg-', 'border-').replace('500', '100').replace('600', '100')} relative overflow-hidden group hover:shadow-xl transition-all`}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-6xl">{anniversary.icon}</span>
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-gray-800 mb-1">{anniversary.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{format(anniversary.date, 'MMMM do, yyyy')}</p>
                
                <div className={`${theme.colors.background} inline-block px-4 py-2 rounded-lg`}>
                  <span className={`text-2xl font-bold ${theme.colors.accent}`}>{days}</span>
                  <span className={`text-sm ${theme.colors.accent} opacity-70 ml-1`}>days together</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
