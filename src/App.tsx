import { useState, useEffect, useMemo, FormEvent, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Copy,
  Check,
  Search,
  Plus,
  Trash2,
  Share2,
  X,
  PenLine,
  Library
} from 'lucide-react';
import { QUOTES_DATA } from './quotes';
import { Quote, Category } from './types';

export default function App() {
  // --- STATE MANAGEMENT ---
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    try {
      const saved = localStorage.getItem('user_quotes');
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...QUOTES_DATA, ...parsed];
      }
    } catch (e) {
      console.error('Failed to load user quotes:', e);
    }
    return QUOTES_DATA;
  });

  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'create'>('browse');

  // Interactive UI states
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Custom Quote Form States
  const [customText, setCustomText] = useState('');
  const [customAuthor, setCustomAuthor] = useState('');
  const [customCategory, setCustomCategory] = useState<Category>('Philosophy');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // --- SAVE TO LOCALSTORAGE ---
  useEffect(() => {
    const userQuotes = quotes.filter(q => !QUOTES_DATA.some(qd => qd.id === q.id));
    localStorage.setItem('user_quotes', JSON.stringify(userQuotes));
  }, [quotes]);

  // --- FILTERED QUOTES POOL ---
  const filteredQuotes = useMemo(() => {
    let pool = quotes;

    if (activeCategory !== 'All') {
      pool = quotes.filter(q => q.category === activeCategory);
    }

    // Filter by Search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      pool = pool.filter(
        q => q.text.toLowerCase().includes(query) || q.author.toLowerCase().includes(query)
      );
    }

    return pool;
  }, [quotes, activeCategory, searchQuery]);

  // --- INITIALIZE RANDOM QUOTE ON OPEN ---
  useEffect(() => {
    if (quotes.length > 0) {
      const daily = getQuoteOfTheDay();
      setCurrentQuote(daily || quotes[Math.floor(Math.random() * quotes.length)]);
    }
  }, []);

  // --- QUOTE OF THE DAY CALCULATOR ---
  const getQuoteOfTheDay = (): Quote => {
    const today = new Date();
    const dateNum = today.getFullYear() * 1000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = dateNum % QUOTES_DATA.length;
    return QUOTES_DATA[index];
  };

  // --- RANDOM QUOTE GENERATOR LOGIC ---
  const handleNewQuote = () => {
    const pool = filteredQuotes.length > 0 ? filteredQuotes : quotes;
    
    if (pool.length === 0) return;

    let nextQuote = pool[Math.floor(Math.random() * pool.length)];

    if (pool.length > 1 && currentQuote) {
      let attempts = 0;
      while (nextQuote.id === currentQuote.id && attempts < 10) {
        nextQuote = pool[Math.floor(Math.random() * pool.length)];
        attempts++;
      }
    }

    setCurrentQuote(nextQuote);
    setAnimationKey(prev => prev + 1);
  };

  // --- INTERACTION HANDLERS ---
  const handleCopy = () => {
    if (!currentQuote) return;
    const formatted = `"${currentQuote.text}" — ${currentQuote.author}`;
    navigator.clipboard.writeText(formatted).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = () => {
    if (!currentQuote) return;
    const formatted = `"${currentQuote.text}" — ${currentQuote.author} (${currentQuote.category})`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Inspiring Quote',
        text: formatted,
        url: window.location.href,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(formatted).then(() => {
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      });
    }
  };

  const handleAddCustomQuote = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(false);

    if (!customText.trim()) {
      setFormError('Please enter the quote text.');
      return;
    }
    if (!customAuthor.trim()) {
      setFormError('Please enter the author.');
      return;
    }

    const newQuote: Quote = {
      id: `custom_${Date.now()}`,
      text: customText.trim(),
      author: customAuthor.trim(),
      category: customCategory,
    };

    setQuotes(prev => [newQuote, ...prev]);
    setCustomText('');
    setCustomAuthor('');
    setFormSuccess(true);
    
    setCurrentQuote(newQuote);
    setAnimationKey(prev => prev + 1);

    setTimeout(() => {
      setFormSuccess(false);
      setActiveTab('browse');
    }, 1500);
  };

  const handleDeleteQuote = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this custom quote?')) {
      setQuotes(prev => prev.filter(q => q.id !== id));
      
      if (currentQuote && currentQuote.id === id) {
        const remaining = quotes.filter(q => q.id !== id);
        if (remaining.length > 0) {
          setCurrentQuote(remaining[Math.floor(Math.random() * remaining.length)]);
          setAnimationKey(prev => prev + 1);
        } else {
          setCurrentQuote(null);
        }
      }
    }
  };

  const handleSelectQuote = (quote: Quote) => {
    setCurrentQuote(quote);
    setAnimationKey(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="app_root" className="min-h-screen bg-white text-gray-900 font-sans antialiased selection:bg-gray-100 selection:text-gray-900 pb-20">
      
      {/* --- HEADER --- */}
      <header className="max-w-6xl mx-auto px-6 pt-12 pb-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-gray-100">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400">
            Axiom <span className="text-gray-300">/</span> Quotes
          </div>
          <h1 className="text-sm font-semibold tracking-tight text-gray-500 font-sans uppercase">
            Timeless Reflection Engine
          </h1>
        </div>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <main className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* LEFT COLUMN: ACTIVE QUOTE SHOWCASE DISPLAY (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-8 justify-center">
          
          <div className="relative w-full py-10 px-4 md:px-8">
            {/* Elegant Quotation Marks */}
            <div className="absolute -top-10 -left-4 text-[120px] font-serif text-gray-100/80 leading-none select-none pointer-events-none">
              “
            </div>

            {/* Core Animated Container */}
            <div className="relative z-10 min-h-[220px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {currentQuote ? (
                  <motion.div
                    key={animationKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-8"
                  >
                    {/* The Quote Text */}
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-light leading-snug tracking-tight text-gray-900 font-sans">
                      {currentQuote.text}
                    </h2>
                    
                    {/* The Author and Line */}
                    <div className="flex items-center gap-4">
                      <div className="h-px w-8 bg-gray-300"></div>
                      <p className="text-base md:text-lg font-medium text-gray-500 italic">
                        {currentQuote.author}
                      </p>
                      
                      {/* Meta Tags */}
                      <span className="ml-auto text-[9px] font-mono tracking-widest text-gray-400 uppercase border border-gray-200/60 px-2 py-0.5">
                        {currentQuote.category}
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-12 text-gray-400 font-sans italic">
                    No quote currently selected. Browse the library to pick one.
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div className="absolute -bottom-16 -right-4 text-[120px] font-serif text-gray-100/80 leading-none select-none pointer-events-none">
              ”
            </div>
          </div>

          {/* Action Row - Minimalized */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 border-t border-gray-100 mt-4">
            
            {/* Action Tools (Copy, Share) */}
            <div className="flex items-center gap-2">
              {currentQuote && (
                <div className="relative">
                  <button
                    onClick={handleCopy}
                    title="Copy Quote to Clipboard"
                    className="p-3 border border-gray-200 text-gray-400 hover:border-gray-900 hover:text-gray-900 transition-colors duration-300 flex items-center justify-center rounded-none"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-gray-900 font-bold" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  {copied && (
                    <span className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-none font-mono whitespace-nowrap z-30">
                      COPIED
                    </span>
                  )}
                </div>
              )}

              {currentQuote && (
                <div className="relative">
                  <button
                    onClick={handleShare}
                    title="Share Quote"
                    className="p-3 border border-gray-200 text-gray-400 hover:border-gray-900 hover:text-gray-900 transition-colors duration-300 flex items-center justify-center rounded-none"
                  >
                    {shared ? (
                      <Check className="w-4 h-4 text-gray-900 font-bold" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </button>
                  {shared && (
                    <span className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-none font-mono whitespace-nowrap z-30">
                      SHARE TEXT COPIED
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* STARK PRIMARY NEW QUOTE BUTTON */}
            <button
              onClick={handleNewQuote}
              className="px-10 py-4 border border-gray-900 text-xs font-bold uppercase tracking-[0.25em] hover:bg-gray-900 hover:text-white transition-all duration-300 rounded-none cursor-pointer select-none"
            >
              Generate New Quote
            </button>
          </div>

          {/* Quick status counters */}
          <div className="grid grid-cols-3 gap-4 border-t border-b border-gray-100 py-6 mt-4">
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest">Active Pool</span>
              <span className="text-xs font-bold text-gray-800">{activeCategory}</span>
            </div>
            <div className="h-8 w-px bg-gray-100 mx-auto self-center"></div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest">Source Count</span>
              <span className="text-xs font-bold text-gray-800">{filteredQuotes.length} Quotes</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: INTERACTIVE UTILITIES PANEL (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="bg-white border border-gray-100 rounded-none overflow-hidden flex flex-col min-h-[480px]">
            
            {/* Tabs Selector */}
            <div className="flex border-b border-gray-100 bg-gray-50/50 p-1">
              <button
                onClick={() => setActiveTab('browse')}
                className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                  activeTab === 'browse'
                    ? 'bg-white text-gray-900 border border-gray-100 border-b-transparent'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                Collection
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                  activeTab === 'create'
                    ? 'bg-white text-gray-900 border border-gray-100 border-b-transparent'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                Add Yours
              </button>
            </div>

            <div className="p-6 flex-grow flex flex-col">
              
              {/* TAB 1: BROWSE COLLECTION */}
              {activeTab === 'browse' && (
                <div className="flex-grow flex flex-col gap-6">
                  
                  {/* Flat Categories Chips */}
                  <div>
                    <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">
                      Filter Library
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(['All', 'Philosophy', 'Science & Tech', 'Wisdom', 'Literature & Art', 'Motivation'] as const).map(cat => {
                        const isSelected = activeCategory === cat;
                        const count = quotes.filter(q => {
                          if (cat === 'All') return true;
                          return q.category === cat;
                        }).length;

                        return (
                          <button
                            key={cat}
                            onClick={() => {
                              setActiveCategory(cat);
                              setTimeout(() => {
                                let pool = quotes;
                                if (cat !== 'All') {
                                  pool = quotes.filter(q => q.category === cat);
                                }
                                if (pool.length > 0 && (!currentQuote || !pool.some(q => q.id === currentQuote.id))) {
                                  setCurrentQuote(pool[Math.floor(Math.random() * pool.length)]);
                                  setAnimationKey(prev => prev + 1);
                                }
                              }, 50);
                            }}
                            className={`px-3 py-1.5 text-[10px] uppercase tracking-wider border rounded-none transition-all duration-200 ${
                              isSelected
                                ? 'bg-gray-900 text-white border-gray-900 font-semibold'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-900 hover:text-gray-900'
                            }`}
                          >
                            <span>{cat}</span>
                            <span className="ml-1 text-[9px] font-mono opacity-60">
                              ({count})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clean Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="SEARCH BY KEYWORD OR AUTHOR..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 text-[11px] bg-white border border-gray-200 rounded-none focus:outline-none focus:border-gray-900 transition-all placeholder:text-gray-400 text-gray-900 font-mono uppercase tracking-wider"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Result List */}
                  <div className="flex-grow flex flex-col">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                        Results ({filteredQuotes.length})
                      </span>
                    </div>

                    <div className="overflow-y-auto max-h-[260px] flex-grow pr-1 space-y-2 scrollbar-thin">
                      <AnimatePresence initial={false}>
                        {filteredQuotes.length > 0 ? (
                          filteredQuotes.map((q) => {
                            const isActive = currentQuote?.id === q.id;
                            return (
                              <motion.div
                                key={q.id}
                                layoutId={`quote_item_${q.id}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => handleSelectQuote(q)}
                                className={`p-3.5 border text-left cursor-pointer transition-all duration-200 relative flex items-start gap-2 justify-between rounded-none ${
                                  isActive
                                    ? 'bg-gray-50 border-gray-900 text-gray-900'
                                    : 'bg-white border-gray-100 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex-grow min-w-0 pr-4">
                                  <p className="text-xs text-gray-800 line-clamp-2 leading-relaxed font-sans font-light">
                                    "{q.text}"
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-medium text-gray-500 italic truncate">
                                      — {q.author}
                                    </span>
                                    <span className="text-[8px] font-mono bg-gray-50 px-1 py-0.5 text-gray-400 uppercase tracking-wider shrink-0">
                                      {q.category}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {q.id.startsWith('custom_') && (
                                    <button
                                      onClick={(e) => handleDeleteQuote(q.id, e)}
                                      className="p-1 hover:bg-red-50 text-gray-300 hover:text-red-600 transition-colors"
                                      title="Delete custom quote"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })
                        ) : (
                          <div className="text-center py-12 text-gray-400 font-sans italic text-xs">
                            {searchQuery.trim() !== ''
                              ? 'No matching quotes found.'
                              : 'No quotes available in this category.'}
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: WRITE / CREATE CUSTOM QUOTE */}
              {activeTab === 'create' && (
                <div className="flex-grow flex flex-col justify-between">
                  <form onSubmit={handleAddCustomQuote} className="space-y-5">
                    <div>
                      <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                        Add Custom Quote
                      </h4>
                      <p className="text-xs text-gray-500 mb-4 leading-relaxed font-sans">
                        Introduce personal insights, quotes, or wisdom. They are kept securely inside your local browser context.
                      </p>
                    </div>

                    {/* Quote Text Area */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        Quote Content
                      </label>
                      <textarea
                        rows={3}
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="Write your beautiful quote here..."
                        className="w-full p-3.5 text-xs bg-white border border-gray-200 rounded-none focus:outline-none focus:border-gray-900 transition-all placeholder:text-gray-400 text-gray-900 resize-none font-sans"
                      />
                    </div>

                    {/* Author Input */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        Author Name
                      </label>
                      <input
                        type="text"
                        value={customAuthor}
                        onChange={(e) => setCustomAuthor(e.target.value)}
                        placeholder="e.g. Unknown, Anonymous, or Yourself"
                        className="w-full p-3 text-xs bg-white border border-gray-200 rounded-none focus:outline-none focus:border-gray-900 transition-all placeholder:text-gray-400 text-gray-900"
                      />
                    </div>

                    {/* Category Selector */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        Category
                      </label>
                      <select
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value as Category)}
                        className="w-full p-3 text-xs bg-white border border-gray-200 rounded-none focus:outline-none focus:border-gray-900 transition-all text-gray-900"
                      >
                        <option value="Philosophy">Philosophy</option>
                        <option value="Science & Tech">Science & Tech</option>
                        <option value="Wisdom">Wisdom</option>
                        <option value="Literature & Art">Literature & Art</option>
                        <option value="Motivation">Motivation</option>
                      </select>
                    </div>

                    {/* Form Status Messages */}
                    {formError && (
                      <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-none border border-red-100">
                        {formError}
                      </p>
                    )}

                    {formSuccess && (
                      <p className="text-xs font-bold text-gray-900 bg-gray-50 p-2.5 rounded-none border border-gray-200 flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-900" /> Saved successfully.
                      </p>
                    )}

                    {/* Stark Submit Button */}
                    <button
                      type="submit"
                      disabled={formSuccess}
                      className="w-full py-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-bold text-xs uppercase tracking-[0.25em] transition-all duration-300 rounded-none"
                    >
                      Save & Showcase Quote
                    </button>
                  </form>
                  
                  <div className="text-[9px] font-mono text-gray-400 border-t border-gray-100 pt-3 mt-4 text-center">
                    STORES DIRECTLY TO THE CURRENT LOCAL ENVIRONMENT.
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </main>

      {/* --- FOOTER --- */}
      <footer className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-gray-100 text-center flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-sans">
        <p>
          Designed around the Axiom Clean Minimalism standard. Stored locally.
        </p>
        <p className="font-mono text-[9px] uppercase tracking-widest text-gray-400">
          Axiom v1.0.0
        </p>
      </footer>
    </div>
  );
}
