# 2026-05-22 spec 实体类型与 scope 治理记录

> Internal record. Not normative. 本文记录一次关于 Adapter、Compiler、Prototype interaction 约束如何进入 spec 体系的日常工程讨论。它包含临时判断、候选方案与后续 todo，不等同于 `spec/decisions/D-*` 决策实体。

---

## 1）背景

当前 spec 体系已经有较稳定的实体类型，例如：

- `contract`
- `module`
- `test`
- `decision`
- `host-cap`
- `knowledge`

在整理 lifecycle 契约时，出现了一个新的治理问题：

- core lifecycle 只定义通用 runtime 顺序与 checkpoint。
- Adapter 需要把具体 host 生命周期映射到这些 core lifecycle 语义。
- Compiler 虽然不是 v0 正式发布目标，但在 Proto UI 的哲学模型中与 Adapter 一样，都是 translation layer 的工程落地方式。
- 官方原型库中的每个 prototype 也会有独立交互规范，约束某个组件该有哪些交互、不该有哪些交互；这类规范与 translation layer 独立演进，更接近 component / interaction layer。

因此需要判断：

1. Adapter / Compiler 是否需要独立实体类型？
2. 官方 prototype interaction 规范是否需要独立实体类型？
3. 哪些内容应进入 spec `D-*` 决策，哪些只适合放在 `internal/records`？

---

## 2）当前记录形式判断

本次讨论暂时放在 `internal/records`，而不是直接进入 spec。

原因：

- 讨论仍夹杂候选方向、决策倾向和 todo。
- 相关 schema 变更尚未实施。
- 还没有与其他维护者完成正式同步。
- 它会影响 spec 信息架构，但尚未形成稳定的 normative 约束。

`internal/records` 的定位适合这类内容：

- 记录为什么这样想；
- 保留备选方案；
- 明确哪些点还没定；
- 为未来升级为正式 spec 决策提供材料。

当某个判断稳定后，应再拆分进入：

- `D-*`：记录核心治理决策；
- `K-*`：记录概念模型或哲学分类；
- schema 变更：新增实体类型、关系类型或字段；
- `C-*`：记录 normative contract；
- `T-*`：记录对应测试与 conformance mapping。

---

## 3）Adapter 与 Compiler 的候选定位

### 3.1 Translation layer 的共同地位

Adapter 与 Compiler 在 Proto UI 的哲学模型中都属于 translation layer：

- Adapter：把 Proto UI runtime/prototype 语义翻译到某个 host runtime 或平台中。
- Compiler：把 Proto UI prototype 语义编译到目标代码、目标 runtime 或目标平台结构中。

二者是同一类抽象地位的不同工程落地方式。

但在 v0 中：

- Adapter 是真实发布与测试范围。
- Compiler 不会作为正式发布能力进入 v0。

因此短期不宜让 compiler 过早承担完整 spec 治理负担。

### 3.2 Adapter 是否应是独立实体类型

当前倾向：应预留或新增独立 `adapter` 实体类型。

理由：

- Adapter 不是一条 contract，而是被 contract 约束的工程身份。
- 同样是 React，不同 React 主版本可以有不同 adapter profile。
- `React 15 adapter` 与 `React 19 adapter` 可能共享一部分 baseline contract，但 host lifecycle、commit timing、props/event wiring、effect timing 等细节可能不同。
- 测试、能力矩阵、deprecated/replacedBy、支持范围都需要一个稳定实体锚点。

候选形式：

- `A-WEB-COMPONENT-0001`
- `A-REACT-19-0001`
- `A-VUE-3-0001`

这些实体表示 official adapter profile，而不是抽象 host 名称。

### 3.3 Compiler 是否应是独立实体类型

当前倾向：哲学上承认 compiler 与 adapter 同属 translation layer，但 v0 暂不急于新增 active compiler entity。

较稳妥路径：

1. 先用 `K-*` 记录 translation layer 的概念模型：Adapter 与 Compiler 是同一抽象地位下的两类实现路径。
2. v0 只引入或预留 adapter profile 的工程治理。
3. v1 compiler 主线启动时，再引入 compiler entity type。

Compiler 前缀需另行讨论，因为 `C` 已用于 contract。候选可能是 `CMP` 或其他不冲突前缀。

---

## 4）Adapter 相关 contract 的层级建议

如果引入 adapter entity，具体约束仍应主要使用 `contract` 实体表达。

建议拆三层：

### 4.1 Core contract

例如：

- `C-LIFECYCLE-0004`

它只规定所有 runtime/adapter 必须保序映射到 canonical lifecycle checkpoint。

它不关心 React、Vue、Web Component 的具体机制。

### 4.2 Adapter baseline contract

例如未来可能出现：

- `C-ADAPTER-LIFECYCLE-0001`
- `C-ADAPTER-PROPS-0001`
- `C-ADAPTER-EVENT-0001`

