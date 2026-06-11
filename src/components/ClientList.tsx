import React, { useState, useMemo } from "react";
import { Search, Phone, Calendar, Dumbbell, ChevronRight, UserPlus, TrendingUp, Notebook, Trash2, Edit2, AlertCircle, Heart, RefreshCw, Sliders, Clock, Plus } from "lucide-react";
import { Client } from "../types";
import { isSubscriptionEndingSoon, formatDate, getSubscriptionDaysRemaining, calculateAge, calculateBMR, getSystemDate } from "../utils";

interface ClientListProps {
  clients: Client[];
  onLogWorkout: (client: Client) => void;
  onQuickAttend: (clientId: string) => void;
  onViewProgress: (client: Client) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onAddNewClientClick: () => void;
  onManageSubscription: (client: Client) => void;
  onUpdateClient?: (updatedClient: Client) => void;
}

export default function ClientList({
  clients,
  onLogWorkout,
  onQuickAttend,
  onViewProgress,
  onEditClient,
  onDeleteClient,
  onAddNewClientClick,
  onManageSubscription,
  onUpdateClient
}: ClientListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "warning" | "expired">("all");
  const [packFilter, setPackFilter] = useState<"all" | "8" | "12" | "16">("all");

  // State hooks for Trainer Schedule Dashboard
  const [scheduleView, setScheduleView] = useState<"today" | "week">("today");
  
  // State elements for adding new schedule slots per client
  const [addingScheduleForClientId, setAddingScheduleForClientId] = useState<string | null>(null);
  const [newScheduleDay, setNewScheduleDay] = useState<number>(1); // default to 1 (Monday)
  const [newScheduleTime, setNewScheduleTime] = useState<string>("10:00");

  // Filter logic
  const filteredClients = clients.filter((client) => {
    // Search matching
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery);

    // Get alerts status
    const { endingSoon, expired } = isSubscriptionEndingSoon(client);
    
    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = !expired && !endingSoon && client.remainingSessions > 0;
    } else if (statusFilter === "warning") {
      matchesStatus = endingSoon && !expired;
    } else if (statusFilter === "expired") {
      matchesStatus = expired;
    }

    // Pack type matching
    let matchesPack = true;
    if (packFilter !== "all") {
      matchesPack = client.subscriptionType.toString() === packFilter;
    }

    return matchesSearch && matchesStatus && matchesPack;
  });

  // Setup system dates and helpers for scheduling
  const todayDate = getSystemDate();
  const todayDayOfWeek = todayDate.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday

  const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const DAY_SEQUENCE = [1, 2, 3, 4, 5, 6, 0]; // Monday-first sequence

  // Group and sort scheduling items from all clients
  const scheduledItems = useMemo(() => {
    const list: { client: Client; schedule: { id: string; dayOfWeek: number; time: string } }[] = [];
    clients.forEach((c) => {
      if (c.schedules && c.schedules.length > 0) {
        c.schedules.forEach((s) => {
          list.push({ client: c, schedule: s });
        });
      }
    });

    let items = list;
    if (scheduleView === "today") {
      items = list.filter((item) => item.schedule.dayOfWeek === todayDayOfWeek);
    }

    // Sort: Monday-first, then by time
    return items.sort((a, b) => {
      if (scheduleView === "week") {
        const idxA = DAY_SEQUENCE.indexOf(a.schedule.dayOfWeek);
        const idxB = DAY_SEQUENCE.indexOf(b.schedule.dayOfWeek);
        if (idxA !== idxB) return idxA - idxB;
      }
      return a.schedule.time.localeCompare(b.schedule.time);
    });
  }, [clients, scheduleView, todayDayOfWeek]);

  const handleAddSchedule = (client: Client) => {
    if (!newScheduleTime) return;

    const newSchedule = {
      id: "sched-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
      dayOfWeek: newScheduleDay,
      time: newScheduleTime,
    };

    const updatedSchedules = [...(client.schedules || []), newSchedule];
    onUpdateClient?.({
      ...client,
      schedules: updatedSchedules,
    });

    // Reset fields
    setAddingScheduleForClientId(null);
  };

  const handleDeleteSchedule = (client: Client, scheduleId: string) => {
    const updatedSchedules = (client.schedules || []).filter((s) => s.id !== scheduleId);
    onUpdateClient?.({
      ...client,
      schedules: updatedSchedules,
    });
  };

  return (
    <div id="clients-container" className="space-y-4">
      {/* FILTER & HEADER PANEL */}
      <div className="bg-card border border-muted-border/30 rounded-3xl p-6 shadow-soft">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-text/40">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="client-search"
              type="text"
              placeholder="Search clients by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-warm/50 border border-muted-border text-sm text-text placeholder-text/40 rounded-full focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Quick Filter buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 bg-warm p-1 border border-muted-border/80 rounded-full text-xs text-text/60">
              <button
                id="filter-status-all"
                onClick={() => setStatusFilter("all")}
                className={`px-3.5 py-1.5 rounded-full transition-all ${
                  statusFilter === "all" ? "bg-white text-accent font-semibold shadow-soft" : "hover:text-text"
                }`}
              >
                All Status
              </button>
              <button
                id="filter-status-active"
                onClick={() => setStatusFilter("active")}
                className={`px-3.5 py-1.5 rounded-full transition-all ${
                  statusFilter === "active" ? "bg-accent/10 text-accent font-semibold" : "hover:text-text"
                }`}
              >
                Active
              </button>
              <button
                id="filter-status-warning"
                onClick={() => setStatusFilter("warning")}
                className={`px-3.5 py-1.5 rounded-full transition-all ${
                  statusFilter === "warning" ? "bg-alert-coral/10 text-alert-coral font-semibold" : "hover:text-alert-coral"
                }`}
              >
                3-Day Warning
              </button>
              <button
                id="filter-status-expired"
                onClick={() => setStatusFilter("expired")}
                className={`px-3.5 py-1.5 rounded-full transition-all ${
                  statusFilter === "expired" ? "bg-alert-coral/10 text-alert-coral font-semibold" : "hover:text-alert-coral"
                }`}
              >
                Expired
              </button>
            </div>

            <div className="flex items-center space-x-1 bg-warm p-1 border border-muted-border/80 rounded-full text-xs text-text/60">
              <span className="pl-3.5 pr-1 text-[10px] text-text/40 font-semibold uppercase tracking-wider">Packs:</span>
              {(["all", "8", "12", "16"] as const).map((pack) => (
                <button
                  key={pack}
                  onClick={() => setPackFilter(pack)}
                  className={`px-3 py-1 rounded-full capitalize transition-all ${
                    packFilter === pack ? "bg-white text-accent font-semibold shadow-soft" : "hover:text-text"
                  }`}
                >
                  {pack === "all" ? "All" : `${pack} Sessions`}
                </button>
              ))}
            </div>

            <button
              onClick={onAddNewClientClick}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-accent text-white text-xs font-semibold rounded-full hover:bg-accent/90 active:scale-95 transition-all shadow-soft"
            >
              <UserPlus className="w-4 h-4" />
              Add Client
            </button>
          </div>

        </div>
      </div>

      {/* WEEKLY TRAINING SCHEDULE DASHBOARD */}
      <div className="bg-card border border-muted-border/30 rounded-3xl p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-muted-border/15 pb-4 mb-4 gap-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-accent/10 text-accent rounded-xl">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h3 className="serif text-lg font-bold text-accent leading-tight">Weekly Training Schedule</h3>
              <p className="text-[10px] text-text/40 uppercase font-bold tracking-wider mt-0.5">Recurring sessions overview</p>
            </div>
          </div>
          
          {/* Toggle Button */}
          <div className="flex items-center bg-warm p-1 border border-muted-border/80 rounded-full text-xs text-text/60 self-start sm:self-center">
            <button
              onClick={() => setScheduleView("today")}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                scheduleView === "today" ? "bg-white text-accent font-semibold shadow-soft" : "hover:text-text"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setScheduleView("week")}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                scheduleView === "week" ? "bg-white text-accent font-semibold shadow-soft" : "hover:text-text"
              }`}
            >
              This Week
            </button>
          </div>
        </div>

        {scheduledItems.length === 0 ? (
          <div className="py-6 text-center text-text/40 text-xs font-semibold italic bg-warm/20 rounded-2xl border border-dashed border-muted-border/50">
            {scheduleView === "today" 
              ? "No training sessions scheduled for today. Have a restful day!"
              : "No training sessions scheduled for this week. Set up a schedule below!"}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {scheduledItems.map(({ client, schedule }) => {
              return (
                <div 
                  key={schedule.id}
                  className="bg-warm/40 border border-muted-border/30 rounded-2xl p-3 flex flex-col justify-between hover:border-accent/40 hover:bg-warm/60 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <div>
                      <h4 className="font-bold text-xs text-text line-clamp-1 leading-tight">{client.name}</h4>
                      <p className="text-[10px] text-text/45 mt-0.5">{client.phone}</p>
                    </div>
                    <span className="shrink-0 flex items-center gap-1 bg-white border border-muted-border/50 text-accent font-black text-[10px] px-2 py-0.5 rounded-lg font-sans">
                      <Clock className="w-2.5 h-2.5 text-accent/60" />
                      {schedule.time}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-muted-border/10">
                    <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
                      {DAYS_LONG[schedule.dayOfWeek]}
                    </span>
                    
                    <button
                      onClick={() => onLogWorkout(client)}
                      disabled={client.remainingSessions <= 0}
                      className="text-[9px] font-bold text-accent bg-accent/10 hover:bg-accent hover:text-white px-2 py-1 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Log Workout
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EMPTY STATE */}
      {filteredClients.length === 0 ? (
        <div className="bg-card border border-muted-border/30 rounded-3xl p-12 text-center shadow-soft">
          <div className="w-12 h-12 bg-warm rounded-full flex items-center justify-center mx-auto mb-3 text-text/30">
            <Search className="w-5 h-5" />
          </div>
          <h4 className="serif text-2xl text-text font-semibold mb-1">No clients found</h4>
          <p className="text-text/60 text-sm max-w-sm mx-auto">
            Try adjusting your filters or search terms, or register a new client profile using the registration button.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredClients.map((client) => {
            const { endingSoon, expired, daysLeft } = isSubscriptionEndingSoon(client);
            
            // Calc Session completion percentage
            const completedSessions = client.subscriptionType - client.remainingSessions;
            const completionPercent = (completedSessions / client.subscriptionType) * 100;

            // Session warning status
            const hasNoSessions = client.remainingSessions === 0;
            const hasOneSession = client.remainingSessions === 1;

            return (
              <div
                key={client.id}
                className={`bg-card border rounded-3xl overflow-hidden shadow-soft hover:shadow-soft-hover hover:border-accent transition-all duration-300 flex flex-col justify-between ${
                  expired
                    ? "border-alert-coral/20"
                    : endingSoon
                    ? "border-alert-coral/50 bg-alert-coral/[0.01]"
                    : "border-muted-border/30"
                }`}
              >
                {/* Client Top Information */}
                <div className="p-5 flex-1">
                  
                  {/* Category Indicator & Status Tag */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="serif text-xl font-semibold text-accent leading-tight">
                        {client.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-text/60 mt-1">
                        <Phone className="w-3.5 h-3.5 text-accent/50" />
                        <span>{client.phone}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {/* Subscription Status Tag */}
                      {expired ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-alert-coral/10 text-alert-coral border border-alert-coral/20 uppercase tracking-widest">
                          Expired
                        </span>
                      ) : endingSoon ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-alert-coral/10 text-alert-coral border border-alert-coral/30 uppercase tracking-widest animate-pulse">
                          Ending Soon
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent/10 text-accent border border-accent/20 uppercase tracking-widest">
                          Active
                        </span>
                      )}

                      {/* Expiration warning description */}
                      {!expired && endingSoon && (
                        <div className="text-[10px] text-alert-coral font-medium flex items-center gap-0.5 mt-0.5 animate-pulse">
                           <AlertCircle className="w-3 h-3" />
                           <span>Last 3 Days! ({daysLeft}d left)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Physiological Metrics summary */}
                  {(client.gender || client.birthDate || client.height || client.weight || client.price !== undefined) && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-4 bg-warm/30 p-2.5 rounded-2xl border border-muted-border/15">
                      {client.price !== undefined && (
                        <span className="px-2 py-0.5 bg-accent/15 text-[10px] font-extrabold text-accent rounded-lg border border-accent/25 tracking-wide">
                          {client.price}
                        </span>
                      )}
                      {client.gender && (
                        <span className="px-2 py-0.5 bg-white text-[10px] font-bold text-text/80 rounded-lg border border-muted-border/30 capitalize tracking-wide">
                          {client.gender}
                        </span>
                      )}
                      {client.birthDate && (
                        <>
                          <span className="px-2 py-0.5 bg-white text-[10px] font-bold text-text/80 rounded-lg border border-muted-border/30 tracking-wide">
                            Born: {formatDate(client.birthDate)}
                          </span>
                          <span className="px-2 py-0.5 bg-white text-[10px] font-bold text-text/80 rounded-lg border border-muted-border/30 tracking-wide">
                            {calculateAge(client.birthDate)} yrs
                          </span>
                        </>
                      )}
                      {client.height && (
                        <span className="px-2 py-0.5 bg-white text-[10px] font-bold text-text/80 rounded-lg border border-muted-border/30 tracking-wide">
                          {client.height} cm
                        </span>
                      )}
                      {client.weight && (
                        <span className="px-2 py-0.5 bg-white text-[10px] font-bold text-text/80 rounded-lg border border-muted-border/30 tracking-wide">
                          {client.weight} kg
                        </span>
                      )}
                      {client.gender && client.birthDate && client.height && client.weight && (
                        <span className="px-2 py-0.5 bg-accent/10 text-[10px] font-extrabold text-accent rounded-lg border border-accent/15 flex items-center gap-1" title="Basal Metabolic Rate">
                          <Heart className="w-2.5 h-2.5 fill-accent/10 shrink-0" />
                          <span>BMR: {calculateBMR(client.gender, client.weight, client.height, client.birthDate)?.toLocaleString()} kcal</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Notes / Health Restrictions */}
                  {client.notes && (
                    <div className="bg-warm/60 p-3 rounded-2xl border border-muted-border/20 mb-4 text-xs text-text/70 flex items-start gap-1.5">
                      <Notebook className="w-3.5 h-3.5 text-accent/60 mt-0.5 flex-shrink-0" />
                      <p className="line-clamp-2">{client.notes}</p>
                    </div>
                  )}

                  {/* SESSION TRACKER BAR */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text/60 font-medium flex items-center gap-1">
                        <Dumbbell className="w-3.5 h-3.5 text-accent/50" />
                        <span>Attendance Sessions</span>
                      </span>
                      <span className="font-mono text-text/70">
                        <span className="text-accent font-bold">{client.remainingSessions}</span>
                        <span className="text-text/40"> / {client.subscriptionType} Left</span>
                      </span>
                    </div>

                    {/* Styled progress level */}
                    <div className="w-full h-2.5 bg-warm rounded-full overflow-hidden border border-muted-border/40">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          hasNoSessions
                            ? "bg-alert-coral"
                            : hasOneSession
                            ? "bg-alert-coral/80"
                            : "bg-accent"
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, 100 - completionPercent))}%` }}
                      ></div>
                    </div>

                    {/* Quick sub info below bar */}
                    <div className="flex items-center justify-between text-[11px] text-text/40 pt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        Started: {formatDate(client.startDate)}
                      </span>
                      <span className="font-mono">
                        {daysLeft < 0 ? (
                          <span className="text-alert-coral font-semibold">Days Expired ({Math.abs(daysLeft)})</span>
                        ) : (
                          <span>{daysLeft} Calendar Days Left</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* WEEKLY REPEATING SCHEDULES */}
                  <div className="mt-4 border-t border-muted-border/15 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-accent flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 opacity-80" />
                        <span>Weekly Schedules</span>
                      </span>
                      <button
                        onClick={() => {
                          if (addingScheduleForClientId === client.id) {
                            setAddingScheduleForClientId(null);
                          } else {
                            setAddingScheduleForClientId(client.id);
                            setNewScheduleDay(1); // Monday default
                            setNewScheduleTime("10:00");
                          }
                        }}
                        className="text-[10px] font-bold text-accent bg-accent/5 hover:bg-accent/10 px-2 py-0.5 rounded-lg border border-accent/20 transition-all flex items-center gap-1"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>{addingScheduleForClientId === client.id ? "Cancel" : "Schedule"}</span>
                      </button>
                    </div>

                    {/* Active weekly slots list for this client */}
                    {(!client.schedules || client.schedules.length === 0) ? (
                      <p className="text-[10px] text-text/40 italic">No schedules set.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {client.schedules.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center gap-1 bg-warm px-2 py-0.5 rounded-lg border border-muted-border/80 text-[10px] text-text/75"
                          >
                            <span className="font-semibold text-accent/80">{DAYS_SHORT[s.dayOfWeek]}</span>
                            <span>{s.time}</span>
                            <button
                              onClick={() => handleDeleteSchedule(client, s.id)}
                              className="text-rose-500 hover:text-rose-700 font-bold ml-1 text-[9px] focus:outline-none"
                              title="Delete schedule"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inline Form to add recurring slot */}
                    {addingScheduleForClientId === client.id && (
                      <div className="bg-warm/50 border border-muted-border/50 rounded-2xl p-2.5 mt-2 space-y-2 animate-fade-in text-[11px]">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-text/40 uppercase mb-1">Day</label>
                            <select
                              value={newScheduleDay}
                              onChange={(e) => setNewScheduleDay(Number(e.target.value))}
                              className="w-full bg-white border border-muted-border/80 rounded-lg py-1 px-1.5 focus:outline-none focus:border-accent text-xs font-semibold"
                            >
                              <option value={1}>Monday</option>
                              <option value={2}>Tuesday</option>
                              <option value={3}>Wednesday</option>
                              <option value={4}>Thursday</option>
                              <option value={5}>Friday</option>
                              <option value={6}>Saturday</option>
                              <option value={0}>Sunday</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-text/40 uppercase mb-1">Time</label>
                            <input
                              type="time"
                              value={newScheduleTime}
                              onChange={(e) => setNewScheduleTime(e.target.value)}
                              className="w-full bg-white border border-muted-border/80 rounded-lg py-1 px-1.5 focus:outline-none focus:border-accent text-xs font-semibold cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handleAddSchedule(client)}
                            className="bg-accent text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-accent/90 transition-all shadow-sm flex items-center gap-0.5"
                          >
                            <span>Add Weekly Slot</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* BOTTOM ACTION BUTTONS */}
                <div className="p-4 bg-warm/30 border-t border-muted-border/20 grid grid-cols-2 gap-3">
                  
                  {/* Left Column Actions: Quick Attend or Renew */}
                  {client.remainingSessions > 0 && !expired ? (
                    <button
                      onClick={() => onQuickAttend(client.id)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-muted-border/80 rounded-full text-xs font-semibold text-text/80 hover:text-accent hover:border-accent hover:bg-warm active:scale-95 transition-all w-full shadow-sm"
                    >
                      <CheckCircleIcon className="w-3.5 h-3.5 text-accent" />
                      Quick Deduct (-1)
                    </button>
                  ) : (
                    <button
                      onClick={() => onEditClient(client)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-alert-coral/10 border border-alert-coral/30 rounded-full text-xs font-semibold text-alert-coral hover:bg-alert-coral/20 active:scale-95 transition-all w-full"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Renew / Package
                    </button>
                  )}

                  {/* Log Workout detail session (with exercises) */}
                  <button
                    onClick={() => onLogWorkout(client)}
                    disabled={client.remainingSessions <= 0}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold active:scale-95 transition-all ${
                      client.remainingSessions > 0
                        ? "bg-accent hover:bg-accent/90 text-white font-semibold"
                        : "bg-warm text-text/30 border border-muted-border/15 cursor-not-allowed"
                    }`}
                  >
                    <Dumbbell className="w-3.5 h-3.5" />
                    Log Workout
                  </button>

                  {/* Subscription Direct Actions */}
                  <div className="col-span-2 grid grid-cols-2 gap-3 pt-1 border-t border-muted-border/10">
                    <button
                      onClick={() => onManageSubscription(client)}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-accent/5 hover:bg-accent/10 border border-accent/25 rounded-full text-[11px] font-bold text-accent active:scale-95 transition-all shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Renew Sub
                    </button>
                    <button
                      onClick={() => onManageSubscription(client)}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-accent/5 hover:bg-accent/10 border border-accent/25 rounded-full text-[11px] font-bold text-accent active:scale-95 transition-all shadow-sm"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      Change Sub
                    </button>
                  </div>

                  {/* Utility row: Manage, View Progress */}
                  <div className="col-span-2 pt-1.5 border-t border-dashed border-muted-border/30 flex items-center justify-between text-xs">
                    <button
                      onClick={() => onViewProgress(client)}
                      className="flex items-center gap-1 text-text/60 hover:text-accent font-semibold transition-colors"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-accent" />
                      Visual Progress
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEditClient(client)}
                        title="Edit profile & packages"
                        className="p-1 px-2.5 rounded-full bg-white border border-muted-border/80 text-text/60 hover:text-accent hover:border-accent hover:bg-warm transition-colors shadow-sm"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDeleteClient(client.id)}
                        title="Delete client"
                        className="p-1 px-2.5 rounded-full bg-white border border-muted-border/80 text-text/60 hover:text-alert-coral hover:border-alert-coral hover:bg-warm transition-colors shadow-sm"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Minimal inline custom icons
function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
