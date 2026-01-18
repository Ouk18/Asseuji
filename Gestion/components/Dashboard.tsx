
import React, { useMemo } from 'react';
import { AppData, UserRole } from '../types.ts';
import { 
  TrendingUp, Scale, Wallet, PiggyBank, Package, 
  ExternalLink, User, CheckCircle2, Download, BarChart3, Calculator,
  TrendingDown, ShieldAlert, ArrowUpRight, ArrowDownRight, FileDown
} from 'lucide-react';

interface Props {
  data: AppData;
  onExport: () => void;
  onNavigateToEmployee: (id: string) => void;
  userRole?: UserRole;
}

const Dashboard: React.FC<Props> = ({ data, onExport, onNavigateToEmployee, userRole }) => {
  const { harvests, advances, workTasks, settings, employees } = data;
  const isEmployee = userRole === 'EMPLOYE';
  const isGerant = userRole === 'GERANT';
  const isAdmin = userRole === 'ADMIN';
  const canExport = isAdmin || isGerant;

  const stats = useMemo(() => {
    const totalGrossPay = Math.round(
      harvests.reduce((acc, h) => acc + (h.weight * h.payRate), 0) + 
      workTasks.reduce((acc, t) => acc + t.amount, 0)
    );
    const totalAlreadyPaid = Math.round(advances.reduce((acc, a) => acc + a.amount, 0));
    
    const grossRevenue = Math.round(harvests.reduce((acc, h) => {
      const rate = h.crop === 'HEVEA' ? settings.marketPriceHevea : settings.marketPriceCacao;
      return acc + (h.weight * rate);
    }, 0));

    return { totalGrossPay, totalAlreadyPaid, grossRevenue };
  }, [harvests, workTasks, advances, settings]);

  const netDueToWorkers = stats.totalGrossPay - stats.totalAlreadyPaid;
  const profit = stats.grossRevenue - stats.totalGrossPay;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            {isEmployee ? "Mon Espace" : isGerant ? "Gestion Opérationnelle" : "Bilan Plantation"}
          </h2>
          <p className="text-gray-500 font-medium text-xs md:text-sm">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        
        {canExport && (
          <button 
            onClick={onExport} 
            className="flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <FileDown className="w-4 h-4" /> Exporter Rapport CSV
          </button>
        )}
      </div>

      <div className={`rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 text-white relative overflow-hidden shadow-xl border-2 ${
        isEmployee ? 'bg-emerald-800 border-emerald-700' : 
        isGerant ? 'bg-blue-900 border-blue-800' : 
        'bg-emerald-950 border-emerald-900'
      }`}>
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="bg-white/10 text-white/70 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-2 inline-block">
                {isEmployee ? "Mon Solde à percevoir" : isGerant ? "Charge Salariale Totale" : "Bénéfice Net Estimé"}
              </span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl md:text-7xl font-black tracking-tighter">
                  {isEmployee ? netDueToWorkers.toLocaleString() : isGerant ? stats.totalGrossPay.toLocaleString() : profit.toLocaleString()}
                </h3>
                <span className="text-lg md:text-3xl font-bold opacity-50">FCFA</span>
              </div>
            </div>
            {isAdmin && profit > 0 && <ArrowUpRight className="w-8 h-8 text-emerald-400 opacity-50" />}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[9px] font-black text-white/50 uppercase mb-1">Total Gagné</p>
              <p className="text-lg font-bold">{stats.totalGrossPay.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[9px] font-black text-white/50 uppercase mb-1">Déjà Reçu</p>
              <p className="text-lg font-bold">-{stats.totalAlreadyPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {!isEmployee && (
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-black text-sm uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" /> Reste à payer par ouvrier
            </h4>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {employees.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-xs italic">Aucun ouvrier enregistré.</p>
            ) : (
              employees.map(emp => {
                const empH = harvests.filter(h => h.employeeId === emp.id).reduce((acc, h) => acc + (h.weight * h.payRate), 0);
                const empT = workTasks.filter(t => t.employeeId === emp.id).reduce((acc, t) => acc + t.amount, 0);
                const empA = advances.filter(a => a.employeeId === emp.id).reduce((acc, a) => acc + a.amount, 0);
                const due = Math.round(empH + empT - empA);
                if (due <= 0) return null;
                return (
                  <button 
                    key={emp.id} 
                    onClick={() => onNavigateToEmployee(emp.id)}
                    className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-emerald-50 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black shadow-sm" style={{ backgroundColor: emp.color }}>
                        {emp.name.substring(0,2).toUpperCase()}
                      </div>
                      <span className="font-bold text-xs text-gray-700">{emp.name}</span>
                    </div>
                    <span className="font-black text-xs text-red-600">{due.toLocaleString()} <span className="text-[8px] opacity-50">FCFA</span></span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {!isEmployee && (
        <div className="grid grid-cols-2 gap-4">
          {['HEVEA', 'CACAO'].map(crop => {
            const vol = harvests.filter(h => h.crop === crop).reduce((acc, h) => acc + h.weight, 0);
            return (
              <div key={crop} className="bg-white p-5 rounded-3xl border shadow-sm space-y-1">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{crop}</p>
                <p className="text-xl font-black text-emerald-900">{vol.toLocaleString()} <span className="text-[10px] opacity-40 font-bold">KG</span></p>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${crop === 'HEVEA' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: vol > 0 ? '60%' : '0%' }}></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isEmployee && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border shadow-sm">
            <h4 className="font-black text-sm uppercase tracking-widest text-gray-400 mb-4">Mes Dernières Activités</h4>
            <div className="space-y-3">
              {harvests.slice(0, 5).length === 0 ? (
                <p className="text-center py-6 text-gray-400 text-xs italic">Aucune récolte enregistrée pour le moment.</p>
              ) : (
                harvests.slice(0, 5).map(h => (
                  <div key={h.id} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><Scale className="w-3 h-3" /></div>
                      <div>
                        <p className="font-bold">{h.weight} kg {h.crop}</p>
                        <p className="text-[8px] text-gray-400">{new Date(h.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="font-black text-emerald-700">{(h.weight * h.payRate).toLocaleString()} F</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
