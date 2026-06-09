import React, { useState, useMemo } from "react";
import { Calendar, Search, CreditCard, Download, User, ArrowUpRight, TrendingUp, Sparkles, Receipt, Filter, Trash2 } from "lucide-react";
import { Client, SubscriptionHistoryEntry } from "../types";
import { formatDate } from "../utils";
import { jsPDF } from "jspdf";

interface ClientSubscriptionsProps {
  clients: Client[];
  onTriggerSubscriptionManager?: (client: Client) => void;
  onDeleteSubscription?: (clientId: string, entryId: string) => void;
}

export default function ClientSubscriptions({
  clients,
  onTriggerSubscriptionManager,
  onDeleteSubscription
}: ClientSubscriptionsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const [subToDelete, setSubToDelete] = useState<{ clientId: string; entryId: string; clientName: string; startDate: string; sessionCount: number; price: number } | null>(null);

  // Flatten and prepare chronological list of all subscriptions
  const allSubscriptions = useMemo(() => {
    const list: Array<{
      id: string;
      clientId: string;
      clientName: string;
      clientPhone: string;
      startDate: string;
      price: number;
      sessionCount: number;
      dateCreated: string;
      isCurrentActive: boolean;
      isFallback?: boolean;
    }> = [];

    clients.forEach((client) => {
      const history = client.subscriptionHistory || [];
      
      if (history.length === 0) {
        // Fallback reference to their initial core subscription
        list.push({
          id: `fallback-${client.id}`,
          clientId: client.id,
          clientName: client.name,
          clientPhone: client.phone,
          startDate: client.startDate,
          price: client.price || 0,
          sessionCount: client.subscriptionType,
          dateCreated: `${client.startDate}T12:00:00Z`,
          isCurrentActive: true,
          isFallback: true
        });
      } else {
        history.forEach((h, index) => {
          // If this matches the client's current active parameters and is the newest date, treat it as active
          const isLatest = index === history.length - 1;
          list.push({
            id: h.id,
            clientId: client.id,
            clientName: client.name,
            clientPhone: client.phone,
            startDate: h.startDate,
            price: h.price,
            sessionCount: h.sessionCount,
            dateCreated: h.dateCreated,
            isCurrentActive: isLatest && client.startDate === h.startDate && client.subscriptionType === h.sessionCount
          });
        });
      }
    });

    // Apply filtering
    return list
      .filter((sub) => {
        const matchesSearch = sub.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              sub.clientPhone.includes(searchQuery);
        const matchesPrice = priceFilter === "all" ? true : sub.price.toString() === priceFilter;
        const matchesStartDate = startDateFilter ? sub.startDate >= startDateFilter : true;
        const matchesEndDate = endDateFilter ? sub.startDate <= endDateFilter : true;
        return matchesSearch && matchesPrice && matchesStartDate && matchesEndDate;
      })
      .sort((a, b) => {
        const timeA = new Date(a.startDate).getTime();
        const timeB = new Date(b.startDate).getTime();
        return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
      });
  }, [clients, searchQuery, sortOrder, priceFilter, startDateFilter, endDateFilter]);

  // Aggregate stats
  const billingStats = useMemo(() => {
    let totalRevenue = 0;
    let totalPurchases = 0;
    
    allSubscriptions.forEach((sub) => {
      totalRevenue += sub.price;
      totalPurchases += 1;
    });

    const averageTicket = totalPurchases > 0 ? totalRevenue / totalPurchases : 0;

    return {
      totalRevenue,
      totalPurchases,
      averageTicket
    };
  }, [allSubscriptions]);

  // Print PDF Workflow via client-side jsPDF
  const handlePrintPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Set standard clean styling
      doc.setFont("helvetica", "normal");
      
      // Header Banner
      doc.setFillColor(28, 58, 39); // Match branding color #1C3A27
      doc.rect(0, 0, 210, 35, "F");

      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Fit with Diana", 15, 18);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(162, 235, 183); // Light greenish brand accent
      doc.text("Subscription history", 15, 25);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 155, 25);

      // Stat cards box backgrounds
      doc.setFillColor(242, 242, 238); // Soft warm background
      doc.roundedRect(15, 45, 55, 20, 2, 2, "F");
      doc.roundedRect(78, 45, 55, 20, 2, 2, "F");
      doc.roundedRect(141, 45, 54, 20, 2, 2, "F");

      doc.setTextColor(110, 110, 110);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL REVENUE", 20, 50);
      doc.text("TOTAL PACKAGES ISSUED", 83, 50);
      doc.text("AVERAGE PRICE", 146, 50);

      doc.setTextColor(28, 58, 39);
      doc.setFontSize(13);
      doc.text(`${billingStats.totalRevenue.toLocaleString()}`, 20, 58);
      doc.text(`${billingStats.totalPurchases} Cycles`, 83, 58);
      doc.text(`${Math.round(billingStats.averageTicket).toLocaleString()}`, 146, 58);

      // Table Header
      let y = 75;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(235, 235, 230);
      doc.rect(15, y, 180, 8, "F");
      
      doc.setTextColor(60, 60, 60);
      doc.text("Client Name", 18, y + 5);
      doc.text("Phone", 65, y + 5);
      doc.text("Effective Date", 95, y + 5);
      doc.text("Package Sessions", 130, y + 5);
      doc.text("Price Paid", 165, y + 5);

      // Table Body
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      allSubscriptions.forEach((sub, idx) => {
        // Handle multipage overflow
        if (y > 275) {
          doc.addPage();
          y = 20;
          doc.setFont("helvetica", "bold");
          doc.setFillColor(235, 235, 230);
          doc.rect(15, y, 180, 8, "F");
          doc.setTextColor(60, 60, 60);
          doc.text("Client Name", 18, y + 5);
          doc.text("Phone", 65, y + 5);
          doc.text("Effective Date", 95, y + 5);
          doc.text("Package Sessions", 130, y + 5);
          doc.text("Price Paid", 165, y + 5);
          y += 8;
          doc.setFont("helvetica", "normal");
        }

        // Alternating row color
        if (idx % 2 === 0) {
          doc.setFillColor(248, 248, 244);
          doc.rect(15, y, 180, 8, "F");
        }

        doc.setTextColor(30, 30, 30);
        const name = sub.clientName.length > 22 ? sub.clientName.substring(0, 20) + ".." : sub.clientName;
        doc.text(name, 18, y + 5);
        doc.text(sub.clientPhone || "N/A", 65, y + 5);
        doc.text(formatDate(sub.startDate), 95, y + 5);
        doc.text(`${sub.sessionCount} Sessions`, 130, y + 5);
        doc.text(`${sub.price}`, 165, y + 5);

        y += 8;
      });

      // Save file
      doc.save(`Vitality_Subscriptions_Ledger_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      console.error("PDF generation exception: ", err);
      // Fallback
      window.print();
    }
  };

  return (
    <div id="subscription-ledger" className="space-y-6">
      
      {/* HUD STATS CONTAINER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-[#1C3A27] text-white p-5 rounded-3xl relative overflow-hidden shadow-soft">
          <div className="absolute right-[-10px] bottom-[-10px] text-white/5 pointer-events-none transform -rotate-12">
            <TrendingUp className="w-32 h-32" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#A2EBB7]/80 font-sans block mb-1">
            Total Billing Revenue
          </span>
          <div className="serif text-3xl font-black text-[#A2EBB7] tracking-tight leading-none mt-1">
            {billingStats.totalRevenue.toLocaleString()}
          </div>
          <p className="text-[10px] text-white/60 mt-2 font-mono">
            Accumulated from all historical client cycles
          </p>
        </div>

        <div className="bg-card border border-muted-border/30 p-5 rounded-3xl relative overflow-hidden shadow-soft">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text/45 font-sans block mb-1">
            Total Packages Issued
          </span>
          <div className="serif text-3xl font-black text-accent tracking-tight leading-none mt-1">
            {billingStats.totalPurchases} <span className="text-sm font-sans font-medium text-text/40">contracts</span>
          </div>
          <p className="text-[10px] text-text/45 mt-2 font-mono">
            Across {clients.length} registered wellness client records
          </p>
        </div>

        <div className="bg-card border border-muted-border/30 p-5 rounded-3xl relative overflow-hidden shadow-soft">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text/45 font-sans block mb-1">
            Average Cycle Ticket
          </span>
          <div className="serif text-3xl font-black text-accent tracking-tight leading-none mt-1">
            {Math.round(billingStats.averageTicket).toLocaleString()}
          </div>
          <p className="text-[10px] text-text/45 mt-2 font-mono">
            Mean value paid per renew/change cycle
          </p>
        </div>

      </div>

      {/* SEARCH, SORT AND EXPORT FILTER BAR */}
      <div className="bg-card border border-muted-border/30 rounded-3xl p-5 shadow-soft print:hidden">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search bar */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-text/40">
                <Search className="w-4 h-4" />
              </span>
              <input
                id="sub-ledger-search"
                type="text"
                placeholder="Search subscription histories by client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-warm/50 border border-muted-border text-sm text-text placeholder-text/40 rounded-full focus:outline-none focus:border-accent transition-colors font-sans"
              />
            </div>

            {/* EXPORT TO PDF BUTTON */}
            <div className="shrink-0 animate-fade-in">
              <button
                onClick={handlePrintPDF}
                className="w-full lg:w-auto flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-accent text-white text-xs font-semibold rounded-full hover:bg-accent/90 active:scale-95 transition-all shadow-soft font-sans h-[38px]"
              >
                <Download className="w-4 h-4" />
                <span>Export to PDF</span>
              </button>
            </div>

          </div>

          {/* Quick Filters Strip (Inc. Start Date & End Date) */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-muted-border/15">
            
            {/* Start Date filter field */}
            <div className="flex items-center gap-1.5 bg-warm px-3 py-1.5 border border-muted-border/80 rounded-full text-xs text-text/60">
              <Calendar className="w-3.5 h-3.5 text-text/40" />
              <span>Start Date:</span>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="bg-transparent border-none text-[11px] font-bold text-accent focus:outline-none cursor-pointer max-w-[105px]"
              />
              {startDateFilter && (
                <button 
                  onClick={() => setStartDateFilter("")}
                  className="text-rose-500 hover:text-rose-700 font-bold ml-1 text-[11px]"
                  title="Clear start date filter"
                >
                  ✕
                </button>
              )}
            </div>

            {/* End Date filter field */}
            <div className="flex items-center gap-1.5 bg-warm px-3 py-1.5 border border-muted-border/80 rounded-full text-xs text-text/60">
              <Calendar className="w-3.5 h-3.5 text-text/40" />
              <span>End Date:</span>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="bg-transparent border-none text-[11px] font-bold text-accent focus:outline-none cursor-pointer max-w-[105px]"
              />
              {endDateFilter && (
                <button 
                  onClick={() => setEndDateFilter("")}
                  className="text-rose-500 hover:text-rose-700 font-bold ml-1 text-[11px]"
                  title="Clear end date filter"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Price paid tag filter */}
            <div className="flex items-center gap-1.5 bg-warm px-3 py-1.5 border border-muted-border/80 rounded-full text-xs text-text/60">
              <Filter className="w-3.5 h-3.5 text-text/40" />
              <span>Paid:</span>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="bg-transparent font-bold text-accent focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All Values</option>
                <option value="0">0</option>
                <option value="100">100</option>
                <option value="500">500</option>
                <option value="850">850</option>
                <option value="1300">1300</option>
                <option value="3000">3000</option>
              </select>
            </div>

            {/* Price sorting order selection dropdown */}
            <div className="flex items-center gap-1.5 bg-warm px-3 py-1.5 border border-muted-border/80 rounded-full text-xs text-text/60">
              <Calendar className="w-3.5 h-3.5 text-text/40" />
              <span>Timeline:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-transparent font-bold text-accent focus:outline-none cursor-pointer text-xs"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block mb-6 border-b-2 border-accent pb-4 font-sans">
        <h1 className="serif text-3xl font-bold text-accent">Fitness tracker Instructor Console</h1>
        <h2 className="text-sm uppercase tracking-wider text-text/60 font-semibold mt-1">Chronological Subscriptions Billing Ledger</h2>
        <div className="flex justify-between text-xs text-text/50 mt-4 font-mono">
          <span>Printed on: {new Date().toLocaleDateString()}</span>
          <span>Filtered Count: {allSubscriptions.length} cycle entries</span>
          <span>Total Recorded billing: {billingStats.totalRevenue.toLocaleString()}</span>
        </div>
      </div>

      {/* CHRONOLOGICAL RESULTS LIST */}
      <div id="print-section" className="bg-card border border-muted-border/30 rounded-3xl overflow-hidden shadow-soft">
        
        {allSubscriptions.length === 0 ? (
          <div className="p-12 text-center text-text/40 font-sans">
            <Receipt className="w-10 h-10 mx-auto mb-2 text-text/20" />
            <p className="font-semibold text-sm">No transaction parameters correspond to the query filters.</p>
            <p className="text-xs text-text/50 mt-1">Try resetting search labels or registering renewals.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            
            {/* Desktop Table - Hidden on Print or on tiny screens */}
            <table className="w-full text-left border-collapse text-xs font-sans whitespace-nowrap hidden sm:table">
              
              <thead className="bg-warm/50 border-b border-muted-border/20 uppercase text-[10px] text-text/50 font-bold tracking-wider">
                <tr>
                  <th className="py-4 pl-6">Client Name</th>
                  <th className="py-4 px-4">Contact Phone</th>
                  <th className="py-4 px-4">Cycle Effective Date</th>
                  <th className="py-4 px-4 text-center">Package Sessions</th>
                  <th className="py-4 px-4 text-right">Price Paid</th>
                  <th className="py-4 px-4 text-right">Status State</th>
                  <th className="py-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-muted-border/15 text-text/80">
                {allSubscriptions.map((sub, idx) => (
                  <tr 
                    key={sub.id}
                    className="hover:bg-warm/20 transition-colors"
                  >
                    <td className="py-4 pl-6 font-bold text-accent flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-accent/40" />
                      <span>{sub.clientName}</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-text/60">{sub.clientPhone}</td>
                    <td className="py-4 px-4 font-bold text-text/70">{formatDate(sub.startDate)}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="bg-warm px-2.5 py-1 rounded-xl text-[11px] font-bold text-text/70 border border-muted-border/30">
                        {sub.sessionCount} Sessions
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-black text-accent text-sm">
                      {sub.price}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {sub.isCurrentActive ? (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-[#1C3A27]/10 text-[#1C3A27] border border-[#1C3A27]/20 uppercase tracking-widest">
                          Active Contract
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-medium bg-text/5 text-text/40 border border-text/10 uppercase tracking-widest">
                          Past Cycle
                        </span>
                      )}
                    </td>
                    <td className="py-4 pr-6 text-right">
                      {!sub.isFallback ? (
                        <button
                          onClick={() => setSubToDelete({
                            clientId: sub.clientId,
                            entryId: sub.id,
                            clientName: sub.clientName,
                            startDate: sub.startDate,
                            sessionCount: sub.sessionCount,
                            price: sub.price
                          })}
                          className="p-1 px-2.5 rounded-full text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 hover:text-rose-700 transition-colors active:scale-95"
                          title="Delete cycle history entry"
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="text-[10px] text-text/30 italic">Initial</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>

            {/* Mobile Responsive list layout - visible on small mobile screens */}
            <div className="block sm:hidden divide-y divide-muted-border/15 p-4 space-y-3 print:block">
              {allSubscriptions.map((sub) => (
                <div 
                  key={sub.id} 
                  className="bg-warm/10 p-3.5 rounded-2xl border border-muted-border/20 flex flex-col justify-between gap-2 text-xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-accent text-sm">{sub.clientName}</h4>
                      <p className="text-[10px] text-text/40 font-mono mt-0.5">{sub.clientPhone}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {sub.isCurrentActive ? (
                        <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-[#1C3A27]/10 text-[#1C3A27] border border-[#1C3A27]/15 uppercase tracking-widest shrink-0">
                          Active Contract
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[8px] font-medium bg-text/5 text-text/40 border border-text/10 uppercase tracking-widest shrink-0">
                          Past Cycle
                        </span>
                      )}

                      {!sub.isFallback && (
                        <button
                          onClick={() => setSubToDelete({
                            clientId: sub.clientId,
                            entryId: sub.id,
                            clientName: sub.clientName,
                            startDate: sub.startDate,
                            sessionCount: sub.sessionCount,
                            price: sub.price
                          })}
                          className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors whitespace-nowrap"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-muted-border/15">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-text/40 block">Start Date</span>
                      <span className="font-bold text-text/70">{formatDate(sub.startDate)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-text/40 block">Package</span>
                      <span className="font-semibold text-text/70 underline decoration-accent/30">{sub.sessionCount} Sess.</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-text/40 block">Price</span>
                      <span className="font-black text-accent text-sm">{sub.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

      {/* STATE-DRIVEN ROYAL CONFIRMATION DIALOG MODAL */}
      {subToDelete && (
        <div className="fixed inset-0 bg-text/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
          <div className="bg-white rounded-3xl border border-muted-border/40 p-6 max-w-sm w-full shadow-large relative">
            <h3 className="serif text-lg font-black text-[#852C2C] mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-500" />
              Delete Cycle Entry?
            </h3>
            <p className="text-xs text-text/70 leading-relaxed mb-5">
              Are you sure you want to permanently delete the subscription history entry starting on{" "}
              <strong>{formatDate(subToDelete.startDate)}</strong> ({subToDelete.sessionCount} sessions, price{" "}
              {subToDelete.price}) for <strong>{subToDelete.clientName}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSubToDelete(null)}
                className="flex-1 py-2 bg-warm hover:bg-muted-border/20 border border-muted-border/40 text-xs font-bold text-text/70 rounded-full transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteSubscription?.(subToDelete.clientId, subToDelete.entryId);
                  setSubToDelete(null);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full transition-all active:scale-95 shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
