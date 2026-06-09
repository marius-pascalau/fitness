import React, { useState, useMemo } from "react";
import { TrendingUp, Dumbbell, Calendar, ChevronDown, Sparkles, Award, ArrowUpRight, Scale, Info, Edit3, Copy, Download } from "lucide-react";
import { Client, SessionLog, ExerciseLog, WorkoutSet } from "../types";
import { formatDate } from "../utils";
import { jsPDF } from "jspdf";

interface VisualAnalyticsProps {
  clients: Client[];
  sessions: SessionLog[];
  preSelectedClient: Client | null;
  onEditSession?: (session: SessionLog) => void;
  onDuplicateSession?: (session: SessionLog) => void;
}

type MetricType = "1rm" | "volume" | "weight";

export default function VisualAnalytics({ 
  clients, 
  sessions, 
  preSelectedClient,
  onEditSession,
  onDuplicateSession
}: VisualAnalyticsProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    if (preSelectedClient) return preSelectedClient.id;
    return clients[0]?.id || "";
  });

  // Keep selected range or reset on client change
  const [selectedExercise, setSelectedExercise] = useState<string>("Squat");
  const [metricOption, setMetricOption] = useState<MetricType>("1rm");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const client = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Retrieve chronological session logs for selected client
  const clientSessions = useMemo(() => {
    return sessions
      .filter((s) => s.clientId === selectedClientId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sessions, selectedClientId]);

  // Extract unique exercises that this client has actually performed
  const clientPerformedExercises = useMemo(() => {
    const list = new Set<string>();
    clientSessions.forEach((s) => {
      s.exercises.forEach((ex) => {
        if (ex.exerciseName.trim()) {
          list.add(ex.exerciseName.trim());
        }
      });
    });
    const result = Array.from(list);
    return result.length > 0 ? result : ["Squat", "Bench Press", "Deadlift"];
  }, [clientSessions]);

  // Set selected exercise to its first logged if previous doesn't exist
  React.useEffect(() => {
    if (!clientPerformedExercises.includes(selectedExercise)) {
      setSelectedExercise(clientPerformedExercises[0] || "Squat");
    }
  }, [clientPerformedExercises, selectedExercise]);

  // Compute Epley's 1RM for a single exercise's sets
  const calcEstimated1RM = (sets: WorkoutSet[]): number => {
    if (sets.length === 0) return 0;
    // Classic Epley Formula: 1RM = Weight * (1 + Reps/30)
    // Find set that yields maximum 1RM
    let max1RM = 0;
    sets.forEach((set) => {
      if (set.reps <= 0) return;
      let epley = set.weight * (1 + set.reps / 30);
      if (set.reps === 1) epley = set.weight; // Exactly 1 rep is 1RM
      if (epley > max1RM) max1RM = epley;
    });
    return parseFloat(max1RM.toFixed(1));
  };

  // Compute Total Set Volume (weight * reps)
  const calcTotalVolume = (sets: WorkoutSet[]): number => {
    return sets.reduce((acc, curr) => acc + curr.weight * curr.reps, 0);
  };

  // Compute Peak Weight
  const calcPeakWeight = (sets: WorkoutSet[]): number => {
    if (sets.length === 0) return 0;
    return Math.max(...sets.map((s) => s.weight));
  };

  // Build the time-series coordinates for SVG line graph
  const chartDataPoints = useMemo(() => {
    const points: { date: string; value: number; formattedValue: string; originalLog: ExerciseLog }[] = [];

    clientSessions.forEach((session) => {
      const exerciseLog = session.exercises.find(
        (ex) => ex.exerciseName.toLowerCase().trim() === selectedExercise.toLowerCase().trim()
      );

      if (exerciseLog && exerciseLog.sets.length > 0) {
        let val = 0;
        let suffix = "kg";
        if (metricOption === "1rm") {
          val = calcEstimated1RM(exerciseLog.sets);
          suffix = "kg est. 1RM";
        } else if (metricOption === "volume") {
          val = calcTotalVolume(exerciseLog.sets);
          suffix = "kg volume";
        } else if (metricOption === "weight") {
          val = calcPeakWeight(exerciseLog.sets);
          suffix = "kg peak";
        }

        points.push({
          date: session.date,
          value: val,
          formattedValue: `${val}${suffix}`,
          originalLog: exerciseLog
        });
      }
    });

    return points;
  }, [clientSessions, selectedExercise, metricOption]);

  // Stats calculation
  const statsOverview = useMemo(() => {
    if (chartDataPoints.length === 0) return { min: 0, max: 0, latest: 0, change: 0 };
    const values = chartDataPoints.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const earliestVal = chartDataPoints[0].value;
    const latestVal = chartDataPoints[chartDataPoints.length - 1].value;
    
    let change = 0;
    if (earliestVal > 0) {
      change = parseFloat((((latestVal - earliestVal) / earliestVal) * 100).toFixed(1));
    }

    return { min, max, latest: latestVal, change };
  }, [chartDataPoints]);

  const handleExportWorkoutHistoryPDF = () => {
    if (!client) return;

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // 1. HEADER BANNER
      doc.setFillColor(28, 58, 39); // Deep Forest Green #1C3A27
      doc.rect(0, 0, 210, 38, "F");

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("Fit with Diana", 15, 16);

      // Subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(162, 235, 183); // Mint highlight #A2EBB7
      doc.text("WORKOUT HISTORY & PROGRESSION SCHEMES", 15, 23);

      doc.setFontSize(8);
      doc.setTextColor(230, 240, 230);
      doc.text(`Generated: ${new Date().toLocaleDateString()}  |  Trainer Assessment Report`, 15, 30);

      let y = 48;

      // 2. CLIENT INDOBOX (Biometrics & Briefing)
      doc.setFillColor(248, 247, 243); // warm light off-white background
      doc.roundedRect(15, y, 180, 36, 4, 4, "F");
      doc.setDrawColor(230, 226, 215);
      doc.setLineWidth(0.3);
      doc.roundedRect(15, y, 180, 36, 4, 4, "S");

      doc.setTextColor(28, 58, 39);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`COACH PROFILE: ${client.name.toUpperCase()}`, 20, y + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      doc.text(`Primary Phone: ${client.phone}`, 20, y + 13);
      doc.text(`Start Date: ${formatDate(client.startDate)}`, 20, y + 18);
      doc.text(`Active Balance: ${client.remainingSessions} of ${client.subscriptionType} sessions left`, 20, y + 23);

      // Render some biometrics if available
      doc.text(`Gender: ${client.gender ? client.gender.toUpperCase() : "N/A"}`, 105, y + 13);
      doc.text(`Height: ${client.height ? client.height + " cm" : "N/A"}`, 105, y + 18);
      doc.text(`Weight: ${client.weight ? client.weight + " kg" : "N/A"}`, 105, y + 23);

      if (client.notes) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(110, 110, 110);
        const truncatedNotes = client.notes.length > 95 ? client.notes.substring(0, 92) + "..." : client.notes;
        doc.text(`Trainer Cues: "${truncatedNotes}"`, 20, y + 30);
      }

      y += 46;

      if (clientSessions.length === 0) {
        // No session logs handle
        doc.setTextColor(110, 110, 110);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("NO STRUCTURAL WORKOUTS RECORDED YET", 15, y + 10);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.text("There are no session history logs logged for this client inside the coach console.", 15, y + 17);
        doc.text("Verify your records or log a session in the 'Clients' directory to enable dynamic PDF tracking.", 15, y + 23);
        doc.save(`${client.name.replace(/\s+/g, "_")}_workout_history.pdf`);
        return;
      }

      // Group data points by exercise
      // unique exercise names actually done
      const performedExercisesSet = new Set<string>();
      clientSessions.forEach((s) => {
        s.exercises.forEach((ex) => {
          if (ex.exerciseName.trim()) {
            performedExercisesSet.add(ex.exerciseName.trim());
          }
        });
      });
      const performedExercises = Array.from(performedExercisesSet);

      if (performedExercises.length === 0) {
        doc.setTextColor(110, 110, 110);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("No specific named exercises with weight sets have been recorded yet in these sessions.", 15, y + 10);
        doc.save(`${client.name.replace(/\s+/g, "_")}_workout_history.pdf`);
        return;
      }

      // Draw each exercise's progression
      performedExercises.forEach((exName, exIndex) => {
        // Filter points for this specific exercise
        const exPoints: {
          date: string;
          oneRM: number;
          volume: number;
          peak: number;
          setsDetail: string;
        }[] = [];

        clientSessions.forEach((session) => {
          const matchedEx = session.exercises.find(
            (ex) => ex.exerciseName.toLowerCase().trim() === exName.toLowerCase().trim()
          );
          if (matchedEx && matchedEx.sets.length > 0) {
            const oneRM = calcEstimated1RM(matchedEx.sets);
            const volume = calcTotalVolume(matchedEx.sets);
            const peak = calcPeakWeight(matchedEx.sets);
            const setsDetail = matchedEx.sets.map((s, idx) => `${s.weight}kg x ${s.reps}r`).join(", ");
            exPoints.push({
              date: session.date,
              oneRM,
              volume,
              peak,
              setsDetail
            });
          }
        });

        if (exPoints.length === 0) return;

        // Check if we need to add a new page
        const heightNeeded = exPoints.length >= 2 ? 65 + exPoints.length * 6.5 : 30 + exPoints.length * 6.5;
        if (y + heightNeeded > 280) {
          doc.addPage();
          // Subsequent page banner header
          doc.setFillColor(28, 58, 39);
          doc.rect(0, 0, 210, 12, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.text(`Fit with Diana  |  Workout History Progress Report: ${client.name}`, 15, 8);
          y = 20;
        }

        // Section Title
        doc.setFillColor(242, 240, 234);
        doc.rect(15, y, 180, 8, "F");
        doc.setFillColor(28, 58, 39);
        doc.rect(15, y, 1.2, 8, "F"); // nice green flag decoration

        doc.setTextColor(28, 58, 39);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text(`${exIndex + 1}. ${exName.toUpperCase()} PROGRESSION ANALYSIS`, 18, y + 5.5);

        y += 13;

        // Draw Line Chart if >= 2 points
        if (exPoints.length >= 2) {
          const chartX = 25;
          const chartY = y;
          const chartW = 160;
          const chartH = 24;

          const oneRMValues = exPoints.map((p) => p.oneRM);
          const minEst = Math.min(...oneRMValues);
          const maxEst = Math.max(...oneRMValues);
          
          const minValBound = Math.max(0, Math.floor(minEst * 0.95));
          const maxValBound = Math.ceil(maxEst * 1.05) === minValBound ? minValBound + 10 : Math.ceil(maxEst * 1.05);
          const valRangeBound = maxValBound - minValBound || 10;

          // Draw baseline axis & grid line bounds
          doc.setDrawColor(230, 226, 215);
          doc.setLineWidth(0.25);
          doc.line(chartX, chartY, chartX + chartW, chartY); // top border
          doc.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH); // base axis

          // print max bound label on axis
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(140, 140, 140);
          doc.text(`${maxValBound}kg`, chartX - 3, chartY + 2.5, { align: "right" });
          doc.text(`${minValBound}kg`, chartX - 3, chartY + chartH, { align: "right" });

          // Label center grid
          const midValue = parseFloat((minValBound + valRangeBound / 2).toFixed(1));
          doc.line(chartX, chartY + chartH / 2, chartX + chartW, chartY + chartH / 2);
          doc.text(`${midValue}kg`, chartX - 3, chartY + chartH / 2 + 1, { align: "right" });

          // Plot points of chart
          const coordinates = exPoints.map((pt, index) => {
            const cx = chartX + (index / (exPoints.length - 1)) * chartW;
            const relativeValue = (pt.oneRM - minValBound) / valRangeBound;
            const cy = chartY + chartH - relativeValue * chartH;
            return { cx, cy, pt };
          });

          // Draw continuous progress path
          doc.setDrawColor(28, 58, 39);
          doc.setLineWidth(0.8);
          for (let i = 0; i < coordinates.length - 1; i++) {
            doc.line(coordinates[i].cx, coordinates[i].cy, coordinates[i+1].cx, coordinates[i+1].cy);
          }

          // Draw small solid dot markers and text labels
          coordinates.forEach((coord, idx) => {
            // Draw dot
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(28, 58, 39);
            doc.setLineWidth(0.5);
            doc.circle(coord.cx, coord.cy, 1.2, "FD");

            // Dot value labeller (skip to prevent cram if too many entries)
            const shouldLabel = coordinates.length < 12 || idx === 0 || idx === coordinates.length - 1 || idx % 2 === 0;
            if (shouldLabel) {
              doc.setFontSize(6.5);
              doc.setFont("helvetica", "bold");
              doc.setTextColor(28, 58, 39);
              doc.text(`${coord.pt.oneRM}kg`, coord.cx, coord.cy - 2.5, { align: "center" });

              // Draw date marker on bottom axis
              doc.setFontSize(6);
              doc.setFont("helvetica", "normal");
              doc.setTextColor(140, 140, 140);
              const customDateStr = coord.pt.date.substring(5); // e.g. 12-25
              doc.text(customDateStr, coord.cx, chartY + chartH + 4, { align: "center" });
            }
          });

          y += chartH + 11;
        } else {
          doc.setFillColor(248, 247, 243);
          doc.rect(15, y, 180, 12, "F");
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(80, 80, 80);
          doc.text(`Initial performance recorded on ${formatDate(exPoints[0].date)}:  ${exPoints[0].oneRM}kg (Estimated 1RM). Multiple entries will generate a timeline chart.`, 20, y + 7.5);
          y += 16;
        }

        // Draw sub table headers
        doc.setFillColor(28, 58, 39);
        doc.rect(15, y, 180, 7, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text("Date Logged", 20, y + 4.8);
        doc.text("Estimated 1RM", 52, y + 4.8);
        doc.text("Peak Weight", 85, y + 4.8);
        doc.text("Total Volume", 115, y + 4.8);
        doc.text("Sets Execution Logs", 145, y + 4.8);

        y += 7;

        exPoints.forEach((point) => {
          if (y + 8 > 280) {
            doc.addPage();
            // Subsequent page banner header
            doc.setFillColor(28, 58, 39);
            doc.rect(0, 0, 210, 12, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.text(`Fit with Diana  |  Workout History Progress Report: ${client.name}`, 15, 8);
            y = 20;

            // Reprint columns row headers
            doc.setFillColor(28, 58, 39);
            doc.rect(15, y, 180, 7, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.5);
            doc.text("Date Logged", 20, y + 4.8);
            doc.text("Estimated 1RM", 52, y + 4.8);
            doc.text("Peak Weight", 85, y + 4.8);
            doc.text("Total Volume", 115, y + 4.8);
            doc.text("Sets Execution Logs", 145, y + 4.8);
            y += 7;
          }

          // Subtle background grid cell row borders
          doc.setFillColor(252, 251, 248);
          doc.rect(15, y, 180, 6.5, "F");
          doc.setDrawColor(240, 237, 230);
          doc.setLineWidth(0.2);
          doc.line(15, y + 6.5, 195, y + 6.5);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(80, 80, 80);
          doc.text(formatDate(point.date), 20, y + 4.2);
          doc.text(`${point.oneRM} kg`, 52, y + 4.2);
          doc.text(`${point.peak} kg`, 85, y + 4.2);
          doc.text(`${point.volume} kg`, 115, y + 4.2);

          // Sub sets execution log
          doc.setFont("monospace", "normal");
          doc.setFontSize(7);
          doc.text(point.setsDetail, 145, y + 4.2);

          y += 6.5;
        });

        y += 10; // extra padding between exercise sections
      });

      // Save PDF document
      const fileSuffix = client.name.toLowerCase().replace(/\s+/g, "_");
      doc.save(`Diana_Fitness_${fileSuffix}_progress_report.pdf`);
    } catch (err) {
      console.error("Failed to compile or save visual workout PDF report", err);
    }
  };

  // Layout math parameters for SVG viewbox width=600 height=260
  const width = 600;
  const height = 240;
  const paddingLeft = 55;
  const paddingRight = 35;
  const paddingTop = 30;
  const paddingBottom = 40;

  const svgCoordinates = useMemo(() => {
    if (chartDataPoints.length === 0) return [];

    const values = chartDataPoints.map((p) => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    // Give some breathing room in vertical bounds
    const minBound = Math.max(0, Math.floor(minVal * 0.9));
    const maxBound = Math.ceil(maxVal * 1.1) === minBound ? minBound + 10 : Math.ceil(maxVal * 1.1);
    const valRange = maxBound - minBound;

    const graphWidth = width - paddingLeft - paddingRight;
    const graphHeight = height - paddingTop - paddingBottom;

    return chartDataPoints.map((point, index) => {
      // Scale horizontally
      const x =
        chartDataPoints.length > 1
          ? paddingLeft + (index / (chartDataPoints.length - 1)) * graphWidth
          : paddingLeft + graphWidth / 2;

      // Scale vertically (inverted because SVG 0 is top)
      const relativeVal = (point.value - minBound) / valRange;
      const y = paddingTop + graphHeight - relativeVal * graphHeight;

      return { x, y, ...point, minBound, maxBound };
    });
  }, [chartDataPoints]);

  // Compile path strings
  const pathD = useMemo(() => {
    if (svgCoordinates.length === 0) return "";
    return svgCoordinates.reduce(
      (path, pt, index) => (index === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`),
      ""
    );
  }, [svgCoordinates]);

  // Compile filled coordinates for progress area under the curve
  const fillD = useMemo(() => {
    if (svgCoordinates.length === 0) return "";
    const bottomY = height - paddingBottom;
    const firstPt = svgCoordinates[0];
    const lastPt = svgCoordinates[svgCoordinates.length - 1];
    return `${pathD} L ${lastPt.x} ${bottomY} L ${firstPt.x} ${bottomY} Z`;
  }, [svgCoordinates, pathD]);

  // Render Horizontal Scales / Grid lines
  const gridLines = useMemo(() => {
    if (svgCoordinates.length === 0) return [];
    const minB = svgCoordinates[0].minBound;
    const maxB = svgCoordinates[0].maxBound;
    const step = (maxB - minB) / 4;
    const lines = [];

    for (let i = 0; i <= 4; i++) {
      const v = parseFloat((minB + step * i).toFixed(1));
      const graphHeight = height - paddingTop - paddingBottom;
      const y = paddingTop + graphHeight - (i / 4) * graphHeight;
      lines.push({ y, value: v });
    }
    return lines;
  }, [svgCoordinates]);

  return (
    <div id="analytics-module" className="space-y-6">
      
      {/* SELECTION CRITERIA DRUM */}
      <div className="bg-card border border-muted-border/30 rounded-3xl p-6 shadow-soft">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          
          {/* 1. Client Select */}
          <div>
            <label className="block text-xs font-semibold text-text/60 uppercase tracking-wider mb-1.5 font-sans">
              Analyze Client
            </label>
            <select
              id="analytics-client-select"
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                setHoveredIndex(null);
              }}
              className="w-full bg-warm/50 border border-muted-border text-sm text-text rounded-2xl py-2.5 px-3.5 focus:outline-none focus:border-accent transition-colors"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.remainingSessions} sessions active)
                </option>
              ))}
            </select>
          </div>

          {/* 2. Exercise Selection */}
          <div>
            <label className="block text-xs font-semibold text-text/60 uppercase tracking-wider mb-1.5 font-sans">
              Select Lift / Exercise
            </label>
            <select
              id="analytics-exercise-select"
              value={selectedExercise}
              onChange={(e) => {
                setSelectedExercise(e.target.value);
                setHoveredIndex(null);
              }}
              className="w-full bg-warm/50 border border-muted-border text-sm text-text rounded-2xl py-2.5 px-3.5 focus:outline-none focus:border-accent transition-colors"
            >
              {clientPerformedExercises.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Metric selector tab */}
          <div>
            <label className="block text-xs font-semibold text-text/60 uppercase tracking-wider mb-1.5 font-sans">
              Performance Metric
            </label>
            <div className="flex bg-warm p-1 border border-muted-border/80 rounded-full">
              <button
                onClick={() => {
                  setMetricOption("1rm");
                  setHoveredIndex(null);
                }}
                className={`flex-1 text-center py-1.5 rounded-full text-xs font-semibold transition-all ${
                  metricOption === "1rm" ? "bg-white text-accent shadow-soft" : "text-text/60 hover:text-accent font-medium"
                }`}
                title="Epley's formula max estimate"
              >
                1RM Est.
              </button>
              <button
                onClick={() => {
                  setMetricOption("volume");
                  setHoveredIndex(null);
                }}
                className={`flex-1 text-center py-1.5 rounded-full text-xs font-semibold transition-all ${
                  metricOption === "volume" ? "bg-white text-accent shadow-soft" : "text-text/60 hover:text-accent font-medium"
                }`}
                title="Total set reps * kg combined"
              >
                Volume
              </button>
              <button
                onClick={() => {
                  setMetricOption("weight");
                  setHoveredIndex(null);
                }}
                className={`flex-1 text-center py-1.5 rounded-full text-xs font-semibold transition-all ${
                  metricOption === "weight" ? "bg-white text-accent shadow-soft" : "text-text/60 hover:text-accent font-medium"
                }`}
                title="Peak heavy lift weight"
              >
                Peak Wt.
              </button>
            </div>
          </div>

          {/* 4. Export PDF Action Button */}
          <div>
            <label className="block text-xs font-semibold text-text/60 uppercase tracking-wider mb-1.5 font-sans">
              Export History Report
            </label>
            <button
              onClick={handleExportWorkoutHistoryPDF}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white hover:bg-accent/90 text-xs font-semibold rounded-2xl transition-all shadow-md active:scale-95 h-[38px] font-sans"
              title="Download client's full exercise progression PDF report"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          </div>

        </div>
      </div>

      {/* GRAPH PLATFORM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Graph Panel */}
        <div className="lg:col-span-2 bg-card border border-muted-border/30 rounded-3xl p-6 shadow-soft flex flex-col justify-between">
          
          {/* Header Area */}
          <div className="flex items-center justify-between pb-3.5 border-b border-muted-border/30">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-accent font-semibold uppercase tracking-widest font-sans">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Strength Telemetry</span>
              </div>
              <h3 className="serif text-xl font-semibold text-text mt-0.5">
                {selectedExercise} Progression Plan
              </h3>
            </div>
            
            {/* Short insight label */}
            {chartDataPoints.length >= 2 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-accent/10 border border-accent/20 text-accent rounded-full text-xs font-semibold">
                <ArrowUpRight className="w-4 h-4 text-accent" />
                <span>{statsOverview.change >= 0 ? "+" : ""}{statsOverview.change}%</span>
                <span className="text-[9px] text-text/50 font-normal lowercase pl-0.5">improved</span>
              </div>
            )}
          </div>

          {/* SVG Line Chart Canvas */}
          <div className="my-5 relative flex-1 flex items-center justify-center min-h-[220px]">
            {chartDataPoints.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Dumbbell className="w-10 h-10 text-text/30 mx-auto mb-2 animate-bounce" />
                <p className="text-text/60 font-semibold text-xs uppercase tracking-wider">No exercise data available</p>
                <p className="text-text/40 text-xs mt-1.5 max-w-sm">
                  Log at least one workout session for {client?.name || "this client"} with the lift "
                  <span className="text-accent font-semibold">{selectedExercise}</span>" to see progress telemetry charts.
                </p>
              </div>
            ) : (
              <div className="w-full h-full">
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  className="w-full h-auto overflow-visible"
                >
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5A5A40" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#5A5A40" stopOpacity="0.00" />
                    </linearGradient>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#5A5A40" />
                      <stop offset="100%" stopColor="#5A5A40" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal gridlines */}
                  {gridLines.map((line, idx) => (
                    <g key={idx} className="opacity-70">
                      <line
                        x1={paddingLeft}
                        y1={line.y}
                        x2={width - paddingRight}
                        y2={line.y}
                        stroke="#EBE5D9"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={paddingLeft - 8}
                        y={line.y + 4}
                        fill="#2D2D2A"
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="end"
                        className="opacity-50"
                      >
                        {line.value}kg
                      </text>
                    </g>
                  ))}

                  {/* Area fill */}
                  <path d={fillD} fill="url(#areaGrad)" />

                  {/* Line track */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="url(#lineGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Interactive Dot points */}
                  {svgCoordinates.map((pt, idx) => {
                    const isHovered = hoveredIndex === idx;

                    return (
                      <g key={idx}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? "7" : "4.5"}
                          fill={isHovered ? "#5A5A40" : "#FFFFFF"}
                          stroke="#5A5A40"
                          strokeWidth={isHovered ? "2.5" : "2"}
                          className="cursor-pointer transition-all duration-150"
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                        />

                        {/* Date axis label for points (only first, last, and hovered to avoid crowding) */}
                        {(idx === 0 || idx === svgCoordinates.length - 1 || isHovered) && (
                          <text
                            x={pt.x}
                            y={height - 18}
                            fill={isHovered ? "#5A5A40" : "#2D2D2A"}
                            fontSize="9"
                            fontFamily="monospace"
                            textAnchor="middle"
                            className="font-semibold pointer-events-none opacity-60"
                          >
                            {pt.date.substring(5)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Tooltip Container inside container */}
                {hoveredIndex !== null && svgCoordinates[hoveredIndex] && (
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-card border border-muted-border/80 rounded-2xl p-4 shadow-soft text-xs space-y-1 z-20 w-52 max-w-full text-text flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] text-text/45">{formatDate(svgCoordinates[hoveredIndex].date)}</span>
                      <span className="text-[10px] bg-accent/10 text-accent font-semibold px-2 py-0.5 rounded-full uppercase">
                        {metricOption}
                      </span>
                    </div>
                    <div className="font-bold text-base text-accent">
                      {svgCoordinates[hoveredIndex].value} kg
                    </div>
                    
                    {/* List sets details */}
                    <div className="pt-2 mt-2 border-t border-muted-border/20 leading-normal">
                      <span className="text-[9px] uppercase font-bold text-text/40 tracking-wider">Set Logs:</span>
                      <div className="space-y-0.5 text-[11px] text-text/80 font-mono">
                        {svgCoordinates[hoveredIndex].originalLog.sets.map((s, i) => (
                          <div key={s.id} className="flex justify-between">
                            <span>Set {i + 1}:</span>
                            <span className="font-semibold text-text">{s.weight}kg x {s.reps}r</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-text/60 mt-2 p-2 px-3 bg-accent/5 rounded-2xl border border-accent/15 justify-center">
            <Info className="w-3.5 h-3.5 text-accent" />
            <span>Hover or tap individual data coordinates on the chart line to analyze historical set metrics.</span>
          </div>

        </div>

        {/* Dynamic Metric Benchmarking Cards */}
        <div className="space-y-4">
          
          {/* Summary Box */}
          <div className="bg-card border border-muted-border/30 rounded-3xl p-5 shadow-soft space-y-4">
            <h4 className="text-xs uppercase font-bold text-text/60 tracking-widest flex items-center gap-1.5 font-sans">
              <Award className="w-4 h-4 text-accent" />
              <span>Workout Assessment</span>
            </h4>

            {/* Benchmarks metrics */}
            <div className="grid grid-cols-2 gap-4">
              
              <div className="bg-warm p-3 rounded-2xl border border-muted-border/40">
                <span className="block text-[10px] uppercase font-bold text-text/40 tracking-wider mb-1">Peak Target</span>
                <span className="text-xl font-semibold text-text font-sans">{statsOverview.max}kg</span>
              </div>

              <div className="bg-warm p-3 rounded-2xl border border-muted-border/40">
                <span className="block text-[10px] uppercase font-bold text-text/40 tracking-wider mb-1">Starting Point</span>
                <span className="text-xl font-semibold text-text font-sans">{chartDataPoints[0]?.value || 0}kg</span>
              </div>

              <div className="bg-warm p-3.5 rounded-2xl border border-muted-border/40 col-span-2">
                <span className="block text-[10px] uppercase font-bold text-text/40 tracking-wider mb-1 flex items-center justify-between">
                  <span>Estimated Output (Latest)</span>
                  <span className="text-[10px] font-sans font-semibold text-accent/80">Stable</span>
                </span>
                <span className="serif text-2xl font-semibold text-accent leading-tight">{statsOverview.latest}kg</span>
              </div>

            </div>

            {/* General progress text block */}
            <div className="text-xs text-text/70 leading-relaxed bg-accent/5 p-3.5 rounded-2xl border border-accent/25">
              {chartDataPoints.length >= 2 ? (
                <span>
                  By progressively loading metrics from {formatDate(chartDataPoints[0].date)} to {formatDate(chartDataPoints[chartDataPoints.length - 1].date)}, <span className="text-accent font-semibold">{client?.name}</span> generated an output gain of <span className="text-accent font-bold">{statsOverview.change}%</span> in their {selectedExercise} lift.
                </span>
              ) : (
                <span>
                  Progress tracking evaluates calculated 1-Rep Max benchmarks, muscle set load, and peak volumes once 2 or more distinct workouts is recorded. Key elements will adjust chronologically.
                </span>
              )}
            </div>

          </div>

          {/* Client Bio Stats */}
          {client && (
            <div className="bg-card border border-muted-border/30 rounded-3xl p-5 shadow-soft space-y-3.5">
              <h4 className="text-xs uppercase font-bold text-text/60 tracking-widest flex items-center gap-1.5 font-sans">
                <Scale className="w-4 h-4 text-accent" />
                <span>Coach Profile Briefing</span>
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between pb-1.5 border-b border-muted-border/15">
                  <span className="text-text/60">Client Name:</span>
                  <span className="font-semibold text-text">{client.name}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-muted-border/15">
                  <span className="text-text/60">Primary Phone:</span>
                  <span className="text-text/80">{client.phone}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-muted-border/15">
                  <span className="text-text/60">Remaining Slots:</span>
                  <span className="font-bold text-accent">{client.remainingSessions} / {client.subscriptionType} Sessions</span>
                </div>
                {client.notes && (
                  <div className="bg-warm/60 p-3 rounded-2xl border border-muted-border/20 mt-1">
                    <span className="block text-[10px] font-bold uppercase text-text/40 tracking-wider mb-1">Trainer Cues:</span>
                    <p className="text-text/70 font-sans italic leading-relaxed text-[11px]">{client.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* TRAINING LOG HISTORY TABLE */}
      <div className="bg-card border border-muted-border/30 rounded-3xl p-6 shadow-soft">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-muted-border/25">
          <Calendar className="w-4.5 h-4.5 text-text/40" />
          <h3 className="serif text-xl font-semibold text-text leading-tight">
            Historical Workout Session Logs ({clientSessions.length})
          </h3>
        </div>

        {clientSessions.length === 0 ? (
          <div className="text-center py-10 text-text/40 text-xs">
            No workouts logged yet. Go to Clients tab to log a structured session.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {clientSessions.slice().reverse().map((session) => (
              <div
                key={session.id}
                className="bg-warm/40 p-4 rounded-2xl border border-muted-border/30 hover:border-muted-border/60 transition-colors"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5 pb-2 border-b border-muted-border/20">
                  <div className="flex-grow">
                    <span className="text-xs font-semibold text-accent font-sans">
                      Session on {formatDate(session.date)}
                    </span>
                    {session.notes && (
                      <span className="text-[11px] text-text/60 italic block mt-0.5">
                        Notes: {session.notes}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 sm:mt-0 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditSession?.(session)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent text-[11px] font-bold rounded-xl transition-all active:scale-95"
                      title="Edit this session"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateSession?.(session)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-accent text-white hover:bg-accent/90 text-[11px] font-bold rounded-xl transition-all active:scale-95 shadow-sm"
                      title="Duplicate this session"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicate</span>
                    </button>
                  </div>
                </div>

                {/* Exercises logged */}
                <div className="flex flex-wrap gap-4">
                  {session.exercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="bg-card p-3 rounded-2xl border border-muted-border/30 flex-1 min-w-[200px]"
                    >
                      <div className="text-xs font-semibold text-text mb-1 flex items-center gap-1.5">
                        <Dumbbell className="w-3.5 h-3.5 text-accent/50" />
                        <span>{ex.exerciseName}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[10px] text-text/50 font-mono">
                        {ex.sets.map((s, idx) => (
                          <span
                             key={s.id}
                             className="bg-warm p-1 px-2.5 rounded-lg border border-muted-border/20"
                          >
                            Set {idx + 1}: <b className="text-text font-bold">{s.weight}kg</b> x {s.reps}r
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
