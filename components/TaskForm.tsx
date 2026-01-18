
import React, { useState } from 'react';
import { Employee, WorkTask } from '../types.ts';
import { X, ClipboardList } from 'lucide-react';

interface Props {
  employees: Employee[];
  onClose: () => void;
  onSubmit: (task: Omit<WorkTask, 'id'>) => void;
}

const TaskForm: React.FC<Props> = ({ employees, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    employeeId: employees[0]?.id || '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      employeeId: formData.employeeId,
      description: formData.description,
      amount: Number(formData.amount),
      date: formData.date,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        <div className="p-6 bg-blue-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-xl"><ClipboardList className="w-6 h-6" /></div>
            <h3 className="text-xl font-bold">Nouveau Travail / Tâche</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Employé solicité</label>
            <select 
              value={formData.employeeId}
              onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-medium"
              required
            >
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.crop})</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Description du travail</label>
            <input 
              type="text" 
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
              placeholder="Ex: Entretien parcelle 4, Collecte manoeuvres..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Montant (FCFA)</label>
              <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-black text-blue-700 text-lg" placeholder="0" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Date</label>
              <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-medium" required />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start">
            <p className="text-[10px] text-blue-800 leading-relaxed italic">Note: Les travaux à la tâche sont ajoutés au solde de l'ouvrier sans impacter les volumes de récolte.</p>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl transition-colors">Annuler</button>
            <button type="submit" className="flex-2 bg-blue-600 text-white py-4 px-8 rounded-2xl font-black shadow-lg shadow-blue-600/20 active:scale-95 uppercase tracking-tighter">Valider Tâche</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
