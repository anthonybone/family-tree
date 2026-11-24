"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { fullName, lifespan } from "@/lib/person-utils";
import { buildRelations, lineageOf } from "@/lib/relations";
import { CARD_HEIGHT, CARD_WIDTH, layoutFamily } from "@/lib/tree-layout";
import type { FamilyData } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { JunctionDotNode, PersonCardNode } from "./nodes";
import { PersonPanel } from "./PersonPanel";

const nodeTypes = { person: PersonCardNode, junction: JunctionDotNode };
const EDGE = "#b9a99a";
const EDGE_ACCENT = "#b5573a";

const chip =
  "shrink-0 rounded-full border border-line bg-card px-3 py-1 text-sm text-ink transition hover:border-accent hover:text-accent";
const chipActive = "!border-accent !bg-accent !text-white";

function setHash(id: string | null) {
  const url = window.location.pathname + window.location.search + (id ? `#${id}` : "");
  window.history.replaceState(window.history.state, "", url);
}

function TreeCanvas({ data }: { data: FamilyData }) {
  const { setCenter, fitView, getViewport } = useReactFlow();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeGen, setActiveGen] = useState(0);

  const layout = useMemo(() => layoutFamily(data), [data]);
  const relations = useMemo(() => buildRelations(data), [data]);
  const peopleById = useMemo(() => new Map(data.people.map((p) => [p.id, p])), [data]);
  const lineage = useMemo(
    () => (selectedId ? lineageOf(selectedId, relations) : null),
    [selectedId, relations],
  );

  const generationLabels = useMemo(
    () =>
      layout.generations.map((g) => {
        const years = g.personIds
          .map((id) => peopleById.get(id)?.birthDate?.slice(0, 4))
          .filter((y): y is string => Boolean(y))
          .sort();
        const range = years.length ? (years[0] === years.at(-1) ? years[0] : `${years[0]}–${years.at(-1)}`) : "";
        return { index: g.index, range };
      }),
    [layout, peopleById],
  );

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return [];
    return data.people
      .filter((p) => `${fullName(p)} ${p.birthPlace ?? ""}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [q, data.people]);
  const matchedIds = useMemo(() => new Set(results.map((p) => p.id)), [results]);

  const size = () => ({
    w: wrapRef.current?.clientWidth ?? window.innerWidth,
    h: wrapRef.current?.clientHeight ?? window.innerHeight,
  });

  /** A readable overview: cards stay legible, the tree is centred, and the top row is in view. */
  const goHome = useCallback(
    (duration = 500) => {
      const { w, h } = size();
      const zoom = w < 640 ? 0.5 : 0.6;
      const fitsVertically = layout.height * zoom <= h;
      void setCenter(
        layout.width / 2,
        fitsVertically ? layout.height / 2 : h / 2 / zoom,
        { zoom, duration },
      );
    },
    [layout, setCenter],
  );

  const focus = useCallback(
    (id: string, duration = 600) => {
      setSelectedId(id);
      setQuery("");
      setHash(id);
      const n = layout.persons.find((p) => p.id === id);
      if (!n) return;
      // Shift the view so the card lands in the area not covered by the details panel.
      const { w, h } = size();
      const zoom = 1;
      const desktop = w >= 768;
      void setCenter(
        n.x + CARD_WIDTH / 2 + (desktop ? 200 / zoom : 0),
        n.y + CARD_HEIGHT / 2 + (desktop ? 0 : (0.275 * h) / zoom),
        { zoom, duration },
      );
    },
    [setCenter, layout],
  );

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setHash(null);
  }, []);

  const goToGeneration = (index: number) => {
    const vp = getViewport();
    const { w } = size();
    const zoom = Math.max(vp.zoom, 0.6);
    void setCenter((w / 2 - vp.x) / vp.zoom, layout.generations[index].y + CARD_HEIGHT / 2, {
      zoom,
      duration: 500,
    });
    setActiveGen(index);
  };

  const fitLineage = () => {
    if (!lineage) return;
    void fitView({
      nodes: [...lineage].map((id) => ({ id })),
      padding: 0.15,
      minZoom: 0.3,
      maxZoom: 0.9,
      duration: 600,
    });
  };

  const onMoveEnd = useCallback(
    (_: unknown, vp: Viewport) => {
      const { h } = size();
      const cy = (h / 2 - vp.y) / vp.zoom;
      let best = 0;
      layout.generations.forEach((g, i) => {
        const d = Math.abs(g.y + CARD_HEIGHT / 2 - cy);
        if (d < Math.abs(layout.generations[best].y + CARD_HEIGHT / 2 - cy)) best = i;
      });
      setActiveGen(best);
    },
    [layout],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !query) clearSelection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [query, clearSelection]);

  // Restore the person from the URL hash (e.g. returning from a profile page).
  const focusFromHash = useCallback(
    (duration: number) => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id && peopleById.has(id)) {
        focus(id, duration);
        return true;
      }
      return false;
    },
    [peopleById, focus],
  );
  const onInit = useCallback(() => {
    if (!focusFromHash(0)) goHome(0);
  }, [focusFromHash, goHome]);

  useEffect(() => {
    const onHashChange = () => {
      focusFromHash(500);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [focusFromHash]);

  const nodes = useMemo<Node[]>(() => {
    const person = layout.persons.map((n) => ({
      id: n.id,
      type: "person",
      position: { x: n.x, y: n.y },
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      draggable: false,
      data: {
        person: peopleById.get(n.id)!,
        selected: n.id === selectedId,
        dimmed: lineage ? !lineage.has(n.id) : q ? !matchedIds.has(n.id) : false,
        matched: Boolean(q) && matchedIds.has(n.id),
      },
    }));
    const junction = layout.junctions.map((j) => ({
      id: j.id,
      type: "junction",
      position: { x: j.x, y: j.y },
      draggable: false,
      selectable: false,
      data: { dimmed: lineage ? !j.parents.every((p) => lineage.has(p)) : false },
    }));
    return [...junction, ...person];
  }, [layout, peopleById, selectedId, lineage, q, matchedIds]);

  const edges = useMemo<Edge[]>(
    () =>
      layout.edges.map((e) => {
        const active = lineage ? e.persons.every((p) => lineage.has(p)) : true;
        const highlighted = Boolean(lineage) && active;
        const isSpouse = e.kind === "spouse";
        const style = {
          stroke: highlighted ? EDGE_ACCENT : EDGE,
          strokeWidth: highlighted ? 2.5 : 2,
          opacity: active ? 1 : 0.2,
        };
        if (e.arc) {
          return {
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: "as",
            targetHandle: "at",
            type: "smoothstep",
            selectable: false,
            pathOptions: { offset: 34, borderRadius: 16 },
            style: { ...style, strokeDasharray: "6 5" },
          } as Edge;
        }
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: isSpouse ? "r" : undefined,
          targetHandle: isSpouse ? "l" : undefined,
          type: isSpouse ? "straight" : "smoothstep",
          selectable: false,
          style,
        } satisfies Edge;
      }),
    [layout, lineage],
  );

  return (
    <div className="flex h-dvh flex-col">
      <header className="z-30 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line bg-card/90 px-4 py-3 backdrop-blur md:px-8">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink">The Whitlock Family</h1>
          <p className="text-xs text-muted">{data.people.length} people</p>
        </div>
        <div className="relative ml-auto w-full max-w-sm sm:w-80">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) focus(results[0].id);
              if (e.key === "Escape") setQuery("");
            }}
            placeholder="Search family members…"
            aria-label="Search family members"
            className="w-full rounded-full border border-line bg-paper px-4 py-2 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {q && (
            <ul className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-line bg-card p-1 shadow-xl">
              {results.length === 0 && <li className="px-3 py-2 text-sm text-muted">No matches</li>}
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => focus(p.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-paper"
                  >
                    <Avatar person={p} size={32} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">{fullName(p)}</span>
                      <span className="block truncate text-xs text-muted">{lifespan(p)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <nav aria-label="Editing" className="flex items-center gap-2 text-sm">
          <Link
            href="/person/new"
            className="rounded-full bg-accent px-4 py-2 font-medium text-white transition hover:bg-accent-dark"
          >
            + Add person
          </Link>
        </nav>
      </header>

      <div
        role="toolbar"
        aria-label="Tree navigation"
        className="z-20 flex items-center gap-2 overflow-x-auto border-b border-line bg-paper px-4 py-2 [scrollbar-width:none] md:px-8 [&::-webkit-scrollbar]:hidden"
      >
        <button type="button" className={chip} onClick={() => goHome()}>
          Overview
        </button>
        <button type="button" className={chip} onClick={() => void fitView({ padding: 0.08, duration: 600 })}>
          Fit all
        </button>
        <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-line" />
        {generationLabels.map((g) => (
          <button
            key={g.index}
            type="button"
            title={g.range ? `Born ${g.range}` : undefined}
            aria-pressed={activeGen === g.index}
            className={`${chip} ${activeGen === g.index ? chipActive : ""}`}
            onClick={() => goToGeneration(g.index)}
          >
            Gen {g.index + 1}
            {g.range && <span className="ml-1 hidden text-xs opacity-70 lg:inline">{g.range}</span>}
          </button>
        ))}
        {selectedId && (
          <>
            <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-line" />
            <button type="button" className={chip} onClick={fitLineage}>
              Fit lineage
            </button>
            <button type="button" className={chip} onClick={clearSelection}>
              Clear
            </button>
          </>
        )}
      </div>

      <div ref={wrapRef} className="relative min-h-0 flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onInit={onInit}
          onMoveEnd={onMoveEnd}
          minZoom={0.08}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          onNodeClick={(_, node) => node.type === "person" && focus(node.id)}
          onPaneClick={clearSelection}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#e2d8cc" />
          <Controls showInteractive={false} position="bottom-left" />
          <MiniMap
            pannable
            zoomable
            position="bottom-right"
            className="!hidden md:!block"
            maskColor="rgba(250,247,242,0.7)"
            nodeColor="#d9c3ae"
          />
        </ReactFlow>

        {selectedId && peopleById.get(selectedId) && (
          <PersonPanel
            person={peopleById.get(selectedId)!}
            relations={relations.get(selectedId)!}
            peopleById={peopleById}
            onSelect={focus}
            onClose={clearSelection}
          />
        )}
      </div>
    </div>
  );
}

export function FamilyTreeApp({ data }: { data: FamilyData }) {
  return (
    <ReactFlowProvider>
      <TreeCanvas data={data} />
    </ReactFlowProvider>
  );
}
