# Proto UI Workspace 阶段性目标

> 当前版本：2026-05-18 更新

Workspace 的近期目标不是完整录入 Proto UI 的全部哲学、契约和测试，而是先打通一条真实可用的治理链路：

```text
哲学前提 -> 契约 -> criteria -> 测试映射 -> 真值表 / 能力矩阵 -> 主线迭代反馈
```

第一条链路选择 Props，因为 Props 已经具备白皮书背景、契约底本、模块实现、模块测试、adapter 测试和 runtime 相关测试，是最适合验证知识体系是否有工程价值的切片。

## 成功标准

当前阶段的成功标准不是实体数量，而是 Workspace 能回答这些问题：

- 某条契约由哪些上游哲学或核心契约支撑？
- 某条契约有哪些可判断的 criteria？
- 每条 criteria 是否有测试覆盖？
- 测试覆盖的是契约语义，还是只是实现细节？
- 某个 Props 行为调整会影响哪些契约、测试、module 和 adapter 能力？
- 哪些断口阻塞了契约从 draft 进入 active？

## 当前进展

截至 2026-05-18，Props 契约测试链路已经从单契约闭环扩展到几个小域：

- `C-PROPS-0003`：Props values must be JSON values
  - 已通过 `T-PROPS-0001` 建立 JSON value boundary fixture。
  - 已落到 module resolved/define 测试，以及 React、Vue、Web Component adapter conformance 测试。
- `C-PROPS-0008`：Runtime props resolution produces a declared-key resolved snapshot
  - 已通过 `T-PROPS-0005` 拆出 criteria-level cases。
  - 已落到 module focused test、runtime props wiring/integration，以及 React、Vue、Web Component adapter conformance 测试。
  - 保留断口：`resolved snapshot` 的深层语义只读更适合未来静态分析检查，v0 runtime 目前只验证浅层不可变。
- `C-PROPS-0004` / `C-PROPS-0009`：per-key state classification 与 fallback resolution
  - 已通过 `T-PROPS-0002`、`T-PROPS-0006` 建立 criteria-level mapping。
  - 已落到 focused module tests，并保留历史测试作为 supporting coverage。
- `C-PROPS-0011` / `C-PROPS-0012` / `C-PROPS-0013`：resolved watcher、raw escape hatch 与 watcher-time `run handle` binding
  - 已通过 `T-PROPS-0007`、`T-PROPS-0008`、`T-PROPS-0009` 映射到 module/runtime 测试。
  - `C-PROPS-0013` 已被重新定位为 `C-CORE-SYNTAX-0002` 的 Props-specific refinement。
- `C-PROPS-0006` / `C-PROPS-0007` / `C-PROPS-0010`：declaration descriptor shape、merge safety 与 failed merge atomicity
  - 已通过 `T-PROPS-0003`、`T-PROPS-0004` 映射到 define merge module tests。
  - 保留断口：`validator` 作为函数型 descriptor 字段是否属于 portable Props declaration 仍需后续讨论。
- `C-PROPS-0002`：Props API surface
  - 已通过 `T-PROPS-0010` 固定 `def.props` / `run.props` 的最小 API surface 与阶段边界。
  - 不再承接 render commit 调度语义；该断口转移到 `C-PROPS-0014` 与未来 core runtime/update 契约。

这个阶段证明了 Workspace 的核心链路可以工作：

```text
Contract -> Criteria -> T entity -> shared fixture / conformance harness -> module/runtime/adapter tests
```

## Phase 1：单契约闭环

目标：选 1-2 条边界清晰的 Props 契约，把契约到测试的最小链路跑通。

已完成起点：

- `C-PROPS-0003`：Props values must be JSON values
- `C-PROPS-0008`：Runtime props resolution produces a declared-key resolved snapshot

交付物：

- 契约拥有明确 `statement` 和 `criteria`
- criteria 能锚定到 `T-*` 测试实体
- 测试实体能记录测试文件、测试 case、覆盖 criteria、当前状态
- Workspace 能显示 coverage gap 和 open questions

阶段完成标准：

- 至少 1 条 Props 契约具备完整 criteria
- 至少 1 个 `T-*` 不再只是占位，而是指向真实测试
- Workspace 能看出哪些 criteria 已覆盖、哪些未覆盖

