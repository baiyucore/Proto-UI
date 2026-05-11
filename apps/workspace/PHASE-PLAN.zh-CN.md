# Proto UI Workspace 阶段性目标

> 当前版本：2026-05-11 草案

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

## Phase 1：单契约闭环

目标：选 1-2 条边界清晰的 Props 契约，把契约到测试的最小链路跑通。

建议起点：

- `C-PROPS-0003`：Props values must be JSON values
- 备选：`C-PROPS-0008`：Runtime props resolution produces a declared-key resolved snapshot

交付物：

- 契约拥有明确 `statement` 和 `criteria`
- criteria 能锚定到 `T-*` 测试实体
- 测试实体能记录测试文件、测试 case、覆盖 criteria、当前状态
- Workspace 能显示 coverage gap 和 open questions

阶段完成标准：

- 至少 1 条 Props 契约具备完整 criteria
- 至少 1 个 `T-*` 不再只是占位，而是指向真实测试
- Workspace 能看出哪些 criteria 已覆盖、哪些未覆盖

## Phase 2：Props 小域闭环

目标：扩展到一个小型 Props 语义域，而不是整个 Props 系统。

候选小域：

- value boundary：JSON value、可序列化、函数排除
- resolution：declared key、raw/resolved、null normalization
- fallback：missing、empty、invalid、prevValid
- watch：watchAll、watch(keys)、Object.is、hydration

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

从 `C-PROPS-0003` 开始：

1. 补全该契约的 `statement` 和 criteria。
2. 查找现有 module / adapter / runtime 测试。
3. 将真实测试映射到 `T-PROPS-0001`。
4. 为测试实体补充覆盖状态和缺口。
5. 让 Workspace UI 展示 criteria coverage。
