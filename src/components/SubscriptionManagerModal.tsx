import React, { useState, useEffect } from "react";
import { X, Check, RefreshCw, Sliders, Calendar, ArrowUpRight, ShieldCheck, Info } from "lucide-react";
import { Client } from "../types";
import { getSystemDate } from "../utils";

interface SubscriptionManagerModalProps {
  client: Client | null;
  onClose: () => void;
  onRenew: (client: Client, startDate: string) => void;
  onChangeSub: (client: Client, startDate: string, sessions: number, price: number) => void;
}

export default function SubscriptionManagerModal({
  client,
  onClose,
  onRenew,
  onChangeSub
}: SubscriptionManagerModalProps) {
  const [activeTab, setActiveTab] = useState<"renew" | "change">("renew");
  const [startDate, setStartDate] = useState("");
  
  // Change Sub form fields
  const [newSessions, setNewSessions] = useState<number>(12);
  const [newPrice, setNewPrice] = useState<number>(500);

  useEffect(() => {
    if (client) {
      // Set to current date as default
      const today = getSystemDate();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      setStartDate(`${year}-${month}-${day}`);
      
      // Initialize changing state with their existing defaults
      setNewSessions(client.subscriptionType || 12);
      setNewPrice(client.price || 500);
      setActiveTab("renew");
    }
  }, [client]);

  if (!client) return null;

  const handleRenewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRenew(client, startDate);
    onClose();
  };

  const handleChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChangeSub(client, startDate, newSessions, newPrice);
    onClose();
  };

  return (
    <div id="sub-manager-backdrop" className="fixed inset-0 bg-[#2D2D2A]/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-card border border-muted-border/30 rounded-3xl w-full max-w-md overflow-hidden shadow-soft relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-muted-border/20 bg-warm/20 flex-shrink-0">
          <div>
            <h2 className="serif text-lg font-semibold text-accent leading-tight">
              Subscription billing
            </h2>
            <p className="text-xs text-text/60 mt-0.5">Manage for <strong className="text-text/80">{client.name}</strong></p>
          </div>
          <button
            onClick={onClose}
            className="text-text/60 hover:text-accent p-1.5 rounded-full hover:bg-warm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-muted-border/10 bg-warm/10 p-2 gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("renew")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "renew"
                ? "bg-white text-accent border border-muted-border/30 shadow-sm"
                : "text-text/60 hover:text-accent font-medium hover:bg-white/50"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Renew Existing Package</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("change")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "change"
                ? "bg-white text-accent border border-muted-border/30 shadow-sm"
                : "text-text/60 hover:text-accent font-medium hover:bg-white/50"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Change Package</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 font-sans">
          
          {activeTab === "renew" ? (
            <form onSubmit={handleRenewSubmit} className="space-y-4">
              
              {/* CURRENT SUBSCRIBED STATE DISPLAY */}
              <div className="bg-warm/40 p-4 rounded-2xl border border-muted-border/25 space-y-2">
                <div className="text-[10px] text-text/45 uppercase tracking-wider font-bold">Client Current Package</div>
                <div className="flex items-center justify-between">
                  <div className="serif text-lg font-bold text-accent">
                    {client.subscriptionType} Sessions
                  </div>
                  <div className="text-sm font-extrabold text-accent bg-accent/10 px-2.5 py-1 rounded-xl">
                    {client.price !== undefined ? client.price : 0}
                  </div>
                </div>
                <div className="text-[11px] text-text/50">
                  Currently has <strong className="text-text/70">{client.remainingSessions}</strong> unused session(s) remaining in this cycle.
                </div>
              </div>

              {/* RENEW START DATE */}
              <div>
                <label className="block text-[11px] font-semibold text-text/60 uppercase tracking-wider mb-1.5">
                  Renew Start Date
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text/40">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-warm/50 border border-muted-border text-sm text-text rounded-2xl py-2.5 pl-9 pr-3.5 focus:outline-none focus:border-accent transition-colors font-sans"
                  />
                </div>
              </div>

              {/* INFO BOX */}
              <div className="p-3 bg-accent/5 rounded-2xl border border-accent/20 flex gap-2 text-xs text-accent">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  This direct renewal will reset her remaining balance to exactly <strong>{client.subscriptionType} Sessions</strong> starting on the renewed date, and log a chronological transaction of <strong>{client.price || 0}</strong>.
                </span>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-white border border-muted-border text-xs font-semibold text-text/60 hover:text-accent rounded-full transition-colors text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-accent text-white text-xs font-bold rounded-full hover:bg-accent/90 active:scale-95 transition-all shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm Renewal</span>
                </button>
              </div>

            </form>
          ) : (
            <form onSubmit={handleChangeSubmit} className="space-y-4">
              
              {/* SELECT NEW PACKAGE */}
              <div>
                <label className="block text-[11px] font-semibold text-text/60 uppercase tracking-wider mb-1.5">
                  New Package Sessions
                </label>
                <select
                  value={newSessions}
                  onChange={(e) => setNewSessions(Number(e.target.value))}
                  className="w-full bg-warm/50 border border-muted-border text-sm text-text rounded-2xl py-2.5 px-3 focus:outline-none focus:border-accent transition-colors cursor-pointer"
                >
                  <option value={1}>1 Session</option>
                  <option value={8}>8 Sessions</option>
                  <option value={12}>12 Sessions</option>
                  <option value={16}>16 Sessions</option>
                  <option value={48}>48 Sessions</option>
                </select>
              </div>

              {/* SELECT NEW PRICE */}
              <div>
                <label className="block text-[11px] font-semibold text-text/60 uppercase tracking-wider mb-1.5">
                  New Package Price
                </label>
                <select
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="w-full bg-warm/50 border border-muted-border text-sm text-text rounded-2xl py-2.5 px-3 focus:outline-none focus:border-accent transition-colors cursor-pointer"
                >
                  <option value={0}>0 - Complimentary</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                  <option value={850}>850</option>
                  <option value={1300}>1300</option>
                  <option value={3000}>3000</option>
                </select>
              </div>

              {/* NEW START DATE */}
              <div>
                <label className="block text-[11px] font-semibold text-text/60 uppercase tracking-wider mb-1.5">
                  Package Effective Date
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text/40">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-warm/50 border border-muted-border text-sm text-text rounded-2xl py-2.5 pl-9 pr-3.5 focus:outline-none focus:border-accent transition-colors font-sans"
                  />
                </div>
              </div>

              {/* CHANGE INFO BOX */}
              <div className="p-3 bg-accent/5 rounded-2xl border border-accent/20 flex gap-2 text-xs text-accent">
                <ArrowUpRight className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  This will change her core subscription package parameters permanently to <strong>{newSessions} sessions for {newPrice}</strong> and reset her balance allocate to full.
                </span>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-white border border-muted-border text-xs font-semibold text-text/60 hover:text-accent rounded-full transition-colors text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-accent text-white text-xs font-bold rounded-full hover:bg-accent/90 active:scale-95 transition-all shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Update Package</span>
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
