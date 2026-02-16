import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useUser } from '../lib/user-context';
import { useNavigate } from 'react-router-dom';

export function Welcome() {
  const { setUser } = useUser();
  const navigate = useNavigate();

  const handleContinue = () => {
    setUser('angy');
    navigate('/');
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#111214]">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-pink-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 flex flex-col items-center gap-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-purple-400 drop-shadow-sm tracking-tight">
            Hi baby ❤️
          </h1>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleContinue}
            className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-200 font-medium transition-all flex items-center gap-2 group backdrop-blur-sm"
          >
            Wanna see our app?
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
