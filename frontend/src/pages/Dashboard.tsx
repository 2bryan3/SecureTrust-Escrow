import React from 'react';
import { ShieldCheck, Lock, FileText, ChevronRight, Activity, DollarSign } from 'lucide-react';

const ModernDashboard = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* TOP NAV / TITLE AREA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Transaction Detail</h1>
            <p className="text-slate-500 font-medium">ID: #ST-99284-UA • Created Feb 15, 2026</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-200">
            <ShieldCheck size={20} />
            <span className="font-bold text-sm">SecureTrust Protected</span>
          </div>
        </div>

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: MAIN TRANSACTION STATUS (2/3 Width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-5">
                  <div className="p-5 bg-blue-600 rounded-3xl text-white shadow-lg shadow-blue-200">
                    <Lock size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">Funds Locked</h2>
                    <p className="text-slate-400 font-semibold">Held securely by SecureTrust Escrow</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-slate-900">$150.00</span>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Amount</p>
                </div>
              </div>

              {/* INTERACTIVE MILESTONE TIMELINE */}
              <div className="space-y-6 relative">
                {/* Vertical Line */}
                <div className="absolute left-7 top-0 bottom-0 w-1 bg-slate-100 -z-0"></div>
                
                {/* Completed */}
                <div className="flex items-center gap-6 relative z-10 opacity-50">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white">
                    <ShieldCheck size={24} />
                  </div>
                  <span className="text-lg font-bold text-slate-700 uppercase tracking-tight">Deposit Funds</span>
                </div>

                {/* Active */}
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white border-4 border-blue-600 flex items-center justify-center text-blue-600 shadow-lg">
                    <Activity size={24} className="animate-pulse" />
                  </div>
                  <div className="flex-grow flex items-center justify-between">
                    <span className="text-xl font-black text-blue-900">Service Milestone 1</span>
                    <span className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-black">ACTIVE</span>
                  </div>
                </div>

                {/* Pending */}
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
                    <DollarSign size={24} />
                  </div>
                  <span className="text-lg font-bold text-slate-300 uppercase tracking-tight">Final Verification</span>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <button className="w-full mt-12 bg-slate-900 text-white py-6 rounded-3xl font-black text-xl hover:bg-black transition-all hover:scale-[1.01] active:scale-[0.98] shadow-2xl shadow-slate-300">
                Approve & Release Funds
              </button>
            </div>
          </div>

          {/* RIGHT: EVIDENCE & INFO SIDEBAR (1/3 Width) */}
          <div className="space-y-6">
            {/* EVIDENCE CARD */}
            <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100">
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <FileText size={22} className="text-blue-500" />
                Evidence Log
              </h3>
              <div className="space-y-4">
                <div className="aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center group hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
                   <p className="text-xs font-black text-slate-400 group-hover:text-blue-600 uppercase tracking-widest">Upload Proof</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-800 truncate">service_log_v1.pdf</span>
                  <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-1 rounded-md">VERIFIED</span>
                </div>
              </div>
            </div>

            {/* WHY TRUST CARD (FTC DATA) */}
            <div className="bg-blue-900 rounded-[2rem] p-8 text-white shadow-lg shadow-blue-200">
              <p className="text-blue-300 text-xs font-black uppercase tracking-widest mb-4">Market Security</p>
              <p className="text-sm font-bold leading-relaxed">
                "In 2024, 76% of online shopping fraud reports resulted in financial loss. SecureTrust ensures your $150.00 is safe until you confirm delivery."
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;