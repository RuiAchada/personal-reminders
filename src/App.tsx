import {
  Check,
  ChefHat,
  Copy, Edit2,
  PackageOpen,
  Plus,
  Search,
  Trash2, X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// --- Types ---
type FoodItem = {
  id: string;
  title: string;
  daysToConsumeAfterOpening: number;
  daysToConsumeAfterCooking: number;
  
  // State
  status: 'owned' | 'unowned';
  originalExpirationDate: string | null; // YYYY-MM-DD
  openedDate: string | null;             // YYYY-MM-DD
  cookedDate: string | null;             // YYYY-MM-DD
};

type FormMode = 'new' | 'edit' | 'duplicate' | 're-add' | null;

// --- Helper Functions ---
const getTodayStr = () => new Date().toISOString().split('T')[0];

const calculateDaysLeft = (item: FoodItem): number | null => {
  if (item.status === 'unowned' || !item.originalExpirationDate) return null;

  const today = new Date(getTodayStr());
  let expiryDate = new Date(item.originalExpirationDate);

  // If cooked, it overrides everything else
  if (item.cookedDate) {
    expiryDate = new Date(item.cookedDate);
    expiryDate.setDate(expiryDate.getDate() + item.daysToConsumeAfterCooking);
  } 
  // If opened (and not cooked)
  else if (item.openedDate) {
    const openExpiry = new Date(item.openedDate);
    openExpiry.setDate(openExpiry.getDate() + item.daysToConsumeAfterOpening);
    if (openExpiry < expiryDate) {
      expiryDate = openExpiry;
    }
  }

  const diffTime = expiryDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getStatusColor = (daysLeft: number | null, status: 'owned' | 'unowned') => {
  if (status === 'unowned') return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-500' };
  if (daysLeft === null) return { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-900' };
  
  if (daysLeft <= 0) return { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-900' };
  if (daysLeft <= 3) return { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-900' };
  return { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-900' };
};

export default function App() {
  // --- State ---
  const [items, setItems] = useState<FoodItem[]>(() => {
    const saved = localStorage.getItem('pantry-v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  
  // Form State
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [formData, setFormData] = useState<Partial<FoodItem>>({});

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('pantry-v2', JSON.stringify(items));
  }, [items]);

  // --- Sorting & Filtering ---
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items;
    if (searchQuery) {
      filtered = items.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return [...filtered].sort((a, b) => {
      // 1. Unowned items always go to the bottom
      if (a.status === 'unowned' && b.status === 'owned') return 1;
      if (a.status === 'owned' && b.status === 'unowned') return -1;
      
      // 2. Sort owned items by days left
      if (a.status === 'owned' && b.status === 'owned') {
        const daysA = calculateDaysLeft(a) ?? 999;
        const daysB = calculateDaysLeft(b) ?? 999;
        return daysA - daysB;
      }
      return 0;
    });
  }, [items, searchQuery]);

  // --- Actions ---
  const handleAction = (id: string, action: 'open' | 'cook' | 'eat' | 'remove') => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const today = getTodayStr();
      switch (action) {
        case 'open': return { ...item, openedDate: today };
        case 'cook': return { ...item, cookedDate: today };
        case 'eat': return { 
          ...item, 
          status: 'unowned', 
          originalExpirationDate: null, 
          openedDate: null, 
          cookedDate: null 
        };
        default: return item;
      }
    }).filter(item => action === 'remove' ? item.id !== id : true));
    
    setSelectedItem(null);
  };

  // --- Form Handling ---
  const openForm = (mode: FormMode, item?: FoodItem) => {
    setFormMode(mode);
    setSelectedItem(null);
    if (mode === 'new') {
      setFormData({ title: searchQuery, status: 'owned' });
    } else if (item) {
      setFormData({ 
        ...item, 
        id: mode === 'duplicate' ? undefined : item.id,
        originalExpirationDate: (mode === 're-add' || mode === 'duplicate') ? '' : item.originalExpirationDate,
        status: 'owned',
        openedDate: null,
        cookedDate: null
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem = {
      ...formData,
      id: formData.id || crypto.randomUUID(),
      status: 'owned',
    } as FoodItem;

    if (formMode === 'new' || formMode === 'duplicate') {
      setItems(prev => [...prev, newItem]);
    } else {
      setItems(prev => prev.map(i => i.id === newItem.id ? newItem : i));
    }
    
    setFormMode(null);
    setSearchQuery('');
  };

  // --- Rendering ---
  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      {/* Header & Search */}
 <div className="bg-white p-4 pt-[calc(env(safe-area-inset-top)+1rem)] shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold mb-4 text-center">Pantry</h1>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search food..."
              className="w-full bg-gray-100 rounded-lg py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => openForm('new')}
            className="bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center shrink-0"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {filteredAndSortedItems.map(item => {
          const daysLeft = calculateDaysLeft(item);
          const colors = getStatusColor(daysLeft, item.status);

          return (
            <div 
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-4 aspect-square flex flex-col justify-center items-center text-center shadow-sm cursor-pointer transition-transform active:scale-95`}
            >
              <h3 className={`font-bold text-lg leading-tight mb-2 ${colors.text} line-clamp-2`}>
                {item.title}
              </h3>
              
              {item.status === 'owned' ? (
                <div className="space-y-1">
                  <p className={`text-sm font-medium ${colors.text} opacity-90`}>
                    {daysLeft !== null && daysLeft < 0 ? 'Expired' : 
                     daysLeft === 0 ? 'Expires Today' : 
                     `${daysLeft} days left`}
                  </p>
                  
                  {/* Status Badges */}
                  <div className="flex gap-1 justify-center mt-2">
                    {item.cookedDate && <ChefHat size={16} className="text-orange-600" />}
                    {item.openedDate && !item.cookedDate && <PackageOpen size={16} className="text-blue-600" />}
                  </div>
                </div>
              ) : (
                <p className="text-sm font-medium text-gray-400">Not Owned</p>
              )}
            </div>
          )
        })}
        
        {filteredAndSortedItems.length === 0 && (
          <div className="col-span-2 text-center py-10 text-gray-400">
            No food found. Click + to add some!
          </div>
        )}
      </div>

      {/* Action Modal (Bottom Sheet style) */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">{selectedItem.title}</h2>
              <button onClick={() => setSelectedItem(null)} className="p-1 bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {selectedItem.status === 'owned' && (
                <>
                  <button onClick={() => handleAction(selectedItem.id, 'open')} disabled={!!selectedItem.openedDate || !!selectedItem.cookedDate} className="btn-action bg-blue-50 text-blue-700 disabled:opacity-50">
                    <PackageOpen size={18} /> {selectedItem.openedDate ? 'Opened' : 'Open'}
                  </button>
                  <button onClick={() => handleAction(selectedItem.id, 'cook')} disabled={!!selectedItem.cookedDate} className="btn-action bg-orange-50 text-orange-700 disabled:opacity-50">
                    <ChefHat size={18} /> {selectedItem.cookedDate ? 'Cooked' : 'Cook'}
                  </button>
                  <button onClick={() => handleAction(selectedItem.id, 'eat')} className="btn-action bg-green-50 text-green-700">
                    <Check size={18} /> Eaten
                  </button>
                  <button onClick={() => openForm('duplicate', selectedItem)} className="btn-action bg-gray-100 text-gray-700">
                    <Copy size={18} /> Duplicate
                  </button>
                </>
              )}
              
              {selectedItem.status === 'unowned' && (
                <button onClick={() => openForm('re-add', selectedItem)} className="col-span-2 btn-action bg-blue-600 text-white">
                  <Plus size={18} /> Add / Restock
                </button>
              )}

              <button onClick={() => openForm('edit', selectedItem)} className="btn-action bg-gray-100 text-gray-700">
                <Edit2 size={18} /> Edit
              </button>
              <button onClick={() => handleAction(selectedItem.id, 'remove')} className="btn-action bg-red-50 text-red-700">
                <Trash2 size={18} /> Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {formMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleFormSubmit} className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold capitalize">
              {formMode.replace('-', ' ')} Food
            </h2>

            <div className="space-y-3">
              {(formMode === 'new' || formMode === 'edit') && (
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input type="text" required className="input-field" 
                    value={formData.title || ''} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Expiration Date</label>
                <input type="date" required className="input-field" 
                  value={formData.originalExpirationDate || ''} 
                  onChange={e => setFormData({...formData, originalExpirationDate: e.target.value})} 
                />
              </div>

              {(formMode === 'new' || formMode === 'edit') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Days valid (Opened)</label>
                    <input type="number" required min="1" className="input-field" 
                      value={formData.daysToConsumeAfterOpening || ''} 
                      onChange={e => setFormData({...formData, daysToConsumeAfterOpening: Number(e.target.value)})} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Days valid (Cooked)</label>
                    <input type="number" required min="1" className="input-field" 
                      value={formData.daysToConsumeAfterCooking || ''} 
                      onChange={e => setFormData({...formData, daysToConsumeAfterCooking: Number(e.target.value)})} 
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setFormMode(null)} className="flex-1 py-2 rounded-lg bg-gray-100 font-medium">Cancel</button>
              <button type="submit" className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-medium">Save</button>
            </div>
          </form>
        </div>
      )}
      
      {/* Global Styles injected for cleaner JSX */}
      <style>{`
        .btn-action {
          @apply flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors;
        }
        .input-field {
          @apply w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none;
        }
      `}</style>
    </div>
  );
}