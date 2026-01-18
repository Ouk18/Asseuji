
import React, { useState, useEffect } from 'react';
import { Employee, Harvest, MarketSettings } from '../types.ts';
import { X, Scale, Calculator } from 'lucide-react';

interface Props {
  employees: Employee[];
  settings: MarketSettings;
  onClose: () => void;
  onSubmit: (harvest: Omit<Harvest, 'id'>) => void;
}

const HarvestForm: React.FC<Props> = ({ employees, settings, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    employeeId: employees[0]?.id || '',
    weight: '',
    date: new Date().toISOString().split('T')[0],
    payRate: '',
  });

  const selectedEmployee = employees.find(e => e.id === formData.employeeId);
  
  // Calcul dynamique du tarif proposé par défaut
  const getProposedRate = () => {
    if (!selectedEmployee) return 0;
    if (selectedEmployee.crop === 'HEVEA') {
      return settings.payRateHevea;
    } else {
      // Pour le cacao, on propose automatiquement le 1/3 (ou ratio configuré) du prix du marché
      return Math.round(settings.marketPriceCacao * settings.cacaoPayRatio);
    }
  };

  const proposedRate = getProposedRate();

  // Mise à jour automatique du tarif quand on change d'employé
  useEffect(() => {
    setFormData(prev => ({ ...prev, payRate: getProposedRate().toString() }));
  }, [formData.employeeId, settings]);

  const currentPayRate = formData.payRate === '' ? proposedRate : Number(formData.payRate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    onSubmit({
      employeeId: formData.employeeId,
      weight: Number(formData.weight),
      date: formData.date,
      payRate: currentPayRate,
      crop: selectedEmployee.crop
    });
  };

  const ratioPercent = Math.round(settings.cacaoPayRatio * 1000) / 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 bg-emerald-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-xl"><Scale className="w-6 h-6" /></div>
            <h3 className="text-xl font-bold uppercase tracking-tight">Nouvelle Récolte</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Employé</label>
            <select 
              value={formData.employeeId}
              onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold"
              required
            >
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.crop})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Poids (kg)</label>
              <input type="number" step="0.1" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-black text-xl" placeholder="0.00" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Tarif (FCFA/kg)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={formData.payRate} 
                  onChange={e => setFormData({ ...formData, payRate: e.target.value })} 
                  className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-black text-xl transition-colors ${selectedEmployee?.crop === 'CACAO' ? 'text-amber-700' : 'text-emerald-700'}`} 
                  required 
                />
                {selectedEmployee?.crop === 'CACAO' && (
                  <div className="absolute right-3 top-3.5">
                    <Calculator className="w-4 h-4 text-amber-500" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Date</label>
            <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold" required />
          </div>

          {selectedEmployee?.crop === 'CACAO' ? (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 items-start">
              <Calculator className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] text-amber-800 leading-relaxed font-black uppercase tracking-tight">
                  Logique de Partage Cacao ({ratioPercent}%)
                </p>
                <p className="text-[10px] text-amber-600 font-medium">
                  Le tarif est calculé sur le prix marché de {settings.marketPriceCacao} FCFA.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 items-start">
              <Scale className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] text-emerald-800 leading-relaxed font-black uppercase tracking-tight">
                  Tarif Fixe Hévéa
                </p>
                <p className="text-[10px] text-emerald-600 font-medium">
                  Utilisation du tarif fixe configuré à {settings.payRateHevea} FCFA/kg.
                </p>
              </div>
            </div>
          )}

          <div className={`rounded-2xl p-5 border flex justify-between items-center shadow-inner ${selectedEmployee?.crop === 'CACAO' ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <span className={`text-[10px] font-black uppercase tracking-widest ${selectedEmployee?.crop === 'CACAO' ? 'text-amber-600' : 'text-emerald-600'}`}>Part ouvrier estimée</span>
            <p className={`text-3xl font-black ${selectedEmployee?.crop === 'CACAO' ? 'text-amber-700' : 'text-emerald-700'}`}>
              {(Math.round(Number(formData.weight) * currentPayRate)).toLocaleString()} <span className="text-xs">FCFA</span>
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 text-gray-400 font-black uppercase text-xs hover:bg-gray-100 rounded-2xl transition-colors">Annuler</button>
            <button type="submit" className={`flex-2 text-white py-4 px-8 rounded-2xl font-black shadow-xl active:scale-95 uppercase tracking-widest text-xs ${selectedEmployee?.crop === 'CACAO' ? 'bg-amber-600 shadow-amber-600/20' : 'bg-emerald-600 shadow-emerald-600/20'}`}>Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HarvestForm;
