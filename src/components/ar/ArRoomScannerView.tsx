/**
 * ISAMS - Mobile AR Room Scanner & Spatial Document Annotation Studio
 * Uses Live Camera / Phone Sync Feed with Interactive 3D Spatial Overlay Reticle
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Smartphone, 
  QrCode, 
  Sparkles, 
  Plus, 
  MapPin, 
  FileText, 
  Tag, 
  Trash2, 
  CheckCircle2, 
  Eye, 
  Layers, 
  RefreshCw, 
  Info, 
  X, 
  Search, 
  Compass, 
  Maximize2,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Upload
} from 'lucide-react';
import { Asset, LocationNode, RoomScanSession, ArSpatialAnchor, ArDocumentAnnotation } from '../../types/isams';
import { api } from '../../services/api';

interface ArRoomScannerViewProps {
  assets: Asset[];
  locations: LocationNode[];
  currentUser: any;
  onSelectAsset?: (asset: Asset) => void;
}

export const ArRoomScannerView: React.FC<ArRoomScannerViewProps> = ({
  assets,
  locations,
  currentUser,
  onSelectAsset
}) => {
  // Room Scans State
  const [scans, setScans] = useState<RoomScanSession[]>([]);
  const [activeScanId, setActiveScanId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Camera & Stream State
  const [cameraMode, setCameraMode] = useState<'webcam' | 'sample' | 'upload'>('sample');
  const [webcamActive, setWebcamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Crosshair & Placing Reticle
  const [reticlePos, setReticlePos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredAnchor, setHoveredAnchor] = useState<ArSpatialAnchor | null>(null);
  const [selectedAnchor, setSelectedAnchor] = useState<ArSpatialAnchor | null>(null);

  // New Annotation Modal / Form
  const [isAnnotating, setIsAnnotating] = useState<boolean>(false);
  const [newAnchorPos, setNewAnchorPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [areaTitle, setAreaTitle] = useState<string>('');
  const [areaType, setAreaType] = useState<ArSpatialAnchor['area_type']>('shelf');
  const [badgeColor, setBadgeColor] = useState<string>('bg-blue-500');
  const [notes, setNotes] = useState<string>('');
  
  // Document "X" & "Y" Inputs
  const [docXTitle, setDocXTitle] = useState<string>('Document X: Expansion Contract');
  const [docXType, setDocXType] = useState<string>('Legal Agreement');
  const [docYTitle, setDocYTitle] = useState<string>('Document Y: HIPAA Audit Log');
  const [docYType, setDocYType] = useState<string>('Compliance Record');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');

  // Mobile Pairing Modal State
  const [isPairModalOpen, setIsPairModalOpen] = useState<boolean>(false);
  const [pairData, setPairData] = useState<{ pair_code: string; pair_url: string } | null>(null);
  const [pairQrDataUrl, setPairQrDataUrl] = useState<string>('');

  // AI Frame Analyzer State
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Search & Filter
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Load initial scans from server
  useEffect(() => {
    loadScans();
  }, []);

  const loadScans = async () => {
    try {
      setLoading(true);
      const data = await api.getRoomScans('org-1');
      setScans(data);
      if (data.length > 0 && !activeScanId) {
        setActiveScanId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load room scans:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentScan = scans.find(s => s.id === activeScanId) || scans[0];

  // Camera Management
  const startWebcam = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setWebcamActive(true);
      setCameraMode('webcam');
    } catch (err: any) {
      console.error('Webcam access error:', err);
      setCameraError('Camera access denied or unequipped. Switching to Interactive Room Backdrop Mode.');
      setCameraMode('sample');
      setWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  };

  useEffect(() => {
    if (cameraMode === 'webcam') {
      startWebcam();
    } else {
      stopWebcam();
    }
    return () => stopWebcam();
  }, [cameraMode]);

  // Handle clicking canvas to drop pin
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    setNewAnchorPos({ x, y });
    setAreaTitle(`Storage Spot (${x}%, ${y}%)`);
    setIsAnnotating(true);
  };

  // Mobile Pairing Handler
  const handleOpenMobilePair = async () => {
    setIsPairModalOpen(true);
    try {
      const data = await api.pairMobileSession();
      setPairData(data);
      const qrDataUrl = await api.renderQrCode(data.pair_url);
      setPairQrDataUrl(qrDataUrl);
    } catch (err) {
      console.error('Failed to initiate phone pairing:', err);
    }
  };

  // Submit Annotation
  const handleSaveAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentScan || !areaTitle.trim()) return;

    const docs: ArDocumentAnnotation[] = [];
    if (docXTitle.trim()) {
      docs.push({
        id: `doc-${Date.now()}-1`,
        doc_code: 'DOC-X',
        title: docXTitle.trim(),
        type: docXType || 'Document X',
        added_at: new Date().toISOString()
      });
    }
    if (docYTitle.trim()) {
      docs.push({
        id: `doc-${Date.now()}-2`,
        doc_code: 'DOC-Y',
        title: docYTitle.trim(),
        type: docYType || 'Document Y',
        added_at: new Date().toISOString()
      });
    }

    try {
      await api.addAnchorToRoomScan(currentScan.id, {
        x: newAnchorPos.x,
        y: newAnchorPos.y,
        z_depth: Math.round((1 + Math.random() * 2) * 10) / 10,
        title: areaTitle.trim(),
        area_type: areaType,
        documents: docs,
        color: badgeColor,
        notes,
        associated_asset_id: selectedAssetId || null,
        user_id: currentUser?.id,
        user_name: currentUser?.name
      });

      await loadScans();
      setIsAnnotating(false);
      setAreaTitle('');
      setNotes('');
    } catch (err: any) {
      alert(`Failed to save AR annotation: ${err.message}`);
    }
  };

  // Delete Anchor
  const handleDeleteAnchor = async (anchorId: string) => {
    if (!currentScan) return;
    if (!confirm('Are you sure you want to remove this AR spatial annotation pin?')) return;

    try {
      await api.deleteAnchorFromRoomScan(currentScan.id, anchorId);
      await loadScans();
      setSelectedAnchor(null);
    } catch (err: any) {
      alert(`Failed to delete anchor: ${err.message}`);
    }
  };

  // AI Frame Analysis Trigger
  const handleAiScanFrame = async () => {
    setAiAnalyzing(true);
    setAiResult(null);
    try {
      const res = await api.aiAnalyzeFrame();
      setAiResult(res);
      if (res) {
        setAreaTitle(res.suggested_title || 'Detected Document Shelf');
        setAreaType(res.area_type || 'shelf');
        if (res.detected_documents && res.detected_documents.length >= 2) {
          setDocXTitle(res.detected_documents[0].title);
          setDocXType(res.detected_documents[0].type);
          setDocYTitle(res.detected_documents[1].title);
          setDocYType(res.detected_documents[1].type);
        }
        setIsAnnotating(true);
      }
    } catch (err) {
      console.error('AI Scan Error:', err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  if (loading || !currentScan) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-400 mb-3" />
        <p className="text-xs">Initializing Augmented Reality Spatial Workspace...</p>
      </div>
    );
  }

  // Filter anchors
  const filteredAnchors = currentScan.anchors.filter(a => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.documents.some(d => d.title.toLowerCase().includes(q) || d.doc_code.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Camera className="w-4 h-4 text-indigo-400" /> Mobile AR Spatial Room Mapping
          </div>
          <h2 className="text-xl font-bold text-white">Augmented Reality Room & Document Annotator</h2>
          <p className="text-xs text-slate-300 mt-1">
            Scan physical rooms with phone camera, drop persistent 3D spatial pins, and annotate exact locations for Document X & Document Y.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenMobilePair}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Smartphone className="w-4 h-4" /> Connect Phone Camera
          </button>

          <button
            onClick={handleAiScanFrame}
            disabled={aiAnalyzing}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" /> {aiAnalyzing ? 'AI Scanning...' : 'AI Auto-Detect Documents'}
          </button>
        </div>
      </div>

      {/* Main AR Workspace Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Room Sessions & Controls */}
        <div className="space-y-4">
          
          {/* Room Selector Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-400" /> Active Room Scans
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                {scans.length} Rooms
              </span>
            </div>

            <div className="space-y-2">
              {scans.map(scan => (
                <div
                  key={scan.id}
                  onClick={() => setActiveScanId(scan.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    activeScanId === scan.id
                      ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm'
                      : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold text-xs truncate">{scan.room_name}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">{scan.location_path}</div>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800 text-[10px]">
                    <span className="text-blue-400 font-semibold">{scan.anchors.length} AR Pins</span>
                    {scan.paired_device_connected ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Smartphone className="w-3 h-3" /> Mobile Paired
                      </span>
                    ) : (
                      <span className="text-slate-500">Standalone</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Camera Input Switcher */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-slate-800 pb-2">
              Camera Stream Mode
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCameraMode('webcam')}
                className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  cameraMode === 'webcam'
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" /> WebCam / Phone
              </button>

              <button
                onClick={() => setCameraMode('sample')}
                className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  cameraMode === 'sample'
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Room Backdrop
              </button>
            </div>

            {cameraError && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
                {cameraError}
              </div>
            )}
          </div>

          {/* Quick Search & Highlight */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <label className="text-xs font-bold text-white uppercase tracking-wider block">
              Search Document / Tag
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Highlight Doc X, Doc Y, Box..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

        </div>

        {/* Center Canvas Column: Interactive Live AR Viewport */}
        <div className="lg:col-span-3 space-y-4">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3">
            
            {/* Viewport Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-white">
                  {currentScan.room_name}
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  AR HUD ACTIVE
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                <Compass className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" />
                <span>Pitch: 0.4° | Roll: 0.1°</span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400">{filteredAnchors.length} Spatial Pins</span>
              </div>
            </div>

            {/* Live AR Spatial Reticle Canvas Container */}
            <div
              ref={containerRef}
              onClick={handleCanvasClick}
              onMouseMove={(e) => {
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                setReticlePos({
                  x: Math.round(((e.clientX - rect.left) / rect.width) * 100),
                  y: Math.round(((e.clientY - rect.top) / rect.height) * 100)
                });
              }}
              onMouseLeave={() => setReticlePos(null)}
              className="relative w-full h-[520px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 select-none group cursor-crosshair shadow-inner"
            >
              
              {/* Background 1: Live Video Feed */}
              {cameraMode === 'webcam' ? (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                /* Background 2: High-Res Room Photo */
                <img
                  src={currentScan.background_image}
                  alt={currentScan.room_name}
                  className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity"
                />
              )}

              {/* AR HUD Grid & Horizon Lines */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

              {/* Center Crosshair Target */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none border border-emerald-500/30 w-16 h-16 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              </div>

              {/* Mouse Reticle Tracking HUD */}
              {reticlePos && (
                <div
                  style={{ left: `${reticlePos.x}%`, top: `${reticlePos.y}%` }}
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-all duration-75 z-20"
                >
                  <div className="w-8 h-8 border border-blue-400 border-dashed rounded-full animate-spin-slow flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  </div>
                  <span className="absolute top-8 left-1/2 -translate-x-1/2 bg-slate-950/90 text-blue-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-blue-500/40 whitespace-nowrap shadow-lg">
                    [{reticlePos.x}%, {reticlePos.y}%] Tap to Annotate
                  </span>
                </div>
              )}

              {/* Render Persistent AR Spatial Pins / Anchors */}
              {filteredAnchors.map((anchor) => {
                const isSelected = selectedAnchor?.id === anchor.id;
                const isHighlighted = searchFilter && (
                  anchor.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                  anchor.documents.some(d => d.title.toLowerCase().includes(searchFilter.toLowerCase()))
                );

                return (
                  <div
                    key={anchor.id}
                    style={{ left: `${anchor.x}%`, top: `${anchor.y}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAnchor(anchor);
                    }}
                    onMouseEnter={() => setHoveredAnchor(anchor)}
                    onMouseLeave={() => setHoveredAnchor(null)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer group/pin transition-all ${
                      isHighlighted ? 'scale-125 z-40' : ''
                    }`}
                  >
                    {/* Pulsing Beacon Ring */}
                    <div className={`absolute -inset-2 rounded-full opacity-60 animate-ping ${anchor.color || 'bg-blue-500'}`} />

                    {/* Pin Badge */}
                    <div className={`relative px-2.5 py-1 rounded-full text-white text-[10px] font-bold shadow-xl border flex items-center gap-1.5 backdrop-blur-md transition-transform ${
                      isSelected ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                    } ${anchor.color || 'bg-blue-600'} border-white/40`}>
                      <MapPin className="w-3 h-3 text-white shrink-0" />
                      <span className="truncate max-w-[120px]">{anchor.title}</span>
                      {anchor.documents.length > 0 && (
                        <span className="bg-black/30 px-1 py-0.2 rounded text-[9px]">
                          {anchor.documents.length} Docs
                        </span>
                      )}
                    </div>

                    {/* Document Label Tag Badges (Floating under pin) */}
                    <div className="mt-1 flex flex-col items-center gap-1 pointer-events-none">
                      {anchor.documents.map((doc, idx) => (
                        <span
                          key={doc.id || idx}
                          className="bg-slate-900/95 text-blue-200 text-[9px] font-mono px-2 py-0.5 rounded-md border border-slate-700 shadow-md whitespace-nowrap flex items-center gap-1"
                        >
                          <FileText className="w-2.5 h-2.5 text-blue-400" />
                          <strong className="text-amber-300">{doc.doc_code}:</strong> {doc.title}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Click Prompt Watermark */}
              <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] text-slate-300 flex items-center gap-2 pointer-events-none">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <span>Click anywhere on room view to place a spatial label for Document X & Y</span>
              </div>

            </div>

            {/* Selected Anchor Inspector Tray */}
            {selectedAnchor && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg animate-in fade-in">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${selectedAnchor.color}`} />
                    <h4 className="text-sm font-bold text-white">{selectedAnchor.title}</h4>
                    <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      Depth: {selectedAnchor.z_depth || 1.5}m
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Spatial Position: X: {selectedAnchor.x}% | Y: {selectedAnchor.y}% &bull; Labeled by {selectedAnchor.created_by}
                  </p>
                  
                  {/* Documents List */}
                  <div className="pt-2 flex flex-wrap gap-2">
                    {selectedAnchor.documents.map((doc) => (
                      <div key={doc.id} className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 text-slate-200 font-medium">
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-mono text-amber-300 font-bold">{doc.doc_code}:</span>
                        <span>{doc.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDeleteAnchor(selectedAnchor.id)}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Pin
                  </button>
                  <button
                    onClick={() => setSelectedAnchor(null)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* MODAL 1: Create AR Spatial Annotation & Document Label */}
      {isAnnotating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2 text-indigo-400">
                <MapPin className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Annotate Spatial Spot & Documents</h3>
              </div>
              <button
                onClick={() => setIsAnnotating(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveAnnotation} className="p-6 space-y-4">
              
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-300 font-mono">
                <span>Selected Spot Coordinates:</span>
                <span className="text-blue-400 font-bold">X: {newAnchorPos.x}% | Y: {newAnchorPos.y}%</span>
              </div>

              {/* Area Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Location / Area Label Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={areaTitle}
                  onChange={(e) => setAreaTitle(e.target.value)}
                  placeholder="e.g. Upper Storage Shelf - Box 4B"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Area Type & Tag Color */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Storage Type</label>
                  <select
                    value={areaType}
                    onChange={(e) => setAreaType(e.target.value as any)}
                    className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="shelf">Shelf / Rack</option>
                    <option value="drawer">Drawer / Cabinet</option>
                    <option value="box">Archival Box</option>
                    <option value="vault">Safe / Vault</option>
                    <option value="desk">Worktable / Desk</option>
                    <option value="equipment">Biomedical Device</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pin Color Tag</label>
                  <select
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="bg-blue-500">Blue - Legal Contracts</option>
                    <option value="bg-emerald-500">Emerald - Clinical Records</option>
                    <option value="bg-amber-500">Amber - Compliance</option>
                    <option value="bg-rose-500">Rose - Urgent / Confidential</option>
                    <option value="bg-purple-500">Purple - Executive Archives</option>
                  </select>
                </div>
              </div>

              {/* Document "X" & "Y" Annotations Section */}
              <div className="border-t border-slate-800 pt-3 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <FileText className="w-4 h-4" /> Document Labels Stored At This Location
                </div>

                {/* Document X */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Document X Label</div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={docXTitle}
                      onChange={(e) => setDocXTitle(e.target.value)}
                      placeholder="e.g. Hospital Expansion Contract"
                      className="col-span-2 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={docXType}
                      onChange={(e) => setDocXType(e.target.value)}
                      placeholder="e.g. Legal Agreement"
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Document Y */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Document Y Label</div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={docYTitle}
                      onChange={(e) => setDocYTitle(e.target.value)}
                      placeholder="e.g. HIPAA Audit Log Binder"
                      className="col-span-2 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={docYType}
                      onChange={(e) => setDocYType(e.target.value)}
                      placeholder="e.g. Compliance Record"
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Link to Existing Asset Option */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Link to ISAMS Inventory Asset (Optional)
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none font-mono"
                >
                  <option value="">-- No direct asset link --</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.asset_number} - {a.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Spatial Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions or access key required..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAnnotating(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer"
                >
                  Save Spatial Pin & Labels
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: Smartphone Connect & Pair Modal */}
      {isPairModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2 text-emerald-400">
                <Smartphone className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Connect Mobile Smartphone Camera</h3>
              </div>
              <button
                onClick={() => setIsPairModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 text-center space-y-4">
              
              <p className="text-xs text-slate-300">
                Scan this QR code with your smartphone camera to connect your phone as an AR spatial scanner.
              </p>

              {/* QR Display */}
              {pairQrDataUrl ? (
                <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block mx-auto shadow-lg">
                  <img src={pairQrDataUrl} alt="Pairing QR" className="w-48 h-48 mx-auto" />
                </div>
              ) : (
                <div className="w-48 h-48 bg-slate-800 rounded-xl mx-auto flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              )}

              {/* Pair PIN Code */}
              {pairData && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pairing Session PIN</span>
                  <span className="text-xl font-mono font-extrabold text-emerald-400 tracking-widest">
                    {pairData.pair_code}
                  </span>
                </div>
              )}

              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Waiting for mobile connection...</span>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
