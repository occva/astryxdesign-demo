import {useEffect, useMemo, useRef, useState} from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  PanOnScrollMode,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react';
import ELK from 'elkjs/lib/elk.bundled.js';
import type {ElkNode} from 'elkjs/lib/elk-api';
import {UserCircle} from '@phosphor-icons/react';
import {Text} from '@cloudflare/kumo/components/text';
import type {DepartmentMember, DepartmentNode} from '../types';
import {StatusBadge} from './kumo-ui';

export type OrganizationFlowLabels = {
  canvasAriaLabel: string;
  expand: string;
  collapse: string;
  owner: string;
  directMembers: string;
  totalMembers: string;
  enabled: string;
  disabled: string;
  employee: string;
  noJobTitle: string;
  enabledPerson: string;
  disabledPerson: string;
  zoomIn: string;
  zoomOut: string;
  fitView: string;
};

type DepartmentData = {
  department: DepartmentNode;
  hasDescendants: boolean;
  expanded: boolean;
  labels: OrganizationFlowLabels;
  onToggle: (id: string) => void;
};

type PersonData = {
  person: DepartmentMember;
  labels: OrganizationFlowLabels;
};

type JunctionData = {
  departmentId: string;
  count: number;
  expanded: boolean;
  labels: OrganizationFlowLabels;
  onToggle: (id: string) => void;
};

type DepartmentFlowNode = Node<DepartmentData, 'department'>;
type PersonFlowNode = Node<PersonData, 'person'>;
type JunctionFlowNode = Node<JunctionData, 'junction'>;
type OrganizationNode = DepartmentFlowNode | PersonFlowNode | JunctionFlowNode;

const DEPARTMENT_WIDTH = 272;
const DEPARTMENT_HEIGHT = 108;
const PERSON_WIDTH = 232;
const PERSON_HEIGHT = 78;
const JUNCTION_SIZE = 24;
const elk = new ELK();

