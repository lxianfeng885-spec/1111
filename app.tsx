import React, { useState, useRef, useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { Button } from './components/Button';
import { SegmentList } from './components/SegmentList';
import { analyzeVideoWithScript } from './services/geminiService';
import { VideoSegment, AnalysisState } from './types';
import { Wand2, Download, FileText, LayoutTemplate, AlertCircle } from 'lucide-react';

export default function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [script, setScript] = useState<string>("");
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  const [analysisState, setAnalysisState] = useState<AnalysisState>({ status: 'idle', message: '' });
  const [currentTime, setCurrentTime] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Clean up object URL when file changes
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoFile]);

  const handleAnalysis = async () => {
    if (!videoFile || !script.trim()) return;

    setAnalysisState({ status: 'processing', message: '正在上傳並分析影片視覺內容（大文件可能需要幾分鐘）...' });
    setSegments([]);

    try {
      const results = await analyzeVideoWithScript(videoFile, script);
      setSegments(results);
      setAnalysisState({ status: 'success', message: '時間軸生成成功！' });
    } catch (error) {
      setAnalysisState({ status: 'error', message: error instanceof Error ? error.message : '分析失敗。請檢查 API Key 或網絡連接。' });
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleExport = () => {
    // Create a simple EDL (Edit Decision List) or JSON export
    const exportData = {
      project: "AutoCut_Export",
      source: videoFile?.name,
      segments: segments
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'autocut_project.json';
    a.click();
  };

  return (
    <div className="flex h-screen w-full bg-background text-slate-200">
      
      {/* Sidebar: Inputs */}
      <div className="w-1/3 min-w-[400px] border-r border-slate-800 flex flex-col bg-surface/30">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <LayoutTemplate className="text-primary" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              AutoCut AI
            </h1>
          </div>
          <p className="text-xs text-slate-500">影片解說自動化工具</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Video */}
          <section>
            <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs">1</span>
              影片素材
            </h2>
            <UploadZone onFileSelect={setVideoFile} selectedFile={videoFile} />
          </section>

          {/* Section 2: Script */}
          <section className="flex-1 flex flex-col">
            <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs">2</span>
              解說腳本
            </h2>
            <div className="relative flex-grow">
              <FileText className="absolute top-3 left-3 text-slate-600" size={16} />
              <textarea
                className="w-full h-48 bg-surface border border-slate-700 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:border-primary resize-none placeholder-slate-600 transition-colors"
                placeholder="在此貼上您的解說文字。AI 將自動分析畫面並進行匹配..."
                value={script}
                onChange={(e) => setScript(e.target.value)}
              />
            </div>
          </section>

          {/* Action Area */}
          <div className="pt-2">
             {analysisState.status === 'error' && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-400">
                <AlertCircle size={16} />
                {analysisState.message}
              </div>
            )}
            
            <Button 
              className="w-full h-12 text-base shadow-xl" 
              onClick={handleAnalysis}
              isLoading={analysisState.status === 'processing'}
              disabled={!videoFile || !script}
            >
              <Wand2 size={18} />
              智能匹配分段
            </Button>
            <p className="text-center text-xs text-slate-600 mt-3">
              使用 Gemini 2.5 Flash 進行多模態分析。<br/>
              支持高達 2GB 的影片文件。
            </p>
          </div>
        </div>
      </div>

      {/* Main Area: Preview & Results */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Header Bar */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-surface/30 backdrop-blur-sm z-10">
          <h2 className="font-semibold text-slate-300">預覽與時間軸</h2>
          <Button variant="secondary" className="text-xs h-8" disabled={segments.length === 0} onClick={handleExport}>
            <Download size={14} />
            導出專案
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          
          <div className="max-w-4xl mx-auto">
            {/* Video Player */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-slate-800 relative group">
              {videoUrl ? (
                <video 
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  controls
                  onTimeUpdate={handleTimeUpdate}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900/50">
                  <p>未載入影片</p>
                </div>
              )}
            </div>

            {/* Results Timeline */}
            <div className="mt-8">
              {segments.length > 0 ? (
                 <SegmentList 
                  segments={segments} 
                  onSeek={handleSeek} 
                  currentTime={currentTime}
                />
              ) : (
                <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 mb-4 text-slate-500">
                    <LayoutTemplate size={24} />
                  </div>
                  <h3 className="text-lg font-medium text-slate-400">準備分析</h3>
                  <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto">
                    請在左側上傳影片與文案，然後點擊「智能匹配分段」以生成時間軸。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}