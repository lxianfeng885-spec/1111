import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { AICopilot } from './components/AICopilot';
import { Doc, Template } from './types';
import { Icon } from './components/Icon';
import { TEMPLATES } from './constants';

const App: React.FC = () => {
  // State
  const [docs, setDocs] = useState<Doc[]>(() => {
    const saved = localStorage.getItem('roadtech_docs');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [copilotContext, setCopilotContext] = useState('');

  // Effects
  useEffect(() => {
    localStorage.setItem('roadtech_docs', JSON.stringify(docs));
  }, [docs]);

  // Handlers
  const handleCreateDoc = (template: Template) => {
    const newDoc: Doc = {
      id: Date.now().toString(),
      title: template.name === "空白文档" ? "" : template.name,
      content: template.initialContent,
      lastModified: Date.now(),
      type: 'general' // Could be dynamic based on template
    };
    setDocs(prev => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    
    // Auto-close sidebar on mobile after creation
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDeleteDoc = (id: string) => {
    if (window.confirm("确定要删除这个文档吗?")) {
      setDocs(prev => prev.filter(d => d.id !== id));
      if (activeDocId === id) {
        setActiveDocId(null);
      }
    }
  };

  const handleUpdateDoc = (updatedDoc: Doc) => {
    setDocs(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
  };

  const handleAIRequest = (context: string) => {
      setCopilotContext(context);
      setIsCopilotOpen(true);
  };

  const activeDoc = docs.find(d => d.id === activeDocId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100 text-gray-900">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        docs={docs}
        activeDocId={activeDocId}
        onSelectDoc={setActiveDocId}
        onCreateDoc={handleCreateDoc}
        onDeleteDoc={handleDeleteDoc}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative transition-all duration-300">
        
        {/* Mobile Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:hidden shrink-0">
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-600">
                <Icon name="menu" className="w-6 h-6" />
             </button>
             <span className="font-semibold text-gray-800">
                 {activeDoc?.title || "RoadTech Docs"}
             </span>
             <button onClick={() => setIsCopilotOpen(!isCopilotOpen)} className="p-2 -mr-2 text-indigo-600">
                <Icon name="sparkles" className="w-6 h-6" />
             </button>
        </header>

        {/* Workspace */}
        <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col max-w-5xl mx-auto w-full">
                {activeDoc ? (
                    <Editor 
                        doc={activeDoc} 
                        onUpdate={handleUpdateDoc}
                        onRequestAIHelp={handleAIRequest}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-4">
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                            <Icon name="document" className="w-10 h-10 text-gray-400" />
                        </div>
                        <div>
                            <p className="text-lg font-medium text-gray-500">没有选中的文档</p>
                            <p className="text-sm">请在左侧选择一个文件或新建文档</p>
                        </div>
                        <button 
                            onClick={() => handleCreateDoc(TEMPLATES[0])}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            快速创建空白文档
                        </button>
                    </div>
                )}
            </div>
            
            {/* Desktop Toggle Copilot Button (Floating) */}
            {!isCopilotOpen && (
                <button 
                    onClick={() => setIsCopilotOpen(true)}
                    className="absolute right-6 bottom-6 shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full transition-all hover:scale-105 z-10 hidden md:flex items-center gap-2"
                >
                    <Icon name="sparkles" className="w-5 h-5" />
                    <span className="text-sm font-medium pr-1">AI 助手</span>
                </button>
            )}

            {/* AI Side Panel */}
            <AICopilot 
                currentContext={activeDoc?.content || ""}
                isOpen={isCopilotOpen}
                onClose={() => setIsCopilotOpen(false)}
            />
        </div>
      </div>
    </div>
  );
};

export default App;