import { useState, useEffect, ChangeEvent } from "react";
import { Dumbbell, Users, Activity, AlertTriangle, Calendar, Download, Upload, Plus, Trash2, Heart, ShieldAlert } from "lucide-react";
import { Client, SessionLog } from "./types";
import { INITIAL_CLIENTS, INITIAL_SESSIONS } from "./mockData";
import { isSubscriptionEndingSoon, getSystemDate } from "./utils";

// Sub-components
import MetricCards from "./components/MetricCards";
import ClientList from "./components/ClientList";
import SessionLogger from "./components/SessionLogger";
import VisualAnalytics from "./components/VisualAnalytics";
import SubscriptionAlerts from "./components/SubscriptionAlerts";
import AddClientModal from "./components/AddClientModal";

export default function App() {
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [activeTab, setActiveTab] = useState<string>("clients");
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClientForWorkout, setSelectedClientForWorkout] = useState<Client | null>(null);
  const [selectedClientForAnalytics, setSelectedClientForAnalytics] = useState<Client | null>(null);

  // Initialize data from local storage or mock
  useEffect(() => {
    const savedClients = localStorage.getItem("fit_tracker_clients_v1");
    const savedSessions = localStorage.getItem("fit_tracker_sessions_v1");

    if (savedClients) {
      try {
        setClients(JSON.parse(savedClients));
      } catch {
        setClients(INITIAL_CLIENTS);
      }
    } else {
      setClients(INITIAL_CLIENTS);
      localStorage.setItem("fit_tracker_clients_v1", JSON.stringify(INITIAL_CLIENTS));
    }

    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch {
        setSessions(INITIAL_SESSIONS);
      }
    } else {
      setSessions(INITIAL_SESSIONS);
      localStorage.setItem("fit_tracker_sessions_v1", JSON.stringify(INITIAL_SESSIONS));
    }
  }, []);

  // Save updates helper
  const updateClientsState = (newClients: Client[]) => {
    setClients(newClients);
    localStorage.setItem("fit_tracker_clients_v1", JSON.stringify(newClients));
  };

  const updateSessionsState = (newSessions: SessionLog[]) => {
    setSessions(newSessions);
    localStorage.setItem("fit_tracker_sessions_v1", JSON.stringify(newSessions));
  };

  // Register or Update a Client
  const handleSaveClient = (clientData: Omit<Client, "id"> & { id?: string }) => {
    if (clientData.id) {
      // Editing Mode
      const updated = clients.map((c) => {
        if (c.id === clientData.id) {
          // Keep remaining count or reset to subscription type if they edit subscription quantity
          const isSubUpdated = c.subscriptionType !== clientData.subscriptionType;
          return {
            ...c,
            name: clientData.name,
            phone: clientData.phone,
            startDate: clientData.startDate,
            subscriptionType: clientData.subscriptionType,
            durationDays: clientData.durationDays,
            notes: clientData.notes,
            remainingSessions: isSubUpdated ? clientData.subscriptionType : c.remainingSessions
          };
        }
        return c;
      });
      updateClientsState(updated);
    } else {
      // Register Mode
      const newId = "client-" + Date.now();
      const newClient: Client = {
        id: newId,
        name: clientData.name,
        phone: clientData.phone,
        startDate: clientData.startDate,
        subscriptionType: clientData.subscriptionType,
        remainingSessions: clientData.subscriptionType, // starts full
        durationDays: clientData.durationDays,
        notes: clientData.notes
      };
      updateClientsState([...clients, newClient]);
    }

    setIsAddModalOpen(false);
    setClientToEdit(null);
  };

  // Trigger Client renewal/editing from other sections
  const handleTriggerEditClient = (client: Client) => {
    setClientToEdit(client);
    setIsAddModalOpen(true);
  };

  // Save Workout Session
  const handleSaveSession = (newSession: SessionLog) => {
    // 1. Decrement remaining sessions from relevant client
    const updatedClients = clients.map((c) => {
      if (c.id === newSession.clientId) {
        return {
          ...c,
          remainingSessions: Math.max(0, c.remainingSessions - 1)
        };
      }
      return c;
    });

    updateClientsState(updatedClients);
    updateSessionsState([...sessions, newSession]);

    // Find client to pre-select for immediate visual inspection
    const matchClient = clients.find((c) => c.id === newSession.clientId) || null;
    setSelectedClientForAnalytics(matchClient);

    // Switch view to analytics automatically so trainer inspects the chart!
    setActiveTab("analytics");
    setSelectedClientForWorkout(null);
  };

  // Quick One-click Attendance Check-in
  const handleQuickAttend = (clientId: string) => {
    const targetClient = clients.find((c) => c.id === clientId);
    if (!targetClient || targetClient.remainingSessions <= 0) return;

    // Standard date format
    const today = getSystemDate();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;

    // Generate basic Session log to keep track of dates
    const quickSession: SessionLog = {
      id: "session-quick-" + Date.now(),
      clientId: clientId,
      date: formattedDate,
      notes: "Quick check-in (deducted 1 session)",
      exercises: []
    };

    const updatedClients = clients.map((c) => {
      if (c.id === clientId) {
        return {
          ...c,
          remainingSessions: Math.max(0, c.remainingSessions - 1)
        };
      }
      return c;
    });

    updateClientsState(updatedClients);
    updateSessionsState([...sessions, quickSession]);
  };

  // Handle Client Deletion
  const handleDeleteClient = (clientId: string) => {
    const target = clients.find((c) => c.id === clientId);
    if (!target) return;

    const confirm = window.confirm(`Are you absolutely sure you want to remove ${target.name} and clear all their workout records? This action is irreversible.`);
    if (confirm) {
      const filteredClients = clients.filter((c) => c.id !== clientId);
      const filteredSessions = sessions.filter((s) => s.clientId !== clientId);
      
      updateClientsState(filteredClients);
      updateSessionsState(filteredSessions);

      if (selectedClientForAnalytics?.id === clientId) {
        setSelectedClientForAnalytics(null);
      }
    }
  };

  const handleTriggerLogWorkout = (client: Client) => {
    setSelectedClientForWorkout(client);
    setActiveTab("log");
  };

  const handleTriggerViewProgress = (client: Client) => {
    setSelectedClientForAnalytics(client);
    setActiveTab("analytics");
  };

  // Export Data for durability backup
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({ clients, sessions }, null, 2)
    );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `fit_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Backup Data
  const handleImportData = (e: ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.clients) && Array.isArray(parsed.sessions)) {
          updateClientsState(parsed.clients);
          updateSessionsState(parsed.sessions);
          alert("Import successful! Client records and sessions loaded into storage.");
        } else {
          alert("Invalid backup file. Ensure it contains 'clients' and 'sessions' lists.");
        }
      } catch {
        alert("Failed to parse JSON file. Ensure you uploaded a valid tracker backup file.");
      }
    };
    fileReader.readAsText(files[0]);
  };

  // Warnings count for Alerts Badge
  const urgentAlertsCount = clients.filter((c) => {
    const { endingSoon, expired } = isSubscriptionEndingSoon(c);
    // Alert triggers if ending soon (within 3 days remaining) or has exactly 0/1 sessions remaining
    return (endingSoon && !expired) || (c.remainingSessions <= 1);
  }).length;

  return (
    <div id="application-layout" className="min-h-screen bg-warm text-text font-sans flex flex-col selection:bg-accent/20 selection:text-accent">
      
      {/* GLOBAL HUD HEADER */}
      <header className="border-b border-muted-border bg-[#F9F7F2]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          
          {/* Logo Brand Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent text-white rounded-xl shadow-soft flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="serif text-2xl font-semibold text-accent leading-tight">
                Vitality Coach
              </h1>
              <span className="text-[10px] tracking-widest block uppercase text-text/60 font-semibold">
                Instructor Console & Client Management
              </span>
            </div>
          </div>

          {/* Nav & Utilities Panel */}
          <div className="flex items-center gap-3">
            
            {/* Backup export button */}
            <button
              onClick={handleExportData}
              title="Export database as JSON backup"
              className="p-2 text-accent/70 hover:text-accent hover:bg-muted-border/30 rounded-xl transition-all"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Import file input wrapper */}
            <label
              title="Restore from JSON backup file"
              className="p-2 text-accent/70 hover:text-accent hover:bg-muted-border/30 rounded-xl transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>

            {/* Quick Register */}
            <button
              onClick={() => {
                setClientToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-xs font-semibold rounded-full hover:bg-accent/90 active:scale-95 transition-all shadow-soft"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              New Subscription
            </button>
          </div>

        </div>
      </header>

      {/* TABS CONTAINER BAR */}
      <div className="border-b border-muted-border bg-warm/50">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-1 py-2 overflow-x-auto">
            
            <button
              id="tab-btn-clients"
              onClick={() => {
                setActiveTab("clients");
                setSelectedClientForWorkout(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "clients"
                  ? "bg-white text-accent border border-muted-border shadow-soft"
                  : "text-text/60 hover:text-accent font-medium hover:bg-muted-border/10"
              }`}
            >
              <Users className="w-4 h-4" />
              Client Directory
            </button>

            <button
              id="tab-btn-log"
              onClick={() => setActiveTab("log")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "log"
                  ? "bg-white text-accent border border-muted-border shadow-soft"
                  : "text-text/60 hover:text-accent font-medium hover:bg-muted-border/10"
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              Log Workout Session
            </button>

            <button
              id="tab-btn-analytics"
              onClick={() => {
                setActiveTab("analytics");
                // Fallback selected client to first if empty
                if (!selectedClientForAnalytics && clients.length > 0) {
                  setSelectedClientForAnalytics(clients[0]);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "analytics"
                  ? "bg-white text-accent border border-muted-border shadow-soft"
                  : "text-text/60 hover:text-accent font-medium hover:bg-muted-border/10"
              }`}
            >
              <Activity className="w-4 h-4" />
              Client Analytics
            </button>

            <button
              id="tab-btn-alerts"
              onClick={() => setActiveTab("alerts")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap relative ${
                activeTab === "alerts"
                  ? "bg-white text-accent border border-muted-border shadow-soft"
                  : "text-text/60 hover:text-accent font-medium hover:bg-muted-border/10"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Expiration Center
              {urgentAlertsCount > 0 && (
                <span className="ml-1 bg-alert-coral text-white font-semibold font-sans text-[10px] px-1.5 py-0.5 rounded-full min-w-4 h-4 flex items-center justify-center animate-pulse">
                  {urgentAlertsCount}
                </span>
              )}
            </button>

          </nav>
        </div>
      </div>

      {/* CORE INNER WORKSPACE */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-6">
        
        {/* OVERHEAD HUD KPIS DISPLAYED ALMOST ALWAYS EXCEPT FOR FOCUSED LOGS */}
        {activeTab !== "log" && (
          <MetricCards
            clients={clients}
            sessions={sessions}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              if (tab === "analytics" && !selectedClientForAnalytics && clients.length > 0) {
                setSelectedClientForAnalytics(clients[0]);
              }
            }}
          />
        )}

        {/* ACTIVE MODULE CONTAINER ROUTING */}
        <div id="module-viewport" className="animate-fade-in duration-300">
          
          {activeTab === "clients" && (
            <ClientList
              clients={clients}
              onLogWorkout={handleTriggerLogWorkout}
              onQuickAttend={handleQuickAttend}
              onViewProgress={handleTriggerViewProgress}
              onEditClient={handleTriggerEditClient}
              onDeleteClient={handleDeleteClient}
              onAddNewClientClick={() => {
                setClientToEdit(null);
                setIsAddModalOpen(true);
              }}
            />
          )}

          {activeTab === "log" && (
            <SessionLogger
              clients={clients}
              selectedClientFromCard={selectedClientForWorkout}
              onSaveSession={handleSaveSession}
              onCancel={() => {
                setActiveTab("clients");
                setSelectedClientForWorkout(null);
              }}
            />
          )}

          {activeTab === "analytics" && (
            <VisualAnalytics
              clients={clients}
              sessions={sessions}
              preSelectedClient={selectedClientForAnalytics}
            />
          )}

          {activeTab === "alerts" && (
            <SubscriptionAlerts
              clients={clients}
              onRenewClient={handleTriggerEditClient}
              onSelectTab={(tab) => {
                setActiveTab(tab);
                if (tab === "analytics" && !selectedClientForAnalytics && clients.length > 0) {
                  setSelectedClientForAnalytics(clients[0]);
                }
              }}
            />
          )}

        </div>

      </main>

      {/* COACH FOOTER */}
      <footer className="border-t border-muted-border bg-white/40 py-5 text-center text-xs text-text/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 justify-center">
            <span>Designed for physical wellness practitioners with</span>
            <Heart className="w-3.5 h-3.5 text-alert-coral fill-alert-coral" />
            <span>in Cloud Native Workspace.</span>
          </div>
          <div className="flex items-center gap-3 justify-center">
            <span className="font-mono text-[10px]">Client Data Secured via LocalStorage</span>
            <span>•</span>
            <button
              onClick={() => {
                if (window.confirm("This will erase all clients and log databases and restore defaults. Continue?")) {
                  localStorage.removeItem("fit_tracker_clients_v1");
                  localStorage.removeItem("fit_tracker_sessions_v1");
                  window.location.reload();
                }
              }}
              className="text-text/40 hover:text-accent font-semibold transition-colors"
            >
              Reset Database Defaults
            </button>
          </div>
        </div>
      </footer>

      {/* DIALOG MODAL WIZARD */}
      {isAddModalOpen && (
        <AddClientModal
          clientToEdit={clientToEdit}
          onSave={handleSaveClient}
          onClose={() => {
            setIsAddModalOpen(false);
            setClientToEdit(null);
          }}
        />
      )}

    </div>
  );
}
