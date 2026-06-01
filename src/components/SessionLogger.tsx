import React, { useState, useEffect } from "react";
import { Plus, Trash2, Dumbbell, Calendar, ChevronDown, Check, Info, Notebook } from "lucide-react";
import { Client, SessionLog, ExerciseLog, WorkoutSet } from "../types";
import { getSystemDate } from "../utils";

interface SessionLoggerProps {
  clients: Client[];
  selectedClientFromCard: Client | null;
  onSaveSession: (session: SessionLog) => void;
  onCancel: () => void;
}

const COMMON_EXERCISES = [
  "Squat",
  "Bench Press",
  "Deadlift",
  "Shoulder Press",
  "Barbell Row",
  "Lat Pulldown",
  "Dumbbell Bicep Curl",
  "Tricep Pushdown",
  "Leg Press",
  "Lunge"
];

export default function SessionLogger({
  clients,
  selectedClientFromCard,
  onSaveSession,
  onCancel
}: SessionLoggerProps) {
  // Pre-selected client or first available active client
  const [selectedClientId, setSelectedClientId] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [customExerciseName, setCustomExerciseName] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Initialize form details
  useEffect(() => {
    // Default date YYYY-MM-DD
    const systemDate = getSystemDate();
    const year = systemDate.getFullYear();
    const month = String(systemDate.getMonth() + 1).padStart(2, "0");
    const day = String(systemDate.getDate()).padStart(2, "0");
    setDate(`${year}-${month}-${day}`);

    if (selectedClientFromCard) {
      setSelectedClientId(selectedClientFromCard.id);
    } else {
      const activeWithSessions = clients.find((c) => c.remainingSessions > 0);
      if (activeWithSessions) {
        setSelectedClientId(activeWithSessions.id);
      } else if (clients.length > 0) {
        setSelectedClientId(clients[0].id);
      }
    }

    // Start with one blank exercise to make it quick
    setExercises([
      {
        id: "initial-ex",
        exerciseName: "Squat",
        sets: [{ id: "s-init-1", weight: 60, reps: 8 }]
      }
    ]);
  }, [selectedClientFromCard, clients]);

  const activeClient = clients.find((c) => c.id === selectedClientId);

  // Add exercise to workout list
  const handleAddExercise = (name: string) => {
    if (!name.trim()) return;

    const newEx: ExerciseLog = {
      id: "ex-" + Date.now() + Math.random().toString(36).substr(2, 4),
      exerciseName: name,
      sets: [{ id: "set-" + Date.now() + "-0", weight: 40, reps: 10 }]
    };

    setExercises((prev) => [...prev, newEx]);
    setCustomExerciseName("");
    setIsDropdownOpen(false);
  };

  // Remove exercise from list
  const handleRemoveExercise = (exId: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== exId));
  };

  // Add Set row to exercise
  const handleAddSet = (exId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exId) return ex;
        
        // Grab values from previous set if any, to make rapid incrementing easy
        const lastSet = ex.sets[ex.sets.length - 1];
        const defaultWeight = lastSet ? lastSet.weight : 40;
        const defaultReps = lastSet ? lastSet.reps : 10;

        const newSet: WorkoutSet = {
          id: "set-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
          weight: defaultWeight,
          reps: defaultReps
        };
        return {
          ...ex,
          sets: [...ex.sets, newSet]
        };
      })
    );
  };

  // Remove specific set row
  const handleRemoveSet = (exId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exId) return ex;
        // Keep at least one set
        if (ex.sets.length <= 1) return ex;
        return {
          ...ex,
          sets: ex.sets.filter((s) => s.id !== setId)
        };
      })
    );
  };

  // Update set value (weight or reps)
  const handleUpdateSet = (exId: string, setId: string, field: "weight" | "reps", val: number) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id !== setId) return s;
            return { ...s, [field]: val };
          })
        };
      })
    );
  };

  // Handle exercise name edit directly
  const handleRenameExercise = (exId: string, name: string) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === exId ? { ...ex, exerciseName: name } : ex))
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;
    if (exercises.length === 0) {
      alert("Please add at least one exercise to save the session.");
      return;
    }

    // Format final session entry
    const finalSession: SessionLog = {
      id: "session-" + Date.now(),
      clientId: selectedClientId,
      date,
      notes: notes.trim() || undefined,
      exercises: exercises.filter((ex) => ex.exerciseName.trim() !== "")
    };

    onSaveSession(finalSession);
  };

  return (
    <div id="session-logger-box" className="bg-card border border-muted-border/30 rounded-3xl p-6 shadow-soft max-w-4xl mx-auto">
      <div className="flex items-center gap-2 pb-4 mb-5 border-b border-muted-border/30">
        <Dumbbell className="w-5 h-5 text-accent" />
        <h2 className="serif text-2xl font-semibold text-accent leading-tight">
          Log Client Workout Session
        </h2>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* TOP CONFIGURATION ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Client Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-text/60 uppercase tracking-wider mb-1.5 font-sans">
              Client Name
            </label>
            <select
              id="logger-client-select"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full bg-warm/50 border border-muted-border text-sm text-text rounded-2xl py-2.5 px-3.5 focus:outline-none focus:border-accent transition-colors"
              required
            >
              <option value="" disabled>Select a client...</option>
              {clients.map((client) => {
                const isOutOfSessions = client.remainingSessions <= 0;
                return (
                  <option 
                    key={client.id} 
                    value={client.id}
                    disabled={isOutOfSessions}
                  >
                    {client.name} {isOutOfSessions ? "(No Remaining Sessions)" : `(${client.remainingSessions} sessions left)`}
                  </option>
                );
              })}
            </select>
            {activeClient && (
              <div className="mt-1.5 flex justify-between items-center text-[11px]">
                <span className="text-text/40">Phone: {activeClient.phone}</span>
                <span className="text-accent font-semibold font-sans">
                  Remaining: {activeClient.remainingSessions} / {activeClient.subscriptionType} Sessions
                </span>
              </div>
            )}
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-text/60 uppercase tracking-wider mb-1.5 font-sans">
              Workout Date
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text/45">
                <Calendar className="w-4 h-4" />
              </span>
              <input
                id="logger-date-picker"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-warm/50 border border-muted-border text-sm text-text rounded-2xl py-2.5 pl-9 pr-3 focus:outline-none focus:border-accent transition-colors"
                required
              />
            </div>
          </div>

        </div>

        {/* WORKOUT NOTES */}
        <div>
          <label className="block text-[11px] font-semibold text-text/60 uppercase tracking-wider mb-1.5 font-sans">
            Trainer Session Notes
          </label>
          <textarea
            id="logger-notes"
            placeholder="Add specific comments about form, recovery, cues to trigger next session..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-warm/50 border border-muted-border text-sm text-text rounded-2xl py-2.5 px-3.5 focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* WORKOUT LIFTS & SETS BUILDER */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="serif text-xl font-semibold text-text flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-accent" />
              Exercises Conducted
            </h3>
            
            {/* Add Exercise Controller */}
            <div className="relative">
              <button
                type="button"
                id="logger-dropdown-toggle"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 px-4 py-2 bg-accent text-xs font-semibold text-white rounded-full hover:bg-accent/90 active:scale-95 transition-all outline-none"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                Add Exercise
                <ChevronDown className="w-3 h-3 text-white/80" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-card border border-muted-border rounded-2xl shadow-soft p-4.5 z-50 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-text/40 tracking-wider pb-1 border-b border-muted-border/30">Select Preset Lift</div>
                  <div className="max-h-40 overflow-y-auto grid grid-cols-1 gap-1 py-1">
                    {COMMON_EXERCISES.map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => handleAddExercise(ex)}
                        className="text-left text-xs text-text/80 hover:text-accent hover:bg-warm px-2 py-1.5 rounded-lg transition-colors"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-muted-border/30">
                    <div className="text-[10px] uppercase font-bold text-text/40 tracking-wider mb-1.5">Or write custom exercise:</div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Power Clean..."
                        value={customExerciseName}
                        onChange={(e) => setCustomExerciseName(e.target.value)}
                        className="flex-1 bg-warm border border-muted-border/80 text-xs text-text rounded-xl p-1.5 focus:outline-none focus:border-accent"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddExercise(customExerciseName)}
                        className="p-1.5 bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* LIST OF EXERCISES */}
          {exercises.length === 0 ? (
            <div className="border border-dashed border-muted-border/60 rounded-3xl p-8 text-center text-text/40 text-xs bg-warm/20">
              No exercises added yet. Use the "Add Exercise" selection above to start logging metrics.
            </div>
          ) : (
            <div className="space-y-4">
              {exercises.map((ex, index) => (
                <div
                  key={ex.id}
                  className="bg-warm/40 border border-muted-border/50 rounded-3xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-muted-border/40 text-text/60 font-semibold px-2.5 py-1 rounded-full text-xs font-mono">
                        #{index + 1}
                      </span>
                      <input
                        type="text"
                        value={ex.exerciseName}
                        onChange={(e) => handleRenameExercise(ex.id, e.target.value)}
                        className="bg-transparent border-b border-transparent hover:border-muted-border/40 focus:border-accent font-semibold text-base text-text focus:outline-none"
                        placeholder="Exercise name"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(ex.id)}
                      className="text-text/40 hover:text-alert-coral p-1.5 rounded-full transition-colors"
                      title="Remove exercise"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* SETS HEADER */}
                  <div className="grid grid-cols-12 gap-3 text-[10px] uppercase font-bold text-text/40 tracking-wider">
                    <span className="col-span-2 text-center">Set No</span>
                    <span className="col-span-5 px-1">Weight (kg)</span>
                    <span className="col-span-4 px-1">Reps Goal</span>
                    <span className="col-span-1"></span>
                  </div>

                  {/* SETS MATRIX */}
                  <div className="space-y-2">
                    {ex.sets.map((set, setIndex) => (
                      <div key={set.id} className="grid grid-cols-12 gap-3 items-center">
                        {/* Set index */}
                        <div className="col-span-2 text-center text-xs text-text/50 font-mono">
                          {setIndex + 1}
                        </div>

                        {/* Weight input */}
                        <div className="col-span-5 flex items-center bg-card border border-muted-border/80 rounded-xl px-2 text-text/70 focus-within:border-accent/50 transition-colors">
                          <input
                            type="number"
                            value={set.weight}
                            step="any"
                            onChange={(e) =>
                              handleUpdateSet(ex.id, set.id, "weight", parseFloat(e.target.value) || 0)
                            }
                            className="bg-transparent w-full text-xs text-text py-2 focus:outline-none"
                            placeholder="Weight"
                            min="0"
                            required
                          />
                          <span className="text-[10px] text-text/40 font-bold uppercase pl-1">kg</span>
                        </div>

                        {/* Reps input */}
                        <div className="col-span-4 flex items-center bg-card border border-muted-border/80 rounded-xl px-2 text-text/70 focus-within:border-accent/50 transition-colors">
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) =>
                              handleUpdateSet(ex.id, set.id, "reps", parseInt(e.target.value, 10) || 0)
                            }
                            className="bg-transparent w-full text-xs text-text py-2 focus:outline-none"
                            placeholder="Reps"
                            min="0"
                            required
                          />
                          <span className="text-[10px] text-text/40 font-bold uppercase pl-1">reps</span>
                        </div>

                        {/* Delete set */}
                        <div className="col-span-1">
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(ex.id, set.id)}
                            disabled={ex.sets.length <= 1}
                            className="text-text/30 hover:text-alert-coral disabled:opacity-30 disabled:hover:text-text/30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add set button inside exercise */}
                  <div className="pt-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddSet(ex.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:text-accent/80 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Set
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* METRICS SUMMARY HELPER BAR */}
        <div className="bg-accent/5 p-4 rounded-3xl border border-accent/20 flex items-start gap-3">
          <Info className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-text/70 leading-relaxed font-sans">
            <span className="font-semibold text-accent block mb-0.5">Trainer Guidance:</span>
            <span>Saving this completed training log will automatically reduce the remaining subscriber sessions of <b>{activeClient ? activeClient.name : "the selected client"}</b> by <b>1 session</b> and register their progression curves within the diagnostics databases.</span>
          </div>
        </div>

        {/* FORM TRIGGER ACTIONS */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-muted-border/20">
          <button
            type="button"
            onClick={onCancel}
            className="bg-white border border-muted-border text-text/60 hover:text-accent font-semibold rounded-full px-4 py-2 hover:bg-warm/50 text-xs transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            id="logger-submit-btn"
            disabled={!selectedClientId || exercises.length === 0}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-accent text-white text-xs font-semibold rounded-full hover:bg-accent/90 shadow-soft active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            Save & Decrement Session
          </button>
        </div>

      </form>
    </div>
  );
}
