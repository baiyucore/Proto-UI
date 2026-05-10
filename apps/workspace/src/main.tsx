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
import type { SpecEntity } from '@proto.ui/spec-schema';

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
    issues: 'Issues',
    id: 'ID',
    status: 'Status',
    since: 'Since',
    noEntity: 'No entity selected.',
    relates: 'Relates',
    requires: 'Requires',
    verifies: 'Verifies',
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
    issues: '问题',
    id: 'ID',
    status: '状态',
    since: '引入版本',
    noEntity: '未选择实体。',
    relates: '关联',
    requires: '依赖',
    verifies: '验证',
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
          <SummaryMetric
            label={props.t.issues}
            value={props.dataset.issues.length}
            tone={props.dataset.issues.length > 0 ? 'warn' : 'ok'}
          />
        </header>

        <section className="main-grid">
          <EntityInspector entity={props.selectedEntity} t={props.t} />
          <DiffPanel diff={props.diff} t={props.t} />
          <GraphPanel graph={props.graph} t={props.t} />
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

function EntityInspector(props: { entity: SpecEntity | null; t: UiText }) {
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
      <RelationList title={props.t.relates} relations={entity.relates} />
      <RelationList title={props.t.requires} relations={entity.requires} />
      <RelationList title={props.t.verifies} relations={entity.verifies} />
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
            {kind}: {target.id}
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

function GraphPanel(props: { graph: SpecGraph; t: UiText }) {
  return (
    <section className="panel graph-panel">
      <div className="panel-heading">
        <p className="eyebrow">{props.t.explicitRelations}</p>
        <h2>{props.t.graphProjection}</h2>
      </div>
      <div className="edge-list">
        {props.graph.edges.length === 0 ? (
          <p className="empty">{props.t.noActiveEdges}</p>
        ) : (
          props.graph.edges.map((edge) => (
            <div className="edge-row" key={edge.id}>
              <span>{edge.from}</span>
              <strong>{edge.kind}</strong>
              <span>{edge.to}</span>
            </div>
          ))
        )}
      </div>
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
