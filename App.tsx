
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Scale, Wallet, Plus, Pickaxe, Loader2, LogOut, User as UserIcon, ShieldAlert,
  AlertTriangle, Trash2, X, Download, HelpCircle, Smartphone, Share, DownloadCloud,
  LayoutDashboard, Users, Calendar as CalendarIcon, Settings as SettingsIcon, RefreshCw,
  WifiOff, ShoppingBag
} from 'lucide-react';
import { supabase } from './lib/supabase.ts';
import { Employee, Harvest, Advance, RainEvent, MarketSettings, AppData, WorkTask, UserProfile, Entrepreneur } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import EmployeeManager from './components/EmployeeManager.tsx';
import CalendarView from './components/CalendarView.tsx';
import SettingsView from './components/SettingsView.tsx';
import HarvestForm from './components/HarvestForm.tsx';
import ExpenseForm from './components/ExpenseForm.tsx';
import RainForm from './components/RainForm.tsx';
import TaskForm from './components/TaskForm.tsx';
import Auth from './components/Auth.tsx';

const INITIAL_SETTINGS: MarketSettings = {
  payRateHevea: 75,
  payRateCacao: 0,
  marketPriceHevea: 360,
  marketPriceCacao: 2800,
  cacaoPayRatio: 0.3333,
};

