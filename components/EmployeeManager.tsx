
import React, { useState } from 'react';
import { Employee, EmployeeStatus, CropType, Harvest, Advance, WorkTask, Entrepreneur } from '../types.ts';
import { 
  UserPlus, UserX, UserCheck, 
  X, Scale, Wallet, ReceiptText,
  User, PhoneCall, Trash2, Banknote, Pickaxe,
  PlusCircle, Truck, Briefcase, Plus
} from 'lucide-react';
import EmployeeForm from './EmployeeForm.tsx';
import EntrepreneurForm from './EntrepreneurForm.tsx';

interface Props {
  employees: Employee[];
  entrepreneurs: Entrepreneur[];
  harvests: Harvest[];
  advances: Advance[];
  workTasks: WorkTask[];
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
  onAdd: (emp: any) => Promise<void>;
  onAddEntrepreneur: (en: any) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Employee>) => void;
  onUpdateStatus: (id: string, status: EmployeeStatus) => void;
  onClearBalance: (employeeId: string, amount: number) => void;
  onDeleteEmployee: (id: string) => void;
  onDeleteEntrepreneur: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const EmployeeManager: React.FC<Props> = ({ 
  employees, entrepreneurs, harvests, advances, workTasks, selectedId, onSelectId, 
  onAdd, onAddEntrepreneur, onUpdate, onUpdateStatus, onClearBalance, onDeleteEmployee, onDeleteEntrepreneur, canEdit = true, canDelete = false
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'entrepreneurs'>('employees');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddEntrepreneur, setShowAddEntrepreneur] = useState(false);
  const selectedEmployee = employees.find(e => e.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Header avec Navigation et Boutons d'Action Rapide */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Gestion du Personnel</h3>
            <div className="flex gap-2">
                <button 
                    onClick={() => setShowAddEmployee(true)}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                >
                    <Plus className="w-3.5 h-3.5" /> Manœuvre
                </button>
                <button 
                    onClick={() => setShowAddEntrepreneur(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-lg font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                >
                    <Plus className="w-3.5 h-3.5" /> Prestataire
                </button>
            </div>
        </div>

        <div className="flex bg-white p-1 rounded-2xl border w-full overflow-hidden">
          <button 
            onClick={() => setActiveSubTab('employees')} 
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'employees' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400'}`}
          >
            Nos Manœuvres ({employees.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('entrepreneurs')} 
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'entrepreneurs' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400'}`}
          >
            Prestataires ({entrepreneurs.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'employees' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {employees.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200">
               <User className="w-12 h-12 mx-auto text-gray-200 mb-3" />
               <p className="text-xs font-bold text-gray-400 uppercase">Aucun manœuvre enregistré</p>
            </div>
          ) : (
            employees.map(emp => {
                const empH = harvests.filter(h => h.employeeId === emp.id).reduce((acc, h) => acc + (h.weight * h.payRate), 0);
                const empT = workTasks.filter(t => t.employeeId === emp.id).reduce((acc, t) => acc + t.amount, 0);
                const empA = advances.filter(a => a.employeeId === emp.id).reduce((acc, a) => acc + a.amount, 0);
                const empDue = Math.round(empH + empT - empA);
                return (
                  <div key={emp.id} onClick={() => onSelectId(emp.id)} className={`bg-white p-5 rounded-[2rem] border-2 transition-all cursor-pointer hover:shadow-xl ${selectedId === emp.id ? 'border-emerald-600 bg-emerald-50/30' : 'border-white shadow-sm'} ${emp.status !== 'ACTIF' ? 'opacity-60 grayscale' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-inner" style={{ backgroundColor: emp.status === 'ACTIF' ? emp.color : '#cbd5e1' }}>
                          {emp.name.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-gray-900">{emp.name}</h4>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${emp.crop === 'HEVEA' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{emp.crop}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${empDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{Math.abs(empDue).toLocaleString()} F</p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Solde actuel</p>
                      </div>
                    </div>
                  </div>
                );
            })
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {entrepreneurs.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200">
               <Truck className="w-12 h-12 mx-auto text-gray-200 mb-3" />
               <p className="text-xs font-bold text-gray-400 uppercase">Aucun prestataire enregistré</p>
            </div>
          ) : (
            entrepreneurs.map(en => {
                // Total des paiements effectués à ce prestataire
                const totalPaid = advances.filter(a => a.entrepreneurId === en.id).reduce((acc, a) => acc + a.amount, 0);
                return (
                  <div key={en.id} className="bg-white p-5 rounded-[2rem] border-2 border-white shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: en.color || '#2563eb' }}><Truck className="w-6 h-6" /></div>
                        <div>
                          <h4 className="font-black text-sm text-gray-900">{en.name}</h4>
                          <p className="text-[9px] font-bold text-gray-400 uppercase">{en.specialty || 'Fournisseur / Prestataire'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-blue-600">{totalPaid.toLocaleString()} F</p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase">Total réglé</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                      {en.phone && <a href={`tel:${en.phone}`} className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold"><PhoneCall className="w-3 h-3" /> Appeler</a>}
                      {canDelete && <button onClick={() => onDeleteEntrepreneur(en.id)} className="p-2 bg-red-50 text-red-600 rounded-xl active:scale-90"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </div>
                );
            })
          )}
        </div>
      )}

      {showAddEmployee && <EmployeeForm onClose={() => setShowAddEmployee(false)} onSubmit={async (e) => { await onAdd(e); setShowAddEmployee(false); }} />}
      {showAddEntrepreneur && <EntrepreneurForm onClose={() => setShowAddEntrepreneur(false)} onSubmit={async (en) => { await onAddEntrepreneur(en); setShowAddEntrepreneur(false); }} />}

      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 md:p-8 text-white flex justify-between items-center" style={{ backgroundColor: selectedEmployee.status === 'ACTIF' ? selectedEmployee.color : '#64748b' }}>
              <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30"><User className="w-6 h-6" /></div><div><h2 className="text-xl font-black">{selectedEmployee.name}</h2><p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{selectedEmployee.crop} • {selectedEmployee.status}</p></div></div>
              <button onClick={() => onSelectId(null)} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-10">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-4 rounded-2xl text-center"><p className="text-[8px] font-black text-gray-400 uppercase mb-1">Total Gagné</p><p className="text-sm font-black text-gray-900">{(Math.round(harvests.filter(h => h.employeeId === selectedId).reduce((acc, h) => acc + (h.weight * h.payRate), 0) + workTasks.filter(t => t.employeeId === selectedId).reduce((acc, t) => acc + t.amount, 0))).toLocaleString()} F</p></div>
                <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-100">
                  <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Solde à Payer</p>
                  <p className="text-sm font-black text-emerald-700">{(() => { const hVal = harvests.filter(h => h.employeeId === selectedId).reduce((acc, h) => acc + (h.weight * h.payRate), 0); const tVal = workTasks.filter(t => t.employeeId === selectedId).reduce((acc, t) => acc + t.amount, 0); const aVal = advances.filter(a => a.employeeId === selectedId).reduce((acc, a) => acc + a.amount, 0); return Math.round(hVal + tVal - aVal).toLocaleString(); })()} F</p>
                </div>
              </div>
              <button onClick={() => { const hVal = harvests.filter(h => h.employeeId === selectedId).reduce((acc, h) => acc + (h.weight * h.payRate), 0); const tVal = workTasks.filter(t => t.employeeId === selectedId).reduce((acc, t) => acc + t.amount, 0); const aVal = advances.filter(a => a.employeeId === selectedId).reduce((acc, a) => acc + a.amount, 0); const due = Math.round(hVal + tVal - aVal); if (due > 0) { onClearBalance(selectedEmployee.id, due); onSelectId(null); } }} className="w-full flex items-center justify-center gap-3 py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl">
                <Banknote className="w-5 h-5" /> Solder le Compte
              </button>
              <div className="space-y-4">
                <h4 className="font-black text-xs uppercase text-gray-400 tracking-widest flex items-center gap-2"><ReceiptText className="w-4 h-4 text-emerald-600" /> Historique</h4>
                <div className="space-y-2">
                  {[...harvests, ...advances, ...workTasks].filter(i => (i as any).employeeId === selectedId).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl text-xs">
                      <div className="flex flex-col"><span className="font-medium text-gray-500">{new Date(item.date).toLocaleDateString()}</span><span className="text-[10px] font-bold text-gray-400">{item.weight ? 'Récolte' : item.description ? 'Tâche' : 'Paiement'}</span></div>
                      <span className={`font-black ${item.amount && !item.description ? 'text-red-600' : 'text-emerald-700'}`}>{item.amount ? `${item.amount.toLocaleString()} F` : `${(item.weight * item.payRate).toLocaleString()} F`}</span>
                    </div>
                  ))}
                </div>
              </div>
              {canDelete && <button onClick={() => { onDeleteEmployee(selectedEmployee.id); onSelectId(null); }} className="w-full py-4 text-red-400 font-bold text-[10px] uppercase hover:bg-red-50 rounded-2xl transition-all">Supprimer Fiche</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManager;
