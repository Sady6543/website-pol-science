"use client";

import React, { useState, useEffect, useRef } from "react";
import { GlobalShell } from "@/components/global-shell";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import {
  Layers,
  HelpCircle,
  Users,
  Compass,
  FileText,
  RotateCw,
  Plus,
  Trash2,
  Save,
  Check,
  ChevronRight,
  Loader2
} from "lucide-react";

type StudyTab = "flashcards" | "mindmap" | "databases";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  topic: string;
  next_review_at: string;
  interval_days: number;
  ease_factor: number;
}

interface MindMapNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface MindMapEdge {
  id: string;
  source: string;
  target: string;
}



export default function StudyPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<StudyTab>("flashcards");
  const [loading, setLoading] = useState(true);

  // --- FLASHCARDS STATES ---
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [newTopic, setNewTopic] = useState("IR Theory");

  // --- MIND MAP STATES ---
  const [nodes, setNodes] = useState<MindMapNode[]>([
    { id: "1", label: "Realism", x: 150, y: 150 },
    { id: "2", label: "Classical Realism", x: 320, y: 80 },
    { id: "3", label: "Structural Realism", x: 320, y: 220 }
  ]);
  const [edges, setEdges] = useState<MindMapEdge[]>([
    { id: "e1", source: "1", target: "2" },
    { id: "e2", source: "1", target: "3" }
  ]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const [editingNodeLabel, setEditingNodeLabel] = useState("");
  const [mapTitle, setMapTitle] = useState("IR Theories Core");

  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  // --- DATABASES SEED DATA ---
  const thinkers = [
    { name: "Max Weber", era: "Modern (1864 - 1920)", texts: ["Politics as a Vocation"], idea: "Defined the State by its monopoly on the legitimate use of physical force in a given territory." },
    { name: "Hans Morgenthau", era: "Classical Realist (1904 - 1980)", texts: ["Politics Among Nations"], idea: "Stated that politics is governed by objective laws rooted in human nature, defining interest as power." },
    { name: "Kenneth Waltz", era: "Structural Realist (1924 - 2013)", texts: ["Theory of International Politics"], idea: "Pioneered Neorealism; argued that structural anarchy forces states into defensive security competition." }
  ];

  const pyqs = [
    { year: 2025, exam: "Civil Services Exam", question: "Critically analyze how Thucydides' Trap explains contemporary security dilemmas in the Asia-Pacific." },
    { year: 2024, exam: "UPSC Pol Sci", question: "Evaluate the role of non-alignment and strategic autonomy in India's current multi-aligned foreign policy." }
  ];

  const constitutionArticles = [
    { article: "Article 1", summary: "Name and territory of the Union. India, that is Bharat, shall be a Union of States." },
    { article: "Article 14", summary: "Equality before law. Prohibits state discrimination on grounds of religion, race, caste, sex, or birth place." },
    { article: "Article 19", summary: "Protection of certain rights regarding freedom of speech, assembly, associations, movement, residence, and profession." },
    { article: "Article 21", summary: "Protection of life and personal liberty. No person shall be deprived of his life except according to procedure established by law." }
  ];

  const irTheories = [
    { theory: "Realism", core: "Anarchy, state-centric survival, security dilemmas, balance of power, polarity dynamics." },
    { theory: "Liberalism", core: "Cooperation via international institutions, economic interdependence, democratic peace theory." },
    { theory: "Constructivism", core: "International relations are socially constructed; identities and social norms shape state interests." }
  ];

  // LEITNER FLASHCARDS SEEDING
  const seedFlashcards = async () => {
    if (!user) return;
    try {
      const defaultCards = [
        { front: "What is the core argument of Structural Realism (Neorealism)?", back: "States seek survival in an anarchic system. Power distribution (polarity) determines international outcomes, not human nature.", topic: "IR Theory" },
        { front: "Define Thucydides' Trap.", back: "A security dilemma where a rising power threatens to displace an established hegemon, frequently leading to war.", topic: "IR Theory" },
        { front: "What is Article 370 of the Indian Constitution (historically)?", back: "A temporary provision granting special autonomous status to Jammu and Kashmir. Revoked in 2019.", topic: "Indian Constitution" },
        { front: "Who wrote 'Politics as a Vocation' and what is his definition of the state?", back: "Max Weber. Defined the state as a human community that successfully claims a monopoly of the legitimate use of physical force within a given territory.", topic: "Political Thinkers" }
      ];

      const payloads = defaultCards.map((c) => ({
        user_id: user.id,
        front: c.front,
        back: c.back,
        topic: c.topic,
        next_review_at: new Date().toISOString(),
        interval_days: 1,
        ease_factor: 2.5
      }));

      await supabase.from("flashcards").insert(payloads);
    } catch (err) {
      console.warn("Flashcards default seeding failed:", err);
    }
  };

  const fetchFlashcards = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .order("next_review_at", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        await seedFlashcards();
        const { data: refetched } = await supabase
          .from("flashcards")
          .select("*")
          .order("next_review_at", { ascending: true });
        setFlashcards(refetched || []);
      } else {
        setFlashcards(data);
      }
    } catch (err) {
      console.error("Flashcards loading failure:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        fetchFlashcards();
      }, 0);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // SM-2 Spaced Repetition Grading logic
  const handleGradeCard = async (score: number) => {
    if (!user || flashcards.length === 0) return;
    const card = flashcards[currentCardIndex];

    let newInterval = card.interval_days;
    let newEase = card.ease_factor;

    if (score < 3) {
      // Again/Hard resets
      newInterval = 1;
      newEase = Math.max(1.3, card.ease_factor - 0.2);
    } else {
      if (card.interval_days === 1) {
        newInterval = 3;
      } else {
        newInterval = Math.round(card.interval_days * card.ease_factor);
      }
      if (score === 5) {
        newEase = card.ease_factor + 0.15;
      }
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + newInterval);

    try {
      const { error } = await supabase
        .from("flashcards")
        .update({
          next_review_at: nextDate.toISOString(),
          interval_days: newInterval,
          ease_factor: newEase
        })
        .eq("id", card.id);

      if (error) throw error;

      // Update state queue
      setFlashcards((prev) =>
        prev.map((c) =>
          c.id === card.id
            ? { ...c, next_review_at: nextDate.toISOString(), interval_days: newInterval, ease_factor: newEase }
            : c
        )
      );

      // Move next
      setIsFlipped(false);
      setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
    } catch (err) {
      console.error("Card scheduling update error:", err);
    }
  };

  const handleAddNewCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFront.trim() || !newBack.trim()) return;

    try {
      const { data, error } = await supabase
        .from("flashcards")
        .insert({
          user_id: user.id,
          front: newFront.trim(),
          back: newBack.trim(),
          topic: newTopic,
          next_review_at: new Date().toISOString(),
          interval_days: 1,
          ease_factor: 2.5
        })
        .select()
        .single();

      if (error) throw error;
      setFlashcards((prev) => [data, ...prev]);
      setNewFront("");
      setNewBack("");
      setAddingCard(false);
      setCurrentCardIndex(0);
    } catch (err) {
      console.error("Card addition failed:", err);
    }
  };

  // --- MIND MAP CANVAS HANDLERS ---
  const handleAddNode = () => {
    const newId = `${Date.now()}`;
    const newNode: MindMapNode = {
      id: newId,
      label: `Concept_${nodes.length + 1}`,
      x: 200 + Math.random() * 50,
      y: 200 + Math.random() * 50
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newId);
    setEditingNodeLabel(newNode.label);
  };

  const handleNodeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (connectingNodeId) {
      // Connect nodes
      if (connectingNodeId !== id) {
        const edgeId = `e_${connectingNodeId}_${id}`;
        if (!edges.some((edge) => (edge.source === connectingNodeId && edge.target === id) || (edge.source === id && edge.target === connectingNodeId))) {
          setEdges((prev) => [...prev, { id: edgeId, source: connectingNodeId, target: id }]);
        }
      }
      setConnectingNodeId(null);
    } else {
      setSelectedNodeId(id);
      const node = nodes.find((n) => n.id === id);
      setEditingNodeLabel(node?.label || "");
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - rect.left, 20), rect.width - 20);
    const y = Math.min(Math.max(e.clientY - rect.top, 20), rect.height - 20);

    setNodes((prev) =>
      prev.map((n) => (n.id === draggingNodeId ? { ...n, x, y } : n))
    );
  };

  const handleRenameNode = () => {
    if (!selectedNodeId || !editingNodeLabel.trim()) return;
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNodeId ? { ...n, label: editingNodeLabel.trim() } : n))
    );
  };

  const handleDeleteNode = () => {
    if (!selectedNodeId) return;
    setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
    setEdges((prev) => prev.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const handleSaveMindmap = async () => {
    if (!user) return;
    try {
      const graph_data = { nodes, edges };
      const { error } = await supabase.from("mind_maps").upsert({
        user_id: user.id,
        title: mapTitle,
        graph_data,
        created_at: new Date().toISOString()
      }, { onConflict: "user_id, title" });
      
      if (error) throw error;
      alert("Mindmap saved successfully to cloud!");
    } catch (err) {
      console.error("Mindmap save error:", err);
    }
  };

  const loadMindmap = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("mind_maps")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setMapTitle(data.title);
        setNodes(data.graph_data.nodes || []);
        setEdges(data.graph_data.edges || []);
      }
    } catch (err) {
      console.error("Mindmap load error:", err);
    }
  };

  const activeCard = flashcards[currentCardIndex];

  return (
    <GlobalShell>
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
          <div className="flex flex-col gap-1">
            <span className="text-mono-sm text-accent-signal uppercase font-mono tracking-wider">
              Research Syllabus & Learning Center
            </span>
            <h1 className="text-display-lg font-display text-text-primary tracking-tight">
              Active Study Hub
            </h1>
            <p className="text-body-md text-text-secondary">
              Distraction-free spaced-repetition card drills, ideological canvases, and syllabus references.
            </p>
          </div>

          {/* Navigation Tab Links */}
          <div className="flex items-center gap-1.5 border border-border-subtle bg-bg-surface p-1 rounded font-mono">
            {[
              { id: "flashcards", label: "Drill Cards", icon: <Layers className="h-4 w-4" /> },
              { id: "mindmap", label: "Mindmap Canvas", icon: <Compass className="h-4 w-4" /> },
              { id: "databases", label: "Syllabus Index", icon: <FileText className="h-4 w-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as StudyTab)}
                className={`px-3 py-1.5 text-mono-sm font-mono uppercase rounded flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-accent-signal text-text-primary font-bold shadow"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && activeTab === "flashcards" ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-accent-signal" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* 1. FLASHCARDS Leitner Deck Workspace */}
            {activeTab === "flashcards" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Leitner Card Review Pane */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  {flashcards.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border-subtle p-16 text-center text-body-md text-text-secondary">
                      Your Leitner spaced-repetition queue is empty.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      
                      {/* Active Card Body */}
                      <div
                        onClick={() => setIsFlipped(!isFlipped)}
                        className={`min-h-[220px] rounded-xl border border-border-subtle bg-bg-surface p-8 flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-300 transform select-none relative overflow-hidden hover:border-accent-signal-muted shadow-elevation`}
                      >
                        <div className="absolute top-4 left-4 text-mono-sm text-text-tertiary font-mono uppercase">
                          Deck Queue · {currentCardIndex + 1} / {flashcards.length}
                        </div>
                        <div className="absolute top-4 right-4 text-mono-sm text-accent-signal font-mono uppercase bg-accent-signal-muted px-2 py-0.5 rounded">
                          {activeCard?.topic}
                        </div>

                        <div className="my-auto text-heading-md font-display font-medium text-text-primary max-w-xl">
                          {isFlipped ? activeCard?.back : activeCard?.front}
                        </div>

                        <span className="text-[10px] text-text-tertiary font-mono uppercase">
                          {isFlipped ? "Inspection Active · Click to flip front" : "Inspection Due · Click to reveal answer"}
                        </span>
                      </div>

                      {/* Grading Controls (Only visible when flipped) */}
                      {isFlipped ? (
                        <div className="grid grid-cols-4 gap-3 animate-[fadeIn_120ms_ease-out] font-mono">
                          {[
                            { score: 1, label: "Again", desc: "Reset (1d)", style: "border-data-negative hover:bg-data-negative/10 text-data-negative" },
                            { score: 3, label: "Hard", desc: "Review (2d)", style: "border-[#F59E0B] hover:bg-[#F59E0B]/10 text-[#F59E0B]" },
                            { score: 4, label: "Good", desc: "Pass (4d)", style: "border-accent-signal hover:bg-accent-signal-muted/50 text-accent-signal" },
                            { score: 5, label: "Easy", desc: "Clear (7d)", style: "border-data-positive hover:bg-data-positive/10 text-data-positive" }
                          ].map((g) => (
                            <button
                              key={g.score}
                              onClick={() => handleGradeCard(g.score)}
                              className={`flex flex-col items-center py-2.5 rounded border transition-all cursor-pointer ${g.style}`}
                            >
                              <span className="text-body-sm font-semibold">{g.label}</span>
                              <span className="text-[9px] uppercase mt-0.5">{g.desc}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsFlipped(true)}
                          className="w-full rounded bg-accent-signal text-text-primary py-3 text-body-sm font-semibold hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer font-mono"
                        >
                          <span>REVEAL KEY VALUE ANNOTATION</span>
                          <ChevronRight className="h-4.5 w-4.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Add new Card rail sidebar */}
                <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 flex flex-col gap-4">
                  <h3 className="text-body-md font-semibold text-text-primary border-b border-border-subtle/50 pb-2 flex items-center justify-between">
                    <span>Leitner Deck Actions</span>
                    <button
                      onClick={() => setAddingCard(!addingCard)}
                      className="rounded bg-bg-canvas border border-border-subtle p-1 hover:text-accent-signal hover:border-accent-signal transition-colors cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </h3>

                  {addingCard ? (
                    <form onSubmit={handleAddNewCard} className="flex flex-col gap-3 font-mono">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-text-secondary uppercase">Front Question</label>
                        <textarea
                          placeholder="What is the concept definition?"
                          value={newFront}
                          onChange={(e) => setNewFront(e.target.value)}
                          required
                          className="w-full h-16 rounded border border-border-subtle bg-bg-canvas p-2 text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-signal resize-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-text-secondary uppercase">Back Answer</label>
                        <textarea
                          placeholder="Core analytical takeaways"
                          value={newBack}
                          onChange={(e) => setNewBack(e.target.value)}
                          required
                          className="w-full h-20 rounded border border-border-subtle bg-bg-canvas p-2 text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-signal resize-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-text-secondary uppercase">Topic Category</label>
                        <input
                          type="text"
                          value={newTopic}
                          onChange={(e) => setNewTopic(e.target.value)}
                          className="w-full rounded border border-border-subtle bg-bg-canvas py-1 px-2 text-body-sm text-text-primary focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="rounded bg-accent-signal text-text-primary py-2 text-body-sm font-semibold hover:opacity-90 mt-1 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Check className="h-4 w-4" />
                        <span>Add to Leitner Deck</span>
                      </button>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-2 font-mono text-mono-sm text-text-secondary">
                      <p className="text-[11px] leading-relaxed text-text-tertiary">
                        Cards are queued utilizing Leitner boxes. Correct classifications automatically delay reviews; mistakes prompt immediate re-inspection.
                      </p>
                      <button
                        onClick={() => setAddingCard(true)}
                        className="w-full rounded border border-border-subtle bg-bg-canvas py-2 text-center text-body-sm font-semibold hover:text-accent-signal hover:border-accent-signal transition-colors cursor-pointer mt-2"
                      >
                        Create New Flashcard
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. CONCEPT MIND MAP CANVAS */}
            {activeTab === "mindmap" && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                
                {/* SVG node canvas (Left 3 columns) */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                  
                  {/* Canvas controller panel */}
                  <div className="flex items-center justify-between border border-border-subtle bg-bg-surface p-3 rounded-md font-mono">
                    <input
                      type="text"
                      value={mapTitle}
                      onChange={(e) => setMapTitle(e.target.value)}
                      className="bg-transparent border-b border-transparent focus:border-accent-signal text-body-sm font-bold text-text-primary focus:outline-none"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleAddNode}
                        className="rounded border border-border-subtle hover:border-accent-signal bg-bg-canvas hover:text-accent-signal px-3 py-1.5 text-mono-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>NODE</span>
                      </button>
                      <button
                        onClick={handleSaveMindmap}
                        className="rounded border border-border-subtle hover:border-accent-signal bg-bg-canvas hover:text-accent-signal px-3 py-1.5 text-mono-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>SAVE MAP</span>
                      </button>
                      <button
                        onClick={loadMindmap}
                        className="rounded border border-border-subtle hover:border-accent-signal bg-bg-canvas hover:text-accent-signal px-3 py-1.5 text-mono-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        <span>LOAD MAP</span>
                      </button>
                    </div>
                  </div>

                  {/* SVG drawing canvas */}
                  <div
                    ref={canvasRef}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={() => setDraggingNodeId(null)}
                    className="relative w-full h-[400px] border border-border-subtle rounded-xl bg-[#090C11] overflow-hidden select-none"
                  >
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {/* Grid background dots */}
                      <defs>
                        <pattern id="canvas-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                          <circle cx="3" cy="3" r="1" fill="#141923" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#canvas-grid)" />

                      {/* Linking line edges */}
                      {edges.map((edge) => {
                        const src = nodes.find((n) => n.id === edge.source);
                        const tgt = nodes.find((n) => n.id === edge.target);
                        if (!src || !tgt) return null;
                        return (
                          <line
                            key={edge.id}
                            x1={src.x}
                            y1={src.y}
                            x2={tgt.x}
                            y2={tgt.y}
                            stroke="#1E293B"
                            strokeWidth="2"
                            strokeDasharray="4"
                          />
                        );
                      })}
                    </svg>

                    {/* Nodes elements */}
                    {nodes.map((node) => {
                      const isSelected = selectedNodeId === node.id;
                      const isConnecting = connectingNodeId === node.id;
                      return (
                        <div
                          key={node.id}
                          onMouseDown={(e) => {
                            if (e.button === 0) {
                              setDraggingNodeId(node.id);
                              setSelectedNodeId(node.id);
                              setEditingNodeLabel(node.label);
                            }
                          }}
                          onClick={(e) => handleNodeClick(e, node.id)}
                          style={{
                            left: `${node.x}px`,
                            top: `${node.y}px`,
                            transform: "translate(-50%, -50%)"
                          }}
                          className={`absolute z-10 rounded px-3 py-1.5 border font-mono text-body-sm font-semibold select-none cursor-grab active:cursor-grabbing transition-colors text-center min-w-[90px] ${
                            isSelected
                              ? "bg-accent-signal text-text-primary border-accent-signal shadow-elevation"
                              : isConnecting
                              ? "bg-accent-signal-muted text-accent-signal border-accent-signal animate-pulse"
                              : "bg-bg-surface text-text-secondary border-border-subtle hover:text-text-primary hover:border-text-secondary"
                          }`}
                        >
                          {node.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Node property control sidebar (Right column) */}
                <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 flex flex-col gap-4 font-mono">
                  <h3 className="text-body-md font-semibold text-text-primary border-b border-border-subtle/50 pb-2">
                    Node Attributes
                  </h3>

                  {!selectedNodeId ? (
                    <p className="text-[11px] text-text-tertiary leading-relaxed">
                      Select or click a canvas node to adjust its labels, link edges, or delete conceptual blocks.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* Rename Field */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-text-secondary uppercase">Rename Node</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingNodeLabel}
                            onChange={(e) => setEditingNodeLabel(e.target.value)}
                            className="flex-1 rounded border border-border-subtle bg-bg-canvas py-1 px-2 text-body-sm text-text-primary focus:outline-none"
                          />
                          <button
                            onClick={handleRenameNode}
                            className="rounded bg-accent-signal text-text-primary px-2.5 py-1 text-mono-sm font-semibold hover:opacity-90 cursor-pointer"
                          >
                            Set
                          </button>
                        </div>
                      </div>

                      {/* Connect trigger */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-text-secondary uppercase">Relations</label>
                        <button
                          onClick={() => setConnectingNodeId(selectedNodeId)}
                          className="rounded border border-border-subtle bg-bg-canvas hover:text-accent-signal hover:border-accent-signal py-1.5 text-center text-body-sm font-semibold transition-colors cursor-pointer"
                        >
                          Link to other Node...
                        </button>
                      </div>

                      {/* Delete node */}
                      <button
                        onClick={handleDeleteNode}
                        className="rounded border border-data-negative text-data-negative hover:bg-data-negative/10 py-1.5 text-center text-body-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Node</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. SYLLABUS LIBRARIES */}
            {activeTab === "databases" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
                
                {/* Thinkers database card */}
                <div className="rounded-xl border border-border-subtle bg-bg-surface p-5">
                  <h3 className="text-mono-sm font-semibold uppercase text-text-primary flex items-center gap-1.5 border-b border-border-subtle/50 pb-2 mb-3">
                    <Users className="h-4.5 w-4.5 text-accent-signal" />
                    <span>Classical Thinkers catalog</span>
                  </h3>
                  <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
                    {thinkers.map((t, i) => (
                      <div key={i} className="flex flex-col p-2.5 rounded bg-bg-canvas border border-border-subtle/40">
                        <div className="flex items-center justify-between">
                          <span className="text-body-sm font-semibold text-text-primary">{t.name}</span>
                          <span className="text-[9px] text-text-tertiary uppercase">{t.era}</span>
                        </div>
                        <span className="text-[10px] text-accent-signal mt-1">Core Text: &ldquo;{t.texts.join(", ")}&rdquo;</span>
                        <p className="text-[11px] text-text-secondary mt-1.5 leading-relaxed">{t.idea}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* IR Theories */}
                <div className="rounded-xl border border-border-subtle bg-bg-surface p-5">
                  <h3 className="text-mono-sm font-semibold uppercase text-text-primary flex items-center gap-1.5 border-b border-border-subtle/50 pb-2 mb-3">
                    <Compass className="h-4.5 w-4.5 text-accent-signal" />
                    <span>IR Theories Grid</span>
                  </h3>
                  <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
                    {irTheories.map((t, i) => (
                      <div key={i} className="flex flex-col p-2.5 rounded bg-bg-canvas border border-border-subtle/40 gap-1">
                        <span className="text-body-sm font-semibold text-text-primary uppercase tracking-wide text-accent-signal">{t.theory}</span>
                        <p className="text-[11px] text-text-secondary leading-relaxed mt-1">{t.core}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Constitution Articles */}
                <div className="rounded-xl border border-border-subtle bg-bg-surface p-5">
                  <h3 className="text-mono-sm font-semibold uppercase text-text-primary flex items-center gap-1.5 border-b border-border-subtle/50 pb-2 mb-3">
                    <FileText className="h-4.5 w-4.5 text-accent-signal" />
                    <span>Constitution Articles</span>
                  </h3>
                  <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
                    {constitutionArticles.map((a, i) => (
                      <div key={i} className="flex flex-col p-2.5 rounded bg-bg-canvas border border-border-subtle/40">
                        <span className="text-body-sm font-bold text-text-primary border-b border-border-subtle/20 pb-1 max-w-fit">{a.article}</span>
                        <p className="text-[11px] text-text-secondary leading-relaxed mt-2">{a.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Previous Year Questions (PYQs) */}
                <div className="rounded-xl border border-border-subtle bg-bg-surface p-5">
                  <h3 className="text-mono-sm font-semibold uppercase text-text-primary flex items-center gap-1.5 border-b border-border-subtle/50 pb-2 mb-3">
                    <HelpCircle className="h-4.5 w-4.5 text-accent-signal" />
                    <span>Syllabus PYQ Bank</span>
                  </h3>
                  <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
                    {pyqs.map((q, i) => (
                      <div key={i} className="flex flex-col p-2.5 rounded bg-bg-canvas border border-border-subtle/40 gap-1.5">
                        <div className="flex justify-between items-center text-[9px] font-bold text-text-tertiary uppercase">
                          <span>{q.exam}</span>
                          <span>Year {q.year}</span>
                        </div>
                        <p className="text-body-sm italic text-text-secondary leading-relaxed">&ldquo;{q.question}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </GlobalShell>
  );
}
