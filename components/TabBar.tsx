
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreatorStudioProject, PhotoshootDirectorProject, PromptStudioProject, VoiceOverStudioProject, BrandingStudioProject, CampaignStudioProject, PlanStudioProject, EditStudioProject, StoryboardStudioProject, MarketingStudioProject, ControllerStudioProject, PrePilotAgencySuiteProject } from '../types';
import { Plus, X } from 'lucide-react';

type ProjectUnion = 
  | CreatorStudioProject 
  | PhotoshootDirectorProject 
  | PromptStudioProject 
  | VoiceOverStudioProject 
  | BrandingStudioProject 
  | CampaignStudioProject 
  | PlanStudioProject 
  | EditStudioProject 
  | StoryboardStudioProject 
  | MarketingStudioProject
  | ControllerStudioProject
  | PrePilotAgencySuiteProject;

interface TabBarProps {
  projects: ProjectUnion[];
  activeProjectIndex: number;
  onSelectTab: (index: number) => void;
  onAddTab: () => void;
  onCloseTab: (index: number) => void;
}

const TabBar: React.FC<TabBarProps> = ({ projects, activeProjectIndex, onSelectTab, onAddTab, onCloseTab }) => {
  return (
    <div className="w-full max-w-7xl flex items-center border-b border-[rgba(var(--color-text-base-rgb,229,231,206),0.1)] mb-6">
      <div className="flex items-end -mb-px overflow-x-auto suggestions-scrollbar scroll-smooth">
        <AnimatePresence mode="popLayout" initial={false}>
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              onClick={() => onSelectTab(index)}
              className={`flex-shrink-0 cursor-pointer flex items-center gap-2 px-6 py-3 border-t border-l border-r rounded-t-xl transition-colors duration-200 group relative select-none ${
                index === activeProjectIndex
                  ? 'border-[var(--color-accent)] bg-[rgba(var(--color-accent-rgb),0.15)] text-[var(--color-text-base)] shadow-[0_-4px_12px_rgba(var(--color-accent-rgb),0.1)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:bg-[rgba(var(--color-text-base-rgb,229,231,206),0.05)] hover:text-[var(--color-text-base)]'
              }`}
            >
              <span className="text-sm font-semibold tracking-tight whitespace-nowrap">{project.name}</span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(index);
                }}
                className="rounded-full p-1 -mr-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] hover:bg-[rgba(var(--color-accent-rgb),0.3)] transition-colors"
                aria-label={`Close ${project.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
              
              {index === activeProjectIndex && (
                <motion.div 
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddTab}
          className="ml-2 mb-2 p-2.5 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-base)] hover:bg-white/10 transition-colors flex-shrink-0 bg-white/5"
          aria-label="Add new project"
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};

export default TabBar;
