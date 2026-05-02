'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, subYears, isSunday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, Search, Download, BarChart2, Flame, Printer } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditor';

type CustomColumn = { category: string; content: string };

type EntryData = {
  happiness: number;
  highlight: string;
  kadai: string;
  activities: string;
  customColumns: CustomColumn[];
};

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [isFetching, setIsFetching] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [onThisDayEntry, setOnThisDayEntry] = useState<any>(null);
  const [dashboardNote, setDashboardNote] = useState('');
  const [noteSaveTimer, setNoteSaveTimer] = useState<any>(null);
  
  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [data, setData] = useState<EntryData>({
    happiness: 5,
    highlight: '',
    kadai: '',
    activities: '',
    customColumns: [],
  });

  const isInitialLoad = useRef(true);
  
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Calendar logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  useEffect(() => {
    // Fetch dashboard note
    fetch('/api/settings/note').then(res => res.json()).then(json => {
      if (json.dashboardNote !== undefined) setDashboardNote(json.dashboardNote);
    });
  }, []);

  const handleNoteChange = (val: string) => {
    setDashboardNote(val);
    if (noteSaveTimer) clearTimeout(noteSaveTimer);
    const timer = setTimeout(() => {
      fetch('/api/settings/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardNote: val }),
      });
    }, 1000);
    setNoteSaveTimer(timer);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsFetching(true);
      isInitialLoad.current = true;
      try {
        const res = await fetch(`/api/entries/${dateStr}`);
        const json = await res.json();
        
        if (json.entry) {
          setData({
            happiness: json.entry.happiness || 5,
            highlight: json.entry.highlight || '',
            kadai: json.entry.kadai || '',
            activities: json.entry.activities || '',
            customColumns: json.entry.customColumns || [],
          });
        } else {
          setData({
            happiness: 5,
            highlight: '',
            kadai: '',
            activities: '',
            customColumns: [],
          });
        }

        // Fetch On This Day
        const lastYearDateStr = format(subYears(selectedDate, 1), 'yyyy-MM-dd');
        const otdRes = await fetch(`/api/entries/${lastYearDateStr}`);
        const otdJson = await otdRes.json();
        if (otdJson.entry && (otdJson.entry.highlight || otdJson.entry.activities)) {
          setOnThisDayEntry(otdJson.entry);
        } else {
          setOnThisDayEntry(null);
        }

      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsFetching(false);
        setTimeout(() => { isInitialLoad.current = false; }, 500);
      }
    };
    fetchData();
  }, [dateStr]);

  // Auto-save logic
  useEffect(() => {
    if (isFetching || isInitialLoad.current) return;

    setSaveStatus('saving');
    const timeoutId = setTimeout(async () => {
      try {
        await fetch(`/api/entries/${dateStr}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Failed to auto-save:', error);
        setSaveStatus('idle');
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [data, dateStr, isFetching]);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const json = await res.json();
        setSearchResults(json.entries || []);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const submitCustomColumn = () => {
    if (newCategoryName.trim()) {
      setData((prev) => ({
        ...prev,
        customColumns: [...prev.customColumns, { category: newCategoryName.trim(), content: '' }],
      }));
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const removeCustomColumn = (index: number) => {
    setData((prev) => ({
      ...prev,
      customColumns: prev.customColumns.filter((_, i) => i !== index),
    }));
  };

  const updateCustomColumn = (index: number, content: string) => {
    const newColumns = [...data.customColumns];
    newColumns[index].content = content;
    setData({ ...data, customColumns: newColumns });
  };

  const startWeeklyReflection = () => {
    setData((prev) => {
      // Check if they already exist to avoid duplicates
      const hasReflection = prev.customColumns.some(c => c.category === 'What gave you energy this week?');
      if (hasReflection) return prev;

      return {
        ...prev,
        customColumns: [
          ...prev.customColumns,
          { category: 'What gave you energy this week?', content: '' },
          { category: 'What drained your energy?', content: '' },
          { category: 'What is your main focus for next week?', content: '' },
        ]
      };
    });
  };

  const getWordCount = () => {
    let allHtml = data.highlight + " " + data.kadai + " " + data.activities;
    data.customColumns.forEach(col => allHtml += " " + col.content);
    
    // Safely strip HTML tags using regex for both SSR and Client
    const plainText = allHtml.replace(/<[^>]*>?/gm, '').trim();
    if (!plainText) return 0;
    return plainText.split(/\s+/).length;
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#2C2C2C] pb-32">
      {/* Top Navigation Bar */}
      <nav className="flex justify-between p-6 max-w-6xl mx-auto relative z-40 print:hidden">
        <div className="flex items-center">
        </div>
        <div className="flex items-center space-x-6">
          <Link href="/tasks" className="text-[#8C7A6B] hover:text-[#2C2C2C] transition-colors flex items-center text-sm font-medium">
            Reminders
          </Link>
          <Link href="/expenses" className="text-[#8C7A6B] hover:text-[#2C2C2C] transition-colors flex items-center text-sm font-medium">
            Expenses
          </Link>
          <Link href="/settings/whatsapp" className="text-[#8C7A6B] hover:text-[#2C2C2C] transition-colors flex items-center text-sm font-medium">
            WhatsApp Bot
          </Link>
          <button onClick={() => setIsSearchOpen(true)} className="text-[#8C7A6B] hover:text-[#2C2C2C] transition-colors flex items-center text-sm font-medium">
            <Search className="w-5 h-5 mr-2" /> Search
          </button>
          <Link href="/insights" className="text-[#8C7A6B] hover:text-[#2C2C2C] transition-colors flex items-center text-sm font-medium">
            <BarChart2 className="w-5 h-5 mr-2" /> Insights
          </Link>
          <button onClick={() => window.print()} className="text-[#8C7A6B] hover:text-[#2C2C2C] transition-colors flex items-center text-sm font-medium">
            <Printer className="w-5 h-5 mr-2" /> Print
          </button>
          <a href="/api/export" target="_blank" download className="text-[#8C7A6B] hover:text-[#2C2C2C] transition-colors flex items-center text-sm font-medium">
            <Download className="w-5 h-5 mr-2" /> Export
          </a>
        </div>
      </nav>

      {/* Loading Indicator */}
      <div 
        className="fixed top-0 left-0 h-1 bg-[#8C7A6B] transition-all duration-500 ease-out z-50 print:hidden" 
        style={{ width: isFetching ? '100%' : '0%', opacity: isFetching ? 1 : 0 }} 
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 xl:px-0 grid grid-cols-1 lg:grid-cols-12 gap-12 pt-6">
        
        {/* Left Column: Calendar (Hidden on Print) */}
        <aside className="lg:col-span-4 space-y-8 print:hidden">
          <div className="sticky top-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif text-[#1a1a1a]">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 rounded-full hover:bg-[#EBE5DA] transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-[#5a5a5a]" />
                </button>
                <button 
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 rounded-full hover:bg-[#EBE5DA] transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-[#5a5a5a]" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-y-6 gap-x-2 text-center">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <div key={`day-${idx}`} className="text-xs font-semibold tracking-widest text-[#8C7A6B] uppercase">
                  {day}
                </div>
              ))}
              
              {calendarDays.map((day, idx) => {
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                     key={`cal-${idx}`}
                    onClick={() => {
                      setSelectedDate(day);
                      if (!isSameMonth(day, currentMonth)) {
                        setCurrentMonth(startOfMonth(day));
                      }
                    }}
                    className={clsx(
                      "aspect-square flex items-center justify-center rounded-full text-sm transition-all duration-300 relative mx-auto w-10 h-10",
                      !isCurrentMonth && "text-[#C4BCB3]",
                      isCurrentMonth && !isSelected && "text-[#2C2C2C] hover:bg-[#EBE5DA]",
                      isSelected && "bg-[#2C2C2C] text-[#FDFCF8] font-medium shadow-md shadow-[#2c2c2c]/20 scale-110",
                      isToday && !isSelected && "border border-[#8C7A6B]"
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>

            {/* Auto-save Status Indicator */}
            <div className="mt-12 p-4 rounded-xl bg-[#FDFCF8] border border-[#EBE5DA] flex items-center justify-center transition-opacity">
               <span className="text-xs font-bold uppercase tracking-widest text-[#8C7A6B]">
                 {saveStatus === 'saving' && 'Saving...'}
                 {saveStatus === 'saved' && 'All changes saved'}
                 {saveStatus === 'idle' && 'Auto-save is on'}
               </span>
            </div>

            {/* Sticky Note Widget */}
            <div className="mt-6 print:hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#8C7A6B]">📌 Pinned Note</span>
                {dashboardNote && (
                  <button
                    onClick={() => handleNoteChange('')}
                    className="text-[10px] text-[#C4BCB3] hover:text-red-400 transition-colors uppercase tracking-widest"
                  >
                    Clear
                  </button>
                )}
              </div>
              <textarea
                value={dashboardNote}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="Remember study everyday..."
                rows={3}
                className="w-full bg-[#FDFCF8] border border-[#EBE5DA] rounded-xl p-3 text-sm text-[#2c2c2c] placeholder-[#C4BCB3] focus:outline-none focus:ring-2 focus:ring-[#EBE5DA] resize-none leading-relaxed"
              />
            </div>
          </div>
        </aside>

        {/* Right Column: The Diary Page (Takes full width on Print) */}
        <main className={clsx("lg:col-span-8 transition-opacity duration-500 print:col-span-12", isFetching && "opacity-40")}>
          
          {/* On This Day Banner (Hidden on Print) */}
          {onThisDayEntry && !isFetching && (
            <div className="mb-8 p-4 rounded-xl border border-[#EBE5DA] bg-gradient-to-r from-[#FDFCF8] to-[#EBE5DA]/30 flex items-center justify-between print:hidden">
              <div>
                <h4 className="text-xs font-bold text-[#8C7A6B] uppercase tracking-widest mb-1">On This Day</h4>
                <p className="text-sm text-[#2c2c2c] italic">"{onThisDayEntry.highlight?.substring(0, 50) || onThisDayEntry.activities?.substring(0, 50) + '...'}"</p>
              </div>
              <button 
                onClick={() => {
                  const dateObj = new Date(onThisDayEntry.date + 'T00:00:00');
                  setSelectedDate(dateObj);
                  setCurrentMonth(startOfMonth(dateObj));
                }}
                className="text-xs font-bold text-[#2C2C2C] border-b border-[#2C2C2C] pb-0.5 hover:text-[#8C7A6B] hover:border-[#8C7A6B] transition-colors whitespace-nowrap ml-4"
              >
                Read
              </button>
            </div>
          )}

          {/* Weekly Reflection Banner (Hidden on Print) */}
          {isSunday(selectedDate) && !isFetching && !data.customColumns.some(c => c.category.includes('energy this week')) && (
            <div className="mb-8 p-4 rounded-xl border border-[#8C7A6B]/30 bg-[#8C7A6B]/5 flex items-center justify-between print:hidden">
              <div>
                <h4 className="text-xs font-bold text-[#8C7A6B] uppercase tracking-widest mb-1">Weekly Reflection</h4>
                <p className="text-sm text-[#2c2c2c]">Take a moment to reflect on your past week.</p>
              </div>
              <button 
                onClick={startWeeklyReflection}
                className="text-xs font-bold text-[#FDFCF8] bg-[#8C7A6B] px-4 py-2 rounded-full hover:bg-[#2c2c2c] transition-colors whitespace-nowrap ml-4 uppercase tracking-widest"
              >
                Start Reflection
              </button>
            </div>
          )}

          <div className="mb-12 border-b border-[#EBE5DA] pb-8">
            <h1 className="text-4xl md:text-5xl font-serif text-[#1a1a1a] mb-2 tracking-tight">
              {format(selectedDate, 'EEEE')}
            </h1>
            <p className="text-lg text-[#8C7A6B] uppercase tracking-widest">
              {format(selectedDate, 'MMMM d, yyyy')}
            </p>
          </div>

          <div className="space-y-16">
            {/* Happiness Level */}
            <section className="group print:hidden">
              <h3 className="text-xs font-bold text-[#8C7A6B] uppercase tracking-widest mb-6 flex items-center">
                <span className="w-8 h-[1px] bg-[#EBE5DA] mr-4"></span>
                Happiness Level
              </h3>
              <div className="flex items-center justify-between px-4 md:px-12">
                <span className="text-xs font-bold text-[#8C7A6B] uppercase tracking-widest mr-4">Bad</span>
                <div className="flex items-center space-x-2 md:space-x-4 flex-grow justify-center">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => setData({ ...data, happiness: num })}
                      className="relative flex items-center justify-center w-6 h-6 md:w-10 md:h-10 focus:outline-none group/btn"
                    >
                      <div 
                        className={clsx(
                          "transition-all duration-300 rounded-full",
                          data.happiness === num 
                            ? "w-5 h-5 md:w-6 md:h-6 bg-[#8C7A6B] shadow-lg shadow-[#8C7A6B]/30 scale-110" 
                            : data.happiness >= num 
                              ? "w-2.5 h-2.5 md:w-3 md:h-3 bg-[#8C7A6B]/40"
                              : "w-1.5 h-1.5 md:w-2 md:h-2 bg-[#EBE5DA] group-hover/btn:bg-[#8C7A6B]/20"
                        )}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-[#8C7A6B] uppercase tracking-widest ml-4">Very Good</span>
              </div>
            </section>

            {/* Diary Fields using RichTextEditor */}
            <section className="space-y-12">
              <div className="relative">
                <h3 className="text-xs font-bold text-[#8C7A6B] uppercase tracking-widest mb-4 flex items-center">
                  <span className="w-8 h-[1px] bg-[#EBE5DA] mr-4"></span>
                  Highlight
                </h3>
                <RichTextEditor
                  value={data.highlight}
                  onChange={(val) => setData({ ...data, highlight: val })}
                  placeholder="The best moment of today..."
                  className="text-xl md:text-2xl font-serif leading-relaxed"
                  minHeight="min-h-[150px]"
                />
              </div>

              <div className="relative">
                <h3 className="text-xs font-bold text-[#8C7A6B] uppercase tracking-widest mb-4 flex items-center">
                  <span className="w-8 h-[1px] bg-[#EBE5DA] mr-4"></span>
                  Kadai & Issues
                </h3>
                <RichTextEditor
                  value={data.kadai}
                  onChange={(val) => setData({ ...data, kadai: val })}
                  placeholder="Challenges faced, lessons learned..."
                  className="text-lg leading-relaxed"
                  minHeight="min-h-[100px]"
                />
              </div>

              <div className="relative">
                <h3 className="text-xs font-bold text-[#8C7A6B] uppercase tracking-widest mb-4 flex items-center">
                  <span className="w-8 h-[1px] bg-[#EBE5DA] mr-4"></span>
                  Daily Log
                </h3>
                <RichTextEditor
                  value={data.activities}
                  onChange={(val) => setData({ ...data, activities: val })}
                  placeholder="What did you do?"
                  className="text-lg leading-relaxed"
                  minHeight="min-h-[250px]"
                />
              </div>
            </section>

            {/* Custom Columns */}
            {data.customColumns.length > 0 && (
              <section className="space-y-12 pt-8 border-t border-[#EBE5DA]">
                {data.customColumns.map((col, index) => (
                  <div key={index} className="relative group">
                    <button
                      onClick={() => removeCustomColumn(index)}
                      className="absolute top-0 right-0 p-2 text-[#C4BCB3] hover:text-[#e74c3c] opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-xs font-bold text-[#8C7A6B] uppercase tracking-widest mb-4 flex items-center">
                      <span className="w-8 h-[1px] bg-[#EBE5DA] mr-4"></span>
                      {col.category}
                    </h3>
                    <RichTextEditor
                      value={col.content}
                      onChange={(val) => updateCustomColumn(index, val)}
                      placeholder={`Notes on ${col.category}...`}
                      className="text-lg leading-relaxed"
                      minHeight="min-h-[100px]"
                    />
                  </div>
                ))}
              </section>
            )}

            <div className="print:hidden">
              {isAddingCategory ? (
                <div className="mt-8 flex items-center space-x-4">
                  <input
                    type="text"
                    autoFocus
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitCustomColumn()}
                    placeholder="New category name..."
                    className="bg-transparent border-b border-[#8C7A6B] p-2 text-sm font-bold text-[#2c2c2c] placeholder-[#C4BCB3] outline-none focus:outline-none uppercase tracking-widest"
                  />
                  <button
                    onClick={submitCustomColumn}
                    className="text-sm font-bold text-[#FDFCF8] bg-[#8C7A6B] px-4 py-2 rounded-full hover:bg-[#2c2c2c] transition-colors uppercase tracking-widest"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                    }}
                    className="text-sm font-bold text-[#8C7A6B] hover:text-[#e74c3c] transition-colors uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="mt-8 flex items-center text-sm font-bold text-[#8C7A6B] hover:text-[#2c2c2c] transition-colors uppercase tracking-widest"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Category
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Word Count Indicator */}
      <div className="fixed bottom-0 right-0 p-6 z-40 pointer-events-none print:hidden">
        <p className="text-xs font-bold text-[#8C7A6B] uppercase tracking-widest opacity-60">
          {getWordCount()} words
        </p>
      </div>

      {/* Search Modal (Hidden on Print) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-[#FDFCF8]/95 backdrop-blur-sm p-4 print:hidden">
          <div className="w-full max-w-2xl bg-white shadow-2xl rounded-3xl overflow-hidden border border-[#EBE5DA]">
            <div className="p-4 border-b border-[#EBE5DA] flex items-center">
              <Search className="w-6 h-6 text-[#8C7A6B] mr-4" />
              <input 
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories, highlights, logs..."
                className="w-full bg-transparent border-none text-xl text-[#2c2c2c] placeholder-[#C4BCB3] outline-none focus:ring-0"
              />
              <button 
                onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
                className="p-2 text-[#8C7A6B] hover:text-[#e74c3c] transition-colors rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto bg-[#FDFCF8] p-4 space-y-4">
              {isSearching && <p className="text-center text-[#8C7A6B] py-8 text-sm uppercase tracking-widest font-bold animate-pulse">Searching...</p>}
              {!isSearching && searchQuery && searchResults.length === 0 && (
                <p className="text-center text-[#8C7A6B] py-8 text-sm uppercase tracking-widest font-bold">No results found</p>
              )}
              {searchResults.map((res: any, idx: number) => {
                // simple strip html for preview
                const preview = (res.highlight || res.activities || res.kadai || '').replace(/<[^>]*>?/gm, '');
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      const dateObj = new Date(res.date + 'T00:00:00');
                      setSelectedDate(dateObj);
                      setCurrentMonth(startOfMonth(dateObj));
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-4 rounded-2xl hover:bg-[#EBE5DA]/50 transition-colors border border-transparent hover:border-[#EBE5DA]"
                  >
                    <p className="text-xs font-bold text-[#8C7A6B] uppercase tracking-widest mb-2">{format(new Date(res.date + 'T00:00:00'), 'MMMM d, yyyy')}</p>
                    <p className="text-[#2c2c2c] line-clamp-2">{preview || 'Empty entry'}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