const PRESET_COLORS = ['#2563eb', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#0891b2', '#4f46e5', '#ea580c', '#9333ea', '#475569'];

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'calendar' | 'settings'>('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [data, setData] = useState<AppData>({
    employees: [],
    entrepreneurs: [],
    harvests: [],
    advances: [],
    workTasks: [],
    rainEvents: [],
    settings: INITIAL_SETTINGS
  });

  const [pendingDeletion, setPendingDeletion] = useState<{ table: string; id: string; label: string } | null>(null);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState<{ employeeId?: string; amount?: number } | boolean>(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showRainModal, setShowRainModal] = useState<{ date: string } | null>(null);

  const isAdmin = profile?.role === 'ADMIN';
  const isGerant = profile?.role === 'GERANT';
  const canManage = isAdmin || isGerant;

  useEffect(() => {
    const safetyTimer = setTimeout(() => { if (isLoading) setIsLoading(false); }, 4500);
    return () => clearTimeout(safetyTimer);
  }, [isLoading]);

  const fetchData = useCallback(async () => {
    try {
      setSyncError(null);
      const [
        { data: employees },
        { data: entrepreneurs },
        { data: harvests },
        { data: advances },
        { data: workTasks },
        { data: rainEvents },
        { data: settingsData }
      ] = await Promise.all([
        supabase.from('employees').select('*').order('name'),
        supabase.from('entrepreneurs').select('*').order('name'),
        supabase.from('harvests').select('*').order('date', { ascending: false }),
        supabase.from('advances').select('*').order('date', { ascending: false }),
        supabase.from('work_tasks').select('*').order('date', { ascending: false }),
        supabase.from('rain_events').select('*').order('date', { ascending: false }),
        supabase.from('settings').select('*').maybeSingle()
      ]);

      setData({
        employees: (employees || []).map(e => ({
          id: e.id, name: e.name, status: e.status, crop: e.crop, color: e.color,
          iconName: e.icon_name || 'user', createdAt: new Date(e.created_at || Date.now()).getTime(),
          phone: e.phone, notes: e.notes, user_id: e.user_id
        })),
        entrepreneurs: (entrepreneurs || []).map(en => ({
          id: en.id, name: en.name, specialty: en.specialty, phone: en.phone, color: en.color
        })),
        harvests: (harvests || []).map(h => ({ 
          id: h.id, employeeId: h.employee_id, date: h.date, weight: h.weight, payRate: h.pay_rate, crop: h.crop 
        })),
        advances: (advances || []).map(a => ({ 
          id: a.id, employeeId: a.employee_id, entrepreneurId: a.entrepreneur_id, 
          date: a.date, amount: a.amount, category: a.category || 'AVANCE',
          paymentMethod: a.payment_method, notes: a.notes 
        })),
        workTasks: (workTasks || []).map(t => ({ 
          id: t.id, employeeId: t.employee_id, date: t.date, description: t.description, amount: t.amount 
        })),
        rainEvents: rainEvents || [],
        settings: settingsData ? {
          payRateHevea: settingsData.pay_rate_hevea, payRateCacao: settingsData.pay_rate_cacao,
          marketPriceHevea: settingsData.market_price_hevea, marketPriceCacao: settingsData.market_price_cacao,
          cacaoPayRatio: settingsData.cacao_pay_ratio
        } : INITIAL_SETTINGS
      });
    } catch (err) {
      setSyncError("Erreur de connexion.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (s) {
          setSession(s);
          fetchData();
          supabase.from('profiles').select('*').eq('id', s.user.id).maybeSingle()
            .then(({ data: p }) => { if (mounted && p) setProfile(p); });
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        if (mounted) setIsLoading(false);
      }
    };
    initialize();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      if (s) fetchData(); else { setIsLoading(false); setProfile(null); }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [fetchData]);

  const handleSaveExpense = async (a: any) => {
    try {
      const { error } = await supabase.from('advances').insert([{ 
        employee_id: a.employeeId || null,
        entrepreneur_id: a.entrepreneurId || null,
        date: a.date, amount: a.amount, 
        category: a.category,
        payment_method: a.paymentMethod, notes: a.notes 
      }]);
      if (error) throw error;
      setShowExpenseModal(false);
      fetchData();
    } catch (err: any) {
      alert("Erreur: " + err.message);
    }
  };

  const handleAddEntrepreneur = async (en: any) => {
    try {
      const { error } = await supabase.from('entrepreneurs').insert([{
        name: en.name,
        specialty: en.specialty,
        phone: en.phone,
        color: PRESET_COLORS[data.entrepreneurs.length % PRESET_COLORS.length]
      }]);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert("Erreur: " + err.message);
    }
  };

  if (!session && !isLoading) return <Auth />;
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="bg-emerald-600 p-6 rounded-[2rem] text-white shadow-2xl animate-pulse">
          <Loader2 className="w-12 h-12 animate-spin" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24 md:pb-0 safe-top">
      <header className="h-20 bg-white border-b px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl text-white font-black text-sm">AP</div>
            <span className="text-xl font-black tracking-tighter text-emerald-950">AgriPay</span>
          </div>
          <nav className="hidden md:flex items-center gap-2">
            <button onClick={() => setActiveTab('dashboard')} className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400'}`}>Bilan</button>
            <button onClick={() => setActiveTab('employees')} className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'employees' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400'}`}>Équipe</button>
            <button onClick={() => setActiveTab('calendar')} className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'calendar' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400'}`}>Journal</button>
            {isAdmin && <button onClick={() => setActiveTab('settings')} className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400'}`}>Options</button>}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setIsRefreshing(true); fetchData(); }} className={`p-2.5 bg-gray-50 rounded-xl transition-all ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-gray-400'}`}><RefreshCw className="w-5 h-5" /></button>
          <button onClick={() => { supabase.auth.signOut(); window.location.reload(); }} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && <Dashboard data={data} onExport={() => {}} onNavigateToEmployee={(id) => { setSelectedEmployeeId(id); setActiveTab('employees'); }} userRole={profile?.role} />}
        {activeTab === 'employees' && <EmployeeManager employees={data.employees} entrepreneurs={data.entrepreneurs} harvests={data.harvests} advances={data.advances} workTasks={data.workTasks} selectedId={selectedEmployeeId} onSelectId={setSelectedEmployeeId} onAdd={async (e) => { await supabase.from('employees').insert([{...e, status: 'ACTIF', icon_name:'user', color: PRESET_COLORS[data.employees.length % PRESET_COLORS.length], user_id: session?.user?.id}]); fetchData(); }} onAddEntrepreneur={handleAddEntrepreneur} onUpdate={async (id, u) => { await supabase.from('employees').update(u).eq('id', id); fetchData(); }} onUpdateStatus={async (id, s) => { await supabase.from('employees').update({ status: s }).eq('id', id); fetchData(); }} onClearBalance={(id, amount) => setShowExpenseModal({ employeeId: id, amount })} onDeleteEmployee={(id) => setPendingDeletion({table:'employees', id, label:"l'Employé"})} onDeleteEntrepreneur={(id) => setPendingDeletion({table:'entrepreneurs', id, label:"le Prestataire"})} canDelete={isAdmin} canEdit={canManage} />}
        {/* Fixed: Added entrepreneurs prop to CalendarView */}
        {activeTab === 'calendar' && <CalendarView employees={data.employees} entrepreneurs={data.entrepreneurs} harvests={data.harvests} advances={data.advances} workTasks={data.workTasks} rainEvents={data.rainEvents} onDeleteHarvest={(id) => setPendingDeletion({table:'harvests', id, label:'cette récolte'})} onDeleteAdvance={(id) => setPendingDeletion({table:'advances', id, label:'cette dépense'})} onDeleteTask={(id) => setPendingDeletion({table:'work_tasks', id, label:'ce travail'})} onAddRain={(date) => setShowRainModal({ date })} onDeleteRain={(id) => setPendingDeletion({table:'rain_events', id, label:'cette météo'})} />}
        {isAdmin && activeTab === 'settings' && <SettingsView settings={data.settings} onUpdate={async (s) => { await supabase.from('settings').upsert({id: 1, pay_rate_hevea: s.payRateHevea, pay_rate_cacao: s.payRateCacao, market_price_hevea: s.marketPriceHevea, market_price_cacao: s.marketPriceCacao, cacao_pay_ratio: s.cacaoPayRatio}); fetchData(); }} />}
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t flex items-center justify-around py-4 z-50 safe-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-emerald-600' : 'text-gray-400'}`}><LayoutDashboard className="w-6 h-6" /><span className="text-[10px] font-black uppercase">Bilan</span></button>
        <button onClick={() => setActiveTab('employees')} className={`flex flex-col items-center gap-1 ${activeTab === 'employees' ? 'text-emerald-600' : 'text-gray-400'}`}><Users className="w-6 h-6" /><span className="text-[10px] font-black uppercase">Équipe</span></button>
        <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center gap-1 ${activeTab === 'calendar' ? 'text-emerald-600' : 'text-gray-400'}`}><CalendarIcon className="w-6 h-6" /><span className="text-[10px] font-black uppercase">Journal</span></button>
        {isAdmin && <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-emerald-600' : 'text-gray-400'}`}><SettingsIcon className="w-6 h-6" /><span className="text-[10px] font-black uppercase">Options</span></button>}
      </nav>

      {canManage && (
        <div className="fixed bottom-28 right-6 flex flex-col gap-3 md:bottom-10 md:right-10 z-30">
          <button onClick={() => setShowHarvestModal(true)} className="w-14 h-14 md:w-20 md:h-20 bg-emerald-600 text-white rounded-3xl shadow-2xl flex items-center justify-center border-4 border-white"><Scale className="w-6 h-6 md:w-8 md:h-8" /></button>
          <button onClick={() => setShowTaskModal(true)} className="w-14 h-14 md:w-20 md:h-20 bg-blue-600 text-white rounded-3xl shadow-2xl flex items-center justify-center border-4 border-white"><Pickaxe className="w-6 h-6 md:w-8 md:h-8" /></button>
          <button onClick={() => setShowExpenseModal(true)} className="w-14 h-14 md:w-20 md:h-20 bg-amber-500 text-white rounded-3xl shadow-2xl flex items-center justify-center border-4 border-white"><ShoppingBag className="w-6 h-6 md:w-8 md:h-8" /></button>
        </div>
      )}

      {pendingDeletion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-sm rounded-[3rem] p-10 text-center space-y-8">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner"><AlertTriangle className="w-10 h-10" /></div>
            <h4 className="text-xl font-black text-gray-900">Confirmer la suppression ?</h4>
            <div className="flex flex-col gap-3">
              <button onClick={async () => { await supabase.from(pendingDeletion.table).delete().eq('id', pendingDeletion.id); fetchData(); setPendingDeletion(null); }} className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black uppercase shadow-xl">Supprimer</button>
              <button onClick={() => setPendingDeletion(null)} className="w-full py-5 bg-gray-100 text-gray-400 rounded-[2rem] font-black uppercase">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {showHarvestModal && <HarvestForm employees={data.employees.filter(e => e.status === 'ACTIF')} settings={data.settings} onClose={() => setShowHarvestModal(false)} onSubmit={async (h) => { await supabase.from('harvests').insert([{ employee_id: h.employeeId, date: h.date, weight: h.weight, pay_rate: h.payRate, crop: h.crop }]); setShowHarvestModal(false); fetchData(); }} />}
      {showTaskModal && <TaskForm employees={data.employees.filter(e => e.status === 'ACTIF')} onClose={() => setShowTaskModal(false)} onSubmit={async (t) => { await supabase.from('work_tasks').insert([{ employee_id: t.employeeId, date: t.date, description: t.description, amount: t.amount }]); setShowTaskModal(false); fetchData(); }} />}
      {showExpenseModal && <ExpenseForm employees={data.employees} entrepreneurs={data.entrepreneurs} onClose={() => setShowExpenseModal(false)} onSubmit={handleSaveExpense} initialData={typeof showExpenseModal === 'object' ? showExpenseModal : undefined} />}
      {showRainModal && <RainForm date={showRainModal.date} onClose={() => setShowRainModal(null)} onSubmit={async (r) => { await supabase.from('rain_events').insert([r]); setShowRainModal(null); fetchData(); }} />}
    </div>
  );
};

export default App;
