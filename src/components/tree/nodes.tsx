"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Avatar } from "@/components/Avatar";
import { CARD_HEIGHT, CARD_WIDTH, JUNCTION_SIZE } from "@/lib/tree-layout";
import { fullName, lifespan } from "@/lib/person-utils";
import type { Person } from "@/lib/types";

export type PersonNodeData = {
  person: Person;
  selected: boolean;
  dimmed: boolean;
  matched: boolean;
};
export type PersonFlowNode = Node<PersonNodeData, "person">;

const hidden = "!h-1 !w-1 !border-0 !bg-transparent !opacity-0";

export function PersonCardNode({ data }: NodeProps<PersonFlowNode>) {
  const { person, selected, dimmed, matched } = data;
  return (
    <div
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      className={[
        "group flex cursor-pointer items-center gap-3 rounded-2xl border bg-card px-3 shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md",
        selected
          ? "border-accent ring-2 ring-accent/40 shadow-md"
          : matched
            ? "border-accent/70 ring-2 ring-accent/25"
            : "border-line",
        dimmed ? "opacity-35" : "opacity-100",
      ].join(" ")}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} className={hidden} />
      <Handle type="source" id="as" position={Position.Top} isConnectable={false} className={hidden} />
      <Handle type="target" id="at" position={Position.Top} isConnectable={false} className={hidden} />
      <Handle type="target" id="l" position={Position.Left} isConnectable={false} className={hidden} />
      <Handle type="source" id="r" position={Position.Right} isConnectable={false} className={hidden} />
      <Handle type="source" position={Position.Bottom} isConnectable={false} className={hidden} />
      <Avatar person={person} size={60} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-[15px] font-semibold leading-tight text-ink">
          {person.firstName}
        </p>
        <p className="truncate font-serif text-[15px] leading-tight text-ink/80">{person.lastName}</p>
        <p className="mt-1 truncate text-xs text-muted">
          {lifespan(person) || "\u00a0"}
        </p>
      </div>
      <span className="sr-only">{fullName(person)}</span>
    </div>
  );
}

export type JunctionNodeData = { dimmed: boolean };
export type JunctionFlowNode = Node<JunctionNodeData, "junction">;

export function JunctionDotNode({ data }: NodeProps<JunctionFlowNode>) {
  return (
    <div
      style={{ width: JUNCTION_SIZE, height: JUNCTION_SIZE }}
      className={`rounded-full bg-edge transition-opacity ${data.dimmed ? "opacity-30" : ""}`}
    >
      <Handle type="source" position={Position.Bottom} isConnectable={false} className={hidden} />
    </div>
  );
}
