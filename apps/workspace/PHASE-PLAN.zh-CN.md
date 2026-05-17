# Proto UI Workspace 阶段性目标

> 当前版本：2026-05-17 更新

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

截至 2026-05-17，第一条 Props 契约测试链路已经跑通：

- `C-PROPS-0003`：Props values must be JSON values
  - 已通过 `T-PROPS-0001` 建立 JSON value boundary fixture。
  - 已落到 module resolved/define 测试，以及 React、Vue、Web Component adapter conformance 测试。
- `C-PROPS-0008`：Runtime props resolution produces a declared-key resolved snapshot
  - 已通过 `T-PROPS-0005` 拆出 criteria-level cases。
  - 已落到 module focused test、runtime props wiring/integration，以及 React、Vue、Web Component adapter conformance 测试。
  - 保留断口：`resolved snapshot` 的深层语义只读更适合未来静态分析检查，v0 runtime 目前只验证浅层不可变。

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

当前判断：Phase 1 已完成，可以进入小域闭环。

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
| P0 | `C-PROPS-0009` Empty and invalid prop values resolve through deterministic fallback | 边界清晰，已有 `T-PROPS-0006` 占位和 `resolve-fallback` module 测试；与 `C-PROPS-0008` 已形成测试链路衔接。 | 下一条主线。先补 statement/criteria，再写实 `T-PROPS-0006`，最后补 module focused coverage 与必要 adapter/runtime exercises。 |
| P0.5 | `C-PROPS-0004` Prop semantic state is classified per key | 是 `0009` 的前置语义，边界清晰，但独立测试价值主要体现在 `0009` 的输入分类中。 | 可在推进 `0009` 时顺手补 criteria，并让 `T-PROPS-0002` 记录分类覆盖；不必单独拉成一条长主线。 |
| P1 | `C-PROPS-0011` Resolved props watchers observe resolved snapshot changes | watch 行为边界相对清晰，已有 `watch-resolved` 与 runtime integration 测试基础。 | 在 fallback 小域后推进。需要先补 criteria，再整理 `T-*`，尤其明确 hydration、Object.is、watchAll/watch(keys)、调用顺序。 |
| P1 | `C-PROPS-0006` Prop declaration descriptors have constrained shape | setup-time descriptor 边界清晰，已有 define JSON boundary 和 shape/merge 相关测试基础。 | 适合作为 define 小域起点。需要把 descriptor shape 细节补进 criteria。 |
| P2 | `C-PROPS-0007` Prop declaration merge preserves evolution safety | 可测试，但具体“breaking narrowing / widening traceable”的边界需要再次确认。 | 等 `0006` criteria 稳定后推进。 |
| P2 | `C-PROPS-0010` Failed declaration merge must not partially apply | 边界清晰，适合测试 atomicity，但依赖 `0007` 的冲突定义。 | 跟随 `0007`，不单独提前。 |

暂缓推进：

- `C-PROPS-0001`：偏哲学/通路身份，更多作为上游引用，不适合作为测试链路主线。
- `C-PROPS-0002`：API surface 总契约，范围较大，应由 `0005`、`0008`、`0011`、`0012`、`0014` 等子契约反向收敛后再回修。
- `C-PROPS-0005`：mergeable plans 的高层判断，需要和 `0006/0007/0010` 一起过。
- `C-PROPS-0012`：raw escape hatch 可测，但属于非推荐 API，优先级低于 resolved/fallback/watch 主链路。
- `C-PROPS-0013`：watcher callback `run handle` 绑定已有 runtime 测试基础，但依赖 `0011/0012` 的 watcher 语义稳定。
- `C-PROPS-0014`：`applyRawProps` 与 render commit 的关系更接近 runtime/core update 契约，需要先明确是否拆出更上游的 runtime contract。

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

从 `C-PROPS-0009` 开始：

1. 补全 `C-PROPS-0009` 的 `statement` 和 criteria。
2. 同步补一份轻量的 `C-PROPS-0004` criteria，作为 `0009` 的输入分类前置。
3. 将 `T-PROPS-0006` 写实，拆出 missing、provided-empty、invalid、fallback order、prevValid、`empty="error"` 等 cases。
4. 对照现有 `packages/modules/props/test/contract/resolve-fallback.v0.contract.test.ts`，将可确认的实现状态标为 passing。
5. 检查是否需要新的 focused module test，避免历史测试过宽导致 coverage 难以阅读。
6. 再判断 adapter/runtime 是否只作为 exercises，还是需要建立独立 conformance harness。

完成 `0009` 后，进入一次回扫：

- 回看所有 `C-PROPS-*` 的边界是否仍然合理。
- 将“范围过大”的 `C-PROPS` 拆分或降级为上游/总契约。
- 将暂缓项保留为明确 open question 或 deferred tag，避免 draft 堆积后遗失上下文。
