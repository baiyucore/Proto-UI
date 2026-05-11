import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
  createSpecWorkspace,
  diffSpecSnapshots,
  getSpecSnapshot,
  type SpecSnapshot,
  type SpecSnapshotDiff,
} from '@proto.ui/spec-engine';
import { buildSpecGraph, type SpecGraph } from '@proto.ui/spec-graph';
import { SPEC_RELATION_KINDS, type SpecEntity } from '@proto.ui/spec-schema';

import './styles.css';

type Locale = 'zh' | 'en';

const UI_TEXT = {
  en: {
    loading: 'Loading spec workspace...',
    appTitle: 'Semantic Workspace',
    from: 'From',
    to: 'To',
    navLabel: 'Spec entities',
    entities: 'Entities',
    graphNodes: 'Graph Nodes',
    graphEdges: 'Graph Edges',
    criteria: 'Criteria',
    openQuestions: 'Open Questions',
    issues: 'Issues',
    id: 'ID',
    status: 'Status',
    since: 'Since',
    noEntity: 'No entity selected.',
    statement: 'Statement',
    rationale: 'Rationale',
    blocks: 'Blocks',
    note: 'Note',
    relationships: 'Relationships',
    relationKinds: {
      relates: 'Relates',
      dependsOn: 'Depends On',
      refines: 'Refines',
      satisfies: 'Satisfies',
      verifies: 'Verifies',
      explains: 'Explains',
      exercises: 'Exercises',
      requires: 'Requires',
      owns: 'Owns',
    },
    semanticDiff: 'Semantic Diff',
    added: 'Added',
    removed: 'Removed',
    revised: 'Revised',
    none: 'None',
    explicitRelations: 'Explicit relations',
    graphProjection: 'Graph Projection',
    noActiveEdges: 'No active edges in this snapshot.',
    validation: 'Validation',
    noIssues: 'No validation issues.',
    noOpenQuestions: 'No unresolved work items.',
    file: 'File',
    language: 'Language',
    entityTypes: {
      contract: 'Contracts',
      module: 'Modules',
      decision: 'Decisions',
      'host-cap': 'Host Capabilities',
      test: 'Tests',
      version: 'Versions',
      knowledge: 'Knowledge',
    },
  },
  zh: {
    loading: '正在加载 Spec Workspace...',
    appTitle: '语义工作台',
    from: '起始版本',
    to: '目标版本',
    navLabel: 'Spec 实体',
    entities: '实体',
    graphNodes: '图节点',
    graphEdges: '图关系',
    criteria: '判定准则',
    openQuestions: '断口',
    issues: '问题',
    id: 'ID',
    status: '状态',
    since: '引入版本',
    noEntity: '未选择实体。',
    statement: '契约陈述',
    rationale: '理由',
    blocks: '阻塞项',
    note: '备注',
    relationships: '实体关系',
    relationKinds: {
      relates: '关联',
      dependsOn: '依赖',
      refines: '细化',
      satisfies: '满足',
      verifies: '验证',
      explains: '解释',
      exercises: '演练',
      requires: '要求',
      owns: '拥有',
    },
    semanticDiff: '语义差异',
    added: '新增',
    removed: '移除',
    revised: '修订',
    none: '无',
    explicitRelations: '显式关系',
    graphProjection: '图谱投影',
    noActiveEdges: '当前快照没有有效关系。',
    validation: '校验',
    noIssues: '没有校验问题。',
    noOpenQuestions: '没有待解决断口。',
    file: '文件',
    language: '语言',
    entityTypes: {
      contract: '契约',
      module: '模块',
      decision: '决策',
      'host-cap': 'Host 能力',
      test: '测试',
      version: '版本',
      knowledge: '知识',
    },
  },
} as const;

type UiText = (typeof UI_TEXT)[Locale];

type SpecWorkspaceDataset = {
  generatedAt: string;
  versions: string[];
  latestVersion: string;
  entities: SpecEntity[];
  issues: Array<{ filePath?: string; message: string }>;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; dataset: SpecWorkspaceDataset }
  | { status: 'error'; message: string };

