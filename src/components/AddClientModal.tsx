import React, { useState, useEffect } from "react";
import { X, Check, User, Phone, Calendar, Dumbbell, AlertTriangle, Notebook, Heart, Scale, Trash2 } from "lucide-react";
import { Client } from "../types";
import { getSystemDate, calculateBMR, calculateAge } from "../utils";

interface AddClientModalProps {
  clientToEdit: Client | null; // If null, we are registering a NEW client
  onSave: (clientData: Omit<Client, "id"> & { id?: string }) => void;
  onClose: () => void;
}

export default function AddClientModal({ clientToEdit, onSave, onClose }: AddClientModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [startDate, setStartDate] = useState("");
  const [subscriptionType, setSubscriptionType] = useState<number>(12);
  const [durationDays, setDurationDays] = useState(30);
  const [notes, setNotes] = useState("");
  
  // Custom physique and health profile states
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [birthDate, setBirthDate] = useState("");
  const [height, setHeight] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");

  // Populate inputs if editing
  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name);
      setPhone(clientToEdit.phone);
      setStartDate(clientToEdit.startDate);
      setSubscriptionType(clientToEdit.subscriptionType);
      setDurationDays(clientToEdit.durationDays);
      setNotes(clientToEdit.notes || "");
      setGender(clientToEdit.gender || "");
      setBirthDate(clientToEdit.birthDate || "");
      setHeight(clientToEdit.height !== undefined ? clientToEdit.height : "");
      setWeight(clientToEdit.weight !== undefined ? clientToEdit.weight : "");
      setPrice(clientToEdit.price !== undefined ? clientToEdit.price : "");
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
      setGender("");
      setBirthDate("");
      setHeight("");
      setWeight("");
      setPrice("");
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
      remainingSessions: clientToEdit ? clientToEdit.remainingSessions : subscriptionType, 
      durationDays,
      notes: notes.trim() || undefined,
      gender: gender ? (gender as "male" | "female" | "other") : undefined,
      birthDate: birthDate || undefined,
      height: height !== "" ? Number(height) : undefined,
      weight: weight !== "" ? Number(weight) : undefined,
      price: price !== "" ? Number(price) : undefined,
    });
  };

  return (
    <div id="client-modal-backdrop" className="fixed inset-0 bg-[#2D2D2A]/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-card border border-muted-border/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-soft relative flex flex-col max-h-[90vh] md:max-h-[85vh]">
        
        {/* HEADER - PINNED TO TOP */}
        <div className="flex items-center justify-between p-5 border-b border-muted-border/20 bg-warm/20 flex-shrink-0">
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

        {/* FORM CONTAINER - FLEX FILL */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          
          {/* SCROLLABLE INPUT FIELD AREA */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
            
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

            {/* Subscription Type Slots Selector & Price Options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-text/60 uppercase tracking-wider mb-1.5 font-sans">
                  Subscription Package Sessions
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text/45">
                    <Dumbbell className="w-4 h-4" />
                  </span>
                  <select
                    id="modal-client-subscription"
                    value={subscriptionType}
                    onChange={(e) => setSubscriptionType(Number(e.target.value))}
                    className="w-full bg-warm/50 border border-muted-border text-sm text-text rounded-2xl py-2.5 pl-9 pr-3.5 focus:outline-none focus:border-accent transition-colors font-sans cursor-pointer"
                  >
                    <option value={1}>1 Session</option>
                    <option value={8}>8 Sessions</option>
                    <option value={12}>12 Sessions</option>
                    <option value={16}>16 Sessions</option>
                    <option value={48}>48 Sessions</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text/60 uppercase tracking-wider mb-1.5 font-sans">
                  Package Price
                </label>
                <div className="relative">
                  <select
                    id="modal-client-price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value !== "" ? Number(e.target.value) : "")}
                    className="w-full bg-warm/50 border border-muted-border text-sm text-text rounded-2xl py-2.5 px-3.5 focus:outline-none focus:border-accent transition-colors font-sans cursor-pointer"
                  >
                    <option value="">Select Price...</option>
                    <option value={0}>0</option>
                    <option value={100}>100</option>
                    <option value={500}>500</option>
                    <option value={850}>850</option>
                    <option value={1300}>1300</option>
                    <option value={3000}>3000</option>
                  </select>
                </div>
              </div>
            </div>

            {clientToEdit && (
              <div className="mt-1 flex items-start gap-1.5 p-3.5 bg-alert-coral/10 rounded-2xl border border-alert-coral/25 text-xs text-alert-coral">
                <AlertTriangle className="w-4 h-4 text-alert-coral shrink-0 mt-0.5" />
                <span className="font-sans">
                  <b>Renewal warning:</b> Changing the package parameters will reset this client's balance allocation to exactly <span className="underline font-bold">{subscriptionType} unused sessions</span>.
                </span>
              </div>
            )}

            {/* Physiological Metrics (Gender, Birthdate, Height, Weight) */}
            <div className="border-t border-muted-border/20 pt-4 mt-2">
              <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-accent" />
                <span>Physiological Metrics & BMR</span>
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Gender */}
                <div>
                  <label className="block text-[11px] font-semibold text-text/60 uppercase tracking-wider mb-1.5 font-sans">
                    Gender
                  </label>
                  <select
                    id="modal-client-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full bg-warm/50 border border-muted-border text-sm text-text rounded-2xl py-2.5 px-3 focus:outline-none focus:border-accent transition-colors font-sans"
                  >
                    <option value="">Select Gender...</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Birth Date */}
                <div>
                  <label className="block text-[11px] font-semibold text-text/60 uppercase tracking-wider mb-1.5 font-sans">
                    Birth Date
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text/45">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input
                      id="modal-client-birthdate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full bg-warm/50 border border-muted-border text-sm text-text rounded-2xl py-2.5 pl-9 pr-3.5 focus:outline-none focus:border-accent transition-colors font-sans"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Height in cm */}
                <div>
                  <label className="block text-[11px] font-semibold text-text/60 uppercase tracking-wider mb-1.5 font-sans">
                    Height (cm)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text/45">
                      <span className="text-[11px] font-sans font-bold text-text/45">cm</span>
                    </span>
                    <input
                      id="modal-client-height"
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value !== "" ? Number(e.target.value) : "")}
                      placeholder="e.g. 170"
                      className="w-full bg-warm/50 border border-muted-border text-sm text-text rounded-2xl py-2.5 pl-9 pr-3.5 focus:outline-none focus:border-accent transition-colors font-sans"
                      min="1"
                      max="300"
                    />
                  </div>
                </div>

                {/* Weight in kg */}
                <div>
                  <label className="block text-[11px] font-semibold text-text/60 uppercase tracking-wider mb-1.5 font-sans">
                    Weight (kg)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text/45">
                      <Scale className="w-4 h-4" />
                    </span>
                    <input
                      id="modal-client-weight"
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value !== "" ? Number(e.target.value) : "")}
                      placeholder="e.g. 68.5"
                      className="w-full bg-warm/50 border border-muted-border text-sm text-text rounded-2xl py-2.5 pl-9 pr-3.5 focus:outline-none focus:border-accent transition-colors font-sans"
                      min="1"
                      max="500"
                    />
                  </div>
                </div>
              </div>

              {/* Live BMR Panel */}
              {gender && birthDate && height && weight ? (
                <div className="bg-accent/5 border border-accent/25 rounded-2xl p-4 flex items-center justify-between mb-2">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-accent tracking-wider font-sans">
                      Calculated Basal Metabolic Rate
                    </div>
                    <div className="serif text-2xl font-black text-accent mt-0.5">
                      {calculateBMR(gender as any, Number(weight), Number(height), birthDate)?.toLocaleString()} <span className="text-sm font-sans font-medium text-text/60">kcal/day</span>
                    </div>
                    <div className="text-[10px] text-text/45 mt-1 font-sans">
                      Mifflin-St Jeor Formula ({calculateAge(birthDate)} years old)
                    </div>
                  </div>
                  <div className="p-3 bg-accent/10 rounded-2xl text-accent animate-pulse">
                    <Heart className="w-5 h-5 fill-accent/20" />
                  </div>
                </div>
              ) : (
                <div className="bg-warm/60 border border-muted-border text-center rounded-2xl p-3.5 text-xs text-text/50 font-sans leading-relaxed">
                  Provide gender, birth date, height, and weight to automatically compute the Basal Metabolic Rate (BMR).
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

          </div>

          {/* FOOTER - PINNED TO BOTTOM */}
          <div className="flex items-center justify-end gap-3 p-5 border-t border-muted-border/20 bg-warm/10 flex-shrink-0">
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
