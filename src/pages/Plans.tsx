import React, { useState } from 'react';
import { Map, Plus, Check, Trash2, X } from 'lucide-react';
import { useUser } from '../lib/user-context';
import { useData } from '../lib/data-context';
import { motion, AnimatePresence } from 'framer-motion';

export function Plans() {
  const { theme, user, allUsers } = useUser();
  const { plans, addPlan, updatePlan, deletePlan } = useData();
  const [isAdding, setIsAdding] = useState(false);
  const [newPlan, setNewPlan] = useState({
    title: '',
    location: '',
    category: 'General'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.title) return;
    
    await addPlan({
      title: newPlan.title,
      location: newPlan.location,
      category: newPlan.category,
      completed: false,
      created_by: user || undefined
    });
    
    setIsAdding(false);
    setNewPlan({ title: '', location: '', category: 'General' });
  };

  const togglePlan = (id: string, completed: boolean) => {
    updatePlan(id, { completed: !completed });
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <h1 className={`text-2xl font-bold ${theme.colors.accent} flex items-center gap-2`}>
        <Map className={theme.colors.text} />
        Our Plans
      </h1>

      <div className="grid grid-cols-1 gap-4">
        {plans.length === 0 ? (
           <div className="text-center py-10 opacity-50">
             <p>No plans yet.</p>
             <p className="text-sm">Start planning your adventures!</p>
           </div>
        ) : (
          plans.map((plan, index) => (
            <motion.div 
              key={plan.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${theme.colors.cardBg} backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between transition-all group ${plan.completed ? 'opacity-60 grayscale' : 'hover:scale-[1.02] hover:shadow-md'}`}
            >
              <div 
                className="flex items-center gap-4 flex-1 cursor-pointer"
                onClick={() => togglePlan(plan.id, plan.completed)}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${plan.completed ? `${theme.colors.primary} border-transparent` : 'border-gray-300'}`}>
                  {plan.completed && <Check size={14} className="text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium ${plan.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{plan.title}</h3>
                    {plan.created_by && (
                      <img 
                        src={allUsers[plan.created_by]?.avatar} 
                        alt={plan.created_by} 
                        className="w-5 h-5 rounded-full border border-gray-200" 
                        title={`Added by ${plan.created_by}`}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs ${theme.colors.accent} ${theme.colors.background} px-2 py-0.5 rounded-full font-bold`}>{plan.category}</span>
                    <span className="text-xs text-gray-400">{plan.location}</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deletePlan(plan.id);
                }}
                className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
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
                <h2 className="text-xl font-bold text-gray-800">Add New Plan</h2>
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
                    value={newPlan.title}
                    onChange={e => setNewPlan({...newPlan, title: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white/50 focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="e.g. Visit Museum"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    value={newPlan.category}
                    onChange={e => setNewPlan({...newPlan, category: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white/50 focus:ring-2 focus:ring-pink-500 outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Art">Art</option>
                    <option value="Food">Food</option>
                    <option value="Nature">Nature</option>
                    <option value="Walk">Walk</option>
                    <option value="Travel">Travel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input 
                    type="text" 
                    value={newPlan.location}
                    onChange={e => setNewPlan({...newPlan, location: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white/50 focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="e.g. Amsterdam"
                  />
                </div>

                <button 
                  type="submit"
                  className={`w-full py-3 rounded-xl text-white font-bold ${theme.colors.primary} shadow-lg hover:opacity-90 transition-opacity`}
                >
                  Add Plan
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