function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [locale, setLocale] = useState<Locale>('zh');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fromVersion, setFromVersion] = useState('0.1.0');
  const [toVersion, setToVersion] = useState('0.2.0');
  const t = UI_TEXT[locale];

  useEffect(() => {
    let active = true;

    fetch('/spec-workspace.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load spec dataset: ${response.status}`);
        return response.json() as Promise<SpecWorkspaceDataset>;
      })
      .then((dataset) => {
        if (!active) return;

        setLoadState({ status: 'ready', dataset });
        setSelectedId(dataset.entities[0]?.id ?? null);
        setFromVersion(dataset.versions[0] ?? dataset.latestVersion);
        setToVersion(dataset.latestVersion);
      })
      .catch((error) => {
        if (!active) return;
        setLoadState({
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      });

    return () => {
      active = false;
    };
  }, []);

  if (loadState.status === 'loading') return <main className="status-page">{t.loading}</main>;
  if (loadState.status === 'error') return <main className="status-page">{loadState.message}</main>;

  const dataset = loadState.dataset;
  const workspace = createSpecWorkspace(dataset.entities);
  const snapshot = getSpecSnapshot(workspace, toVersion);
  const diff = diffSpecSnapshots(getSpecSnapshot(workspace, fromVersion), snapshot);
  const graph = buildSpecGraph(snapshot);
  const selectedEntity =
    snapshot.entities.find((entity) => entity.id === selectedId) ?? snapshot.entities[0] ?? null;

  return (
    <WorkspaceView
      dataset={dataset}
      snapshot={snapshot}
      diff={diff}
      graph={graph}
      selectedEntity={selectedEntity}
      selectedId={selectedEntity?.id ?? null}
      locale={locale}
      t={t}
      fromVersion={fromVersion}
      toVersion={toVersion}
      onSelectEntity={setSelectedId}
      onSelectLocale={setLocale}
      onSelectFromVersion={setFromVersion}
      onSelectToVersion={setToVersion}
    />
  );
}

