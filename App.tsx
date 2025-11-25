import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Save, 
  Upload, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Sparkles,
  FolderOpen,
  ClipboardList,
  Layout,
  Hammer,
  MoreHorizontal,
  Download,
  X
} from 'lucide-react';
import { Entry } from '@/types';
import { INITIAL_CATEGORY_TREE, DIRECTIONS, STATUS_OPTIONS, INITIAL_ENTRIES } from '@/constants';
import { exportData, importData } from '@/services/fileService';
import { analyzeEntries } from '@/services/geminiService';
import { Button } from '@/components/Button';
import { StatCard } from '@/components/StatCard';
import { DetailModal } from '@/components/DetailModal';

const STORAGE_KEY = 'road_eng_data_v4';
const CATEGORY_KEY = 'road_eng_categories_v1';

const App: React.FC = () => {
  // Data State
  const [entries, setEntries] = useState<Entry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_ENTRIES;
  });

  // Category Tree State (Editable)
  const [categoryTree, setCategoryTree] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem(CATEGORY_KEY);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORY_TREE;
  });

  // UI State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Selection State: Parent Category and Child SubCategory
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  
  // Expanded state for sidebar groups
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.keys(INITIAL_CATEGORY_TREE)));

  // Detail Modal State
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  // Install Prompt State
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem(CATEGORY_KEY, JSON.stringify(categoryTree));
  }, [categoryTree]);

  // PWA Install Event Listener
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setInstallPrompt(null);
        }
      });
    }
  };

  // Derived Data
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchDate = entry.date === selectedDate;
      const matchCat = activeCategory === 'All' || entry.category === activeCategory;
      const matchSub = activeSubCategory === null || entry.subCategory === activeSubCategory;
      return matchDate && matchCat && matchSub;
    });
  }, [entries, selectedDate, activeCategory, activeSubCategory]);

  const stats = useMemo(() => {
    return filteredEntries.reduce((acc, curr) => {
      acc.total += curr.amount || 0;
      acc.count += 1;
      if (curr.status === '已完成') acc.completed += 1;
      return acc;
    }, { total: 0, count: 0, completed: 0 });
  }, [filteredEntries]);

  // Category Management Handlers
  const handleAddCategory = () => {
    const name = prompt("请输入新工程大类名称 (如: 绿化工程):");
    if (name) {
      if (categoryTree[name]) {
        alert("该分类已存在");
        return;
      }
      setCategoryTree(prev => ({ ...prev, [name]: [] }));
      setExpandedCategories(prev => new Set(prev).add(name));
    }
  };

  const handleDeleteCategory = (cat: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`确定要删除分类 "${cat}" 及其所有子项吗？`)) {
      const newTree = { ...categoryTree };
      delete newTree[cat];
      setCategoryTree(newTree);
      if (activeCategory === cat) setActiveCategory('All');
    }
  };

  const handleAddSubCategory = (cat: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const name = prompt(`在 "${cat}" 下添加细分项目:`);
    if (name) {
      const subs = categoryTree[cat];
      if (subs.includes(name)) {
        alert("该项目已存在");
        return;
      }
      setCategoryTree(prev => ({
        ...prev,
        [cat]: [...prev[cat], name]
      }));
    }
  };

  const handleDeleteSubCategory = (cat: string, sub: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`删除 "${sub}"?`)) {
      setCategoryTree(prev => ({
        ...prev,
        [cat]: prev[cat].filter(s => s !== sub)
      }));
      if (activeSubCategory === sub) setActiveSubCategory(null);
    }
  };

  // Navigation Handlers
  const toggleExpand = (cat: string) => {
    const next = new Set(expandedCategories);
    if (next.has(cat)) {
      next.delete(cat);
    } else {
      next.add(cat);
    }
    setExpandedCategories(next);
  };

  const handleSelectCategory = (cat: string, subCat: string | null = null) => {
    setActiveCategory(cat);
    setActiveSubCategory(subCat);
  };

  const handleAddEntry = () => {
    // Default values based on current selection
    const availableCats = Object.keys(categoryTree);
    const defaultCat = activeCategory === 'All' ? (availableCats[0] || '未分类') : activeCategory;
    const availableSubs = categoryTree[defaultCat] || [];
    const defaultSub = activeSubCategory || availableSubs[0] || '';

    const newEntry: Entry = {
      id: crypto.randomUUID(),
      date: selectedDate,
      category: defaultCat,
      subCategory: defaultSub,
      location: DIRECTIONS[0],
      description: '',
      amount: 0,
      status: '待处理',
      notes: '',
      resources: [],
      photos: []
    };
    setEntries([...entries, newEntry]);
  };

  const handleUpdateEntry = (id: string, field: keyof Entry, value: string | number) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      
      const updated = { ...e, [field]: value };
      
      // If category changes, reset subCategory to first available if not valid
      if (field === 'category') {
        const newSubs = categoryTree[value as string] || [];
        if (!newSubs.includes(updated.subCategory)) {
             updated.subCategory = newSubs[0] || '';
        }
      }
      
      return updated;
    }));
  };

  const handleSaveDetails = (updatedEntry: Entry) => {
      setEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleExport = () => {
    exportData(entries, `工程资料_${selectedDate}.json`);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const loadedData = await importData(file);
        if (window.confirm(`即将加载 ${loadedData.length} 条记录。这会覆盖当前数据，确定吗？`)) {
          setEntries(loadedData);
        }
      } catch (err) {
        alert('文件加载失败，请检查格式。');
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAIAnalyze = async () => {
    setIsAnalyzing(true);
    setAiAnalysis('');
    const result = await analyzeEntries(filteredEntries, selectedDate);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const navigateDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
    setAiAnalysis('');
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20 flex-shrink-0 transition-all">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/50">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-white tracking-wide leading-none truncate">工程资料通</div>
            <div className="text-[10px] text-slate-500 mt-1 truncate">V1.5 - 可编辑分类版</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <button 
            onClick={() => handleSelectCategory('All')}
            className={`w-full text-left px-4 py-3 mb-6 flex items-center gap-3 transition-all border-l-4 ${activeCategory === 'All' ? 'bg-slate-800 border-blue-500 text-white shadow-md' : 'border-transparent hover:bg-slate-800/50 hover:text-white'}`}
          >
            <FolderOpen className="w-4 h-4" />
            <span className="font-medium">全部汇总</span>
          </button>

          <div className="px-4 mb-2 flex items-center justify-between group">
            <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">工程分类目录</div>
            <button 
              onClick={handleAddCategory}
              className="p-1 rounded hover:bg-blue-600 hover:text-white text-slate-600 transition-colors"
              title="添加新分类"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          
          <nav className="space-y-1 pb-10">
            {Object.keys(categoryTree).map(cat => {
              const isExpanded = expandedCategories.has(cat);
              const isActive = activeCategory === cat;
              const subCategories = categoryTree[cat] || [];

              return (
                <div key={cat} className="px-2 mb-1">
                  <div className={`group flex items-center rounded-md transition-colors pr-2 ${isActive && activeSubCategory === null ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' : 'hover:bg-slate-800/40 text-slate-300'}`}>
                    <button 
                      onClick={() => toggleExpand(cat)}
                      className="p-2.5 hover:text-white opacity-70 hover:opacity-100"
                    >
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                    </button>
                    
                    <button
                      onClick={() => handleSelectCategory(cat)}
                      className="flex-1 text-left py-2.5 text-sm font-medium flex items-center gap-2 truncate"
                    >
                      <Layout className="w-3.5 h-3.5 opacity-70" />
                      <span className="truncate">{cat}</span>
                    </button>

                    {/* Category Actions */}
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button 
                        onClick={(e) => handleAddSubCategory(cat, e)}
                        className="p-1 hover:bg-blue-500 hover:text-white rounded text-slate-500"
                        title="添加子项"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteCategory(cat, e)}
                        className="p-1 hover:bg-red-500 hover:text-white rounded text-slate-500"
                        title="删除分类"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="ml-2 pl-2 border-l border-slate-700 mt-1 mb-2 space-y-0.5 animate-in slide-in-from-left-1 duration-200">
                      {subCategories.length === 0 && (
                        <div className="text-[10px] text-slate-600 px-3 py-1 italic">无细分项目</div>
                      )}
                      {subCategories.map(sub => (
                        <div key={sub} className="group flex items-center">
                          <button
                            onClick={() => handleSelectCategory(cat, sub)}
                            className={`flex-1 text-left px-3 py-1.5 text-sm rounded-md flex items-center gap-2 transition-colors ${
                              isActive && activeSubCategory === sub 
                                ? 'bg-blue-900/40 text-blue-200 font-medium' 
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                            }`}
                          >
                            <span className={`w-1 h-1 rounded-full ${isActive && activeSubCategory === sub ? 'bg-blue-400' : 'bg-slate-600'}`}></span>
                            <span className="truncate">{sub}</span>
                          </button>
                          <button 
                            onClick={(e) => handleDeleteSubCategory(cat, sub, e)}
                            className="hidden group-hover:block p-1 hover:text-red-400 text-slate-600 mr-1"
                            title="删除子项"
                          >
                             <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-4 bg-slate-800 border-t border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
           <button 
             onClick={handleAIAnalyze}
             disabled={isAnalyzing || filteredEntries.length === 0}
             className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-xs font-semibold text-white rounded shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <Sparkles className="w-3.5 h-3.5" />
             {isAnalyzing ? '分析中...' : '生成今日简报'}
           </button>
        </div>
      </aside>

      {/* RIGHT MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-5">
            <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200 shadow-inner">
              <button onClick={() => navigateDate(-1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-500 hover:text-gray-800">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 border-l border-r border-gray-200 mx-1 flex items-center gap-2 bg-white h-7 rounded-sm">
                 <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => { if(e.target.value) { setSelectedDate(e.target.value); setAiAnalysis(''); } }} 
                  className="font-mono font-bold text-gray-800 bg-transparent outline-none cursor-pointer text-sm"
                />
              </div>
              <button onClick={() => navigateDate(1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-500 hover:text-gray-800">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <StatCard title="总项数" value={stats.count} color="bg-transparent border-0 shadow-none p-0" />
              <div className="h-8 w-px bg-gray-200"></div>
              <StatCard title="累计工程量" value={stats.total.toLocaleString()} color="bg-transparent border-0 shadow-none p-0" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {installPrompt && (
              <Button variant="primary" onClick={handleInstallClick} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md animate-pulse" icon={<Download className="w-4 h-4" />}>
                安装到桌面
              </Button>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} icon={<Upload className="w-4 h-4"/>}>
              导入
            </Button>
            <Button variant="secondary" onClick={handleExport} icon={<Save className="w-4 h-4"/>}>
              导出备份
            </Button>
          </div>
        </header>

        {/* AI Result Banner */}
        {aiAnalysis && (
          <div className="bg-indigo-50 border-b border-indigo-100 p-4 animate-in slide-in-from-top-2 shadow-inner">
            <div className="max-w-6xl mx-auto flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-indigo-900 prose prose-sm max-w-none leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
              </div>
              <button onClick={() => setAiAnalysis('')} className="ml-auto text-indigo-400 hover:text-indigo-600 p-1 hover:bg-indigo-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-[1920px] mx-auto">
            
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  {activeCategory === 'All' ? '全部分类' : activeCategory}
                  {activeSubCategory && <span className="text-gray-400 font-normal text-xl">/ {activeSubCategory}</span>}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedDate} 施工日志记录表
                </p>
              </div>
              <Button onClick={handleAddEntry} icon={<Plus className="w-4 h-4"/>} className="shadow-lg shadow-blue-500/20">
                新增记录
              </Button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead className="bg-gray-50/80 backdrop-blur text-gray-600 font-semibold text-xs uppercase tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="p-3 pl-4 border-b border-r border-gray-200 w-[140px]">工程分类</th>
                      <th className="p-3 border-b border-r border-gray-200 w-[140px]">细分项目</th>
                      <th className="p-3 border-b border-r border-gray-200 w-[180px]">施工部位/方向</th>
                      <th className="p-3 border-b border-r border-gray-200 min-w-[300px]">具体内容 / 桩号</th>
                      <th className="p-3 border-b border-r border-gray-200 w-[100px] text-right">数量</th>
                      <th className="p-3 border-b border-r border-gray-200 w-[120px]">状态</th>
                      <th className="p-3 border-b border-r border-gray-200 w-[140px]">详情/照片</th>
                      <th className="p-3 border-b border-gray-200 w-[60px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredEntries.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-16 text-center text-gray-400">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-4 bg-gray-50 rounded-full">
                                <Hammer className="w-8 h-8 opacity-20" />
                            </div>
                            <p>当前分类下暂无施工记录</p>
                            <Button variant="secondary" onClick={handleAddEntry} size="sm" className="mt-2">立即添加</Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-blue-50/30 transition-colors group">
                          
                          {/* 1. Main Category */}
                          <td className="p-1 border-r border-gray-100 align-top">
                            <select
                              className="w-full p-2.5 bg-transparent border-none outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-blue-500 rounded text-gray-700 font-medium truncate cursor-pointer"
                              value={entry.category}
                              onChange={(e) => handleUpdateEntry(entry.id, 'category', e.target.value)}
                            >
                              {Object.keys(categoryTree).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>

                          {/* 2. Sub Category - Dynamic from Tree */}
                          <td className="p-1 border-r border-gray-100 align-top">
                            <select
                                className="w-full p-2.5 bg-transparent border-none outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-blue-500 rounded text-gray-600 truncate cursor-pointer"
                                value={entry.subCategory}
                                onChange={(e) => handleUpdateEntry(entry.id, 'subCategory', e.target.value)}
                            >
                                <option value="" disabled>选择项目</option>
                                {(categoryTree[entry.category] || []).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>

                          {/* 3. Location (Direction) */}
                          <td className="p-1 border-r border-gray-100 align-top">
                            <div className="relative">
                              <input
                                  list={`locations-${entry.id}`}
                                  className="w-full p-2.5 bg-transparent border-none outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-blue-500 rounded text-gray-700 truncate placeholder-gray-300"
                                  value={entry.location || ''}
                                  onChange={(e) => handleUpdateEntry(entry.id, 'location', e.target.value)}
                                  placeholder="位置/桩号..."
                              />
                              <datalist id={`locations-${entry.id}`}>
                                  {DIRECTIONS.map(d => <option key={d} value={d} />)}
                              </datalist>
                            </div>
                          </td>

                          {/* 4. Description */}
                          <td className="p-1 border-r border-gray-100 align-top">
                            <textarea
                              rows={1}
                              className="w-full p-2.5 bg-transparent border-none outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-blue-500 rounded resize-none overflow-hidden placeholder-gray-300 min-h-[40px]"
                              value={entry.description}
                              onChange={(e) => handleUpdateEntry(entry.id, 'description', e.target.value)}
                              onInput={(e) => {
                                  const target = e.target as HTMLTextAreaElement;
                                  target.style.height = 'auto';
                                  target.style.height = target.scrollHeight + 'px';
                              }}
                              placeholder="输入具体施工内容..."
                            />
                          </td>

                          {/* 5. Amount */}
                          <td className="p-1 border-r border-gray-100 align-top">
                            <input
                              type="number"
                              className="w-full p-2.5 bg-transparent border-none outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-blue-500 rounded text-right font-mono text-gray-700"
                              value={entry.amount || ''}
                              onChange={(e) => handleUpdateEntry(entry.id, 'amount', parseFloat(e.target.value) || 0)}
                            />
                          </td>

                          {/* 6. Status */}
                          <td className="p-1 border-r border-gray-100 align-top">
                            <div className="p-1">
                              <select
                                className={`w-full text-xs font-bold rounded px-2 py-1.5 border-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors ${
                                  entry.status === '已完成' ? 'bg-emerald-100 text-emerald-700' :
                                  entry.status === '审核中' ? 'bg-amber-100 text-amber-700' :
                                  entry.status === '紧急' ? 'bg-rose-100 text-rose-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}
                                value={entry.status}
                                onChange={(e) => handleUpdateEntry(entry.id, 'status', e.target.value)}
                              >
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          </td>

                          {/* 7. Details Button */}
                          <td className="p-2 border-r border-gray-100 align-middle">
                             <button
                               onClick={() => setEditingEntry(entry)}
                               className={`w-full text-left px-3 py-1.5 text-xs rounded-full border flex items-center justify-between transition-all ${
                                 entry.photos?.length || entry.resources?.length || entry.notes 
                                  ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100' 
                                  : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                               }`}
                             >
                               <span className="truncate max-w-[80px]">
                                  {entry.photos?.length ? `${entry.photos.length}图` : (entry.resources?.length ? '已填报' : '添加')}
                               </span>
                               <MoreHorizontal className="w-3 h-3 opacity-50" />
                             </button>
                          </td>

                          {/* Delete */}
                          <td className="p-2 text-center align-middle">
                            <button 
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                              title="删除记录"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mt-8 text-xs text-gray-400 text-center">
              所有数据已自动保存到本地 · 使用导出功能备份数据
            </div>

          </div>
        </main>
      </div>

      {editingEntry && (
        <DetailModal 
            entry={editingEntry} 
            onClose={() => setEditingEntry(null)} 
            onSave={handleSaveDetails} 
        />
      )}
    </div>
  );
};

export default App;