
import React, { useMemo } from 'react';
import { AppData, UserRole } from '../types.ts';
import { 
  TrendingUp, Scale, Wallet, PiggyBank, Package, 
  ExternalLink, User, CheckCircle2, Download, BarChart3, Calculator,
  TrendingDown, ShieldAlert, ArrowUpRight, ArrowDownRight, FileDown,
  ShoppingBag, Truck
} from 'lucide-react';

interface Props {
  data: AppData;
  onExport: () => void;
  onNavigateToEmployee: (id: string) => void;
  userRole?: UserRole;
}

const Dashboard: React.FC<Props> = ({ data, onExport, onNavigateToEmployee, userRole }) => {
  const { harvests, advances, workTasks, settings, employees, entrepreneurs } = data;
  const isEmployee = userRole === 'EMPLOYE';
  const isGerant = userRole === 'GERANT';
  const isAdmin = userRole === 'ADMIN';
  const canExport = isAdmin || isGerant;

  const stats = useMemo(() => {
    // Somme des manœuvres (avances + travail à la tâche + récolte)
    const workerGross = Math.round(
      harvests.reduce((acc, h) => acc + (h.weight * h.payRate), 0) + 
      workTasks.reduce((acc, t) => acc + t.amount, 0)
    );
    
    // Total déjà payé (avances manœuvres uniquement)
    const totalWorkerPaid = Math.round(advances.filter(a => a.employeeId).reduce((acc, a) => acc + a.amount, 0));
    
    // Total dépenses prestataires / matériel (tout ce qui n'est pas employé)
    const totalExternalExpenses = Math.round(advances.filter(a => !a.employeeId).reduce((acc, a) => acc + a.amount, 0));

    // Revenu brut total de la récolte
    const grossRevenue = Math.round(harvests.reduce((acc, h) => {
      const rate = h.crop === 'HEVEA' ? settings.marketPriceHevea : settings.marketPriceCacao;
      return acc + (h.weight * rate);
    }, 0));

    return { workerGross, totalWorkerPaid, totalExternalExpenses, grossRevenue };
  }, [harvests, workTasks, advances, settings]);

  const netDueToWorkers = stats.workerGross - stats.totalWorkerPaid;
  const profit = stats.grossRevenue - stats.workerGross - stats.totalExternalExpenses;

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
            <FileDown className="w-4 h-4" /> Exporter Rapport
          </button>
        )}
      </div>

      <div className={`rounded-[2.5rem] md:rounded-[3.5rem] p-7 md:p-10 text-white relative overflow-hidden shadow-2xl border-2 ${
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
                  {isEmployee ? netDueToWorkers.toLocaleString() : isGerant ? stats.workerGross.toLocaleString() : profit.toLocaleString()}
                </h3>
                <span className="text-lg md:text-3xl font-bold opacity-50">FCFA</span>
              </div>
            </div>
            {isAdmin && profit > 0 && <ArrowUpRight className="w-10 h-10 text-emerald-400 opacity-50" />}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
              <p className="text-[9px] font-black text-white/50 uppercase mb-1">Dépenses Manœuvres</p>
              <p className="text-lg font-bold">-{stats.totalWorkerPaid.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
              <p className="text-[9px] font-black text-white/50 uppercase mb-1">Frais Prestataires</p>
              <p className="text-lg font-bold">-{stats.totalExternalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {!isEmployee && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2rem] border shadow-sm flex flex-col">
            <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" /> Reliquats à solder
            </h4>
            <div className="space-y-2 flex-1 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {employees.length === 0 ? (
                <p className="text-center py-6 text-gray-300 text-[10px] font-bold">Aucun ouvrier</p>
              ) : (
                employees.map(emp => {
                  const empH = harvests.filter(h => h.employeeId === emp.id).reduce((acc, h) => acc + (h.weight * h.payRate), 0);
                  const empT = workTasks.filter(t => t.employeeId === emp.id).reduce((acc, t) => acc + t.amount, 0);
                  const empA = advances.filter(a => a.employeeId === emp.id).reduce((acc, a) => acc + a.amount, 0);
                  const due = Math.round(empH + empT - empA);
                  if (due <= 0) return null;
                  return (
                    <button key={emp.id} onClick={() => onNavigateToEmployee(emp.id)} className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-emerald-50 rounded-xl transition-all">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black" style={{ backgroundColor: emp.color }}>{emp.name.substring(0,2).toUpperCase()}</div>
                        <span className="font-bold text-xs text-gray-700">{emp.name}</span>
                      </div>
                      <span className="font-black text-xs text-red-600">{due.toLocaleString()} F</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border shadow-sm flex flex-col">
            <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" /> Derniers règlements prestataires
            </h4>
            <div className="space-y-2 flex-1 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {advances.filter(a => a.entrepreneurId).length === 0 ? (
                <p className="text-center py-6 text-gray-300 text-[10px] font-bold">Aucune charge externe</p>
              ) : (
                advances.filter(a => a.entrepreneurId).slice(0, 10).map(a => {
                  const en = entrepreneurs.find(e => e.id === a.entrepreneurId);
                  return (
                    <div key={a.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <div className="flex flex-col">
                        <span className="font-bold text-[10px] text-gray-700">{en?.name || 'Inconnu'}</span>
                        <span className="text-[8px] text-gray-400 font-bold uppercase">{a.category}</span>
                      </div>
                      <span className="font-black text-[10px] text-blue-600">-{a.amount.toLocaleString()} F</span>
                    </div>
                  );
                })
              )}
            </div>
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
    </div>
  );
};

export default Dashboard;