function WorkspaceView(props: {
  dataset: SpecWorkspaceDataset;
  snapshot: SpecSnapshot;
  diff: SpecSnapshotDiff;
  graph: SpecGraph;
  selectedEntity: SpecEntity | null;
  selectedId: string | null;
  locale: Locale;
  t: UiText;
  fromVersion: string;
  toVersion: string;
  onSelectEntity(id: string): void;
  onSelectLocale(locale: Locale): void;
  onSelectFromVersion(version: string): void;
  onSelectToVersion(version: string): void;
}) {
  const entityGroups = useMemo(
    () => groupEntitiesByType(props.snapshot.entities),
    [props.snapshot.entities]
  );
  const criteriaCount = props.snapshot.entities.reduce(
    (count, entity) => count + entity.criteria.length,
    0
  );
  const openQuestionCount = props.snapshot.entities.reduce(
    (count, entity) => count + entity.openQuestions.length,
    0
  );

  return (
    <main className="workspace-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div>
            <p className="eyebrow">Proto UI</p>
            <h1>{props.t.appTitle}</h1>
          </div>
          <span className="version-pill">{props.toVersion}</span>
        </div>

        <div className="language-control" aria-label={props.t.language}>
          <button
            className={props.locale === 'zh' ? 'active' : ''}
            type="button"
            onClick={() => props.onSelectLocale('zh')}
          >
            中文
          </button>
          <button
            className={props.locale === 'en' ? 'active' : ''}
            type="button"
            onClick={() => props.onSelectLocale('en')}
          >
            English
          </button>
        </div>

        <div className="version-controls">
          <label>
            <span>{props.t.from}</span>
            <select
              value={props.fromVersion}
              onChange={(event) => props.onSelectFromVersion(event.target.value)}
            >
              {props.dataset.versions.map((version) => (
                <option key={version}>{version}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{props.t.to}</span>
            <select
              value={props.toVersion}
              onChange={(event) => props.onSelectToVersion(event.target.value)}
            >
              {props.dataset.versions.map((version) => (
                <option key={version}>{version}</option>
              ))}
            </select>
          </label>
        </div>

        <nav className="entity-nav" aria-label={props.t.navLabel}>
          {Object.entries(entityGroups).map(([type, entities]) => (
            <section key={type}>
              <h2>
                {props.t.entityTypes[type as SpecEntity['type']] ?? type}
                <span>{entities.length}</span>
              </h2>
              {entities.map((entity) => (
                <button
                  className={entity.id === props.selectedId ? 'entity-link active' : 'entity-link'}
                  key={entity.id}
                  type="button"
                  onClick={() => props.onSelectEntity(entity.id)}
                >
                  <strong>{entity.id}</strong>
                  <span>{entity.title}</span>
                  {entity.openQuestions.length > 0 ? <em>{entity.openQuestions.length}</em> : null}
                </button>
              ))}
            </section>
          ))}
        </nav>
      </aside>

      <section className="content">
        <header className="topbar">
          <SummaryMetric label={props.t.entities} value={props.snapshot.entities.length} />
          <SummaryMetric label={props.t.graphNodes} value={props.graph.nodes.length} />
          <SummaryMetric label={props.t.graphEdges} value={props.graph.edges.length} />
          <SummaryMetric label={props.t.criteria} value={criteriaCount} />
          <SummaryMetric
            label={props.t.openQuestions}
            value={openQuestionCount}
            tone={openQuestionCount > 0 ? 'warn' : 'ok'}
          />
          <SummaryMetric
            label={props.t.issues}
            value={props.dataset.issues.length}
            tone={props.dataset.issues.length > 0 ? 'warn' : 'ok'}
          />
        </header>

        <section className="main-grid">
          <EntityInspector entity={props.selectedEntity} locale={props.locale} t={props.t} />
          <DiffPanel diff={props.diff} t={props.t} />
          <GraphPanel
            graph={props.graph}
            selectedId={props.selectedId}
            t={props.t}
            onSelectEntity={props.onSelectEntity}
          />
          <OpenQuestionsPanel
            entities={props.snapshot.entities}
            locale={props.locale}
            t={props.t}
            onSelectEntity={props.onSelectEntity}
          />
          <IssuesPanel issues={props.dataset.issues} t={props.t} />
        </section>
      </section>
    </main>
  );
}

function SummaryMetric(props: { label: string; value: number; tone?: 'ok' | 'warn' }) {
  return (
    <div className={`metric ${props.tone ?? ''}`}>
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function EntityInspector(props: { entity: SpecEntity | null; locale: Locale; t: UiText }) {
  if (!props.entity) {
    return <section className="panel">{props.t.noEntity}</section>;
  }

  const entity = props.entity;

  return (
    <section className="panel entity-panel">
      <div className="panel-heading">
        <p className="eyebrow">{entity.type}</p>
        <h2>{entity.title}</h2>
      </div>
      <dl className="entity-meta">
        <div>
          <dt>ID</dt>
          <dd>{entity.id}</dd>
        </div>
        <div>
          <dt>{props.t.status}</dt>
          <dd>{entity.status}</dd>
        </div>
        <div>
          <dt>{props.t.since}</dt>
          <dd>{entity.since}</dd>
        </div>
      </dl>
      {entity.summary ? <p className="summary">{entity.summary}</p> : null}
      {entity.statement ? (
        <section className="detail-section">
          <h3>{props.t.statement}</h3>
          <p>{formatLocalizedText(entity.statement, props.locale)}</p>
        </section>
      ) : null}
      {entity.criteria.length > 0 ? (
        <section className="detail-section">
          <h3>{props.t.criteria}</h3>
          <div className="criteria-list">
            {entity.criteria.map((criterion) => (
              <article className="criterion-row" key={criterion.id}>
                <strong>{criterion.id}</strong>
                <p>{formatLocalizedText(criterion.text, props.locale)}</p>
                {criterion.rationale ? (
                  <p className="rationale">
                    <span>{props.t.rationale}: </span>
                    {formatLocalizedText(criterion.rationale, props.locale)}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {entity.openQuestions.length > 0 ? (
        <section className="detail-section">
          <h3>{props.t.openQuestions}</h3>
          <div className="issue-list compact">
            {entity.openQuestions.map((question) => (
              <article className="issue-row" key={question.id}>
                <p className="issue-file">{question.id}</p>
                <p>{formatLocalizedText(question.question, props.locale)}</p>
                {question.context ? (
                  <p className="issue-context">
                    {formatLocalizedText(question.context, props.locale)}
                  </p>
                ) : null}
                {question.blocks.length > 0 ? (
                  <p className="blocked-items">
                    {props.t.blocks}: {question.blocks.join(', ')}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <section className="detail-section">
        <h3>{props.t.relationships}</h3>
        {SPEC_RELATION_KINDS.map((relationKind) => (
          <RelationList
            key={relationKind}
            title={props.t.relationKinds[relationKind]}
            relations={entity[relationKind]}
          />
        ))}
      </section>
    </section>
  );
}

function RelationList(props: { title: string; relations: SpecEntity['relates'] }) {
  if (!props.relations) return null;

  const entries = Object.entries(props.relations).flatMap(([kind, targets]) =>
    (targets ?? []).map((target) => ({ kind, target }))
  );

  if (entries.length === 0) return null;

  return (
    <div className="relations">
      <h3>{props.title}</h3>
      <div className="relation-list">
        {entries.map(({ kind, target }) => (
          <span className="relation-chip" key={`${kind}:${target.id}`}>
            <strong>{target.id}</strong>
            {target.anchors?.length ? <small>{target.anchors.join(', ')}</small> : null}
            {target.role ? <small>role={target.role}</small> : null}
            {target.coverageImpact ? <small>coverageImpact={target.coverageImpact}</small> : null}
            {target.note ? <small>{target.note}</small> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

function DiffPanel(props: { diff: SpecSnapshotDiff; t: UiText }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <p className="eyebrow">
          {props.diff.fromVersion} to {props.diff.toVersion}
        </p>
        <h2>{props.t.semanticDiff}</h2>
      </div>
      <div className="diff-grid">
        <DiffColumn title={props.t.added} entities={props.diff.added} emptyLabel={props.t.none} />
        <DiffColumn
          title={props.t.removed}
          entities={props.diff.removed}
          emptyLabel={props.t.none}
        />
        <DiffColumn
          title={props.t.revised}
          entities={props.diff.revised.map((entry) => entry.after)}
          emptyLabel={props.t.none}
        />
      </div>
    </section>
  );
}

function DiffColumn(props: { title: string; entities: SpecEntity[]; emptyLabel: string }) {
  return (
    <div className="diff-column">
      <h3>{props.title}</h3>
      {props.entities.length === 0 ? (
        <p className="empty">{props.emptyLabel}</p>
      ) : (
        props.entities.map((entity) => (
          <span className="diff-item" key={entity.id}>
            {entity.id}
          </span>
        ))
      )}
    </div>
  );
}

function GraphPanel(props: {
  graph: SpecGraph;
  selectedId: string | null;
  t: UiText;
  onSelectEntity(id: string): void;
}) {
  const layout = useMemo(() => createGraphLayout(props.graph), [props.graph]);
  const highlightedIds = getHighlightedGraphIds(props.graph, props.selectedId);

  return (
    <section className="panel graph-panel">
      <div className="panel-heading">
        <p className="eyebrow">{props.t.explicitRelations}</p>
        <h2>{props.t.graphProjection}</h2>
      </div>
      <div className="graph-canvas" aria-label={props.t.graphProjection}>
        {props.graph.edges.length === 0 ? (
          <p className="empty">{props.t.noActiveEdges}</p>
        ) : (
          <svg role="img" viewBox="0 0 720 520">
            <defs>
              <marker
                id="arrowhead"
                markerHeight="6"
                markerWidth="8"
                orient="auto"
                refX="7"
                refY="3"
              >
                <path d="M0,0 L8,3 L0,6 Z" />
              </marker>
            </defs>
            <g className="graph-edges">
              {props.graph.edges.map((edge) => {
                const from = layout.get(edge.from);
                const to = layout.get(edge.to);
                if (!from || !to) return null;
                const active =
                  props.selectedId === null ||
                  edge.from === props.selectedId ||
                  edge.to === props.selectedId;

                return (
                  <g className={active ? 'active' : ''} key={edge.id}>
                    <line markerEnd="url(#arrowhead)" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
                    <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2}>
                      {edge.kind}
                    </text>
                  </g>
                );
              })}
            </g>
            <g className="graph-nodes">
              {props.graph.nodes.map((node) => {
                const point = layout.get(node.id);
                if (!point) return null;
                const active = highlightedIds.has(node.id);

                return (
                  <g
                    className={`graph-node type-${node.type} ${active ? 'active' : ''}`}
                    key={node.id}
                    role="button"
                    tabIndex={0}
                    transform={`translate(${point.x} ${point.y})`}
                    onClick={() => props.onSelectEntity(node.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        props.onSelectEntity(node.id);
                      }
                    }}
                  >
                    <circle r={node.id === props.selectedId ? 28 : 22} />
                    <title>{node.id}</title>
                    <text>{compactSpecId(node.id)}</text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>
      <div className="edge-list">
        {props.graph.edges.slice(0, 12).map((edge) => (
          <div className="edge-row" key={edge.id}>
            <span>{edge.from}</span>
            <strong>{edge.kind}</strong>
            <span>{edge.to}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function OpenQuestionsPanel(props: {
  entities: SpecEntity[];
  locale: Locale;
  t: UiText;
  onSelectEntity(id: string): void;
}) {
  const questions = props.entities.flatMap((entity) =>
    entity.openQuestions.map((question) => ({ entity, question }))
  );

  return (
    <section className="panel work-panel">
      <div className="panel-heading">
        <p className="eyebrow">WIP</p>
        <h2>
          {props.t.openQuestions}
          <span>{questions.length}</span>
        </h2>
      </div>
      {questions.length === 0 ? (
        <p className="empty">{props.t.noOpenQuestions}</p>
      ) : (
        <div className="issue-list">
          {questions.map(({ entity, question }) => (
            <article className="issue-row" key={question.id}>
              <button type="button" onClick={() => props.onSelectEntity(entity.id)}>
                {entity.id}
              </button>
              <p className="issue-file">{question.id}</p>
              <p>{formatLocalizedText(question.question, props.locale)}</p>
              {question.blocks.length > 0 ? (
                <p className="blocked-items">
                  {props.t.blocks}: {question.blocks.join(', ')}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function IssuesPanel(props: { issues: SpecWorkspaceDataset['issues']; t: UiText }) {
  return (
    <section className="panel issues-panel">
      <div className="panel-heading">
        <p className="eyebrow">{props.t.validation}</p>
        <h2>
          {props.t.issues}
          <span>{props.issues.length}</span>
        </h2>
      </div>
      {props.issues.length === 0 ? (
        <p className="empty">{props.t.noIssues}</p>
      ) : (
        <div className="issue-list">
          {props.issues.map((issue, index) => (
            <article className="issue-row" key={`${issue.filePath ?? 'workspace'}:${index}`}>
              {issue.filePath ? (
                <p className="issue-file">
                  {props.t.file}: {issue.filePath}
                </p>
              ) : null}
              <p>{issue.message}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function groupEntitiesByType(entities: SpecEntity[]): Record<string, SpecEntity[]> {
  return entities.reduce<Record<string, SpecEntity[]>>((groups, entity) => {
    groups[entity.type] ??= [];
    groups[entity.type].push(entity);
    return groups;
  }, {});
}

function formatLocalizedText(
  value: string | { en?: string | undefined; 'zh-CN'?: string | undefined },
  locale: Locale
): string {
  if (typeof value === 'string') return value;

  if (locale === 'zh') {
    return value['zh-CN'] ?? value.en ?? '';
  }

  return value.en ?? value['zh-CN'] ?? '';
}

function createGraphLayout(graph: SpecGraph): Map<string, { x: number; y: number }> {
  const center = { x: 360, y: 260 };
  const radiusX = 270;
  const radiusY = 185;
  const byType = groupGraphNodesByType(graph.nodes);
  const typeOrder = Object.keys(byType).sort();
  const layout = new Map<string, { x: number; y: number }>();

  if (graph.nodes.length === 1) {
    layout.set(graph.nodes[0].id, center);
    return layout;
  }

  let cursor = 0;

  for (const type of typeOrder) {
    const nodes = byType[type];

    for (const node of nodes) {
      const angle = (cursor / graph.nodes.length) * Math.PI * 2 - Math.PI / 2;
      layout.set(node.id, {
        x: center.x + Math.cos(angle) * radiusX,
        y: center.y + Math.sin(angle) * radiusY,
      });
      cursor += 1;
    }
  }

  return layout;
}

function groupGraphNodesByType(nodes: SpecGraph['nodes']): Record<string, SpecGraph['nodes']> {
  return nodes.reduce<Record<string, SpecGraph['nodes']>>((groups, node) => {
    groups[node.type] ??= [];
    groups[node.type].push(node);
    return groups;
  }, {});
}

function getHighlightedGraphIds(graph: SpecGraph, selectedId: string | null): Set<string> {
  if (!selectedId) return new Set(graph.nodes.map((node) => node.id));

  const ids = new Set([selectedId]);

  for (const edge of graph.edges) {
    if (edge.from === selectedId) ids.add(edge.to);
    if (edge.to === selectedId) ids.add(edge.from);
  }

  return ids;
}

function compactSpecId(id: string): string {
  const parts = id.split('-');
  if (parts.length <= 3) return id;

  return `${parts[0]}-${parts.at(-2)}-${parts.at(-1)}`;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
