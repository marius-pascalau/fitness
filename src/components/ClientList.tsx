import React, { useState } from "react";
import { Search, Phone, Calendar, Dumbbell, ChevronRight, UserPlus, TrendingUp, Notebook, Trash2, Edit2, AlertCircle } from "lucide-react";
import { Client } from "../types";
import { isSubscriptionEndingSoon, formatDate, getSubscriptionDaysRemaining } from "../utils";

interface ClientListProps {
  clients: Client[];
  onLogWorkout: (client: Client) => void;
  onQuickAttend: (clientId: string) => void;
  onViewProgress: (client: Client) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onAddNewClientClick: () => void;
}

export default function ClientList({
  clients,
  onLogWorkout,
  onQuickAttend,
  onViewProgress,
  onEditClient,
  onDeleteClient,
  onAddNewClientClick
}: ClientListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "warning" | "expired">("all");
  const [packFilter, setPackFilter] = useState<"all" | "8" | "12" | "16">("all");

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