它们规定所有 Adapter profile 都应满足的翻译层基本规则。

### 4.3 Adapter profile contract

例如未来可能出现：

- `C-ADAPTER-REACT-19-LIFECYCLE-0001`
- `C-ADAPTER-VUE-3-PROPS-0001`
- `C-ADAPTER-WEB-COMPONENT-EVENT-0001`

它们描述某个 official adapter profile 的 host-specific 映射规则。

这类 contract 比 core contract 更接近实例，但仍然不是一次构建产物；它是一个可版本化、可测试、可替换的 official profile 规范。

---

## 5）Prototype interaction 规范的候选定位

### 5.1 问题

官方 prototype library 中，每一个 prototype 都会对应一组交互约束。

例如 Dialog 可能涉及：

- 是否 modal；
- focus trap；
- Escape 行为；
- outside interaction；
- open/close state；
- ARIA role 与属性；
- 与其他 layer、portal、overlay 的交互。

这些约束与 Adapter / Compiler 独立演进。

它们更像 ARIA 那样的 interaction / component pattern 规范。

### 5.2 是否应有独立实体类型

当前倾向：应预留或新增 `prototype` 实体类型。

理由：

- Prototype 是被 contract 约束的官方原型身份。
- 单纯使用 contract 无法稳定回答“Dialog 当前有哪些规范、测试、版本生命周期、替代关系”。
- Prototype interaction 规范不是 runtime core，也不是 adapter/compiler translation layer。
- 它需要独立承载 deprecated、replacedBy、支持矩阵、测试聚合等信息。

候选形式：

- `P-DIALOG-0001`
- `P-DROPDOWN-MENU-0001`
- `P-TOOLTIP-0001`

这些实体表示 official prototype identity，而不是某条具体交互规则。

### 5.3 Prototype contract 的形式

具体约束仍应使用 `contract`：

- `C-DIALOG-INTERACTION-0001`
- `C-DIALOG-FOCUS-0001`
- `C-DIALOG-KEYBOARD-0001`
- `C-DIALOG-ARIA-0001`
- `C-DROPDOWN-MENU-SELECTION-0001`

这些 contract 通过关系指向对应 `prototype` entity。

### 5.4 是否需要 interaction-pattern 实体

暂不急于新增。

共享交互模式可以先用：

- `knowledge`
- cross-prototype `contract`

例如 modal pattern、roving tabindex pattern、composite widget navigation pattern。

只有当共享 pattern 的数量和复用关系足够多，才考虑新增 `interaction-pattern` 或类似实体类型。

---

## 6）当前倾向性结论

### 6.1 实体类型

倾向预留：

- `adapter`
- `prototype`

暂缓：

- `compiler`
- `interaction-pattern`

### 6.2 Contract 的职责

Contract 仍然表达 normative rule。

新增实体类型只提供被约束对象的稳定身份锚点，不替代 contract。

### 6.3 官方 Adapter 约束的地位

官方 adapter 约束应定位为：

> Official adapter profile 的规范。

它不等同于 core protocol，也不等同于一次实现快照。

### 6.4 官方 Prototype 约束的地位

官方 prototype 约束应定位为：

> Official prototype identity 的 component / interaction profile。

它独立于 translation layer 演进，但会被 adapter/compiler 支持矩阵消费。

---

## 7）暂不解决的问题

以下问题暂不在本记录中定案：

- adapter entity 的具体 schema 字段。
- prototype entity 的具体 schema 字段。
- 是否立即修改 `packages/spec/schema`。
- adapter / prototype 与 contract 的关系字段命名。
- compiler entity type 的前缀。
- interaction-pattern 是否最终需要独立实体。
- workspace UI 如何展示 adapter/prototype 聚合视图。

---

## 8）后续动作建议

1. 起草 `K-TRANSLATION-LAYER-0001`，记录 Adapter / Compiler 作为 translation layer 的概念地位。
2. 起草 `K-PROTOTYPE-INTERACTION-PROFILE-0001`，记录 official prototype identity 与 interaction profile 的概念地位。
3. 设计 schema 扩展草案：新增 `adapter`、`prototype` entity type，以及对应 ID prefix。
4. 先选一个真实 profile 做试点：
   - `A-WEB-COMPONENT-0001` 或 `A-REACT-19-0001`
   - `P-DIALOG-0001` 或 `P-DROPDOWN-MENU-0001`
5. 再决定是否将本记录中的稳定判断升级为 `D-*` 决策实体。

---

## 9）记录结论

本记录不是最终 spec 决策。

当前工作判断是：

- 日常工程讨论、夹杂 todo 的治理想法，先放 `internal/records`。
- 稳定且影响 schema 或长期治理边界的判断，再升级到 spec `D-*` / `K-*` / `C-*`。
- Adapter 和 Prototype 都更适合作为独立实体锚点。
- Compiler 的哲学地位先记录，v1 主线启动前不急于落 schema。