当前判断：Phase 1 已完成；Phase 2 已经覆盖 value boundary、resolution/fallback、watch/raw 和 define/merge 的主要可测链路。

## Phase 2：Props 小域闭环

目标：扩展到一个小型 Props 语义域，而不是整个 Props 系统。

候选小域：

- value boundary：JSON value、可序列化、函数排除
- resolution：declared key、raw/resolved、null normalization
- fallback：missing、empty、invalid、prevValid
- watch：watchAll、watch(keys)、Object.is、hydration

### 下一批候选筛选

优先选择边界明确、可测试、已有工程落点或可复用 conformance harness 的契约。

| 优先级 | 契约 | 判断 | 计划 |
| --- | --- | --- | --- |
| P0 | `C-PROPS-0014` applyRawProps updates the props channel without implicit render commit | 当前仍是 draft/deferred，且牵涉 runtime update / render commit 的上游契约。 | 先判断是否需要拆出 `C-CORE-RUNTIME-*` 或 `C-CORE-UPDATE-*`，再决定 0014 是否保留为 Props-specific refinement。 |
| P1 | `C-PROPS-0005` Setup-time prop declarations are mergeable plans | 高层 mergeable plan 契约仍需要与 `0006/0007/0010` 对齐。 | 回扫 criteria，确保它只表达“可合并计划”的上层语义，不重复写具体 merge rules。 |
| P1 | `C-CORE-SYNTAX-0001` / `C-CORE-SYNTAX-0002` | `def handle` 与 `run handle` 仍为 draft，但 Props 已经大量依赖它们。 | 后续应补核心语法测试或至少补 cross-reference，避免 Props 契约承担过多 core 语义。 |

暂缓推进或需要回收的项：

- `C-PROPS-0001`：偏哲学/通路身份，更多作为上游引用，不适合作为测试链路主线。
- `C-PROPS-0002/0003/0004/0006/0007/0008/0009/0010/0011/0012/0013`：已进入 active，但后续仍需要跟随实现变更回扫 wording 与 coverage。
- `C-CORE-VALUE-0001`：`null` canonical empty value 仍为 draft；它是 Props 多条契约的上游，应在 Props 回扫后补强。

交付物：

- 该小域内契约具备可测试 criteria
- 测试实体能区分 module 测试、adapter 测试、runtime 测试
- 可以生成最小真值表或覆盖矩阵
- 可以列出缺失测试与实现/契约冲突

阶段完成标准：

- 至少一个 Props 小域可生成语义覆盖报告
- 报告能发现至少一种真实缺口：缺失测试、契约不清、实现偏差或 adapter 行为差异

## Phase 3：主线反哺

目标：让 Workspace 输出开始服务 Proto UI 的主线开发。

交付物：

- 本地命令生成 contract -> criteria -> tests -> adapter/module status 报告
- Workspace UI 能浏览该报告
- 修改 Props 行为前，可以查询影响范围
- 修改 Props 行为后，可以检查契约和测试是否仍然一致

阶段完成标准：

- Props 相关改动能使用 Workspace 报告辅助评估影响
- 报告能进入 PR 讨论或本地开发检查流程
- 不要求第一阶段接入 CI，但报告格式应为后续 CI 使用保留空间

## 非目标

近期不追求：

- 完整录入所有白皮书段落
- 完整录入所有 Props 契约
- 完整覆盖所有 module 和 adapter
- 建设 Obsidian 式知识库
- 建设富文本编辑器
- 把 Workspace 全量 Proto UI 化

这些都可以在链路价值被证明后再逐步推进。

## 下一步

进入一次 Props 回扫：

- 回看所有 `C-PROPS-*` 的边界是否仍然合理。
- 将“范围过大”的 `C-PROPS` 拆分或降级为上游/总契约。
- 将暂缓项保留为明确 open question 或 deferred tag，避免 draft 堆积后遗失上下文。
- 优先处理 `C-PROPS-0014`：它决定 props update 与 render commit 的 runtime/core 边界。
- 同步补强 `C-CORE-SYNTAX-0001/0002` 与 `C-CORE-VALUE-0001`，避免 Props 契约继续承载过多核心语法和核心 value 语义。
