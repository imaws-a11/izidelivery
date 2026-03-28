import React from 'react';
import { useAdmin } from '../context/AdminContext';

export default function DriversTab() {
  const {
    driversList, isLoadingList, setSelectedDriverStudio, handleUpdateDriverStatus, handleDeleteDriver, stats, fetchDrivers
  } = useAdmin();

  React.useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Gestão de Entregadores</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Total de {stats.drivers} entregadores na base.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
        {isLoadingList && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Entregador</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Veículo</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {driversList.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 grayscale">
                         {d.name?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <p className="font-black text-sm dark:text-white uppercase tracking-tight">{d.name || 'Sem Nome'}</p>
                        <p className="text-[10px] font-bold text-slate-400 truncate">{d.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest">{d.vehicle_type || 'Moto'} • {d.license_plate || 'N/A'}</td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest ${
                      d.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {d.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => setSelectedDriverStudio(d)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-primary transition-all shadow-sm">
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      <button onClick={() => handleUpdateDriverStatus(d.id, d.is_active ? 'inactive' : 'active')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-primary transition-all shadow-sm">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => handleDeleteDriver(d.id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
