import React from "react";
import { AlertTriangle, Clock, Calendar, Dumbbell, Phone, UserX, CheckCircle, ChevronRight, RefreshCw } from "lucide-react";
import { Client } from "../types";
import { isSubscriptionEndingSoon, formatDate } from "../utils";

interface SubscriptionAlertsProps {
  clients: Client[];
  onRenewClient: (client: Client) => void;
  onSelectTab: (tab: string) => void;
}

export default function SubscriptionAlerts({ clients, onRenewClient, onSelectTab }: SubscriptionAlertsProps) {
  
  // Calculate specific warning states
  const alertsList = clients.map((client) => {
    const { endingSoon, expired, daysLeft } = isSubscriptionEndingSoon(client);
    const hasNoSessions = client.remainingSessions <= 0;
    const isCloseToSessions = client.remainingSessions === 1;

    return {
      client,
      endingSoon, // duration days remaining: 0, 1, 2, 3
      expired,    // duration expired (< 0) or 0 sessions left
      daysLeft,
      hasNoSessions,
      isCloseToSessions,
    };
  });

  // 1. Core target: Ends in <= 3 days of time duration, but not yet fully expired by calendar (or has >= 1 session left)
  const expiringSoonByTime = alertsList.filter((item) => item.endingSoon && !item.expired);

  // 2. Out of Sessions: Remaining sessions is 0, regardless of calendar days
  const outOfSessions = alertsList.filter((item) => item.hasNoSessions);

  // 3. Low sessions: Remaining sessions is 1, regardless of calendar days
  const lowSessions = alertsList.filter((item) => item.isCloseToSessions && !item.hasNoSessions);

  // 4. Calendar Expired: Days remaining are negative
  const fullyExpiredByTime = alertsList.filter((item) => item.daysLeft < 0 && !item.hasNoSessions);

  const totalAlertsCount = expiringSoonByTime.length + outOfSessions.length + lowSessions.length + fullyExpiredByTime.length;

  return (
    <div id="alerts-center-module" className="space-y-6">
      
      {/* ALERT HERO HEADER */}
      <div className="bg-card border border-muted-border/30 rounded-3xl p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-accent uppercase tracking-wider font-sans">Trainer Notification Console</div>
          <h2 className="serif text-2xl font-semibold text-accent leading-tight">Subscription & Package Expiries</h2>
          <p className="text-text/70 text-xs font-sans">
            A central command board detailing client packages needing immediate instructor attention or prompt renewal.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="bg-warm px-4 py-2 border border-muted-border rounded-2xl text-center">
            <span className="block text-[9px] text-text/45 uppercase tracking-widest font-bold">Total Alerts</span>
            <span className={`text-xl font-bold ${totalAlertsCount > 0 ? "text-alert-coral animate-pulse" : "text-text/40"}`}>
              {totalAlertsCount}
            </span>
          </div>
        </div>
      </div>

      {totalAlertsCount === 0 ? (
        <div className="bg-card border border-muted-border/30 rounded-3xl p-12 text-center shadow-soft">
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="serif text-2xl text-text font-semibold mb-1">Subscriptions Stable</h3>
          <p className="text-text/60 text-xs max-w-sm mx-auto mb-4 font-sans">
            No client accounts require renewal. All subscriptions have ample sessions remaining and active program calendars.
          </p>
          <button
            onClick={() => onSelectTab("clients")}
            className="px-4 py-2.5 bg-white border border-muted-border font-semibold text-text/60 rounded-full hover:bg-warm shadow-sm hover:text-accent transition-colors"
          >
            Review All Clients
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* GROUP 1: EXPIRING SOON (3-DAY TIME REMINDER) */}
          <div className="bg-card border border-muted-border/30 rounded-3xl p-5 shadow-soft space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-muted-border/25">
              <div className="p-1 px-2.5 rounded-full bg-alert-coral/10 text-alert-coral text-[10px] font-bold animate-pulse">
                3 Days Left
              </div>
              <h3 className="text-xs uppercase font-extrabold text-accent tracking-wider font-sans">
                Expirations in 3 Days ({expiringSoonByTime.length})
              </h3>
            </div>

            {expiringSoonByTime.length === 0 ? (
              <p className="text-text/40 text-xs italic py-2">No active subscriptions are ending in this 3-day window.</p>
            ) : (
              <div className="space-y-3">
                {expiringSoonByTime.map(({ client, daysLeft }) => (
                  <div
                    key={client.id}
                    className="bg-warm/40 p-4 rounded-3xl border border-alert-coral/25 flex flex-col justify-between hover:border-alert-coral/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-2">
                      <div>
                        <h4 className="serif text-base font-semibold text-text">{client.name}</h4>
                        <span className="font-mono text-xs text-text/60 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-text/40" />
                          <span>{client.phone}</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-alert-coral font-sans">
                          {daysLeft} days until end
                        </span>
                        <span className="block text-[9px] text-text/40 font-mono">
                          Expires: {formatDate(client.startDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-muted-border/15 text-xs">
                      <span className="text-text/60">
                        Sessions: <b className="text-text font-bold">{client.remainingSessions}</b> left
                      </span>
                      <button
                        onClick={() => onRenewClient(client)}
                        className="flex items-center gap-1 p-1.5 px-3 bg-alert-coral text-white font-semibold rounded-full text-[11px] hover:bg-alert-coral/90 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3 animate-spin-slow" />
                        Quick Renew
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GROUP 2: OUT OF SESSIONS (ALLOWS RENEWAL) */}
          <div className="bg-card border border-muted-border/30 rounded-3xl p-5 shadow-soft space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-muted-border/25">
              <div className="p-1 px-2.5 rounded-full bg-alert-coral/10 text-alert-coral text-[10px] font-bold">
                0 Sessions
              </div>
              <h3 className="text-xs uppercase font-extrabold text-accent tracking-wider font-sans">
                Exhausted Sessions ({outOfSessions.length})
              </h3>
            </div>

            {outOfSessions.length === 0 ? (
              <p className="text-text/40 text-xs italic py-2">No active clients are out of training sessions.</p>
            ) : (
              <div className="space-y-3">
                {outOfSessions.map(({ client }) => (
                  <div
                    key={client.id}
                    className="bg-warm/40 p-4 rounded-3xl border border-alert-coral/20 flex flex-col justify-between hover:border-alert-coral/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-2">
                      <div>
                        <h4 className="serif text-base font-semibold text-text">{client.name}</h4>
                        <span className="font-mono text-xs text-text/60 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-text/40" />
                          <span>{client.phone}</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-alert-coral uppercase tracking-wider font-sans">
                          0 sessions
                        </span>
                        <span className="block text-[9px] text-text/40 font-mono">
                          Package: {client.subscriptionType} total
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-muted-border/15 text-xs">
                      <span className="text-text/50">
                        Requires instant slot recharge
                      </span>
                      <button
                        onClick={() => onRenewClient(client)}
                        className="flex items-center gap-1 p-1.5 px-3 bg-alert-coral text-white font-semibold rounded-full text-[11px] hover:bg-alert-coral/90 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Re-book Pack
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GROUP 3: LOW SESSIONS ALERTS (1 SESSION REMAINING) */}
          <div className="bg-card border border-muted-border/30 rounded-3xl p-5 shadow-soft space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-muted-border/25">
              <div className="p-1 px-2.5 rounded-full bg-alert-coral/5 text-alert-coral text-[10px] font-bold">
                1 Session Left
              </div>
              <h3 className="text-xs uppercase font-extrabold text-accent tracking-wider font-sans">
                Low Sessions Caution ({lowSessions.length})
              </h3>
            </div>

            {lowSessions.length === 0 ? (
              <p className="text-text/40 text-xs italic py-2">No active clients have exactly 1 session left.</p>
            ) : (
              <div className="space-y-3">
                {lowSessions.map(({ client }) => (
                  <div
                    key={client.id}
                    className="bg-warm/40 p-4 rounded-3xl border border-alert-coral/15 flex flex-col justify-between hover:border-alert-coral/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-2">
                      <div>
                        <h4 className="serif text-base font-semibold text-text">{client.name}</h4>
                        <span className="font-mono text-xs text-text/60 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-text/40" />
                          <span>{client.phone}</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-alert-coral font-sans">
                          1 session left
                        </span>
                        <span className="block text-[9px] text-text/40 font-mono">
                          Package: {client.subscriptionType} total
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-muted-border/15 text-xs">
                      <span className="text-text/50">
                        Prepare renewal package plan
                      </span>
                      <button
                        onClick={() => onRenewClient(client)}
                        className="flex items-center gap-1 p-1.5 px-3 bg-white border border-muted-border text-text/60 font-semibold rounded-full text-[11px] hover:text-accent hover:border-accent hover:bg-warm shadow-sm transition-colors"
                      >
                        Prepare Pack
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GROUP 4: PASSED TIME EXPIRED (DAYS LEFT IS NEGATIVE) */}
          <div className="bg-card border border-muted-border/30 rounded-3xl p-5 shadow-soft space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-muted-border/25">
              <div className="p-1 px-2.5 rounded-full bg-warm text-text/50 text-[10px] font-bold border border-muted-border">
                Time Expired
              </div>
              <h3 className="text-xs uppercase font-extrabold text-accent tracking-wider font-sans">
                Expired Active Slots ({fullyExpiredByTime.length})
              </h3>
            </div>

            {fullyExpiredByTime.length === 0 ? (
              <p className="text-text/40 text-xs italic py-2">No clients are past their duration date limits.</p>
            ) : (
              <div className="space-y-3">
                {fullyExpiredByTime.map(({ client, daysLeft }) => (
                  <div
                    key={client.id}
                    className="bg-warm/40 p-4 rounded-3xl border border-muted-border/30 flex flex-col justify-between hover:border-muted-border/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-2">
                      <div>
                        <h4 className="serif text-base font-semibold text-text">{client.name}</h4>
                        <span className="font-mono text-xs text-text/60 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-text/40" />
                          <span>{client.phone}</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-alert-coral font-sans">
                          {Math.abs(daysLeft)} days expired
                        </span>
                        <span className="block text-[9px] text-text/40 font-mono">
                          Started: {formatDate(client.startDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-muted-border/15 text-xs">
                      <span className="text-text/50">
                        Had <b className="text-text">{client.remainingSessions}</b> unused sessions
                      </span>
                      <button
                        onClick={() => onRenewClient(client)}
                        className="flex items-center gap-1 p-1.5 px-3 bg-white border border-muted-border text-text/60 font-semibold rounded-full text-[11px] hover:text-accent hover:border-accent hover:bg-warm shadow-sm transition-colors"
                      >
                        Reset & Reactivate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
