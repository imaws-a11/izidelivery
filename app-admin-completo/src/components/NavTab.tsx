import React from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import type { Tab } from '../lib/types';

interface NavTabProps {
  icon: string;
  label: string;
  id: Tab;
}

const NavTab: React.FC<NavTabProps> = ({ icon, label, id }) => {
  const { activeTab, setActiveTab } = useAdmin();

  return (
    <button 
      onClick={() => setActiveTab(id)}
      className={`relative shrink-0 flex flex-col lg:flex-row items-center gap-1.5 lg:gap-3 px-3 lg:px-6 py-2.5 lg:py-3.5 rounded-2xl lg:rounded-2xl transition-all duration-300 group
        ${activeTab === id 
            ? 'bg-slate-900 dark:bg-primary text-primary dark:text-slate-900 shadow-lg shadow-black/5 dark:shadow-primary/10' 
            : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
    >
      <span className={`material-symbols-outlined text-[22px] lg:text-[20px] transition-transform duration-300 ${activeTab === id ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </span>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      {activeTab === id && (
        <motion.div 
          layoutId="active-tab-indicator" 
          className="absolute -bottom-2 lg:bottom-0 left-1/2 lg:left-0 -translate-x-1/2 lg:translate-x-0 w-1 lg:w-full h-1 lg:h-0.5 bg-primary/0 rounded-full" 
        />
      )}
    </button>
  );
};

export default NavTab;
