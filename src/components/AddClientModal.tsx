import React, { useState, useEffect } from "react";
import { X, Check, User, Phone, Calendar, Dumbbell, AlertTriangle, Notebook } from "lucide-react";
import { Client } from "../types";
import { getSystemDate } from "../utils";

interface AddClientModalProps {
  clientToEdit: Client | null; // If null, we are registering a NEW client
  onSave: (clientData: Omit<Client, "id"> & { id?: string }) => void;
  onClose: () => void;
}

export default function AddClientModal({ clientToEdit, onSave, onClose }: AddClientModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [startDate, setStartDate] = useState("");
  const [subscriptionType, setSubscriptionType] = useState<8 | 12 | 16>(12);
  const [durationDays, setDurationDays] = useState(30);
  const [notes, setNotes] = useState("");

  // Populate inputs if editing
  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name);
      setPhone(clientToEdit.phone);
      setStartDate(clientToEdit.startDate);
      setSubscriptionType(clientToEdit.subscriptionType);
      setDurationDays(clientToEdit.durationDays);
      setNotes(clientToEdit.notes || "");
    } else {
      // Set default subscription start date to today
      const today = getSystemDate();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      setStartDate(`${year}-${month}-${day}`);
      
      setName("");
      setPhone("");
      setSubscriptionType(12);
      setDurationDays(30);
      setNotes("");
    }
  }, [clientToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !startDate) return;

    onSave({
      id: clientToEdit?.id,
      name: name.trim(),
      phone: phone.trim(),
      startDate,
      subscriptionType,
      // If editing/renewing, let the app logic decide if remaining sessions reset, or reset to subscriptionType
      remainingSessions: subscriptionType, 
      durationDays,
      notes: notes.trim() || undefined
    });
  };

  return (
    <div id="client-modal-backdrop" className="fixed inset-0 bg-[#2D2D2A]/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-card border border-muted-border/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-soft relative">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-muted-border/20 bg-warm/20">
          <h2 className="serif text-xl font-semibold text-accent flex items-center gap-2 mt-0.5">
            <User className="w-5 h-5 text-accent" />
            <span>{clientToEdit ? "Edit Client & Subscription" : "Register New Client"}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-text/60 hover:text-accent p-1.5 rounded-full hover:bg-warm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* FORM CONTAINER */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* User Name */}
          <div>
            <label className="block text-[11px] font-semibold text-text/60 uppercase tracking-wider mb-1.5 font-sans">
              Client Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text/45">
                <User className="w-4 h-4" />
              </span>
              <input
                id="modal-client-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Mercer..."
                className="w-full bg-warm/50 border border-muted-border text-sm text-text rounded-2xl py-2.5 pl-9 pr-3.5 focus:outline-none focus:border-accent transition-colors font-sans"
                required
              />
            </div>
          </div>

          {/* Contact Phone Number */}
          <div>
            <label className="block text-[11px] font-semibold text-text/60 uppercase tracking-wider mb-1.5 font-sans">
              Contact Phone Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text/45">
                <Phone className="w-3.5 h-3.5" />
              </span>
              <input
                id="modal-client-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 0192..."
                className="w-full bg-warm/50 border border-muted-border text-sm text-text rounded-2xl py-2.5 pl-9 pr-3.5 focus:outline-none focus:border-accent transition-colors font-sans"
                required
              />
            </div>
          </div>

          {/* Start Date & Custom Pack Duration */}
          <div className="grid grid-cols-2 gap-4">
            
            <div>
              <label className="block text-[11px] font-semibold text-text/60 uppercase tracking-wider mb-1.5 font-sans">
                Start Date
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text/45">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  id="modal-client-startdate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-warm/50 border border-muted-border text-sm text-text rounded-2xl py-2.5 pl-9 pr-3.5 focus:outline-none focus:border-accent transition-colors font-sans"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-text/60 uppercase tracking-wider mb-1.5 font-sans" title="Number of days the pack remains active before expiring">
                Duration Days
              </label>
              <input
                id="modal-client-duration"
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value, 10) || 30)}
                className="w-full bg-warm/50 border border-muted-border text-sm text-text rounded-2xl py-2.5 px-3.5 focus:outline-none focus:border-accent transition-colors font-sans"
                min="1"
                required
              />
            </div>

          </div>

          {/* Subscription Type Slots Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-text/60 uppercase tracking-wider mb-2 font-sans">
              Subscription Package Sessions
            </label>
            <div className="grid grid-cols-3 gap-3">
              {([8, 12, 16] as const).map((pack) => (
                <button
                  key={pack}
                  type="button"
                  onClick={() => setSubscriptionType(pack)}
                  className={`py-2.5 px-4 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
                    subscriptionType === pack
                      ? "bg-accent text-white border-accent shadow-soft"
                      : "bg-warm text-text/60 border border-muted-border hover:border-accent hover:text-accent font-medium"
                  }`}
                >
                  <Dumbbell className="w-4 h-4" />
                  <span>{pack} Sessions</span>
                </button>
              ))}
            </div>
            {clientToEdit && (
              <div className="mt-2.5 flex items-start gap-1.5 p-3.5 bg-alert-coral/10 rounded-2xl border border-alert-coral/25 text-xs text-alert-coral">
                <AlertTriangle className="w-4 h-4 text-alert-coral shrink-0 mt-0.5" />
                <span className="font-sans">
                  <b>Renewal warning:</b> Changing the package parameters will reset this client's balance allocation to exactly <span className="underline font-bold">{subscriptionType} unused sessions</span>.
                </span>
              </div>
            )}
          </div>

          {/* Health Details / Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-text/60 uppercase tracking-wider mb-1.5 font-sans">
              Medical & Body Goals Notes (Optional)
            </label>
            <div className="relative">
              <span className="absolute top-3 left-3 text-text/45">
                <Notebook className="w-4 h-4" />
              </span>
              <textarea
                id="modal-client-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Injuries, posture concerns, target weights, dietary comments..."
                rows={3}
                className="w-full bg-warm/50 border border-muted-border text-sm text-[#2D2D2A] rounded-2xl py-2.5 pl-9 pr-3.5 focus:outline-none focus:border-accent transition-colors font-sans"
              />
            </div>
          </div>

          {/* ACTIVATE */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-muted-border/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-muted-border text-xs font-semibold text-text/60 hover:text-accent rounded-full hover:bg-warm/50 shadow-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="modal-submit-btn"
              className="flex items-center gap-1.5 px-5 py-2 bg-accent text-white text-xs font-semibold rounded-full hover:bg-accent/90 active:scale-95 transition-all shadow-soft"
            >
              <Check className="w-4 h-4" />
              <span>{clientToEdit ? "Apply Changes" : "Create Subscription"}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
