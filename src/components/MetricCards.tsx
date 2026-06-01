import React from "react";
import { Users, AlertTriangle, CalendarRange, Dumbbell } from "lucide-react";
import { Client, SessionLog } from "../types";
import { isSubscriptionEndingSoon } from "../utils";

interface MetricCardsProps {
  clients: Client[];
  sessions: SessionLog[];
  onSelectTab: (tab: string) => void;
}

export default function MetricCards({ clients, sessions, onSelectTab }: MetricCardsProps) {
  // Subscriptions ending in <= 3 days (and not expired yet)
  const endingSoonClients = clients.filter((client) => {
    const { endingSoon, expired } = isSubscriptionEndingSoon(client);
    return endingSoon && !expired;
  });

  // Expired clients (days remaining < 0 or sessions <= 0)
  const expiredClients = clients.filter((client) => {
    const { expired } = isSubscriptionEndingSoon(client);
    return expired;
  });

  // Active subscriptions (not expired)
  const activeClients = clients.filter((client) => {
    const { expired } = isSubscriptionEndingSoon(client);
    return !expired && client.remainingSessions > 0;
  });

  // Clients with low sessions (1 or 0 sessions remaining, but not expired by duration yet)
  const lowSessionClients = clients.filter((client) => {
    return client.remainingSessions <= 1 && client.remainingSessions > 0;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* CARD 1: ACTIVE CLIENTS */}
      <div 
        id="metric-card-active"
        onClick={() => onSelectTab("clients")}
        className="bg-card border border-muted-border/30 rounded-3xl p-5 hover:border-accent cursor-pointer transition-all duration-300 shadow-soft group"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-text/60">Active Members</span>
          <div className="p-2.5 rounded-xl bg-accent/10 text-accent group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-text font-sans">{activeClients.length}</span>
          <span className="text-xs text-text/40">of {clients.length} total</span>
        </div>
        <div className="mt-3 text-xs text-text/60 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
          Currently training active packages
        </div>
      </div>

      {/* CARD 2: SUBSCRIPTIONS ENDING SOON (3-DAY WARNING) */}
      <div 
        id="metric-card-ending"
        onClick={() => onSelectTab("alerts")}
        className={`bg-card border rounded-3xl p-5 cursor-pointer transition-all duration-300 shadow-soft group ${
          endingSoonClients.length > 0 
            ? "border-alert-coral bg-alert-coral/[0.02] hover:border-alert-coral" 
            : "border-muted-border/30 hover:border-accent"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-text/60">Ending in 3 Days</span>
          <div className={`p-2.5 rounded-xl group-hover:scale-110 transition-transform ${
            endingSoonClients.length > 0 
              ? "bg-alert-coral/10 text-alert-coral" 
              : "bg-warm text-text/40"
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-semibold font-sans ${
            endingSoonClients.length > 0 ? "text-alert-coral" : "text-text"
          }`}>{endingSoonClients.length}</span>
          <span className="text-xs text-text/40 font-medium">require renewal</span>
        </div>
        <div className="mt-3 text-xs flex items-center gap-1.5 text-text/60">
          <span className={`w-1.5 h-1.5 rounded-full ${
            endingSoonClients.length > 0 ? "bg-alert-coral animate-pulse" : "bg-muted-border"
          }`}></span>
          3-day early alert window
        </div>
      </div>

      {/* CARD 3: RE-ENGAGE / RE-SELL (EXPIRED OR LOW SESSIONS) */}
      <div 
        id="metric-card-expired"
        onClick={() => onSelectTab("alerts")}
        className={`bg-card border rounded-3xl p-5 cursor-pointer transition-all duration-300 shadow-soft group ${
          expiredClients.length > 0 || lowSessionClients.length > 0
            ? "border-alert-coral/45 bg-alert-coral/[0.01] hover:border-alert-coral" 
            : "border-muted-border/30 hover:border-accent"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-text/60">Action Required</span>
          <div className={`p-2.5 rounded-xl group-hover:scale-110 transition-transform ${
            expiredClients.length > 0 || lowSessionClients.length > 0
              ? "bg-alert-coral/10 text-alert-coral" 
              : "bg-warm text-text/40"
          }`}>
            <CalendarRange className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-semibold font-sans ${
            (expiredClients.length + lowSessionClients.length) > 0 ? "text-alert-coral" : "text-text"
          }`}>{expiredClients.length + lowSessionClients.length}</span>
          <span className="text-xs text-text/40">expired or low</span>
        </div>
        <div className="mt-3 text-xs text-text/60 flex items-center gap-1.5">
          <span className="text-alert-coral font-semibold">
            {expiredClients.length}
          </span>{" "}
          expired,{" "}
          <span className="text-alert-coral/80 font-semibold">
            {lowSessionClients.length}
          </span>{" "}
          runs low
        </div>
      </div>

      {/* CARD 4: WORKOUT SESSIONS LOGGED */}
      <div 
        id="metric-card-sessions"
        onClick={() => onSelectTab("analytics")}
        className="bg-card border border-muted-border/30 rounded-3xl p-5 hover:border-accent cursor-pointer transition-all duration-300 shadow-soft group"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-text/60">Completed Workouts</span>
          <div className="p-2.5 rounded-xl bg-accent/10 text-accent group-hover:scale-110 transition-transform">
            <Dumbbell className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-text font-sans">{sessions.length}</span>
          <span className="text-xs text-text/40 font-mono">total history logs</span>
        </div>
        <div className="mt-3 text-xs text-text/60 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent/70"></div>
          Visual tracking data active
        </div>
      </div>
    </div>
  );
}
