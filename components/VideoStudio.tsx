
import React from 'react';

const VideoStudio: React.FC = () => {
    const metaHeroImage = "https://i.ibb.co/4n88pYH1/jenta-branding-3d-glass-app-icon-4k-1-copy.png";
    const grokHeroImage = "https://i.ibb.co/4n88pYH1/jenta-branding-3d-glass-app-icon-4k-1-copy.png";
    const metaUrl = "https://www.meta.ai/";
    const grokUrl = "https://grok.com/imagine";

    const [activeFilter, setActiveFilter] = React.useState<string>('');

    const filters = [
        { id: '', label: 'None' },
        { id: 'cinematic-noir', label: 'Noir' },
        { id: 'cinematic-vibrant', label: 'Vibrant' },
        { id: 'cinematic-sepia', label: 'Sepia' }
    ];

    return (
        <main className="w-full flex flex-col gap-6 pt-4 pb-12 animate-in fade-in duration-700 min-h-[70vh]">
            {/* Header Section */}
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase">Video & Motion Studio</h2>
                    <p className="text-sm text-white/50 mt-1">Experience the future of video creation with integrated world-class AI models.</p>
                </div>
                <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                    {filters.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setActiveFilter(f.id)}
                            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeFilter === f.id ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Studio Grid */}
            <div className={`grid grid-cols-1 xl:grid-cols-2 gap-8 transition-all duration-500 ${activeFilter}`}>
                {/* Meta AI Studio */}
                <div className="relative group">
                    <a 
                        href={metaUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block glass-card rounded-[2.5rem] overflow-hidden border border-white/10 relative bg-black/40 aspect-video shadow-2xl transition-all hover:border-blue-500/50 hover:shadow-blue-500/10 group"
                    >
                        <img 
                            src={metaHeroImage} 
                            alt="Meta AI Video Generation" 
                            className="w-full h-full object-contain p-12 opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                        />

                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 group-hover:bg-black/10 transition-all duration-500">
                            <div className="w-20 h-20 rounded-full bg-blue-600/20 backdrop-blur-xl border border-blue-500/30 flex items-center justify-center mb-4 transform group-hover:scale-110 transition-transform duration-500">
                                <svg className="h-10 w-10 text-white fill-current translate-x-1" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-[0.4em] drop-shadow-2xl">Meta AI Video</h3>
                            <p className="text-white/60 text-xs mt-2 font-bold group-hover:text-white transition-colors">Direct access to Movie Gen Technology</p>
                        </div>

                        <div className="absolute top-6 left-6 px-4 py-2 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg">
                            Ultimate
                        </div>
                    </a>
                    <div className="absolute -inset-4 bg-blue-500/5 blur-3xl rounded-[3rem] -z-10 group-hover:bg-blue-500/10 transition-all"></div>
                </div>

                {/* Grok AI Studio */}
                <div className="relative group">
                    <a 
                        href={grokUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block glass-card rounded-[2.5rem] overflow-hidden border border-white/10 relative bg-black/40 aspect-video shadow-2xl transition-all hover:border-purple-500/50 hover:shadow-purple-500/10 group"
                    >
                        <img 
                            src={grokHeroImage} 
                            alt="Grok AI Video Generation" 
                            className="w-full h-full object-contain p-12 opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                        />

                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 group-hover:bg-black/10 transition-all duration-500">
                            <div className="w-20 h-20 rounded-full bg-purple-600/20 backdrop-blur-xl border border-purple-500/30 flex items-center justify-center mb-4 transform group-hover:scale-110 transition-transform duration-500">
                                <svg className="h-10 w-10 text-white fill-current translate-x-1" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-[0.4em] drop-shadow-2xl">Grok Imagine</h3>
                            <p className="text-white/60 text-xs mt-2 font-bold group-hover:text-white transition-colors">Access Grok's Visual Extension</p>
                        </div>

                        <div className="absolute top-6 left-6 px-4 py-2 bg-purple-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg">
                            Ultimate
                        </div>
                    </a>
                    <div className="absolute -inset-4 bg-purple-500/5 blur-3xl rounded-[3rem] -z-10 group-hover:bg-purple-500/10 transition-all"></div>
                </div>
            </div>
            
            {/* Features Info Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className="glass-card p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                    <h4 className="text-xs font-bold text-blue-400 uppercase mb-2">Dual Model Access</h4>
                    <p className="text-sm text-white/50">Choose between Meta and Grok for different styles of motion and cinematic quality.</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                    <h4 className="text-xs font-bold text-purple-400 uppercase mb-2">Instant Rendering</h4>
                    <p className="text-sm text-white/50">Cloud-based processing allows you to generate videos in minutes, not hours.</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2">Infinite Creative Scope</h4>
                    <p className="text-sm text-white/50">From realistic physics to surreal art, your prompts drive the entire production.</p>
                </div>
            </div>
        </main>
    );
};

export default VideoStudio;
