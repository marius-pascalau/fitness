import { useState, useEffect, ChangeEvent } from "react";
import { Dumbbell, Users, Activity, AlertTriangle, Calendar, Download, Upload, Plus, Trash2, Heart, ShieldAlert, Check, Info, X, CreditCard } from "lucide-react";
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
import ClientSubscriptions from "./components/ClientSubscriptions";
import SubscriptionManagerModal from "./components/SubscriptionManagerModal";

export default function App() {
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("clients");
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClientForWorkout, setSelectedClientForWorkout] = useState<Client | null>(null);
  const [selectedClientForAnalytics, setSelectedClientForAnalytics] = useState<Client | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<SessionLog | null>(null);
  const [sessionToDuplicate, setSessionToDuplicate] = useState<SessionLog | null>(null);
  const [selectedClientForSubManagement, setSelectedClientForSubManagement] = useState<Client | null>(null);

  // Custom non-blocking interactive confirmation & toast states
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Auto-dismiss Toast Timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Initialize data from server (falls back to mocks if fetch fails)
  useEffect(() => {
    async function loadServerData() {
      try {
        const res = await fetch("/api/data");
        if (!res.ok) throw new Error("Failed to fetch data from API, status: " + res.status);
        const data = await res.json();
        
        const rawList = (data.clients || []) as Client[];
        const upgradedList = rawList.map((c) => {
          if (!c.subscriptionHistory || c.subscriptionHistory.length === 0) {
            return {
              ...c,
              subscriptionHistory: [
                {
                  id: "sub-init-" + c.id + "-" + Date.now(),
                  startDate: c.startDate,
                  price: c.price || 0,
                  sessionCount: c.subscriptionType,
                  dateCreated: `${c.startDate}T12:00:00Z`
                }
              ]
            };
          }
          return c;
        });
        setClients(upgradedList);
        setSessions(data.sessions || []);
      } catch (err) {
        console.error("Failed to load server data, using initials:", err);
        setClients(INITIAL_CLIENTS);
        setSessions(INITIAL_SESSIONS);
      } finally {
        setLoading(false);
      }
    }
    loadServerData();
  }, []);

  // Sync state helper to write to server
  const syncToServer = async (newClients: Client[], newSessions: SessionLog[]) => {
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clients: newClients, sessions: newSessions }),
      });
      if (!res.ok) throw new Error("Failed to save data. status: " + res.status);
    } catch (err) {
      console.error("Error syncing with server data.json:", err);
      setToast({ text: "Error syncing changes with server.", type: "error" });
    }
  };

  // Save updates helpers
  const updateClientsState = (newClients: Client[]) => {
    setClients(newClients);
    syncToServer(newClients, sessions);
  };

  const updateSessionsState = (newSessions: SessionLog[]) => {
    setSessions(newSessions);
    syncToServer(clients, newSessions);
  };

  // Register or Update a Client
  const handleSaveClient = (clientData: Omit<Client, "id"> & { id?: string }) => {
    if (clientData.id) {
      // Editing Mode
      const updated = clients.map((c) => {
        if (c.id === clientData.id) {
          // Keep remaining count or reset to subscription type if they edit subscription quantity
          const isSubUpdated = c.subscriptionType !== clientData.subscriptionType || c.price !== clientData.price || c.startDate !== clientData.startDate;
          const currentHistory = c.subscriptionHistory || [];
          
          let nextHistory = [...currentHistory];
          if (isSubUpdated) {
            nextHistory.push({
              id: "sub-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
              startDate: clientData.startDate,
              price: clientData.price || 0,
              sessionCount: clientData.subscriptionType,
              dateCreated: new Date().toISOString()
            });
          } else if (nextHistory.length === 0) {
            nextHistory.push({
              id: "sub-init-" + c.id + "-" + Date.now(),
              startDate: clientData.startDate,
              price: clientData.price || 0,
              sessionCount: clientData.subscriptionType,
              dateCreated: `${clientData.startDate}T12:00:00Z`
            });
          }

          return {
            ...c,
            ...clientData,
            remainingSessions: isSubUpdated ? clientData.subscriptionType : c.remainingSessions,
            subscriptionHistory: nextHistory
          };
        }
        return c;
      });
      updateClientsState(updated);
    } else {
      // Register Mode
      const newId = "client-" + Date.now();
      const firstSubscription = {
        id: "sub-" + Date.now(),
        startDate: clientData.startDate,
        price: clientData.price || 0,
        sessionCount: clientData.subscriptionType,
        dateCreated: new Date().toISOString()
      };
      const newClient: Client = {
        ...clientData,
        id: newId,
        remainingSessions: clientData.subscriptionType, // starts full
        subscriptionHistory: [firstSubscription]
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
  const handleSaveSession = (newSession: SessionLog, isEdit: boolean) => {
    if (isEdit) {
      // Edit existing session
      const updatedSessions = sessions.map((s) => s.id === newSession.id ? newSession : s);
      updateSessionsState(updatedSessions);
      setToast({ text: "Workout session database updated successfully!", type: "success" });
    } else {
      // Save new or duplicated session
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
      setToast({ text: "Workout session logged successfully!", type: "success" });
    }

    // Reset workflow states
    setSessionToEdit(null);
    setSessionToDuplicate(null);

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

  // Handle Subscription Renewals
  const handleRenewSubscription = (client: Client, customStartDate: string) => {
    const renewPrice = client.price !== undefined ? client.price : 500;
    const renewSessions = client.subscriptionType || 12;

    const newEntry = {
      id: "sub-renew-" + Date.now(),
      startDate: customStartDate,
      price: renewPrice,
      sessionCount: renewSessions,
      dateCreated: new Date().toISOString()
    };

    const updated = clients.map((c) => {
      if (c.id === client.id) {
        const history = c.subscriptionHistory || [];
        return {
          ...c,
          startDate: customStartDate,
          remainingSessions: renewSessions,
          subscriptionHistory: [...history, newEntry]
        };
      }
      return c;
    });

    updateClientsState(updated);
    setToast({ text: `Subscription renewed for ${client.name}! ${renewSessions} sessions added.`, type: "success" });
  };

  // Handle Subscription Changes
  const handleChangeSubscription = (client: Client, customStartDate: string, newSessions: number, newPrice: number) => {
    const newEntry = {
      id: "sub-change-" + Date.now(),
      startDate: customStartDate,
      price: newPrice,
      sessionCount: newSessions,
      dateCreated: new Date().toISOString()
    };

    const updated = clients.map((c) => {
      if (c.id === client.id) {
        const history = c.subscriptionHistory || [];
        return {
          ...c,
          startDate: customStartDate,
          subscriptionType: newSessions,
          price: newPrice,
          remainingSessions: newSessions,
          subscriptionHistory: [...history, newEntry]
        };
      }
      return c;
    });

    updateClientsState(updated);
    setToast({ text: `Subscription successfully updated for ${client.name}!`, type: "success" });
  };

  // Handle Delete Subscription from History
  const handleDeleteSubscription = (clientId: string, entryId: string) => {
    const updated = clients.map((c) => {
      if (c.id === clientId) {
        const history = c.subscriptionHistory || [];
        const nextHistory = history.filter((h) => h.id !== entryId);
        
        // If they delete an active/latest entry, recover previous state or keep current.
        const isLatestDeleted = history[history.length - 1]?.id === entryId;
        
        if (isLatestDeleted && nextHistory.length > 0) {
          const prevLatest = nextHistory[nextHistory.length - 1];
          return {
            ...c,
            startDate: prevLatest.startDate,
            subscriptionType: prevLatest.sessionCount,
            price: prevLatest.price,
            remainingSessions: Math.min(c.remainingSessions, prevLatest.sessionCount),
            subscriptionHistory: nextHistory
          };
        }

        return {
          ...c,
          subscriptionHistory: nextHistory
        };
      }
      return c;
    });

    updateClientsState(updated);
    setToast({ text: "Subscription history record deleted successfully.", type: "success" });
  };

  // Handle scheduling and client profile updates
  const handleUpdateClient = (updatedClient: Client) => {
    const updated = clients.map((c) => (c.id === updatedClient.id ? updatedClient : c));
    updateClientsState(updated);
  };

  // Handle Client Deletion Setup
  const handleDeleteClient = (clientId: string) => {
    const target = clients.find((c) => c.id === clientId);
    if (!target) return;
    setClientToDelete(target);
  };

  // Confirm Client Deletion and perform actual state updates
  const confirmDeleteClient = () => {
    if (!clientToDelete) return;
    const clientId = clientToDelete.id;
    const filteredClients = clients.filter((c) => c.id !== clientId);
    const filteredSessions = sessions.filter((s) => s.clientId !== clientId);
    
    updateClientsState(filteredClients);
    updateSessionsState(filteredSessions);

    if (selectedClientForAnalytics?.id === clientId) {
      setSelectedClientForAnalytics(null);
    }
    
    const clientName = clientToDelete.name;
    setClientToDelete(null);
    setToast({ text: `Successfully deleted ${clientName} and all records!`, type: "success" });
  };

  // Reset database with smooth custom animation transition
  const handleResetDatabase = async () => {
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      if (!res.ok) throw new Error("Failed to reset database on server with status: " + res.status);
      const data = await res.json();
      setClients(data.clients);
      setSessions(data.sessions);
      setToast({ text: "Database restored to defaults on server. Reloading tracker...", type: "success" });
      setIsResetConfirmOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error("Failed to reset server data:", err);
      setToast({ text: "Failed to reset database on server.", type: "error" });
    }
  };

  const handleTriggerLogWorkout = (client: Client) => {
    setSelectedClientForWorkout(client);
    setSessionToEdit(null);
    setSessionToDuplicate(null);
    setActiveTab("log");
  };

  const handleTriggerEditSession = (session: SessionLog) => {
    setSessionToEdit(session);
    setSessionToDuplicate(null);
    setSelectedClientForWorkout(null);
    setActiveTab("log");
  };

  const handleTriggerDuplicateSession = (session: SessionLog) => {
    setSessionToDuplicate(session);
    setSessionToEdit(null);
    setSelectedClientForWorkout(null);
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
          setToast({ text: "Import successful! Client records and sessions loaded into storage.", type: "success" });
        } else {
          setToast({ text: "Invalid backup file. Ensure it contains 'clients' and 'sessions' lists.", type: "error" });
        }
      } catch {
        setToast({ text: "Failed to parse JSON file. Ensure you uploaded a valid tracker backup file.", type: "error" });
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

  if (loading) {
    return (
      <div id="loading-screen" className="min-h-screen bg-warm text-[#1C3A27] flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="p-3.5 bg-accent text-white rounded-2xl shadow-soft">
            <Dumbbell className="w-8 h-8 animate-bounce" />
          </div>
          <div className="text-center">
            <h2 className="serif text-xl font-bold tracking-tight text-accent">Fit with Diana</h2>
            <p className="text-[11px] uppercase tracking-widest font-bold text-text/50 mt-2">
              Synchronizing with Coach Database...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
                Fitness tracker
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
              id="tab-btn-subscriptions"
              onClick={() => setActiveTab("subscriptions")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "subscriptions"
                  ? "bg-white text-accent border border-muted-border shadow-soft"
                  : "text-text/60 hover:text-accent font-medium hover:bg-muted-border/10"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Client Subscriptions
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
        
        {/* OVERHEAD HUD KPIS DISPLAYED ONLY FOR THE CLIENT DIRECTORY TAB */}
        {activeTab === "clients" && (
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
              onManageSubscription={(client) => setSelectedClientForSubManagement(client)}
              onUpdateClient={handleUpdateClient}
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
                setSessionToEdit(null);
                setSessionToDuplicate(null);
              }}
              sessionToEdit={sessionToEdit}
              sessionToDuplicate={sessionToDuplicate}
            />
          )}

          {activeTab === "analytics" && (
            <VisualAnalytics
              clients={clients}
              sessions={sessions}
              preSelectedClient={selectedClientForAnalytics}
              onEditSession={handleTriggerEditSession}
              onDuplicateSession={handleTriggerDuplicateSession}
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

          {activeTab === "subscriptions" && (
            <ClientSubscriptions
              clients={clients}
              onTriggerSubscriptionManager={(client) => setSelectedClientForSubManagement(client)}
              onDeleteSubscription={handleDeleteSubscription}
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
              onClick={() => setIsResetConfirmOpen(true)}
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

      {/* SUBSCRIPTION MANAGER MODAL */}
      {selectedClientForSubManagement && (
        <SubscriptionManagerModal
          client={selectedClientForSubManagement}
          onClose={() => setSelectedClientForSubManagement(null)}
          onRenew={handleRenewSubscription}
          onChangeSub={handleChangeSubscription}
        />
      )}

      {/* DELETE CLIENT CONFIRMATION DIALOG */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-text/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div 
            className="bg-white border border-muted-border/30 rounded-3xl p-6 shadow-xl max-w-md w-full animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 mb-4 border-b border-muted-border/30">
              <div className="p-2 bg-alert-coral/15 text-alert-coral rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="serif text-xl font-semibold text-accent leading-tight">
                Delete Client Profile?
              </h3>
            </div>
            
            <p className="text-xs text-text/70 leading-relaxed mb-4">
              Are you absolutely sure you want to remove <strong className="text-text font-bold">{clientToDelete.name}</strong> and completely clear all their subscription packages and historical workout records?
            </p>

            <div className="bg-alert-coral/5 border border-alert-coral/20 rounded-2xl p-3.5 mb-5 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-alert-coral flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-[#552727] font-medium leading-normal animate-pulse">
                This action is <strong className="font-bold underline">permanent and irreversible</strong>. It will remove them from the active directories and metrics dashboards immediately.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3.5">
              <button
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 border border-muted-border/80 text-text/70 text-xs font-semibold rounded-full hover:bg-warm hover:text-text transition-all"
              >
                Cancel, Keep Client
              </button>
              <button
                onClick={confirmDeleteClient}
                className="px-4 py-2 bg-alert-coral text-white text-xs font-semibold rounded-full hover:bg-alert-coral/95 active:scale-95 transition-all shadow-sm"
              >
                Complete Deletion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET DATABASE CONFIRMATION DIALOG */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-text/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div 
            className="bg-white border border-muted-border/30 rounded-3xl p-6 shadow-xl max-w-md w-full animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 mb-4 border-b border-muted-border/30">
              <div className="p-2 bg-alert-coral/15 text-alert-coral rounded-xl">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="serif text-xl font-semibold text-accent leading-tight">
                Reset System Database?
              </h3>
            </div>
            
            <p className="text-xs text-text/70 leading-relaxed mb-5">
              This will completely wipe your local Storage records for all clients, and revert back to the initial sample coach database. Active workouts and calendar counts will be lost.
            </p>

            <div className="flex items-center justify-end gap-3.5">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 border border-muted-border/80 text-text/70 text-xs font-semibold rounded-full hover:bg-warm hover:text-text transition-all"
              >
                No, Go Back
              </button>
              <button
                onClick={handleResetDatabase}
                className="px-4 py-2 bg-alert-coral text-white text-xs font-semibold rounded-full hover:bg-alert-coral/95 active:scale-95 transition-all shadow-sm"
              >
                Yes, Reset System
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION CONTAINER */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`p-4 rounded-2xl shadow-xl flex items-center gap-3 border animate-bounce ${
            toast.type === "success" 
              ? "bg-[#F4F9F2] border-accent/20 text-[#2D3E2F]"
              : toast.type === "error"
              ? "bg-[#FEF2F2] border-alert-coral/20 text-[#451A1A]"
              : "bg-[#F3F6FC] border-accent/15 text-text"
          }`}>
            {toast.type === "success" ? (
              <div className="p-1 px-1.5 bg-accent/10 rounded-lg text-accent">
                <Check className="w-4 h-4" />
              </div>
            ) : toast.type === "error" ? (
              <div className="p-1 px-1.5 bg-alert-coral/10 rounded-lg text-alert-coral">
                <AlertTriangle className="w-4 h-4" />
              </div>
            ) : (
              <div className="p-1 px-1.5 bg-accent/5 rounded-lg text-accent-light">
                <Info className="w-4 h-4" />
              </div>
            )}
            <span className="text-xs font-semibold">{toast.text}</span>
          </div>
        </div>
      )}

    </div>
  );
}
