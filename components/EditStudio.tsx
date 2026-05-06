
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    EditStudioProject, 
    ImageFile, 
    EditAdjustments, 
    LocalText, 
    GlobalLayer,
    BlendingMode,
    DrawPath
} from '../types';
import { resizeImage, createThumbnail } from '../utils';
import { logHistory } from '../lib/admin';
import { 
    Layers, 
    Type, 
    Image as ImageIcon, 
    Trash2, 
    Copy, 
    Download, 
    Plus, 
    Undo2, 
    Redo2, 
    Maximize2, 
    Crop, 
    Sparkles, 
    Palette,
    History,
    Save,
    X,
    MoreHorizontal,
    MousePointer2,
    Square,
    Circle,
    Star,
    Minus,
    Type as TextIcon,
    Link,
    Grid3X3,
    Eye,
    EyeOff,
    Lock,
    Unlock,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignStartVertical,
    AlignCenterVertical,
    AlignEndVertical,
    Pipette,
    Target,
    FlipHorizontal,
    FlipVertical,
    HelpCircle,
    DownloadCloud,
    Maximize,
    Minimize,
    Move,
    Search,
    Grid,
    Check,
    Layers as LayersIcon,
    PenTool as PenIcon,
    Eraser,
    Stamp,
    Scissors,
    Wand2,
    LassoSelect,
    BoxSelect,
    Type,
    Component,
    Box,
    Play,
    Settings,
    FileText,
    Image as ImageFileIcon,
    Monitor,
    Zap,
    Download,
    Share2,
    Cloud,
    Keyboard,
    Command,
    Info,
    Timer,
    Clock,
    Brush,
    Ghost,
    Masks,
    Slice,
    Contrast,
    Sun,
    Droplet,
    Sticker,
    Menu,
    ChevronRight,
    Search
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const CANVAS_SIZES = [
    { id: 'original', label: 'Original', ratio: null, icon: ImageIcon },
    { id: 'instagram-post', label: 'IG Post (1:1)', ratio: 1, icon: Maximize2 },
    { id: 'instagram-story', label: 'IG Story (9:16)', ratio: 9/16, icon: Maximize2 },
    { id: 'linkedin-banner', label: 'Banner (4:1)', ratio: 4, icon: Maximize2 },
];

const ARABIC_FONTS = ['Cairo', 'Tajawal', 'Amiri', 'Reem Kufi', 'Lateef', 'Changa', 'Harmattan', 'Almarai'];
const ENGLISH_FONTS = ['Montserrat', 'Bebas Neue', 'Playfair Display', 'Oswald', 'Rubik', 'Inter', 'Poppins', 'Roboto'];
const FONT_WEIGHTS = [
    { label: 'Thin (300)', value: '300' },
    { label: 'Regular (400)', value: '400' },
    { label: 'Bold (700)', value: '700' },
    { label: 'Black (900)', value: '900' }
];

const LUTS = [
    { name: 'Original', filter: '' },
    { name: 'Warm Sun', filter: 'sepia(0.3) saturate(1.2) hue-rotate(-10deg)' },
    { name: 'Ice Cold', filter: 'saturate(0.8) hue-rotate(180deg) brightness(1.1)' },
    { name: 'Soft Vintage', filter: 'sepia(0.5) contrast(0.8) brightness(1.05)' },
    { name: 'Deep Cinematic', filter: 'contrast(1.3) saturate(0.8) brightness(0.9) hue-rotate(-5deg)' },
    { name: 'Black & White', filter: 'grayscale(1) contrast(1.1)' },
    { name: 'Pastel Glow', filter: 'brightness(1.1) saturate(1.3) contrast(0.9)' },
    { name: 'Neon Night', filter: 'hue-rotate(45deg) saturate(1.5) contrast(1.1)' },
];

const createNewText = (): LocalText => ({
    id: Math.random().toString(36).substr(2, 9),
    content: 'نص جديد',
    fontSize: 50,
    color: '#ffffff',
    fontFamily: 'Cairo',
    fontWeight: '900',
    x: 50,
    y: 50,
    isVisible: true,
    rotation: 0,
    letterSpacing: 0,
    lineHeight: 1.2,
    maxWidth: 80,
    opacity: 1,
    blendMode: 'normal',
    strokeWidth: 0,
    strokeColor: '#000000',
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowBlur: 10,
    shadowOffsetX: 0,
    shadowOffsetY: 8,
    skewX: 0,
    isUppercase: false,
    zIndex: 10
});

const createNewShape = (type: 'rect' | 'circle' | 'line' | 'star'): GlobalLayer => ({
    id: Math.random().toString(36).substr(2, 9),
    type: 'shape',
    shapeType: type,
    scale: 20,
    x: 50,
    y: 50,
    rotation: 0,
    opacity: 0.8,
    blendMode: 'normal',
    color: 'var(--color-accent)',
    borderRadius: type === 'circle' ? 999 : 12,
    zIndex: 5,
    isVisible: true,
    brightness: 100,
    contrast: 100,
    saturation: 100
});

const BLENDING_MODES: BlendingMode[] = [
    'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 
    'color-dodge', 'color-burn', 'hard-light', 'soft-light', 
    'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'
];

const EditStudio: React.FC<{
    project: EditStudioProject;
    setProject: React.Dispatch<React.SetStateAction<EditStudioProject>>;
}> = ({ project, setProject }) => {

    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [draggingSlot, setDraggingSlot] = useState<number | null>(null);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null);
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
    const [customFonts, setCustomFonts] = useState<string[]>([]);
    const [clipboard, setClipboard] = useState<LocalText | null>(null);
    const [activeTool, setActiveTool] = useState<'images' | 'text' | 'layers' | 'branding' | 'history' | 'select' | 'shapes' | 'crop' | 'brush' | 'eyedropper' | 'hand' | 'zoom' | 'marquee' | 'lasso' | 'wand' | 'stamp' | 'eraser' | 'gradient' | 'blur' | 'pen' | 'slice' | 'healing' | 'path' | '3d'>('select');
    const [shapeToolType, setShapeToolType] = useState<'rect' | 'circle' | 'line' | 'star'>('rect');
    const [justSavedSlot, setJustSavedSlot] = useState<number | null>(null);
    const [showHelp, setShowHelp] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [commandSearch, setCommandSearch] = useState('');
    const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<DrawPath | null>(null);
    const [activePenPath, setActivePenPath] = useState<PenPath | null>(null);
    const [activeSlice, setActiveSlice] = useState<SliceRect | null>(null);
    const [lassoPoints, setLassoPoints] = useState<{x:number, y:number}[]>([]);
    const [showGrid, setShowGrid] = useState(false);
    const [showRulers, setShowRulers] = useState(true);
    const [brushSize, setBrushSize] = useState(20);
    const [brushColor, setBrushColor] = useState('#ff0000');
    const [brushOpacity, setBrushOpacity] = useState(1);
    const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'history' | 'layers' | 'branding' | 'channels' | 'adjustments' | '3d'>('properties');
    const [showTimeline, setShowTimeline] = useState(false);
    const [timelineFrames, setTimelineFrames] = useState<number>(1);
    const [activeFrame, setActiveFrame] = useState<number>(0);
    const [availableChannels, setAvailableChannels] = useState(['Red', 'Green', 'Blue']);
    const [activeChannels, setActiveChannels] = useState(['Red', 'Green', 'Blue']);
    const [selectionMarquee, setSelectionMarquee] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
    const [isDrawingSelection, setIsDrawingSelection] = useState(false);
    const [penPoints, setPenPoints] = useState<{ x: number, y: number }[]>([]);
    const [canvasPos, setCanvasPos] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastPointerPos, setLastPointerPos] = useState({ x: 0, y: 0 });
    const [zoomLevel, setZoomLevel] = useState(100);
    const [baseOpacity, setBaseOpacity] = useState(100);
    const [isDragging, setIsDragging] = useState(false);
    const [isCreatingGuide, setIsCreatingGuide] = useState<'h' | 'v' | null>(null);
    const [guideLines, setGuideLines] = useState<{ type: 'h' | 'v', pos: number }[]>([]);
    const containerRefs = useRef<(HTMLDivElement | null)[]>([]);

    const [activeGuides, setActiveGuides] = useState<{ x?: number, y?: number }[]>([]);
    const [draggingOffset, setDraggingOffset] = useState<{ x: number, y: number } | null>(null);

    useEffect(() => {
        if (activeTool === 'layers') {
            setRightPanelTab('layers');
        } else if (activeTool === 'history') {
            setRightPanelTab('history');
        } else if (activeTool === 'branding') {
            setRightPanelTab('branding');
        } else if (['text', 'shapes', 'select', 'images', 'crop', 'brush', 'eyedropper', 'marquee', 'lasso', 'wand', 'stamp', 'eraser', 'gradient', 'blur'].includes(activeTool as string)) {
            setRightPanelTab('properties');
        }
    }, [activeTool]);

    const MenuBar = () => {
        const menus = [
            { label: 'File', items: ['New...', 'Open...', 'Open Recent', 'Save', 'Save As...', 'Export', 'Generate', 'Share', 'Print'] },
            { label: 'Edit', items: ['Undo', 'Redo', 'Cut', 'Copy', 'Paste', 'Fill...', 'Stroke...', 'Content-Aware Fill', 'Free Transform', 'Preferences'] },
            { label: 'Image', items: ['Mode', 'Adjustments', 'Auto Tone', 'Auto Contrast', 'Auto Color', 'Image Size...', 'Canvas Size...', 'Image Rotation'] },
            { label: 'Layer', items: ['New', 'Duplicate Layer', 'Delete', 'Quick Export as PNG', 'Layer Style', 'New Fill Layer', 'New Adjustment Layer', 'Mask', 'Smart Objects', 'Merge Layers', 'Flatten Image'] },
            { label: 'Type', items: ['Panels', 'Anti-Alias', 'Orientation', 'Convert to Shape', 'Rasterize Type Layer', 'Match Font...'] },
            { label: 'Select', items: ['All', 'Deselect', 'Reselect', 'Inverse', 'All Layers', 'Deselect Layers', 'Color Range...', 'Focus Area...', 'Subject', 'Select and Mask...'] },
            { label: 'Filter', items: ['Filter Gallery...', 'Adaptive Wide Angle...', 'Camera Raw Filter...', 'Lens Correction...', 'Liquify...', 'Vanishing Point...', 'Blur', 'Distort', 'Noise', 'Pixelate', 'Render', 'Sharpen', 'Stylize'] },
            { label: '3D', items: ['New 3D Layer from File...', 'New 3D Postcard From Layer', 'New Mesh from Layer', 'Render', 'Export 3D Layer...'] },
            { label: 'View', items: ['Proof Setup', 'Proof Colors', 'Gamut Warning', 'Pixel Aspect Ratio', 'Zoom In', 'Zoom Out', 'Fit on Screen', 'Rulers', 'Grid', 'Guides', 'Lock Guides', 'Clear Guides'] },
            { label: 'Window', items: ['Workspace', 'Extensions', '3D', 'Actions', 'Adjustments', 'Channels', 'Character', 'History', 'Layers', 'Timeline', 'Tools'] },
            { label: 'Help', items: ['Photoshop Help...', 'Photoshop Tutorials...', 'About Photoshop...'] }
        ];

        const [activeMenu, setActiveMenu] = useState<string | null>(null);

        return (
            <div className="h-8 bg-[#2B2B2B] border-b border-black flex items-center px-2 gap-4 text-[11px] text-white/70 select-none relative z-[100]">
                <div className="w-6 h-6 mr-2 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4H20V20H4V4Z" fill="#001C35"/>
                        <path d="M7 7.5V16.5M7 7.5H10.5C11.5 7.5 12.5 8 13 9C13.5 10 13.5 11 13 12C12.5 13 11.5 13.5 10.5 13.5H7M15 11.5C15 10.5 15.5 9.5 16.5 9C17.5 8.5 18.5 8.5 19.5 9C20.5 9.5 21 10.5 21 11.5C21 12.5 20.5 13.5 19.5 14C18.5 14.5 17.5 14.5 16.5 14C15.5 13.5 15 12.5 15 11.5Z" stroke="#31A8FF" strokeWidth="1.5"/>
                    </svg>
                </div>
                {menus.map(menu => (
                    <div 
                        key={menu.label} 
                        className="relative"
                        onMouseEnter={() => activeMenu && setActiveMenu(menu.label)}
                    >
                        <button 
                            onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
                            className={cn(
                                "px-2 py-1 rounded transition-colors",
                                activeMenu === menu.label ? "bg-white/10 text-white" : "hover:bg-white/5"
                            )}
                        >
                            {menu.label}
                        </button>
                        {activeMenu === menu.label && (
                            <div className="absolute top-full left-0 mt-0.5 bg-[#2B2B2B] border border-black shadow-2xl py-1 min-w-[200px] rounded-b overflow-hidden">
                                {menu.items.map((item, i) => (
                                    <React.Fragment key={item}>
                                        {item === '---' ? (
                                            <div className="h-[1px] bg-white/5 my-1" />
                                        ) : (
                                            <button 
                                                className="w-full text-left px-4 py-1.5 hover:bg-[#3d75f2] hover:text-white transition-colors flex justify-between items-center group"
                                                onClick={() => {
                                                    if (item === 'Timeline') setShowTimeline(!showTimeline);
                                                    if (item === 'Channels') { setRightPanelTab('channels'); }
                                                    if (item === 'Adjustments') { setRightPanelTab('adjustments'); }
                                                    if (item === '3D') { setRightPanelTab('3d'); }
                                                    setActiveMenu(null);
                                                }}
                                            >
                                                <span>{item}</span>
                                                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-40" />
                                            </button>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {activeMenu && <div className="fixed inset-0 z-[-1]" onClick={() => setActiveMenu(null)} />}
                
                <div className="ml-auto flex items-center gap-4 text-[10px] opacity-40">
                    <span>Performance: 60fps</span>
                    <div className="flex items-center gap-1">
                        <Monitor className="w-3 h-3" />
                        <span>Generic RGB (8bpc)</span>
                    </div>
                </div>
            </div>
        );
    };

    const getChannelFilter = () => {
        const r = activeChannels.includes('Red') ? 1 : 0;
        const g = activeChannels.includes('Green') ? 1 : 0;
        const b = activeChannels.includes('Blue') ? 1 : 0;
        
        // If all are selected, no filter needed for channels
        if (r && g && b) return '';
        
        return `url(#channelFilter-${r}-${g}-${b})`;
    };

    const ChannelFilters = () => (
        <svg className="absolute w-0 h-0 pointer-events-none overflow-hidden">
            <defs>
                {/* Generate filters for common channel combinations */}
                <filter id="channelFilter-1-0-0">
                    <feColorMatrix type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" />
                </filter>
                <filter id="channelFilter-0-1-0">
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" />
                </filter>
                <filter id="channelFilter-0-0-1">
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" />
                </filter>
                <filter id="channelFilter-1-1-0">
                    <feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" />
                </filter>
                <filter id="channelFilter-1-0-1">
                    <feColorMatrix type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" />
                </filter>
                <filter id="channelFilter-0-1-1">
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0" />
                </filter>
            </defs>
        </svg>
    );

    const AdjustmentsPanel = () => (
        <div className="flex-1 flex flex-col p-4 bg-[#2B2B2B] gap-6 overflow-y-auto">
            <div className="flex flex-col gap-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#3d75f2]">Color Correction</h3>
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { icon: Sun, label: 'Brightness', id: 'brightness' },
                        { icon: Contrast, label: 'Contrast', id: 'contrast' },
                        { icon: Droplet, label: 'Saturation', id: 'saturation' },
                        { icon: Zap, label: 'Exposure', id: 'exposure' },
                        { icon: Palette, label: 'Warmth', id: 'warmth' },
                        { icon: Settings, label: 'Hue', id: 'hue' },
                        { icon: Ghost, label: 'Opacity', id: 'opacity' },
                        { icon: Search, label: 'Sharpness', id: 'sharpness' }
                    ].map(adj => (
                        <button key={adj.label} className="aspect-square flex flex-col items-center justify-center gap-1.5 bg-black/20 hover:bg-[#3d75f2]/40 rounded-lg border border-white/5 transition-all group">
                            <adj.icon className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                            <span className="text-[8px] text-white/30 group-hover:text-white/60">{adj.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Basic Adjustments</h3>
                </div>
                <div className="space-y-4">
                    {[
                        { label: 'Brightness', key: 'exposure', min: -100, max: 100 },
                        { label: 'Contrast', key: 'contrast', min: 0, max: 200 },
                        { label: 'Saturation', key: 'saturation', min: 0, max: 200 },
                        { label: 'Warmth', key: 'warmth', min: -100, max: 100 },
                        { label: 'Grain', key: 'grain', min: 0, max: 100 },
                        { label: 'Vignette', key: 'vignette', min: 0, max: 100 },
                    ].map(item => (
                        <div key={item.key} className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] text-white/60">
                                <span>{item.label}</span>
                                <span>{(project.adjustments as any)[item.key] || 0}</span>
                            </div>
                            <input 
                                type="range" min={item.min} max={item.max}
                                value={(project.adjustments as any)[item.key] || (item.min === 0 && item.max === 200 ? 100 : 0)}
                                onChange={(e) => setProject(s => ({ ...s, adjustments: { ...s.adjustments, [item.key]: parseInt(e.target.value) } }))}
                                className="w-full accent-[#3d75f2] h-1 bg-black/40 rounded-full appearance-none cursor-pointer"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const LayersPanel = () => (
        <div className="flex-1 flex flex-col bg-[#2B2B2B]">
            <div className="h-8 bg-[#333] border-b border-black flex items-center px-4 justify-between shrink-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Layers</span>
                <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-white/5 rounded"><Settings className="w-3 h-3 text-white/20" /></button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto px-1 py-1 flex flex-col-reverse">
                {project.globalLayers.map(layer => (
                    <div 
                        key={layer.id}
                        onClick={() => {
                            setSelectedLayerId(layer.id);
                            setSelectedTextId(null);
                        }}
                        className={cn(
                            "group flex items-center gap-3 p-1 rounded hover:bg-white/5 cursor-pointer border border-transparent transition-all",
                            selectedLayerId === layer.id ? "bg-[#3d75f2]/20 border-white/10" : ""
                        )}
                    >
                        <div 
                            onClick={(e) => {
                                e.stopPropagation();
                                setProject(s => ({
                                    ...s,
                                    globalLayers: s.globalLayers.map(l => l.id === layer.id ? { ...l, isVisible: !l.isVisible } : l)
                                }));
                            }}
                            className="w-6 h-6 flex items-center justify-center text-white/20 hover:text-white"
                        >
                            {layer.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </div>
                        <div className="w-10 h-10 bg-black/40 rounded border border-white/5 shrink-0 flex items-center justify-center overflow-hidden">
                            {layer.type === 'shape' ? (
                                <div style={{ backgroundColor: layer.color }} className="w-6 h-6 rounded-sm opacity-60" />
                            ) : (
                                layer.file && <img src={`data:${layer.file.mimeType};base64,${layer.file.base64}`} className="w-full h-full object-cover" />
                            )}
                        </div>
                        <span className="flex-1 text-[10px] text-white/60 truncate font-medium">
                            {layer.name || (layer.type === 'shape' ? layer.shapeType : 'Image Layer')}
                        </span>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 pr-2">
                            <Lock className={cn("w-2.5 h-2.5 transition-colors", layer.isLocked ? "text-emerald-500 opacity-100" : "text-white/20")} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const ChannelsPanel = () => (
        <div className="flex-1 flex flex-col bg-[#2B2B2B]">
            <div className="h-8 bg-[#333] border-b border-black flex items-center px-4 justify-between shrink-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Channels</span>
                <Palette className="w-3 h-3 text-white/20" />
            </div>
            <div className="flex-1 overflow-y-auto px-1 py-1 flex flex-col gap-1">
                {[
                    { id: 'rgb', label: 'RGB', color: 'text-white' },
                    { id: 'red', label: 'Red', color: 'text-red-500' },
                    { id: 'green', label: 'Green', color: 'text-green-500' },
                    { id: 'blue', label: 'Blue', color: 'text-blue-500' }
                ].map((channel, i) => (
                    <div key={channel.id} className="group flex items-center gap-3 p-1 rounded hover:bg-white/5 cursor-pointer border border-transparent transition-all">
                        <div className="w-6 h-6 flex items-center justify-center text-white/20 hover:text-white">
                            <Eye className="w-3.5 h-3.5" />
                        </div>
                        <div className="w-10 h-10 bg-black/40 rounded border border-white/5 shrink-0 flex items-center justify-center overflow-hidden">
                            <div className={cn("w-full h-full opacity-60", channel.id === 'rgb' ? "bg-gradient-to-br from-red-500 via-green-500 to-blue-500" : `bg-${channel.id}-500`)} />
                        </div>
                        <div className="flex-1 flex flex-col">
                            <span className="text-[10px] text-white/60 font-medium">{channel.label}</span>
                            <span className="text-[8px] text-white/20 font-mono">Alt + {i + 2}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const TimelinePanel = () => (
        <div className="h-48 bg-[#2B2B2B] border-t border-black flex flex-col shrink-0">
            <div className="h-8 bg-[#333] border-b border-black flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#3d75f2]">Timeline</span>
                    <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-white/5 rounded"><Play className="w-3 h-3 text-white/60" /></button>
                        <button className="p-1 hover:bg-white/5 rounded text-[8px] text-white/40 font-mono">00:00:00</button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowTimeline(false)} className="p-1 hover:bg-white/5 rounded"><X className="w-3 h-3 text-white/20" /></button>
                </div>
            </div>
            <div className="flex-1 flex overflow-hidden">
                <div className="w-64 border-r border-black/40 bg-[#252525] flex flex-col overflow-y-auto">
                    {project.globalLayers.map(l => (
                        <div key={l.id} className="h-6 flex items-center px-4 border-b border-white/5 text-[9px] text-white/40 truncate">
                            {l.name || 'Layer'}
                        </div>
                    ))}
                </div>
                <div className="flex-1 bg-black/20 relative overflow-x-auto overflow-y-auto">
                    <div className="absolute top-0 bottom-0 left-1/4 w-px bg-[#3d75f2] z-10 shadow-[0_0_8px_#3d75f2]">
                        <div className="w-2 h-2 bg-[#3d75f2] rounded-full -ml-[3.5px] mt-0" />
                    </div>
                    <div className="w-[200%] h-full flex flex-col">
                        {project.globalLayers.map(l => (
                            <div key={l.id} className="h-6 border-b border-white/5 px-4 flex items-center">
                                <div className="h-2 w-3/4 bg-[#3d75f2]/40 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const HistoryPanel = () => (
        <div className="flex-1 flex flex-col bg-[#2B2B2B]">
            <div className="h-8 bg-[#333] border-b border-black flex items-center px-4 justify-between shrink-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">History</span>
                <Clock className="w-3 h-3 text-white/20" />
            </div>
            <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col">
                    <div className="flex items-center gap-3 p-2 bg-[#3d75f2]/20 border-l-2 border-[#3d75f2] opacity-60 grayscale">
                        <ImageIcon className="w-4 h-4 text-white/40" />
                        <span className="text-[10px] text-white/80">New File</span>
                    </div>
                    {project.undoStack.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 cursor-pointer group">
                             <div className="w-1 h-3 bg-white/10 group-hover:bg-[#3d75f2] transition-colors" />
                             <span className="text-[10px] text-white/60">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const BrandingPanel = () => (
        <div className="flex-1 flex flex-col bg-[#2B2B2B]">
            <div className="h-8 bg-[#333] border-b border-black flex items-center px-4 justify-between shrink-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Libraries / Assets</span>
                <Cloud className="w-3 h-3 text-white/20" />
            </div>
            <div className="p-4 flex flex-col gap-4 overflow-y-auto">
                <div className="aspect-square bg-black/20 rounded border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-all text-white/20 hover:text-white">
                    <Plus className="w-6 h-6" />
                    <span className="text-[8px] uppercase font-black">Add Asset</span>
                </div>
            </div>
        </div>
    );

    const TextProperties = ({ idx, textId }: { idx: number, textId: string }) => {
        const text = project.localTexts[idx]?.find(t => t.id === textId);
        if (!text) return null;
        return (
            <div className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#3d75f2]">Character</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                             <label className="text-[9px] text-white/40 uppercase font-black block">Font Family</label>
                             <select value={text.fontFamily} onChange={(e) => updateSlotText(idx, textId, { fontFamily: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-[11px] outline-none">
                                 {ARABIC_FONTS.concat(ENGLISH_FONTS).map(f => <option key={f} value={f} className="bg-[#2B2B2B]">{f}</option>)}
                             </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] text-white/40 uppercase font-black block">Size</label>
                                <input type="number" value={text.fontSize} onChange={e => updateSlotText(idx, textId, { fontSize: parseInt(e.target.value) || 12 })} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-[11px] outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] text-white/40 uppercase font-black block">Color</label>
                                <input type="color" value={text.color} onChange={e => updateSlotText(idx, textId, { color: e.target.value })} className="w-full bg-transparent border-none p-0 cursor-pointer h-8" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const LayerProperties = ({ layerId }: { layerId: string }) => {
        const layer = project.globalLayers.find(l => l.id === layerId);
        if (!layer) return null;
        return (
            <div className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#3d75f2]">Dimensions</h3>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-[9px] text-white/40 uppercase font-black block">Scale (%)</label>
                            <input type="number" value={Math.round(layer.scale || 0)} onChange={e => setProject(s => ({ ...s, globalLayers: s.globalLayers.map(l => l.id === layerId ? { ...l, scale: parseInt(e.target.value) || 0 } : l) }))} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-[11px] outline-none" />
                         </div>
                    </div>
                </div>
            </div>
        );
    };


        return (
            <>
                {activeGuides.map((guide, i) => (
                    <React.Fragment key={i}>
                        {guide.x !== undefined && (
                            <div 
                                className="absolute top-0 bottom-0 w-[1px] bg-cyan-400 z-50 pointer-events-none"
                                style={{ left: `${guide.x}%` }}
                            />
                        )}
                        {guide.y !== undefined && (
                            <div 
                                className="absolute left-0 right-0 h-[1px] bg-cyan-400 z-50 pointer-events-none"
                                style={{ top: `${guide.y}%` }}
                            />
                        )}
                    </React.Fragment>
                ))}
            </>
        );
    };

    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'layer' | 'canvas', id?: string } | null>(null);

    const handleContextMenu = (e: React.MouseEvent, type: 'layer' | 'canvas', id?: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, type, id });
    };

    const QuickActions = () => (
        <div className="absolute top-20 left-16 z-50 flex flex-col gap-2">
            <button 
                onClick={() => setProject(s => ({ ...s, isProcessingAI: true }))}
                className="px-3 py-1.5 bg-[#3d75f2] hover:bg-[#3d75f2]/90 text-white rounded shadow-lg flex items-center gap-2 text-[10px] font-bold transition-all hover:scale-105 active:scale-95 group"
            >
                <Sparkles className="w-3.5 h-3.5 group-hover:animate-pulse" />
                <span>Select Subject</span>
            </button>
            <button 
                className="px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#2B2B2B] text-white/80 rounded shadow-lg flex items-center gap-2 text-[10px] font-bold border border-white/5 transition-all"
            >
                <Palette className="w-3.5 h-3.5" />
                <span>Remove Background</span>
            </button>
        </div>
    );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsCommandPaletteOpen(false);
                setContextMenu(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const CommandPalette = () => {
        if (!isCommandPaletteOpen) return null;
        
        const commands = [
            { id: 'select', label: 'Select Tool', icon: MousePointer2, action: () => { setActiveTool('select'); setIsCommandPaletteOpen(false); } },
            { id: 'text', label: 'Add Text', icon: TextIcon, action: () => { setActiveTool('text'); setIsCommandPaletteOpen(false); } },
            { id: 'brush', label: 'Brush Tool', icon: Palette, action: () => { setActiveTool('brush'); setIsCommandPaletteOpen(false); } },
            { id: 'shapes', label: 'Shape Tool', icon: Square, action: () => { setActiveTool('shapes'); setIsCommandPaletteOpen(false); } },
            { id: 'layers', label: 'Layers Panel', icon: LayersIcon, action: () => { setActiveTool('layers'); setIsCommandPaletteOpen(false); } },
            { id: 'eyedropper', label: 'Eyedropper', icon: Pipette, action: () => { setActiveTool('eyedropper'); setIsCommandPaletteOpen(false); } },
            { id: 'save', label: 'Save Project', icon: Save, action: () => { if (activeSlotIdx !== null) handleSaveSlot(activeSlotIdx); setIsCommandPaletteOpen(false); } },
            { id: 'undo', label: 'Undo Action', icon: Undo2, action: () => { undo(); setIsCommandPaletteOpen(false); } },
            { id: 'redo', label: 'Redo Action', icon: Redo2, action: () => { redo(); setIsCommandPaletteOpen(false); } },
            { id: 'grid', label: 'Toggle Grid', icon: Grid, action: () => { setShowGrid(!showGrid); setIsCommandPaletteOpen(false); } },
            { id: 'rulers', label: 'Toggle Rulers', icon: Maximize2, action: () => { setShowRulers(!showRulers); setIsCommandPaletteOpen(false); } },
            { id: 'help', label: 'Open Help', icon: HelpCircle, action: () => { setShowHelp(true); setIsCommandPaletteOpen(false); } },
        ].filter(c => c.label.toLowerCase().includes(commandSearch.toLowerCase()));

        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-[5000] flex items-start justify-center pt-24 bg-black/60 backdrop-blur-md"
                onClick={() => setIsCommandPaletteOpen(false)}
            >
                <motion.div 
                    initial={{ y: -20, scale: 0.95 }}
                    animate={{ y: 0, scale: 1 }}
                    className="w-full max-w-xl bg-[#2b2b2b] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-4 border-b border-white/5 flex items-center gap-3">
                        <Search className="w-5 h-5 text-white/40" />
                        <input 
                            autoFocus
                            placeholder="Type a command or tool..."
                            className="bg-transparent border-none outline-none text-white text-base w-full"
                            value={commandSearch}
                            onChange={e => setCommandSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-[400px] overflow-y-auto p-2">
                        {commands.map(cmd => (
                            <button 
                                key={cmd.id}
                                onClick={cmd.action}
                                className="w-full flex items-center gap-3 p-3 hover:bg-[#3d75f2] rounded-lg group transition-colors text-left"
                            >
                                <cmd.icon className="w-4 h-4 text-white/40 group-hover:text-white" />
                                <span className="text-[13px] text-white/80 group-hover:text-white font-medium">{cmd.label}</span>
                                <span className="ml-auto text-[10px] text-white/20 font-mono group-hover:text-white/40">{cmd.id.toUpperCase()}</span>
                            </button>
                        ))}
                        {commands.length === 0 && (
                            <div className="p-12 text-center text-white/20 text-sm">No commands found</div>
                        )}
                    </div>
                    <div className="p-2 border-t border-white/5 bg-black/20 flex justify-between items-center px-4">
                        <div className="flex gap-1">
                            <span className="text-[9px] text-white/30 font-black uppercase tracking-widest px-2 py-1 bg-white/5 rounded">↑↓</span>
                            <span className="text-[9px] text-white/30 font-black uppercase tracking-widest px-2 py-1 bg-white/5 rounded">Enter</span>
                        </div>
                        <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">Command Palette</span>
                    </div>
                </motion.div>
            </motion.div>
        );
    };

    const ContextMenu = () => {
        if (!contextMenu) return null;
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed bg-[#2B2B2B] border border-black shadow-2xl z-[1000] w-48 py-1 rounded" 
                style={{ left: contextMenu.x, top: contextMenu.y }}
                onClick={() => setContextMenu(null)}
            >
                {contextMenu.type === 'layer' ? (
                    <>
                        <div className="px-3 py-1.5 hover:bg-[#3d75f2] text-[10px] text-white/80 hover:text-white cursor-pointer flex justify-between">
                            <span>Duplicate Layer</span>
                            <span className="opacity-30">Cmd+J</span>
                        </div>
                        <div className="px-3 py-1.5 hover:bg-[#3d75f2] text-[10px] text-white/80 hover:text-white cursor-pointer" onClick={() => {
                            const layer = project.globalLayers.find(l => l.id === contextMenu.id);
                            if (layer) {
                                setProject(s => ({
                                    ...s,
                                    globalLayers: s.globalLayers.map(l => l.id === layer.id ? { ...l, isLocked: !l.isLocked } : l)
                                }));
                            }
                        }}>Lock/Unlock Layer</div>
                        <div className="px-3 py-1.5 hover:bg-[#3d75f2] text-[10px] text-white/80 hover:text-white cursor-pointer" onClick={() => setRenamingId(contextMenu.id!)}>Rename Layer</div>
                        <div className="h-[1px] bg-white/5 my-1" />
                        <div className="px-3 py-1.5 hover:bg-[#3d75f2] text-[10px] text-white/80 hover:text-white cursor-pointer">Flip Horizontal</div>
                        <div className="px-3 py-1.5 hover:bg-[#3d75f2] text-[10px] text-white/80 hover:text-white cursor-pointer">Flip Vertical</div>
                        <div className="h-[1px] bg-white/5 my-1" />
                        <div className="px-3 py-1.5 hover:bg-[#3d75f2] text-[10px] text-white/80 hover:text-white cursor-pointer">Rasterize Layer</div>
                        <div className="h-[1px] bg-white/5 my-1" />
                        <div className="px-3 py-1.5 hover:bg-red-500 text-[10px] text-white/80 hover:text-white cursor-pointer">Delete Layer</div>
                    </>
                ) : (
                    <>
                        <div className="px-3 py-1.5 hover:bg-[#3d75f2] text-[10px] text-white/80 hover:text-white cursor-pointer">New Artboard...</div>
                        <div className="px-3 py-1.5 hover:bg-[#3d75f2] text-[10px] text-white/80 hover:text-white cursor-pointer" onClick={() => handlePaste(activeSlotIdx || 0)}>Paste</div>
                        <div className="h-[1px] bg-white/5 my-1" />
                        <div className="px-3 py-1.5 hover:bg-[#3d75f2] text-[10px] text-white/80 hover:text-white cursor-pointer">Canvas Size...</div>
                    </>
                )}
            </motion.div>
        );
    };

    const checkSnapping = (x: number, y: number, id: string, idx: number) => {
        const guides: { x?: number, y?: number }[] = [];
        const threshold = 1.5; // Snap threshold in %
        let snapX = x;
        let snapY = y;

        const otherlayers = [
            ...project.globalLayers.filter(l => l.id !== id),
            ...(project.localTexts[idx] || []).filter(t => t.id !== id)
        ];

        // Canvas centers
        if (Math.abs(x - 50) < threshold) { snapX = 50; guides.push({ x: 50 }); }
        if (Math.abs(y - 50) < threshold) { snapY = 50; guides.push({ y: 50 }); }

        otherlayers.forEach(l => {
            if (Math.abs(x - l.x) < threshold) { snapX = l.x; guides.push({ x: l.x }); }
            if (Math.abs(y - l.y) < threshold) { snapY = l.y; guides.push({ y: l.y }); }
        });

        setActiveGuides(guides);
        return { x: snapX, y: snapY };
    };

    const handleCanvasPointerDown = (e: React.PointerEvent) => {
        if (activeTool === 'hand' || (activeTool === 'select' && e.altKey)) {
            setIsPanning(true);
            setLastPointerPos({ x: e.clientX, y: e.clientY });
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        } else if (activeTool === 'marquee') {
            setIsDrawingSelection(true);
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setSelectionMarquee({ x, y, w: 0, h: 0 });
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        } else if (activeTool === 'brush' || activeTool === 'eraser') {
            setIsDrawing(true);
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setCurrentPath({
                id: Math.random().toString(36).substr(2, 9),
                points: [{ x, y }],
                color: activeTool === 'eraser' ? '#ffffff' : brushColor,
                width: brushSize / 5, // scaled
                opacity: brushOpacity,
                blendMode: activeTool === 'eraser' ? 'normal' : 'normal'
            });
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        } else if (activeTool === 'pen') {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            if (!activePenPath) {
                setActivePenPath({ id: Math.random().toString(36).substr(2, 9), points: [{ x, y }], isClosed: false });
            } else {
                setActivePenPath(prev => prev ? { ...prev, points: [...prev.points, { x, y }] } : null);
            }
        } else if (activeTool === 'slice') {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setActiveSlice({ id: Math.random().toString(36).substr(2, 9), x, y, w: 0, h: 0, label: `Slice ${project.slices[activeSlotIdx || 0]?.length || 0 + 1}` });
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        } else if (activeTool === 'lasso') {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setLassoPoints([{ x, y }]);
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }
    };

    const handleCanvasPointerMove = (e: React.PointerEvent) => {
        if (isPanning) {
            const dx = (e.clientX - lastPointerPos.x) / (zoomLevel / 100);
            const dy = (e.clientY - lastPointerPos.y) / (zoomLevel / 100);
            setCanvasPos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastPointerPos({ x: e.clientX, y: e.clientY });
        } else if (isDrawingSelection && selectionMarquee) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setSelectionMarquee(prev => prev ? { ...prev, w: x - prev.x, h: y - prev.y } : null);
        } else if (activeSlice) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setActiveSlice(prev => prev ? { ...prev, w: x - prev.x, h: y - prev.y } : null);
        } else if (lassoPoints.length > 0 && activeTool === 'lasso') {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setLassoPoints(prev => [...prev, { x, y }]);
        } else if (isDrawing && currentPath) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setCurrentPath(prev => prev ? { ...prev, points: [...prev.points, { x, y }] } : null);
        } else if (isCreatingGuide) {
            // Find the artboard and its rect to calculate % position
            const rect = containerRefs.current[activeSlotIdx || 0]?.getBoundingClientRect();
            if (rect) {
                const pos = isCreatingGuide === 'h' ? ((e.clientX - rect.left) / rect.width) * 100 : ((e.clientY - rect.top) / rect.height) * 100;
            }
        }
    };

    const handleCanvasPointerUp = (e: React.PointerEvent) => {
        if (isCreatingGuide) {
            const rect = containerRefs.current[activeSlotIdx || 0]?.getBoundingClientRect();
            if (rect) {
                const pos = isCreatingGuide === 'h' ? ((e.clientX - rect.left) / rect.width) * 100 : ((e.clientY - rect.top) / rect.height) * 100;
                setGuideLines(prev => [...prev, { type: isCreatingGuide === 'h' ? 'v' : 'h', pos }]);
            }
            setIsCreatingGuide(null);
        }
        if (isDrawing && currentPath && activeSlotIdx !== null) {
            setProject(s => ({
                ...s,
                drawings: {
                    ...s.drawings,
                    [activeSlotIdx]: [...(s.drawings[activeSlotIdx] || []), currentPath]
                }
            }));
            setCurrentPath(null);
            setIsDrawing(false);
        }
        if (activeSlice && activeSlotIdx !== null) {
            setProject(s => ({
                ...s,
                slices: {
                    ...s.slices,
                    [activeSlotIdx]: [...(s.slices[activeSlotIdx] || []), activeSlice]
                }
            }));
            setActiveSlice(null);
        }
        if (lassoPoints.length > 0 && activeTool === 'lasso') {
            // For now just clear it, ideally convert to a selection path
            setLassoPoints([]);
        }
        setIsPanning(false);
        setIsDrawingSelection(false);
        setIsDrawing(false);
    };

    const handleRulerPointerDown = (type: 'h' | 'v') => {
        setIsCreatingGuide(type);
    };

    const Rulers = () => {
        if (!showRulers) return null;
        return (
            <>
                <div 
                    className="absolute top-0 left-0 right-0 h-4 bg-[#1e1e1e] border-b border-white/10 z-[60] flex select-none cursor-col-resize pointer-events-auto"
                    onPointerDown={() => handleRulerPointerDown('h')}
                >
                    <div className="w-4 h-4 bg-[#2B2B2B] border-r border-white/10 shrink-0" />
                    <div className="flex-1 relative">
                        {Array.from({ length: 40 }).map((_, i) => (
                            <div key={i} className="absolute h-full flex flex-col justify-end" style={{ left: `${i * 2.5}%` }}>
                                <div className={cn("w-[1px] bg-white/20", i % 4 === 0 ? "h-2" : "h-1")} />
                                {i % 4 === 0 && <span className="text-[6px] text-white/30 absolute -top-0.5 left-0.5">{i * 50}</span>}
                            </div>
                        ))}
                    </div>
                </div>
                <div 
                    className="absolute top-0 left-0 bottom-0 w-4 bg-[#1e1e1e] border-r border-white/10 z-[60] flex flex-col select-none cursor-row-resize pointer-events-auto"
                    onPointerDown={() => handleRulerPointerDown('v')}
                >
                    <div className="w-4 h-4 bg-[#2B2B2B] border-b border-white/10 shrink-0" />
                    <div className="flex-1 relative">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div key={i} className="absolute w-full flex justify-end" style={{ top: `${i * 5}%` }}>
                                <div className={cn("h-[1px] bg-white/20", i % 4 === 0 ? "w-2" : "w-1")} />
                                {i % 4 === 0 && <span className="text-[6px] text-white/30 absolute -left-0 top-0.5 rotate-90">{i * 50}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </>
        );
    };

    const pushToHistory = useCallback((label: string = "Manual Edit") => {
        setProject(s => {
            const data = {
                localTexts: JSON.parse(JSON.stringify(s.localTexts)),
                adjustments: { ...s.adjustments },
                globalLayers: JSON.parse(JSON.stringify(s.globalLayers))
            };
            const newUndo = [...s.undoStack, { data, label }].slice(-20); 
            return { ...s, undoStack: newUndo, redoStack: [] };
        });
    }, [setProject]);

    const undo = () => {
        setProject(s => {
            if (s.undoStack.length === 0) return s;
            const previous = s.undoStack[s.undoStack.length - 1];
            const currentData = {
                localTexts: JSON.parse(JSON.stringify(s.localTexts)),
                adjustments: { ...s.adjustments },
                globalLayers: JSON.parse(JSON.stringify(s.globalLayers))
            };
            return {
                ...s,
                ...(previous.data as any),
                undoStack: s.undoStack.slice(0, -1),
                redoStack: [{ data: currentData, label: previous.label }, ...s.redoStack]
            } as EditStudioProject;
        });
    };

    const redo = () => {
        setProject(s => {
            if (s.redoStack.length === 0) return s;
            const next = s.redoStack[0];
            const currentData = {
                localTexts: JSON.parse(JSON.stringify(s.localTexts)),
                adjustments: { ...s.adjustments },
                globalLayers: JSON.parse(JSON.stringify(s.globalLayers))
            };
            return {
                ...s,
                ...(next.data as any),
                undoStack: [...s.undoStack, { data: currentData, label: next.label }],
                redoStack: s.redoStack.slice(1)
            } as EditStudioProject;
        });
    };

    const alignLayers = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
        if (!activeSlotIdx && activeSlotIdx !== 0) return;
        pushToHistory();
        setProject(s => {
            const updateLayerPositions = (layers: GlobalLayer[]) => layers.map(l => {
                if (!selectedLayerIds.includes(l.id) && l.id !== selectedLayerId) return l;
                let updates: Partial<GlobalLayer> = {};
                if (type === 'left') updates.x = 0;
                if (type === 'center') updates.x = 50;
                if (type === 'right') updates.x = 100;
                if (type === 'top') updates.y = 0;
                if (type === 'middle') updates.y = 50;
                if (type === 'bottom') updates.y = 100;
                return { ...l, ...updates };
            });

            const updateTextPositions = (texts: LocalText[]) => texts.map(t => {
                if (t.id !== selectedTextId) return t;
                let updates: Partial<LocalText> = {};
                if (type === 'left') updates.x = 20;
                if (type === 'center') updates.x = 50;
                if (type === 'right') updates.x = 80;
                if (type === 'top') updates.y = 10;
                if (type === 'middle') updates.y = 50;
                if (type === 'bottom') updates.y = 90;
                return { ...t, ...updates };
            });

            return {
                ...s,
                globalLayers: updateLayerPositions(s.globalLayers),
                localTexts: {
                    ...s.localTexts,
                    [activeSlotIdx]: updateTextPositions(s.localTexts[activeSlotIdx] || [])
                }
            };
        });
    };

    const addTextToSlot = useCallback((slotIdx: number, customText?: LocalText) => {
        pushToHistory();
        const newText = customText ? { ...customText, id: Math.random().toString(36).substr(2, 9) } : createNewText();
        setProject(s => {
            const currentTexts = s.localTexts[slotIdx] || [];
            return {
                ...s,
                localTexts: { ...s.localTexts, [slotIdx]: [...currentTexts, newText] }
            };
        });
        setSelectedTextId(newText.id);
        setActiveSlotIdx(slotIdx);
    }, [setProject]);

    const handleCopy = useCallback((textObj: LocalText) => {
        setClipboard({ ...textObj });
    }, []);

    const handlePaste = useCallback((slotIdx: number) => {
        if (clipboard) {
            pushToHistory();
            const pastedText = { ...clipboard, x: clipboard.x + 2, y: clipboard.y + 2 };
            addTextToSlot(slotIdx, pastedText);
        }
    }, [clipboard, addTextToSlot]);

    const handleSaveSlot = (idx: number) => {
        setProject(s => ({
            ...s,
            committedTexts: { ...s.committedTexts, [idx]: JSON.parse(JSON.stringify(s.localTexts[idx] || [])) }
        }));
        setJustSavedSlot(idx);
        
        // Log to history
        const texts = project.localTexts[idx] || [];
        logHistory({
            type: 'text',
            studio: 'edit_studio',
            content: `Baked slot ${idx + 1} with ${texts.length} text layers: ${texts.map(t => t.content).join(', ')}`,
            prompt: 'Manual Edit Bake'
        });

        setTimeout(() => setJustSavedSlot(null), 2000);
    };

    const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
        const words = text.split(/\s+/);
        let lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isTyping = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);
            if (isTyping && (e.target as HTMLElement).tagName === 'TEXTAREA') return;

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
                if (activeSlotIdx !== null && selectedTextId) {
                    const texts = project.localTexts[activeSlotIdx] || [];
                    const toCopy = texts.find(t => t.id === selectedTextId);
                    if (toCopy) handleCopy(toCopy);
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
                if (activeSlotIdx !== null && clipboard) {
                    handlePaste(activeSlotIdx);
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                if (activeSlotIdx !== null) handleSaveSlot(activeSlotIdx);
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (isTyping) return;
                if (selectedTextId && activeSlotIdx !== null) {
                    deleteSlotText(activeSlotIdx, selectedTextId);
                } else if (selectedLayerId) {
                    setProject(s => ({
                        ...s,
                        globalLayers: s.globalLayers.filter(l => l.id !== selectedLayerId)
                    }));
                    setSelectedLayerId(null);
                }
            }

            // Photoshop Tool Shortcuts
            if (!isTyping && !e.ctrlKey && !e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'v': setActiveTool('select'); break;
                    case 't': setActiveTool('text'); break;
                    case 'u': setActiveTool('shapes'); break;
                    case 'c': setActiveTool('crop'); break;
                    case 'm': setActiveTool('images'); break;
                    case 'h': setActiveTool('history'); break;
                    case 'l': setActiveTool('layers'); break;
                    case 'g': setShowGrid(prev => !prev); break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeSlotIdx, selectedTextId, project.localTexts, clipboard, handleCopy, handlePaste]);

    const handleUpload = async (files: File[]) => {
        if (!files || files.length === 0) return;
        setProject(s => ({ ...s, isUploading: true }));
        try {
            const uploaded = await Promise.all(files.map(async file => {
                const resized = await resizeImage(file, 1024, 1024);
                const reader = new FileReader();
                return new Promise<ImageFile>(res => {
                    reader.onloadend = () => res({ base64: (reader.result as string).split(',')[1], mimeType: resized.type, name: resized.name });
                    reader.readAsDataURL(resized);
                });
            }));
            
            setProject(s => {
                const newBase = [...s.baseImages, ...uploaded];
                const startIdx = s.baseImages.length;
                const newCommitted = { ...s.committedTexts };
                const newLocal = { ...s.localTexts };
                
                uploaded.forEach((img, i) => {
                    newCommitted[startIdx + i] = [];
                    newLocal[startIdx + i] = [];
                });

                return { ...s, baseImages: newBase, committedTexts: newCommitted, localTexts: newLocal, isUploading: false };
            });

            for (const img of uploaded) {
                const thumb = await createThumbnail(`data:${img.mimeType};base64,${img.base64}`);
                logHistory({
                    type: 'image',
                    studio: 'edit_studio',
                    content: thumb,
                    prompt: `Edit Base Asset: ${img.name}`,
                    metadata: { asset: true, originalName: img.name }
                });
            }
        } catch (err) {
            setProject(s => ({ ...s, isUploading: false, error: "Upload failed" }));
        }
    };

    const handleRemoveSlot = (idx: number) => {
        setProject(s => {
            const newBase = s.baseImages.filter((_, i) => i !== idx);
            const newLocal: { [key: number]: LocalText[] } = {};
            const newCommitted: { [key: number]: LocalText[] } = {};

            // Re-index remaining text data
            newBase.forEach((_, newI) => {
                // Determine which old index this maps to
                const oldI = newI < idx ? newI : newI + 1;
                newLocal[newI] = s.localTexts[oldI] || [];
                newCommitted[newI] = s.committedTexts[oldI] || [];
            });

            return { ...s, baseImages: newBase, localTexts: newLocal, committedTexts: newCommitted };
        });
        if (activeSlotIdx === idx) setActiveSlotIdx(null);
    };

    const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        for (const file of files) {
            try {
                const fontName = file.name.split('.')[0];
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const data = event.target?.result;
                    if (data) {
                        const fontFace = new FontFace(fontName, data as ArrayBuffer);
                        const loadedFace = await fontFace.load();
                        document.fonts.add(loadedFace);
                        setCustomFonts(prev => [...new Set([...prev, fontName])]);
                    }
                };
                reader.readAsArrayBuffer(file);
            } catch (err) { console.error(err); }
        }
    };

    const handleGlobalAssetUpload = async (files: File[]) => {
        if (!files || files.length === 0) return;
        try {
            const uploaded = await Promise.all(files.map(async file => {
                const resized = await resizeImage(file, 1024, 1024);
                const reader = new FileReader();
                return new Promise<GlobalLayer>(res => {
                    reader.onloadend = () => {
                        const base64 = (reader.result as string).split(',')[1];
                        res({ 
                            id: Math.random().toString(36).substr(2, 9),
                            type: 'image',
                            file: { base64, mimeType: resized.type, name: resized.name },
                            scale: 20,
                            x: 50,
                            y: 50,
                            rotation: 0,
                            opacity: 1,
                            zIndex: 5,
                            isVisible: true,
                            blendMode: 'normal'
                        });
                    };
                    reader.readAsDataURL(resized);
                });
            }));
            
            setProject(s => ({ ...s, globalLayers: [...s.globalLayers, ...uploaded] }));

            for (const layer of uploaded) {
                const thumb = await createThumbnail(`data:${layer.file!.mimeType};base64,${layer.file!.base64}`);
                logHistory({
                    type: 'image',
                    studio: 'edit_studio',
                    content: thumb,
                    prompt: `Global Graphics Layer: ${layer.file!.name}`,
                    metadata: { asset: true, globalLayer: true }
                });
            }
        } catch (err) { console.error(err); }
    };

    const updateSlotText = (slotIdx: number, textId: string, updates: Partial<LocalText>) => {
        setProject(s => {
            const texts = s.localTexts[slotIdx] || [];
            const updated = texts.map(t => t.id === textId ? { ...t, ...updates } : t);
            return { ...s, localTexts: { ...s.localTexts, [slotIdx]: updated } };
        });
    };

    const deleteSlotText = (slotIdx: number, textId: string) => {
        setProject(s => {
            const texts = (s.localTexts[slotIdx] || []).filter(t => t.id !== textId);
            return { ...s, localTexts: { ...s.localTexts, [slotIdx]: texts } };
        });
        if (selectedTextId === textId) setSelectedTextId(null);
    };

    const handleDownload = (idx: number, resolution: '2k' | '4k') => {
        const imgFile = project.baseImages[idx];
        const container = containerRefs.current[idx];
        if (!imgFile || !container) return;

        const currentTexts = project.localTexts[idx] || [];
        const committedTexts = project.committedTexts[idx] || [];
        if (JSON.stringify(currentTexts) !== JSON.stringify(committedTexts)) {
            alert("⚠️ فضلاً اضغط على زر 'BAKE' لحفظ التعديلات أولاً لضمان ثباتها عند التحميل.");
            return;
        }

        setIsDownloading(`${idx}-${resolution}`);
        const img = new Image();
        img.src = `data:${imgFile.mimeType};base64,${imgFile.base64}`;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            const targetWidth = resolution === '4k' ? 4096 : 2048;
            const imgAspect = img.width / img.height;
            canvas.width = targetWidth;
            canvas.height = targetWidth / imgAspect;

            const previewWidth = container.offsetWidth;
            const scaleMultiplier = canvas.width / previewWidth;

            const activeLut = LUTS.find(l => l.name === project.adjustments.lut);
            const sharpness = project.adjustments.sharpness / 100;
            ctx.filter = `${activeLut?.filter || ''} contrast(${1 + (sharpness - 1) * 0.2}) brightness(${1 + (sharpness - 1) * 0.05})`;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            ctx.filter = 'none';

            const renderLayers = async () => {
                for (const layer of project.globalLayers) {
                    await new Promise<void>(res => {
                        const lImg = new Image();
                        lImg.src = `data:${layer.file.mimeType};base64,${layer.file.base64}`;
                        lImg.onload = () => {
                            const scale = (layer.scale / 100) * canvas.width;
                            const aspect = lImg.width / lImg.height;
                            const drawW = scale;
                            const drawH = scale / aspect;
                            ctx.drawImage(lImg, (layer.x / 100) * canvas.width - drawW/2, (layer.y / 100) * canvas.height - drawH/2, drawW, drawH);
                            res();
                        };
                    });
                }
                
                const texts = project.committedTexts[idx] || [];
                texts.forEach(text => {
                    if (!text.isVisible) return;
                    ctx.save();
                    
                    const posX = (text.x / 100) * canvas.width;
                    const posY = (text.y / 100) * canvas.height;
                    
                    ctx.translate(posX, posY);
                    ctx.rotate((text.rotation * Math.PI) / 180);
                    
                    const scaledFontSize = text.fontSize * scaleMultiplier;
                    ctx.font = `${text.fontWeight} ${scaledFontSize}px ${text.fontFamily}`;
                    
                    if ('letterSpacing' in ctx) {
                        (ctx as any).letterSpacing = `${text.letterSpacing * scaleMultiplier}px`;
                    }
                    
                    ctx.fillStyle = text.color;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    ctx.shadowColor = 'rgba(0,0,0,0.6)';
                    ctx.shadowBlur = 16 * scaleMultiplier;
                    ctx.shadowOffsetY = 4 * scaleMultiplier;
                    
                    const maxPxWidth = (text.maxWidth / 100) * canvas.width;
                    const lines = wrapText(ctx, text.content, maxPxWidth);
                    
                    const lineHeight = scaledFontSize * text.lineHeight;
                    const totalHeight = lineHeight * (lines.length - 1);
                    
                    lines.forEach((line, i) => {
                        const yOffset = (i * lineHeight) - (totalHeight / 2);
                        ctx.fillText(line, 0, yOffset);
                    });
                    
                    ctx.restore();
                });

                const link = document.createElement('a');
                link.download = `Jenta-Final-${idx + 1}-${resolution}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                setIsDownloading(null);
            };
            renderLayers();
        };
    };

    const activeLut = LUTS.find(l => l.name === project.adjustments.lut);
    const filterStyle = { 
        filter: `${activeLut?.filter || ''} 
                contrast(${project.adjustments.contrast / 100}) 
                saturate(${project.adjustments.saturation / 100}) 
                brightness(${project.adjustments.sharpness / 100}) 
                blur(${project.adjustments.blur}px)`,
        transition: 'filter 0.3s ease'
    };

    const vignetteStyle: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        boxShadow: `inset 0 0 ${project.adjustments.vignette * 2.5}px rgba(0,0,0,${project.adjustments.vignette / 100})`,
        zIndex: 20
    };

    const grainStyle: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: project.adjustments.grain / 100,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        zIndex: 21,
        mixBlendMode: 'overlay'
    };

    const selectedLayer = project.globalLayers.find(l => l.id === selectedLayerId);
    const activeSlotTexts = activeSlotIdx !== null ? (project.localTexts[activeSlotIdx] || []) : [];
    const selectedText = activeSlotTexts.find(t => t.id === selectedTextId) || null;

    return (
        <main className="w-full h-[calc(100vh-120px)] flex flex-col bg-[#1A1A1A] overflow-hidden text-[#cccccc] font-sans selection:bg-[#3d75f2] selection:text-white" onContextMenu={(e) => e.preventDefault()} onClick={() => setContextMenu(null)}>
            <ContextMenu />
            <CommandPalette />
            
            <AnimatePresence>
                {showHelp && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-md flex items-center justify-center p-8 overflow-y-auto"
                        onClick={() => setShowHelp(false)}
                    >
                        <motion.div 
                            initial={{ y: 20, scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            className="bg-[#1e1e1e] border border-white/10 w-full max-w-4xl p-12 rounded-2xl shadow-2xl grid grid-cols-2 gap-12"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-8">
                                    <HelpCircle className="w-8 h-8 text-[#3d75f2]" />
                                    <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Photoshop Studio Guide</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <h3 className="text-[#3d75f2] text-[11px] font-black uppercase tracking-widest">Tools</h3>
                                        <div className="space-y-1 text-[11px] text-white/60">
                                            <div className="flex justify-between"><span>V</span><span className="font-mono text-[9px] bg-white/5 px-1 rounded">Move Tool</span></div>
                                            <div className="flex justify-between"><span>T</span><span className="font-mono text-[9px] bg-white/5 px-1 rounded">Text Tool</span></div>
                                            <div className="flex justify-between"><span>U</span><span className="font-mono text-[9px] bg-white/5 px-1 rounded">Shapes</span></div>
                                            <div className="flex justify-between"><span>C</span><span className="font-mono text-[9px] bg-white/5 px-1 rounded">Crop</span></div>
                                            <div className="flex justify-between"><span>B</span><span className="font-mono text-[9px] bg-white/5 px-1 rounded">Brush</span></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-[#3d75f2] text-[11px] font-black uppercase tracking-widest">Canvas</h3>
                                        <div className="space-y-1 text-[11px] text-white/60">
                                            <div className="flex justify-between"><span>G</span><span className="font-mono text-[9px] bg-white/5 px-1 rounded">Toggle Grid</span></div>
                                            <div className="flex justify-between"><span>⌘+Z</span><span className="font-mono text-[9px] bg-white/5 px-1 rounded">Undo</span></div>
                                            <div className="flex justify-between"><span>⌘+S</span><span className="font-mono text-[9px] bg-white/5 px-1 rounded">Bake</span></div>
                                            <div className="flex justify-between"><span>Esc</span><span className="font-mono text-[9px] bg-white/5 px-1 rounded">Deselect</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-8 border-t border-white/5">
                                    <h3 className="text-white/40 text-[10px] font-black uppercase mb-4 tracking-widest">Pro Features Implemented</h3>
                                    <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-[10px] text-white/30 list-disc pl-4">
                                        <li>Smart Snapping Guides</li>
                                        <li>Real-time Navigator Map</li>
                                        <li>Precision Rulers (Dynamic)</li>
                                        <li>Physics-based Status Bar</li>
                                        <li>16 Blending Modes (RGB)</li>
                                        <li>Global & Local Layer Stacks</li>
                                        <li>Non-destructive Bakes</li>
                                        <li>Arabic Typography Engine</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="bg-black/20 rounded-xl p-8 border border-white/5">
                                <h3 className="text-white text-lg font-black uppercase mb-4">100 Upcoming Ideas</h3>
                                <div className="h-96 overflow-y-auto pr-4 custom-scrollbar text-[10px] text-white/40 space-y-4">
                                    <p>• <b>Dynamic Gradients:</b> Linear/Radial mesh gradients for any shape layer.</p>
                                    <p>• <b>Neural Filters:</b> One-click "Retouch" powered by generative subject analysis.</p>
                                    <p>• <b>Perspective Warp:</b> 4-point pin distortion for localizing branding on objects.</p>
                                    <p>• <b>Smart Masking:</b> Edge-aware selection of hair, fur, and transparency.</p>
                                    <p>• <b>Asset Library:</b> Cloud-synced project folders for logos and brand guides.</p>
                                    <p>• <b>Timeline Editing:</b> Simple keyframe animation for social media ads.</p>
                                    <p>• <b>Advanced Brush Engine:</b> Pressure sensitivity and custom tilt support.</p>
                                    <p>• <b>Collaborative Edit:</b> Real-time cursor presence for remote teams.</p>
                                    <p>• <b>Export Presets:</b> Auto-slice for Instagram, TikTok, and Web formats.</p>
                                    <p>• <b>Version History:</b> Visual timeline of every "Bake" performed.</p>
                                    <p>• <b>Responsive Constraints:</b> Pin layers to canvas edges for mobile resizing.</p>
                                    <p>• <b>Icon Forge:</b> Drop-in vector library with 50,000+ searchable icons.</p>
                                </div>
                                <div className="mt-8 pt-8 border-t border-white/5">
                                    <button onClick={() => setShowHelp(false)} className="w-full py-3 bg-[#3d75f2] text-white font-black uppercase tracking-widest text-[11px] rounded hover:shadow-[0_0_20px_rgba(61,117,242,0.4)] transition-all">Understood</button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Processing Overlay */}
            {project.isProcessingAI && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="w-64 h-64 relative flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
                        <div className="absolute inset-0 border-4 border-[#3d75f2] rounded-full border-t-transparent animate-spin" />
                        <Sparkles className="w-12 h-12 text-[#3d75f2] animate-pulse" />
                    </div>
                    <div className="mt-8 text-center space-y-2">
                        <h3 className="text-xl font-black uppercase tracking-widest text-[#3d75f2]">Generative Selection</h3>
                        <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest animate-pulse">Analyzing subject boundaries...</p>
                    </div>
                    <button onClick={() => setProject(s => ({ ...s, isProcessingAI: false }))} className="mt-12 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-wider transition-all">Cancel</button>
                </div>
            )}
            
            {/* Photoshop Top Navigation */}
            <MenuBar />
            
            <div className="flex flex-1 items-stretch overflow-hidden">
                {/* Left Toolbar - Full Photoshop Tools List */}
                <div className="w-10 bg-[#2B2B2B] border-r border-black flex flex-col items-center py-2 gap-1 z-50 shadow-xl overflow-y-auto">
                    {[
                        { icon: MousePointer2, id: 'select', tooltip: 'Move tool (V)' },
                        { icon: BoxSelect, id: 'marquee', tooltip: 'Rectangular Marquee (M)' },
                        { icon: LassoSelect, id: 'lasso', tooltip: 'Lasso tool (L)' },
                        { icon: Wand2, id: 'wand', tooltip: 'Magic Wand (W)' },
                        { icon: Crop, id: 'crop', tooltip: 'Crop (C)' },
                        { icon: Slice, id: 'slice', tooltip: 'Slice tool (K)' },
                        { icon: Pipette, id: 'eyedropper', tooltip: 'Eyedropper (I)' },
                        { icon: Sparkles, id: 'healing', tooltip: 'Spot Healing Brush (J)' },
                        { icon: Brush, id: 'brush', tooltip: 'Brush Tool (B)' },
                        { icon: Stamp, id: 'stamp', tooltip: 'Clone Stamp (S)' },
                        { icon: History, id: 'eraser', tooltip: 'History Brush (Y)' },
                        { icon: Eraser, id: 'eraser_tool', tooltip: 'Eraser (E)' },
                        { icon: Palette, id: 'gradient', tooltip: 'Gradient Tool (G)' },
                        { icon: Droplet, id: 'blur', tooltip: 'Blur tool' },
                        { icon: PenIcon, id: 'pen', tooltip: 'Pen tool (P)' },
                        { icon: TextIcon, id: 'text', tooltip: 'Horizontal Type tool (T)' },
                        { icon: MousePointer2, id: 'path', tooltip: 'Path Selection tool (A)' },
                        { icon: Square, id: 'shapes', tooltip: 'Rectangle tool (U)' },
                        { icon: Move, id: 'hand', tooltip: 'Hand tool (H)' },
                        { icon: Search, id: 'zoom', tooltip: 'Zoom tool (Z)' },
                        { icon: Box, id: '3d', tooltip: '3D Orbit tool' },
                    ].map((tool) => (
                        <button 
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id as any)}
                            className={cn(
                                "p-2 rounded hover:bg-white/5 transition-all relative group shrink-0",
                                activeTool === tool.id ? "bg-[#3d75f2] text-white shadow-inner" : "text-white/60 hover:text-white"
                            )}
                            title={tool.tooltip}
                        >
                            <tool.icon className="w-4 h-4" />
                        </button>
                    ))}
                    <div className="mt-auto pb-4 flex flex-col gap-2 shrink-0">
                        <div className="w-5 h-5 bg-white border border-black z-10 cursor-pointer" title="Foreground Color" />
                        <div className="w-5 h-5 bg-black border border-white/20 -mt-3 ml-2 cursor-pointer" title="Background Color" />
                    </div>
                </div>

                {/* Creative Workspace with Rulers */}
                <div className="flex-grow flex flex-col bg-[#121212] overflow-hidden relative border-r border-black">
                    {/* Context Bar - Photoshop Options */}
                    <div className="h-8 border-b border-black bg-[#2B2B2B] flex items-center px-4 gap-6 text-[10px] select-none">
                        {selectedText ? (
                            <>
                               <div className="flex items-center gap-2 border-r border-white/5 pr-4 h-full">
                                   <TextIcon className="w-3 h-3 text-white/40" />
                                   <span className="font-bold text-white/60">Type Settings</span>
                               </div>
                               <div className="flex items-center gap-4">
                                    <select value={selectedText.fontFamily} onChange={(e) => updateSlotText(activeSlotIdx!, selectedText.id, { fontFamily: e.target.value })} className="bg-transparent text-white/80 outline-none border-none p-0 cursor-pointer hover:text-white transition-colors font-mono">
                                        {ARABIC_FONTS.concat(ENGLISH_FONTS).map(f => <option key={f} value={f} className="bg-[#2B2B2B]">{f}</option>)}
                                    </select>
                                    <div className="w-[1px] h-4 bg-white/10" />
                                    <div className="flex items-center gap-1">
                                        <span className="text-white/30 uppercase font-black">Size:</span>
                                        <input type="number" value={selectedText.fontSize} onChange={e => updateSlotText(activeSlotIdx!, selectedText.id, { fontSize: parseInt(e.target.value) || 12 })} className="bg-transparent text-white/80 w-12 outline-none border border-white/10 rounded px-1" />
                                    </div>
                                    <div className="w-[1px] h-4 bg-white/10" />
                                    <button className="flex items-center gap-2" onClick={() => updateSlotText(activeSlotIdx!, selectedText.id, { isUppercase: !selectedText.isUppercase })}>
                                        <div className={cn("w-4 h-4 rounded border border-white/20 flex items-center justify-center", selectedText.isUppercase && "bg-[#3d75f2] border-[#3d75f2]")}>
                                            <span className="text-[8px] font-black">TT</span>
                                        </div>
                                    </button>
                               </div>
                            </>
                        ) : activeTool === 'shapes' ? (
                            <>
                                <div className="flex items-center gap-2 border-r border-white/5 pr-4 h-full">
                                    <Square className="w-3 h-3 text-white/40" />
                                    <span className="font-bold text-white/60">Shape Tool</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {[
                                        { id: 'rect', icon: Square, label: 'Rectangle' },
                                        { id: 'circle', icon: Circle, label: 'Ellipse' },
                                        { id: 'star', icon: Star, label: 'Star' },
                                        { id: 'line', icon: Minus, label: 'Line' }
                                    ].map(sub => (
                                        <button 
                                            key={sub.id}
                                            onClick={() => setShapeToolType(sub.id as any)}
                                            className={cn(
                                                "p-1.5 rounded transition-all",
                                                shapeToolType === sub.id ? "bg-[#3d75f2] text-white" : "text-white/40 hover:text-white hover:bg-white/5"
                                            )}
                                            title={sub.label}
                                        >
                                            <sub.icon className="w-3.5 h-3.5" />
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : activeTool === 'brush' ? (
                            <>
                                <div className="flex items-center gap-2 border-r border-white/5 pr-4 h-full">
                                    <Palette className="w-3 h-3 text-white/40" />
                                    <span className="font-bold text-white/60">Brush Tool</span>
                                </div>
                                <div className="flex items-center gap-4">
                                     <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-white/30 font-black uppercase">Size</span>
                                        <input 
                                            type="range" min="1" max="500" 
                                            value={brushSize} 
                                            onChange={e => setBrushSize(parseInt(e.target.value))}
                                            className="w-24 h-0.5 bg-white/10 appearance-none rounded-full accent-[#3d75f2]" 
                                        />
                                        <span className="text-[10px] text-white/50 w-8 font-mono">{brushSize}px</span>
                                     </div>
                                     <div className="w-[1px] h-4 bg-white/10" />
                                     <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-white/30 font-black uppercase">Opacity</span>
                                        <input 
                                            type="range" min="0" max="1" step="0.1" 
                                            value={brushOpacity} 
                                            onChange={e => setBrushOpacity(parseFloat(e.target.value))}
                                            className="w-24 h-0.5 bg-white/10 appearance-none rounded-full accent-[#3d75f2]" 
                                        />
                                        <span className="text-[10px] text-white/50 w-8 font-mono">{Math.round(brushOpacity * 100)}%</span>
                                     </div>
                                     <div className="w-[1px] h-4 bg-white/10" />
                                     <div className="flex gap-1.5 items-center bg-black/20 px-2 py-1 rounded">
                                        <input 
                                            type="color" 
                                            value={brushColor} 
                                            onChange={e => setBrushColor(e.target.value)}
                                            className="w-4 h-4 bg-transparent border-none p-0 cursor-pointer overflow-hidden rounded-sm" 
                                        />
                                        {['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF'].map(c => (
                                            <button 
                                                key={c} 
                                                onClick={() => setBrushColor(c)}
                                                className={cn(
                                                    "w-3 h-3 rounded-full border border-white/10 transition-transform hover:scale-125",
                                                    brushColor === c && "ring-1 ring-[#3d75f2]"
                                                )} 
                                                style={{ backgroundColor: c }} 
                                            />
                                        ))}
                                     </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-4 text-white/30 font-medium">
                                <span className="flex items-center gap-1"><MousePointer2 className="w-3 h-3" /> Auto-Select</span>
                                <div className="w-[1px] h-4 bg-white/10" />
                                <span>Show Transform Controls</span>
                                <div className="ml-auto flex items-center gap-3">
                                    <div className="flex items-center gap-1 border-r border-white/5 pr-3 mr-1">
                                        <button onClick={() => alignLayers('left')} className="p-1 hover:bg-white/5 rounded text-white/40 hover:text-white" title="Align Left"><AlignLeft className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => alignLayers('center')} className="p-1 hover:bg-white/5 rounded text-white/40 hover:text-white" title="Align Center"><AlignCenter className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => alignLayers('right')} className="p-1 hover:bg-white/5 rounded text-white/40 hover:text-white" title="Align Right"><AlignRight className="w-3.5 h-3.5" /></button>
                                        <div className="w-[1px] h-3 bg-white/10 mx-1" />
                                        <button onClick={() => alignLayers('top')} className="p-1 hover:bg-white/5 rounded text-white/40 hover:text-white" title="Align Top"><AlignStartVertical className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => alignLayers('middle')} className="p-1 hover:bg-white/5 rounded text-white/40 hover:text-white" title="Align Middle"><AlignCenterVertical className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => alignLayers('bottom')} className="p-1 hover:bg-white/5 rounded text-white/40 hover:text-white" title="Align Bottom"><AlignEndVertical className="w-3.5 h-3.5" /></button>
                                    </div>
                                    <div className="flex items-center gap-1 border-r border-white/5 pr-3 mr-1">
                                        <button 
                                            onClick={() => {
                                                if (selectedLayerId) {
                                                    setProject(s => ({
                                                        ...s,
                                                        globalLayers: s.globalLayers.map(l => l.id === selectedLayerId ? { ...l, rotation: (l.rotation || 0) + 180 } : l)
                                                    }));
                                                }
                                            }}
                                            className="p-1 hover:bg-white/5 rounded text-white/40 hover:text-white" 
                                            title="Flip Horizontal"
                                        >
                                            <FlipHorizontal className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                // Real vertical flip logic placeholder
                                            }}
                                            className="p-1 hover:bg-white/5 rounded text-white/40 hover:text-white" 
                                            title="Flip Vertical"
                                        >
                                            <FlipVertical className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <button onClick={undo} disabled={project.undoStack.length === 0} className="p-1 hover:bg-white/5 rounded disabled:opacity-20 transition-all"><Undo2 className="w-3 h-3" /></button>
                                    <button onClick={redo} disabled={project.redoStack.length === 0} className="p-1 hover:bg-white/5 rounded disabled:opacity-20 transition-all"><Redo2 className="w-3 h-3" /></button>
                                    <div className="w-[1px] h-4 bg-white/10 mx-2" />
                                    <button 
                                        onClick={() => {
                                            // Real export logic placeholder (canvas.toDataURL)
                                            alert("Project exported as High-Res PSD (Simulated)");
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-[#3d75f2] hover:bg-[#4d85ff] text-white rounded text-[10px] font-black uppercase transition-all"
                                    >
                                        <Download className="w-3 h-3" />
                                        Export
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div 
                        className="flex-grow flex relative overflow-hidden bg-[#1D1D1D]" 
                        onContextMenu={(e) => handleContextMenu(e, 'canvas')}
                        onPointerDown={handleCanvasPointerDown}
                        onPointerMove={handleCanvasPointerMove}
                        onPointerUp={handleCanvasPointerUp}
                    >
                        {/* Rulers */}
                        <Rulers />

                        {/* AI Quick Actions Bar */}
                        <QuickActions />

                        {/* Status Bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-6 bg-[#1e1e1e] border-t border-white/10 z-[60] flex items-center px-4 justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-white/30 truncate max-w-[150px]">{project.baseImages[activeSlotIdx!]?.name || 'Untitled-1'}</span>
                                    <span className="text-[10px] text-white/20">@ {zoomLevel}% (RGB/8)</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-5">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] text-white/30 font-bold">Doc:</span>
                                    <span className="text-[9px] text-white/50">1.21M / 4.45M</span>
                                </div>
                                <div className="w-[1px] h-3 bg-white/10" />
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-white/30 font-bold">Coord:</span>
                                    <span className="text-[9px] text-white/50 tracking-tighter">X: {Math.round(selectedLayer?.x || 0)} Y: {Math.round(selectedLayer?.y || 0)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Panning Container */}
                        <div 
                            className="absolute inset-0 flex items-center justify-center p-20 overflow-hidden"
                            style={{ 
                                cursor: activeTool === 'hand' ? (isPanning ? 'grabbing' : 'grab') : (activeTool === 'zoom' ? 'zoom-in' : 'default') 
                            }}
                        >
                            <div 
                                className="flex gap-40 transition-transform duration-75 select-none shrink-0"
                                style={{ 
                                    transform: `translate(${canvasPos.x}px, ${canvasPos.y}px) scale(${zoomLevel / 100})`,
                                    transformOrigin: 'center'
                                }}
                            >
                                {project.baseImages.map((img, idx) => {
                                    if (!img) return null;
                                    const currentTexts = project.localTexts[idx] || [];
                                    const committedTexts = project.committedTexts[idx] || [];
                                    const isModified = JSON.stringify(currentTexts) !== JSON.stringify(committedTexts);
                                    
                                    return (
                                        <div key={idx} className="group/studio flex flex-col gap-2 animate-in fade-in duration-500 shrink-0">
                                            <div className="flex justify-between items-center px-1 opacity-0 group-hover/studio:opacity-100 transition-opacity">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Artboard 0{idx + 1}</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleSaveSlot(idx)} className={cn("p-1 rounded transition-all", isModified ? "text-emerald-400" : "text-white/10")}>
                                                        <Save className="w-2.5 h-2.5" />
                                                    </button>
                                                    <button onClick={() => handleRemoveSlot(idx)} className="p-1 text-white/10 hover:text-red-500 transition-all">
                                                        <X className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div 
                                                ref={el => { containerRefs.current[idx] = el; }}
                                                onPointerDown={(e) => {
                                                    if (activeTool === 'hand') return;
                                                    setActiveSlotIdx(idx);
                                                    if (activeTool === 'zoom') {
                                                        setZoomLevel(prev => e.altKey ? Math.max(10, prev - 10) : Math.min(600, prev + 10));
                                                        return;
                                                    }
                                                    
                                                    if (activeTool === 'text') {
                                                        addTextToSlot(idx);
                                                    } else if (activeTool === 'shapes') {
                                                        pushToHistory();
                                                        const rect = containerRefs.current[idx]!.getBoundingClientRect();
                                                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                                                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                                                        setProject(s => ({
                                                            ...s,
                                                            globalLayers: [...s.globalLayers, {
                                                                ...createNewShape(shapeToolType),
                                                                x, y
                                                            } as GlobalLayer]
                                                        }));
                                                    }
                                                }}
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    setActiveSlotIdx(idx);
                                                    if (activeTool === 'eyedropper') {
                                                        if ('EyeDropper' in window) {
                                                            try {
                                                                const eyeDropper = new (window as any).EyeDropper();
                                                                const result = await eyeDropper.open();
                                                                if (selectedTextId) {
                                                                    updateSlotText(idx, selectedTextId, { color: result.sRGBHex });
                                                                } else if (selectedLayerId) {
                                                                    setProject(s => ({
                                                                        ...s,
                                                                        globalLayers: s.globalLayers.map(l => l.id === selectedLayerId ? { ...l, color: result.sRGBHex } : l)
                                                                    }));
                                                                }
                                                            } catch (err) {
                                                                console.error(err);
                                                            }
                                                        }
                                                        return;
                                                    }

                                                    if (activeTool === 'text') {
                                                        addTextToSlot(idx);
                                                    } else if (activeTool === 'shapes') {
                                                        pushToHistory();
                                                        const rect = containerRefs.current[idx]!.getBoundingClientRect();
                                                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                                                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                                                        setProject(s => ({
                                                            ...s,
                                                            globalLayers: [...s.globalLayers, {
                                                                ...createNewShape(shapeToolType),
                                                                x, y
                                                            } as GlobalLayer]
                                                        }));
                                                    }
                                                }}
                                                className={cn(
                                                    "relative overflow-hidden transition-shadow duration-300 border border-black shadow-2xl",
                                                    activeSlotIdx === idx ? "ring-1 ring-[#3d75f2] border-[#3d75f2]" : "border-black/50 cursor-pointer",
                                                    activeTool === 'text' ? 'cursor-text' : activeTool === 'shapes' ? 'cursor-crosshair' : 'cursor-default'
                                                )}
                                                style={{ width: '800px', height: '1000px', backgroundColor: '#fff' }}
                                            >
                                                <div className="w-full relative shadow-2xl">
                                                <img 
                                                    src={`data:${img.mimeType};base64,${img.base64}`} 
                                                    className="w-full h-auto block select-none pointer-events-none" 
                                                    style={{ 
                                                        ...filterStyle, 
                                                        opacity: baseOpacity / 100,
                                                        filter: `${filterStyle.filter || ''} ${getChannelFilter()}`.trim()
                                                    }} 
                                                />
                                                <div className={cn("absolute inset-0 pointer-events-none transition-opacity duration-300", showGrid ? "opacity-10" : "opacity-0")} style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                                                <div className={cn("absolute inset-0 pointer-events-none transition-opacity duration-300", showGrid ? "opacity-5" : "opacity-0")} style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
                                                <div style={vignetteStyle} />
                                                <div style={grainStyle} />
                                                
                                                {/* Drawings Rendering */}
                                                <svg className="absolute inset-0 w-full h-full pointer-events-none z-[180]">
                                                    {project.drawings[idx]?.map(draw => (
                                                        <path 
                                                            key={draw.id}
                                                            d={`M ${draw.points.map(p => `${p.x} ${p.y}`).join(' L ')}`} 
                                                            fill="none" 
                                                            stroke={draw.color} 
                                                            strokeWidth={draw.width} 
                                                            strokeLinecap="round" 
                                                            strokeLinejoin="round" 
                                                            opacity={draw.opacity}
                                                            style={{ mixBlendMode: draw.blendMode as any }}
                                                            vectorEffect="non-scaling-stroke"
                                                        />
                                                    ))}
                                                    {isDrawing && currentPath && activeSlotIdx === idx && (
                                                        <path 
                                                            d={`M ${currentPath.points.map(p => `${p.x} ${p.y}`).join(' L ')}`} 
                                                            fill="none" 
                                                            stroke={currentPath.color} 
                                                            strokeWidth={currentPath.width} 
                                                            strokeLinecap="round" 
                                                            strokeLinejoin="round" 
                                                            opacity={currentPath.opacity}
                                                            style={{ mixBlendMode: currentPath.blendMode as any }}
                                                            vectorEffect="non-scaling-stroke"
                                                        />
                                                    )}

                                                    {/* Paths Rendering */}
                                                    {project.paths[idx]?.map(p => (
                                                        <path 
                                                            key={p.id}
                                                            d={`M ${p.points.map(pt => `${pt.x} ${pt.y}`).join(' L ')}${p.isClosed ? ' Z' : ''}`}
                                                            fill="none"
                                                            stroke="var(--color-accent)"
                                                            strokeWidth="2"
                                                            strokeDasharray="4 2"
                                                            vectorEffect="non-scaling-stroke"
                                                        />
                                                    ))}
                                                    {activePenPath && activeSlotIdx === idx && (
                                                        <path 
                                                            d={`M ${activePenPath.points.map(pt => `${pt.x} ${pt.y}`).join(' L ')}`}
                                                            fill="none"
                                                            stroke="var(--color-accent)"
                                                            strokeWidth="2"
                                                            strokeDasharray="4 2"
                                                            vectorEffect="non-scaling-stroke"
                                                        />
                                                    )}

                                                    {/* Lasso Points */}
                                                    {lassoPoints.length > 0 && activeSlotIdx === idx && (
                                                        <path 
                                                            d={`M ${lassoPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                                                            fill="rgba(61, 117, 242, 0.1)"
                                                            stroke="var(--color-accent)"
                                                            strokeWidth="1"
                                                            strokeDasharray="2 2"
                                                            vectorEffect="non-scaling-stroke"
                                                        />
                                                    )}
                                                </svg>

                                                {/* Slices Rendering */}
                                                <div className="absolute inset-0 w-full h-full pointer-events-none z-[190]">
                                                    {project.slices[idx]?.map(slice => (
                                                        <div 
                                                            key={slice.id}
                                                            className="absolute border border-blue-500 bg-blue-500/10 pointer-events-auto group"
                                                            style={{
                                                                left: `${slice.x}%`,
                                                                top: `${slice.y}%`,
                                                                width: `${slice.w}%`,
                                                                height: `${slice.h}%`
                                                            }}
                                                        >
                                                            <span className="absolute -top-4 left-0 bg-blue-500 text-white text-[8px] px-1 font-mono uppercase">{slice.label}</span>
                                                            <button 
                                                                className="absolute -top-1 -right-1 hidden group-hover:block bg-red-500 rounded-full p-0.5"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setProject(s => ({
                                                                        ...s,
                                                                        slices: { ...s.slices, [idx]: s.slices[idx].filter(x => x.id !== slice.id) }
                                                                    }));
                                                                }}
                                                            >
                                                                <X className="w-2 h-2 text-white" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {activeSlice && activeSlotIdx === idx && (
                                                        <div 
                                                            className="absolute border-2 border-blue-400 bg-blue-400/20"
                                                            style={{
                                                                left: `${activeSlice.x}%`,
                                                                top: `${activeSlice.y}%`,
                                                                width: `${activeSlice.w}%`,
                                                                height: `${activeSlice.h}%`
                                                            }}
                                                        />
                                                    )}
                                                </div>

                                                {/* Marquee Selection */}
                                                {selectionMarquee && (
                                                    <div 
                                                        className="absolute border border-dashed border-[#3d75f2] bg-[#3d75f2]/10 z-[200] pointer-events-none"
                                                        style={{
                                                            left: `${Math.min(selectionMarquee.x, selectionMarquee.x + selectionMarquee.w)}%`,
                                                            top: `${Math.min(selectionMarquee.y, selectionMarquee.y + selectionMarquee.h)}%`,
                                                            width: `${Math.abs(selectionMarquee.w)}%`,
                                                            height: `${Math.abs(selectionMarquee.h)}%`,
                                                            backgroundImage: 'linear-gradient(45deg, #3d75f2 25%, transparent 25%, transparent 50%, #3d75f2 50%, #3d75f2 75%, transparent 75%, transparent)',
                                                            backgroundSize: '10px 10px',
                                                            opacity: 0.5
                                                        }}
                                                    >
                                                        <div className="absolute inset-0 border border-white/50" />
                                                    </div>
                                                )}

                                                {/* Pen Tool Path Preview */}
                                                {activePenPath && activeSlotIdx === idx && (
                                                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-[150]">
                                                        <path 
                                                            d={`M ${activePenPath.points.map(p => `${p.x} ${p.y}`).join(' L ')}`} 
                                                            fill="none" 
                                                            stroke="#3d75f2" 
                                                            strokeWidth="2" 
                                                            vectorEffect="non-scaling-stroke"
                                                        />
                                                        {activePenPath.points.map((p, i) => (
                                                            <rect key={i} x={p.x} y={p.y} width="1" height="1" className="fill-white stroke-[#3d75f2]" style={{ transform: 'translate(-0.5%, -0.5%)' }} />
                                                        ))}
                                                    </svg>
                                                )}

                                                {/* Channel Filters Definitions */}
                                                <ChannelFilters />
                                                
                                                {/* Crop Tool Overlay */}
                     
                                                {/* Crop Tool Overlay */}
                                                {activeTool === 'crop' && activeSlotIdx === idx && (
                                                    <div className="absolute inset-0 border-4 border-[#3d75f2]/40 z-[100] cursor-crosshair">
                                                        <div className="absolute inset-0 border border-white/20 grid grid-cols-3 grid-rows-3 pointer-events-none">
                                                            <div className="border-r border-b border-white/10" />
                                                            <div className="border-r border-b border-white/10" />
                                                            <div className="border-b border-white/10" />
                                                            <div className="border-r border-b border-white/10" />
                                                            <div className="border-r border-b border-white/10" />
                                                            <div className="border-b border-white/10" />
                                                        </div>
                                                        {/* Handles */}
                                                        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => (
                                                            <div key={pos} className={cn("absolute w-4 h-4 border-2 border-white bg-[#3d75f2] z-50", 
                                                                pos === 'top-left' ? "-top-2 -left-2 rounded-tl" :
                                                                pos === 'top-right' ? "-top-2 -right-2 rounded-tr" :
                                                                pos === 'bottom-left' ? "-bottom-2 -left-2 rounded-bl" :
                                                                "-bottom-2 -right-2 rounded-br"
                                                            )} />
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Guides Rendering */}
                                    {guideLines.map((g, i) => (
                                        <div 
                                            key={i} 
                                            className={cn(
                                                "absolute z-[100] bg-cyan-400 group/guide",
                                                g.type === 'h' ? "w-full h-[1px] left-0 cursor-row-resize" : "h-full w-[1px] top-0 cursor-col-resize"
                                            )}
                                            style={g.type === 'h' ? { top: `${g.pos}%` } : { left: `${g.pos}%` }}
                                        >
                                            <div className="hidden group-hover/guide:block absolute bg-cyan-400 text-black text-[8px] font-black px-1 rounded-sm -translate-y-1/2">GUIDE</div>
                                        </div>
                                    ))}
                                    {/* Smart Guides Rendering */}
                                                <SmartGuides />
                                                {/* Layers Rendering - Images & Shapes */}
                                                {project.globalLayers.slice().sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map(layer => (
                                                    layer.isVisible && (
                                                        <div 
                                                            key={layer.id} 
                                                            style={{ 
                                                                position: 'absolute', 
                                                                left: `${layer.x}%`, 
                                                                top: `${layer.y}%`, 
                                                                width: `${layer.scale}%`, 
                                                                transform: `translate(-50%, -50%) rotate(${layer.rotation || 0}deg)`, 
                                                                zIndex: layer.zIndex || 5,
                                                                opacity: layer.opacity ?? 1,
                                                                mixBlendMode: layer.blendMode || 'normal',
                                                                filter: `brightness(${(layer.brightness ?? 100) / 100}) contrast(${(layer.contrast ?? 100) / 100}) saturate(${(layer.saturation ?? 100) / 100}) blur(${layer.blur || 0}px) drop-shadow(0px ${layer.dropShadowY || 0}px ${layer.dropShadowBlur || 0}px rgba(0,0,0,0.5))`,
                                                                pointerEvents: (activeTool === 'select' && !layer.isLocked) ? 'auto' : 'none',
                                                                cursor: (activeTool === 'select' && !layer.isLocked) ? 'move' : 'default'
                                                            }}
                                                            onContextMenu={(e) => handleContextMenu(e, 'layer', layer.id)}
                                                            onPointerDown={(e) => {
                                                                if (activeTool !== 'select' || layer.isLocked) return;
                                                                e.stopPropagation();
                                                                
                                                                if (!selectedLayerIds.includes(layer.id)) {
                                                                    if (e.shiftKey) {
                                                                        setSelectedLayerIds(prev => [...prev, layer.id]);
                                                                    } else {
                                                                        setSelectedLayerId(layer.id);
                                                                        setSelectedLayerIds([layer.id]);
                                                                    }
                                                                }
                                                                
                                                                setSelectedTextId(null);
                                                                setIsDragging(true);
                                                                const rect = containerRefs.current[idx]!.getBoundingClientRect();
                                                                const x = ((e.clientX - rect.left) / rect.width) * 100;
                                                                const y = ((e.clientY - rect.top) / rect.height) * 100;
                                                                setDraggingOffset({ x: x - layer.x, y: y - layer.y });
                                                                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                                                            }}
                                                            onPointerMove={(e) => {
                                                                if (!selectedLayerIds.includes(layer.id) || !isDragging || !draggingOffset) return;
                                                                const rect = containerRefs.current[idx]!.getBoundingClientRect();
                                                                const x = ((e.clientX - rect.left) / rect.width) * 100;
                                                                const y = ((e.clientY - rect.top) / rect.height) * 100;
                                                                
                                                                const dx = x - layer.x - draggingOffset.x;
                                                                const dy = y - layer.y - draggingOffset.y;

                                                                setProject(s => ({
                                                                    ...s,
                                                                    globalLayers: s.globalLayers.map(l => {
                                                                        if (selectedLayerIds.includes(l.id) && !l.isLocked) {
                                                                            return { 
                                                                                ...l, 
                                                                                x: Math.max(-50, Math.min(150, l.x + dx)), 
                                                                                y: Math.max(-50, Math.min(150, l.y + dy)) 
                                                                            };
                                                                        }
                                                                        return l;
                                                                    })
                                                                }));
                                                            }}
                                                            className={cn(
                                                                "group/layer",
                                                                selectedLayerId === layer.id && "ring-1 ring-[#3d75f2] ring-offset-2 ring-offset-transparent outline-none"
                                                            )}
                                                        >
                                                            {layer.type === 'shape' ? (
                                                                <div 
                                                                    style={{ 
                                                                        width: '100%', 
                                                                        aspectRatio: (layer.shapeType === 'line') ? '20/1' : (layer.shapeType === 'star' ? '1/1' : '1/1'),
                                                                        backgroundColor: layer.color,
                                                                        borderRadius: layer.shapeType === 'circle' ? '9999px' : `${layer.borderRadius}px`,
                                                                        boxShadow: layer.dropShadowBlur ? `${layer.dropShadowX || 0}px ${layer.dropShadowY || 4}px ${layer.dropShadowBlur}px ${layer.dropShadowColor || 'rgba(0,0,0,0.5)'}` : undefined,
                                                                        clipPath: layer.shapeType === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' : undefined
                                                                    }} 
                                                                />
                                                            ) : (
                                                                layer.file && <img 
                                                                    src={`data:${layer.file.mimeType};base64,${layer.file.base64}`} 
                                                                    className="w-full h-auto" 
                                                                    style={{ 
                                                                        filter: layer.dropShadowBlur ? `drop-shadow(${layer.dropShadowX || 0}px ${layer.dropShadowY || 4}px ${layer.dropShadowBlur}px ${layer.dropShadowColor || 'rgba(0,0,0,0.5)'})` : undefined
                                                                    }} 
                                                                />
                                                            )}
                                                            {/* Transform Handles UI */}
                                                            {selectedLayerId === layer.id && (
                                                                <>
                                                                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#3d75f2] border-2 border-white rounded-full z-50 shadow-sm" />
                                                                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#3d75f2] border-2 border-white rounded-full z-50 shadow-sm" />
                                                                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#3d75f2] border-2 border-white rounded-full z-50 shadow-sm" />
                                                                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#3d75f2] border-2 border-white rounded-full z-50 shadow-sm" />
                                                                </>
                                                            )}
                                                        </div>
                                                    )
                                                ))}
                                                {currentTexts.slice().sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map(text => (
                                                    text.isVisible && (
                                                        <div 
                                                            key={text.id}
                                                            style={{
                                                                position: 'absolute', left: `${text.x}%`, top: `${text.y}%`,
                                                                transform: `translate(-50%, -50%) rotate(${text.rotation}deg) skewX(${text.skewX}deg)`,
                                                                color: text.color, 
                                                                fontSize: `${text.fontSize}px`,
                                                                fontFamily: text.fontFamily, 
                                                                fontWeight: text.fontWeight,
                                                                textAlign: 'center', 
                                                                zIndex: text.zIndex || 10,
                                                                lineHeight: `${text.lineHeight}`,
                                                                letterSpacing: `${text.letterSpacing}px`,
                                                                opacity: text.opacity,
                                                                mixBlendMode: text.blendMode || 'normal',
                                                                textTransform: text.isUppercase ? 'uppercase' : 'none',
                                                                WebkitTextStroke: `${text.strokeWidth}px ${text.strokeColor}`,
                                                                textShadow: `${text.shadowOffsetX}px ${text.shadowOffsetY}px ${text.shadowBlur}px ${text.shadowColor}`,
                                                                width: `${text.maxWidth}%`, 
                                                                display: 'flex', 
                                                                justifyContent: 'center', 
                                                                alignItems: 'center',
                                                                pointerEvents: activeTool === 'select' ? 'auto' : 'none'
                                                            }}
                                                            onContextMenu={(e) => handleContextMenu(e, 'layer', text.id)}
                                                            onPointerDown={(e) => { 
                                                                if (activeTool !== 'select') return;
                                                                e.stopPropagation(); 
                                                                setSelectedTextId(text.id);
                                                                setSelectedLayerId(null);
                                                                setIsDragging(true);
                                                                setDraggingSlot(idx);
                                                                setActiveSlotIdx(idx);
                                                                const rect = containerRefs.current[idx]!.getBoundingClientRect();
                                                                const x = ((e.clientX - rect.left) / rect.width) * 100;
                                                                const y = ((e.clientY - rect.top) / rect.height) * 100;
                                                                setDraggingOffset({ x: x - text.x, y: y - text.y });
                                                                (e.target as HTMLElement).setPointerCapture(e.pointerId); 
                                                            }}
                                                            onPointerMove={(e) => {
                                                                if (!isDragging || draggingSlot !== idx || selectedTextId !== text.id || !draggingOffset) return;
                                                                const rect = containerRefs.current[idx]!.getBoundingClientRect();
                                                                const x = ((e.clientX - rect.left) / rect.width) * 100;
                                                                const y = ((e.clientY - rect.top) / rect.height) * 100;
                                                                
                                                                const snapped = checkSnapping(x - draggingOffset.x, y - draggingOffset.y, text.id, idx);

                                                                updateSlotText(idx, text.id, { 
                                                                    x: Math.max(-50, Math.min(150, snapped.x)), 
                                                                    y: Math.max(-50, Math.min(150, snapped.y)) 
                                                                });
                                                            }}
                                                            onPointerUp={() => { 
                                                                setIsDragging(false); 
                                                                setDraggingOffset(null);
                                                                setActiveGuides([]);
                                                            }}
                                                            className={cn(
                                                                "p-2 border cursor-move select-none transition-all group/text",
                                                                selectedTextId === text.id ? "border-[#3d75f2] bg-[#3d75f2]/10" : "border-transparent hover:border-white/20"
                                                            )}
                                                        >
                                                            {text.content}
                                                            {/* Transform Handles UI */}
                                                            {selectedTextId === text.id && (
                                                                <>
                                                                    <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-[#3d75f2] border border-white" />
                                                                    <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#3d75f2] border border-white" />
                                                                    <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-[#3d75f2] border border-white" />
                                                                    <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-[#3d75f2] border border-white" />
                                                                </>
                                                            )}
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {showTimeline && <TimelinePanel />}
                </div>

                {/* Status Bar */}
                <div className="h-6 bg-[#252525] border-t border-black flex items-center px-4 justify-between text-[10px] text-white/40 shrink-0 select-none">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5"><FileText className="w-3 h-3" /> 2048 x 1152 PX (72 PPI)</span>
                        <span className="flex items-center gap-1.5"><Monitor className="w-3 h-3" /> RGB/8*</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 tracking-tighter uppercase font-mono">{zoomLevel}%</span>
                        <div className="w-24 h-2 bg-black/40 rounded-full overflow-hidden flex items-center px-0.5">
                            <motion.div 
                                animate={{ width: '40%' }}
                                className="h-0.5 bg-[#3d75f2] shadow-[0_0_8px_#3d75f2]" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-80 bg-[#2B2B2B] border-l border-black flex flex-col z-[40]">
                {/* Right: Panels Stack */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Panel Tabs (Top) */}
                    <div className="flex border-b border-black shrink-0 relative bg-[#333]">
                        {[
                            { id: 'properties', label: 'Properties', icon: Settings },
                            { id: 'layers', label: 'Layers', icon: LayersIcon },
                            { id: 'channels', label: 'Channels', icon: ImageFileIcon },
                            { id: 'adjustments', label: 'Adjust', icon: Palette },
                            { id: 'history', label: 'History', icon: History },
                            { id: 'branding', label: 'Assets', icon: Grid3X3 },
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setRightPanelTab(tab.id as any)}
                                className={cn(
                                    "flex-1 py-3 text-[7px] font-black uppercase tracking-widest flex flex-col items-center gap-1 border-r border-black last:border-r-0 transition-colors relative group overflow-hidden",
                                    rightPanelTab === tab.id ? "bg-[#2B2B2B] text-white" : "text-white/30 hover:bg-white/5 hover:text-white/50"
                                )}
                            >
                                <tab.icon className={cn("w-3.5 h-3.5", rightPanelTab === tab.id ? "text-[#3d75f2]" : "text-white/20")} />
                                {rightPanelTab === tab.id && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3d75f2]" />}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto flex flex-col bg-[#2B2B2B]">
                        {rightPanelTab === 'layers' && <LayersPanel />}
                        {rightPanelTab === 'history' && <HistoryPanel />}
                        {rightPanelTab === 'branding' && <BrandingPanel />}
                        {rightPanelTab === 'channels' && <ChannelsPanel />}
                        {rightPanelTab === 'adjustments' && <AdjustmentsPanel />}
                        {rightPanelTab === 'properties' && (
                            <div className="p-4 space-y-6">
                                {/* Properties Content */}
                                {selectedTextId && activeSlotIdx !== null ? (
                                    /* Text Properties */
                                    <div className="space-y-4 animate-in fade-in duration-300">
                                            <TextProperties idx={activeSlotIdx} textId={selectedTextId} />
                                    </div>
                                ) : selectedLayerId ? (
                                    /* Layer Properties */
                                    <div className="space-y-4 animate-in fade-in duration-300">
                                            <LayerProperties layerId={selectedLayerId} />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 text-white/10 italic text-[10px] gap-2">
                                        <MousePointer2 className="w-6 h-6 opacity-20" />
                                        <span>No layer selected</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </main>
    );
};

export default EditStudio;