function DepartmentCard({data}: NodeProps<DepartmentFlowNode>) {
  const {department, hasDescendants, expanded, labels, onToggle} = data;
  const toggle = () => {
    if (hasDescendants) onToggle(department.id);
  };
  return (
    <article
      className={`organization-flow-department ${hasDescendants ? 'is-expandable nodrag nopan' : ''}`}
      role={hasDescendants ? 'button' : undefined}
      tabIndex={hasDescendants ? 0 : undefined}
      aria-expanded={hasDescendants ? expanded : undefined}
      aria-label={hasDescendants ? `${department.name} · ${expanded ? labels.collapse : labels.expand}` : undefined}
      onKeyDown={event => {
        if (!hasDescendants || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        toggle();
      }}
    >
      <Handle type="target" position={Position.Left} className="organization-flow-handle" />
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <Text as="h3" bold truncate>{department.name}</Text>
          {department.code ? <Text as="p" size="sm" variant="secondary" truncate>{department.code}</Text> : null}
        </div>
        <StatusBadge tone={department.status === 'enabled' ? 'success' : 'neutral'}>
          {department.status === 'enabled' ? labels.enabled : labels.disabled}
        </StatusBadge>
      </div>
      <dl className="organization-flow-metrics">
        <div className="min-w-0">
          <dt>{labels.owner}</dt>
          <dd className="truncate">{department.owner || '—'}</dd>
        </div>
        <div>
          <dt>{labels.directMembers}</dt>
          <dd>{department.members}</dd>
        </div>
        <div>
          <dt>{labels.totalMembers}</dt>
          <dd>{department.totalMembers}</dd>
        </div>
      </dl>
      {hasDescendants ? <Handle type="source" position={Position.Right} className="organization-flow-handle" /> : null}
    </article>
  );
}

function PersonCard({data}: NodeProps<PersonFlowNode>) {
  const {person, labels} = data;
  return (
    <article className="organization-flow-person">
      <Handle type="target" position={Position.Left} className="organization-flow-handle" />
      <div className="organization-flow-avatar" aria-hidden="true">
        {person.avatarUrl ? <img src={person.avatarUrl} alt="" draggable={false} /> : <UserCircle weight="duotone" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <Text as="h4" bold truncate>{person.name}</Text>
          <StatusBadge tone={person.status === 'normal' ? 'success' : 'neutral'}>
            {person.status === 'normal' ? labels.enabledPerson : labels.disabledPerson}
          </StatusBadge>
        </div>
        <Text as="p" size="sm" variant="secondary" truncate>{person.jobTitle || labels.noJobTitle}</Text>
        <Text as="p" size="sm" variant="secondary" truncate>
          {labels.employee} · {person.employeeNo || person.account}
        </Text>
      </div>
    </article>
  );
}

function JunctionNode({data}: NodeProps<JunctionFlowNode>) {
  return (
    <div className="organization-flow-junction">
      <Handle type="target" position={Position.Left} className="organization-flow-handle" />
      <button
        type="button"
        className={`organization-flow-toggle nodrag nopan ${data.expanded ? 'is-expanded' : ''}`}
        aria-label={data.expanded ? data.labels.collapse : data.labels.expand}
        aria-expanded={data.expanded}
        onClick={() => data.onToggle(data.departmentId)}
      >
        {data.count}
      </button>
      {data.expanded ? <Handle type="source" position={Position.Right} className="organization-flow-handle" /> : null}
    </div>
  );
}

const nodeTypes = {
  department: DepartmentCard,
  person: PersonCard,
  junction: JunctionNode,
} satisfies NodeTypes;

function visibleGraph(
  departments: DepartmentNode[],
  expanded: Set<string>,
  labels: OrganizationFlowLabels,
  onToggle: (id: string) => void,
) {
  const nodes: OrganizationNode[] = [];
  const edges: Edge[] = [];

  const addDepartment = (department: DepartmentNode, parentId?: string) => {
    const departmentId = `department:${department.id}`;
    const junctionId = `junction:${department.id}`;
    const descendantCount = department.children.length + department.people.length;
    nodes.push({
      id: departmentId,
      type: 'department',
      position: {x: 0, y: 0},
      data: {
        department,
        hasDescendants: descendantCount > 0,
        expanded: expanded.has(department.id),
        labels,
        onToggle,
      },
      style: {width: DEPARTMENT_WIDTH, height: DEPARTMENT_HEIGHT},
    });
    if (parentId) {
      edges.push({id: `${parentId}->${departmentId}`, source: parentId, target: departmentId, type: 'smoothstep'});
    }
    if (!descendantCount) return;
    nodes.push({
      id: junctionId,
      type: 'junction',
      position: {x: 0, y: 0},
      data: {departmentId: department.id, count: descendantCount, expanded: expanded.has(department.id), labels, onToggle},
      style: {width: JUNCTION_SIZE, height: JUNCTION_SIZE},
    });
    edges.push({id: `${departmentId}->${junctionId}`, source: departmentId, target: junctionId, type: 'smoothstep'});
    if (!expanded.has(department.id)) return;
    for (const child of department.children) addDepartment(child, junctionId);
    for (const person of department.people) {
      const personId = `person:${person.id}`;
      nodes.push({
        id: personId,
        type: 'person',
        position: {x: 0, y: 0},
        data: {person, labels},
        style: {width: PERSON_WIDTH, height: PERSON_HEIGHT},
      });
      edges.push({id: `${junctionId}->${personId}`, source: junctionId, target: personId, type: 'smoothstep'});
    }
  };

  departments.forEach(department => addDepartment(department));
  return {nodes, edges};
}

async function layoutGraph(nodes: OrganizationNode[], edges: Edge[]) {
  const graph: ElkNode = {
    id: 'organization',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.spacing.nodeNode': '28',
      'elk.layered.spacing.nodeNodeBetweenLayers': '76',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.padding': '[top=48,left=48,bottom=48,right=48]',
    },
    children: nodes.map(node => ({
      id: node.id,
      width: node.type === 'department' ? DEPARTMENT_WIDTH : node.type === 'person' ? PERSON_WIDTH : JUNCTION_SIZE,
      height: node.type === 'department' ? DEPARTMENT_HEIGHT : node.type === 'person' ? PERSON_HEIGHT : JUNCTION_SIZE,
    })),
    edges: edges.map(edge => ({id: edge.id, sources: [edge.source], targets: [edge.target]})),
  };
  const result = await elk.layout(graph);
  const positions = new Map(result.children?.map(node => [node.id, {x: node.x ?? 0, y: node.y ?? 0}]) ?? []);
  return nodes.map(node => ({...node, position: positions.get(node.id) ?? node.position}));
}

function OrganizationFlowCanvas({
  items,
  expanded,
  labels,
  onToggle,
}: {
  items: DepartmentNode[];
  expanded: Set<string>;
  labels: OrganizationFlowLabels;
  onToggle: (id: string) => void;
}) {
  const [nodes, setNodes] = useState<OrganizationNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const didInitialFit = useRef(false);
  const {fitView} = useReactFlow<OrganizationNode, Edge>();
  const graph = useMemo(() => visibleGraph(items, expanded, labels, onToggle), [items, expanded, labels, onToggle]);

  useEffect(() => {
    let active = true;
    layoutGraph(graph.nodes, graph.edges).then(layoutedNodes => {
      if (!active) return;
      setNodes(layoutedNodes);
      setEdges(graph.edges);
      if (!didInitialFit.current) {
        didInitialFit.current = true;
        window.setTimeout(() => void fitView({padding: 0.15, duration: 260, maxZoom: 1}), 0);
      }
    });
    return () => {
      active = false;
    };
  }, [fitView, graph]);

  return (
    <ReactFlow<OrganizationNode, Edge>
      aria-label={labels.canvasAriaLabel}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      onNodeClick={(_event, node) => {
        if (node.type === 'department' && node.data.hasDescendants) {
          onToggle(node.data.department.id);
        }
      }}
      panOnDrag
      panOnScroll
      panOnScrollMode={PanOnScrollMode.Free}
      zoomOnScroll={false}
      zoomOnPinch
      zoomOnDoubleClick={false}
      minZoom={0.35}
      maxZoom={1.6}
      preventScrolling
      proOptions={{hideAttribution: true}}
      defaultEdgeOptions={{
        type: 'smoothstep',
        style: {stroke: 'var(--organization-flow-line)', strokeWidth: 1.25},
      }}
    >
      <Background variant={BackgroundVariant.Lines} gap={24} size={1} color="var(--organization-flow-grid)" />
      <Controls
        showInteractive={false}
        aria-label={labels.canvasAriaLabel}
        fitViewOptions={{padding: 0.15, maxZoom: 1}}
      />
    </ReactFlow>
  );
}

export function OrganizationFlow(props: {
  items: DepartmentNode[];
  expanded: Set<string>;
  labels: OrganizationFlowLabels;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="organization-flow">
      <ReactFlowProvider>
        <OrganizationFlowCanvas {...props} />
      </ReactFlowProvider>
    </div>
  );
}
