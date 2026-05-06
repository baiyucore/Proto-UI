# 2026-05-06 Packages Release CI(锁步 / OIDC / 周四节奏)

> Spec. 本文记录 v0 首发(`0.1.0`)前 packages release CI 的总体设计:VERSION 锁步、npm Trusted Publishing(OIDC)、单包热修通道、周四自动节奏 PR。

---

## 1)背景

### 1.1 上游

- [`internal/governance/versioning-policy.zh-CN.md`](../../../internal/governance/versioning-policy.zh-CN.md):v0 阶段所有 `@proto.ui/*` 包采用**锁步**版本(共享相同 minor 线),patch 是同一 minor 内部的安全升级边界
- [`docs/superpowers/specs/2026-05-03-v0-cli-package-governance-design.md`](./2026-05-03-v0-cli-package-governance-design.md)(PR #220):已经搭好 `release-packages.yml`(scan / stage / publish 三模式 manual workflow)、`ci.yml` 三道闸(release-scan / release-stage / cli-smoke)、`scripts/release/{publish,scan,lib}.mjs` build+publish 链路

### 1.2 v0 首发还缺什么

#220 让维护者**能**手工发包,但有四条工程缺口与 versioning-policy 不一致:

1. **没有锁步实施面**。policy 说"所有 `@proto.ui/*` 保持相同 minor",但代码里没有 source of truth,也没有 CI 闸。33 个包目前都还停在 `0.0.1`,CLI 是 `0.0.4`——已经飘了。
2. **NPM_TOKEN 长期凭据是供应链风险**。`release-packages.yml` 用 `secrets.NPM_TOKEN`,token 一旦泄漏可以远程发任意 `@proto.ui/*` 版本;且 token 不带 provenance,publish 来源无法被 npm 侧审计
3. **单包热修没有路径**。当前 publish 模式只支持 profile(launch / workspace),不能定向发"只重发 `@proto.ui/adapter-vue` 的 patch"——但 v0 阶段 patch 修复就是要在同一 minor 线内单包递进
4. **发版节奏全靠人记忆**。没有"每周看看是否要切版本"的规律性触发

本 spec 把这四条同时收口。

### 1.3 核心约束(已与用户在 brainstorming 阶段确认)

- 第一次发版统一为 **`0.1.0`**,把 34 个包从 `0.0.x` 直接拉到同一条 `0.1.x` 线
- Trusted Publishing(OIDC)是发布链路的**首选**;`NPM_TOKEN` 仅作"新包首发引导"用一次,事后撤销
- 维护者命名权完全交给本 spec:workflow 文件名 `release-packages.yml`(沿用)+ GitHub Environment 名 `npm-publish`
- Node 全仓 20 → 22 LTS(Trusted Publishing 要求 Node ≥ 22.14.0 / npm CLI ≥ 11.5.1)

---

## 2)总体设计

### 2.1 一图概括

```
repo top:
  VERSION                          single source of truth(纯文本一行,如 0.1.0)
  scripts/release/
    stamp-version.mjs              VERSION → 全部 @proto.ui/* package.json#version
    check-lockstep.mjs             校验所有 @proto.ui/* minor 与 VERSION 一致
    publish.mjs / scan.mjs / lib.mjs   #220 已存在,本次只接入 stamp + lockstep

.github/workflows/
  release-packages.yml             多模式(scan / stage / publish-all / publish-single)
                                   走 OIDC,environment: npm-publish,Node 22
  release-cadence.yml              周四 10:00 UTC cron(+ workflow_dispatch)
                                   git log 自上次 release tag,开 version bump PR
  ci.yml                           PR-gate;新增 lockstep-check job;Node 20 → 22

GitHub Environment:
  npm-publish                      required reviewers + deployment branch 限制
                                   release-packages.yml(publish 模式)和
                                   release-cadence.yml(版本 PR)都走这个 env
```

### 2.2 锁步:`VERSION` 单一来源

- 仓库根放一个 `VERSION` 文件,纯文本一行,内容如 `0.1.0`
- `scripts/release/stamp-version.mjs`(新增):
  - 读 `VERSION`
  - 遍历所有 `@proto.ui/*` 工作区包,把 `package.json#version` 改成 VERSION
  - **不动** `dependencies` / `peerDependencies` 里的 `workspace:*` 协议——发布时由 #220 的 `lib.mjs` 在 `npm publish` 之前 normalize 成版本号
  - 是幂等的(已经一致就 no-op)
- `scripts/release/check-lockstep.mjs`(新增):
  - 读 `VERSION` 的 `0.y.z`
  - 校验所有 `@proto.ui/*` 工作区包的 `package.json#version` 满足 `0.y.*`(同 minor;允许 patch 不同——单包热修后未 stamp 就回流的 race window 内可能短暂不一致,但 publish workflow 跑 stamp 之前会重新对齐)
  - 任何 `0.y'.*` 不一致 → 非零退出码,CI 红
- `ci.yml` 加 `lockstep-check` job(只跑 `node scripts/release/check-lockstep.mjs`),作为 PR gate
- **PR 规则**:本仓库**禁止**手工改 `packages/*/package.json#version`。所有版本号通过 `release-cadence.yml` 改 `VERSION` 一处生效。如果 PR 里 dirty 了任意 package.json#version,lockstep-check 失败,PR 红

### 2.3 三个 workflow

#### 2.3.1 `release-packages.yml`(改造)

把 #220 的现状(scan / stage / publish 三模式 + `NODE_AUTH_TOKEN: secrets.NPM_TOKEN`)改造为 4 模式 OIDC:

| `inputs.mode`    | 含义                                                 | 鉴权 |
| ---------------- | ---------------------------------------------------- | ---- |
| `scan`           | `release:scan` 不发包,产出 artifact                  | 无   |
| `stage`          | `release:stage`(tsc + `npm publish --dry-run`)所有包 | 无   |
| `publish-all`    | stamp VERSION → publish 全部 `@proto.ui/*`           | OIDC |
| `publish-single` | stamp VERSION → 只发 `inputs.only` 列出的包          | OIDC |

publish-\* 模式公共开关:

```yaml
permissions:
  id-token: write # OIDC token signing
  contents: write # post-publish 回写 commit + tag
environment: npm-publish # required-reviewer gate(Settings → Environments)
```

steps 顺序(publish-\* 模式):

1. `actions/checkout@v4`
2. `actions/setup-node@v4`(`node-version: '22'`,`registry-url: 'https://registry.npmjs.org'`)
3. corepack pnpm activation block(line-for-line 复用 ci.yml 的 lockfile-version 自适应版本)
4. `pnpm install --frozen-lockfile`
5. `node scripts/release/stamp-version.mjs`
6. `node scripts/release/check-lockstep.mjs`
7. `node scripts/release/publish.mjs --publish [--only ...]`
   - **不**设 `NODE_AUTH_TOKEN`——npm CLI 检测到 GitHub Actions OIDC 环境会自动用 OIDC token + 自动附带 provenance
   - 发包前 `lib.mjs` 把 `workspace:*` normalize 为当前 VERSION
8. `git config user.name/email` → commit `chore(release): publish ${VERSION}` → tag `release/${VERSION}` → push tag + branch
   - 仅 `publish-all` 推 main commit + tag;`publish-single` 只打 patch tag,不动 main

新包首发 fallback(只在阶段 1 用一次,详见 §5):

- step 7 改为同时设 `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`,publish.mjs 走 npm CLI 默认逻辑(token 在,优先用 token);29 个已配 trusted publisher 的包同样可以通过这条路径发,但 provenance 不会自动附带,可选加 `--provenance` flag(token 模式下需要明确指定)
- 阶段 2 把这个 fallback 删掉

#### 2.3.2 `release-cadence.yml`(新增)

```yaml
on:
  schedule:
    - cron: '7 10 * * 4' # 周四 10:07 UTC,避开整点拥堵
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write
```

每次跑:

1. checkout
2. 算 `LAST_TAG=$(git describe --tags --match 'release/*' --abbrev=0 || echo '')`
3. 算 `git log ${LAST_TAG:+$LAST_TAG..}HEAD --oneline`
4. 如果 0 条 commit → 退出 0,无操作
5. 否则:
   - 读 `VERSION`,计算下一个候选版本号(默认 patch 自增,即 `0.1.0 → 0.1.1`;cron 不自动跨 minor)
   - 写新版本到 `VERSION`
   - `git checkout -b release-bump/${NEW_VERSION}`
   - commit `chore(release): bump VERSION to ${NEW_VERSION}`
   - `gh pr create --title "release: ${NEW_VERSION}" --body "<auto-generated changelog from git log>"`
   - PR body 写出"自上次 release 的 commit 列表"+"勾选这些后由维护者 merge,然后手动触发 release-packages.yml(publish-all)"
6. **不**在这里 publish——cron 只是提议,真正发布动作仍要维护者 review PR + 手动触发 publish workflow

为什么不让 cron 自己 publish:OIDC 要求 `environment: npm-publish` 的 required-reviewer,cron job 没有 reviewer;且 v0 阶段维护者要肉眼过 commit 列表才允许发(policy §6 的判断规则)。

#### 2.3.3 `ci.yml` 增强

- 新增 `lockstep-check` job,跑 `node scripts/release/check-lockstep.mjs`,5 秒级 PR gate
- 5 个现有 job(type-check / test / release-scan / release-stage / cli-smoke)的 `node-version` 从 `20` 改为 `22`
- corepack pnpm activation block 不变(已经是 lockfile-version 自适应)
- release-stage / cli-smoke 的 timeout 不变

### 2.4 GitHub Environment:`npm-publish`

需要在仓库 Settings → Environments 新建,配置:

- **Required reviewers**:`255doesnotexist`(本 PR 作者)+ `guangliang2019`(项目 owner);任一审批可放行
- **Deployment branches**:`main` only(防止从 feature branch 触发 publish)
- **Environment secrets**(仅阶段 1 / fallback 用):`NPM_TOKEN` — 阶段 2 删除

`release-packages.yml`(publish-all / publish-single 模式)和 `release-cadence.yml` 都引用这个 environment。

---

## 3)Trusted Publisher 配置(维护者侧手工动作)

### 3.1 npmjs.com 配置内容(锁定 5 字段)

对**每一个**已发布的 `@proto.ui/*` 包,在 npm UI(Settings → Trusted Publishers → GitHub Actions)配:

```
Publisher:               GitHub Actions
Organization or user:    Proto-UI
Repository:              Proto-UI
Workflow filename:       release-packages.yml
Environment name:        npm-publish
```

5 个字段对所有包都是同一份。

### 3.2 已发布的 29 个包(配 trusted publisher)

```
@proto.ui/adapter-base
@proto.ui/adapter-react
@proto.ui/adapter-vue
@proto.ui/adapter-web-component
@proto.ui/cli
@proto.ui/core
@proto.ui/module-anatomy
@proto.ui/module-as-trigger
@proto.ui/module-base
@proto.ui/module-context
@proto.ui/module-event
@proto.ui/module-expose
@proto.ui/module-expose-state
@proto.ui/module-expose-state-web
@proto.ui/module-feedback
@proto.ui/module-focus
@proto.ui/module-overlay
@proto.ui/module-props
@proto.ui/module-rule
@proto.ui/module-rule-expose-state-web
@proto.ui/module-rule-meta
@proto.ui/module-state
@proto.ui/module-state-accessibility
@proto.ui/module-state-interaction
@proto.ui/module-test-sys
@proto.ui/prototypes-base
@proto.ui/prototypes-shadcn
@proto.ui/runtime
@proto.ui/types
```

### 3.3 尚未发布的 5 个新包(本次首发后再配)

```
@proto.ui/hooks
@proto.ui/module-boundary
@proto.ui/module-hit-participation
@proto.ui/module-presence
@proto.ui/prototypes-lucide
```

OIDC trusted publisher 必须在包**已经存在**于 npm 后才能配——这是 npm 侧 UI 限制(npm/cli#8544)。所以这 5 个包必须先用 `NPM_TOKEN` bootstrap 发一次 `0.1.0`,然后维护者去 npm UI 给它们配 trusted publisher。**详见 §5 阶段 2**。

---

## 4)首发 `0.1.0` 迁移路径

### 4.1 阶段 1:本 PR(spec 实施 + 全包发版)

PR 内动作:

1. 加 `VERSION` = `0.1.0`
2. 加 `scripts/release/stamp-version.mjs` + `scripts/release/check-lockstep.mjs`
3. 改 `.github/workflows/release-packages.yml`:多模式 + OIDC + Node 22 + environment(保留 `NPM_TOKEN` fallback,作为 5 新包的 bootstrap 通道)
4. 加 `.github/workflows/release-cadence.yml`
5. 改 `.github/workflows/ci.yml`:加 `lockstep-check` + Node 20 → 22(全 5 jobs)
6. 跑 `node scripts/release/stamp-version.mjs` 一次,把 33 个 `0.0.1` + `cli@0.0.4` 全部改为 `0.1.0`,**入 PR commit**(让 reviewer 看到批量 stamp 的 diff)

PR merge 后维护者动作:

1. 仓库 Settings → Environments 新建 `npm-publish`,配 required-reviewers + deployment branches=main + 临时加 `NPM_TOKEN` secret
2. 去 npm UI 给 29 个**已发布**包配 trusted publisher(每个 5 字段,15-20 分钟)
3. workflow_dispatch 触发 `release-packages.yml`(`mode=publish-all`,`profile=launch` / 实际由本次 publish.mjs 改造决定)
4. workflow 跑完:
   - 29 个已配 trusted publisher 的包通过 OIDC 发布(自动 provenance)
   - 5 个新包通过 NPM_TOKEN fallback 发布(无 provenance)
   - main 收到 commit `chore(release): publish 0.1.0` + tag `release/0.1.0`

### 4.2 阶段 2:首发后清理(独立小 PR / chore 动作)

维护者动作(不需要新代码 PR):

1. 去 npm UI 给 5 个新包(`hooks` / `module-boundary` / `module-hit-participation` / `module-presence` / `prototypes-lucide`)配 trusted publisher,5 字段同 §3.1
2. 验证:跑 `release-packages.yml`(`mode=publish-single`,`only=@proto.ui/hooks`)以 `0.1.1` 为例,确认 5 个新包也能走 OIDC

代码 PR 动作(可选,放进下一次 release 的 PR 里捎带):

3. 删 `release-packages.yml` 里的 `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` fallback
4. 仓库 Settings → Environments → `npm-publish`,删 `NPM_TOKEN` secret

至此 NPM_TOKEN 完全退出供应链。

---

## 5)Node 22 升级

| 文件 | 当前 | 改为 |
| --- | --- | --- |
| `.github/workflows/ci.yml`(5 jobs) | `node-version: 20` | `node-version: 22` |
| `.github/workflows/release-packages.yml` | `node-version: 20` | `node-version: 22` |
| `.github/workflows/release-cadence.yml`(新增) | — | `node-version: 22` |
| `package.json#engines.node`(若声明) | 不限制 | 保持现状,不收紧(避免 v0 阶段把用户卡到 22+) |

理由:

- npm Trusted Publishing 要求 npm CLI ≥ 11.5.1 → 内置 npm CLI 11.5.1 的最低 Node LTS 是 22.14.0
- 仓库内部 CI 升 22 不影响下游用户 runtime——`engines.node` 不动,用户照旧可以在 Node 18 / 20 装包

---

## 6)本 PR 修改文件清单

新增:

1. `VERSION`
2. `scripts/release/stamp-version.mjs`
3. `scripts/release/check-lockstep.mjs`
4. `.github/workflows/release-cadence.yml`
5. `docs/superpowers/specs/2026-05-06-packages-release-ci-design.md` — 本 spec

修改:

6. `.github/workflows/release-packages.yml` — 4 模式 + OIDC + environment + Node 22 + NPM_TOKEN fallback(阶段 1)
7. `.github/workflows/ci.yml` — 加 lockstep-check job + Node 20 → 22
8. 全部 33 个 `@proto.ui/*` `packages/*/package.json#version` — stamp 后从 `0.0.1`(或 cli 的 `0.0.4`)统一到 `0.1.0`

---

## 7)PR 描述必须包含的事项

PR description 模板:

```
## 阶段 1(本 PR merge 时维护者要做的事)

- [ ] Settings → Environments 新建 `npm-publish`
  - required reviewers: 255doesnotexist + guangliang2019
  - deployment branches: main only
  - 临时加 secret `NPM_TOKEN`(用于 5 个新包 bootstrap)
- [ ] 去 npm UI 给 29 个已发布 @proto.ui/* 包配 trusted publisher(spec §3.2 列表,5 字段同 §3.1)
- [ ] workflow_dispatch 触发 release-packages.yml(mode=publish-all),发 0.1.0

## 阶段 2(0.1.0 发布完成后,作为独立 chore 动作)

- [ ] 给 5 个新包(@proto.ui/hooks / module-boundary / module-hit-participation / module-presence / prototypes-lucide)在 npm UI 配 trusted publisher
- [ ] 通过 publish-single 模式发一次 patch 验证 OIDC 通路
- [ ] 删 release-packages.yml 的 NPM_TOKEN fallback,删 npm-publish environment 的 NPM_TOKEN secret
```

---

## 8)验收清单(本地 / CI 双侧验证)

| 检查项 | 状态 | 备注 |
| --- | --- | --- |
| `node scripts/release/stamp-version.mjs` 幂等 | 待写 | 跑两次 git diff 应为空 |
| `node scripts/release/check-lockstep.mjs` 拒绝 0.0.1 残留 | 待写 | stamp 之前应失败,stamp 之后应通过 |
| `ci.yml lockstep-check` job YAML 解析 | 待写 | actionlint / 仓库本地 PR |
| `release-packages.yml` 4 模式 YAML 解析 | 待写 | actionlint;workflow_dispatch dry-run |
| `release-cadence.yml` cron 表达式 + PR-gen 路径 | 待写 | workflow_dispatch 触发,确认能开 PR |
| Node 22 全部 5 个 ci.yml job 能跑 | 待写 | PR CI 跑一次确认全绿 |
| 33 个包 stamp 后版本号 = 0.1.0 | 待写 | `node -e` 遍历断言 |
| publish.mjs(OIDC,无 NODE_AUTH_TOKEN)在 dry-run 下不调 token | 待写 | 看 `npm publish --dry-run` log 不报缺 token |

---

## 9)已知缺口 / 未来工作

不在本 PR 范围,但应在 follow-up issue 跟踪:

- **single-package 模式的 lockstep 例外**:`publish-single` 模式发 `0.1.1` 单包 patch 时,VERSION 跟着改还是不改?当前设计是改(VERSION = `0.1.1`),所有包下次 publish-all 都会跟到 `0.1.1`。这与"单包 patch"的语义有出入(其他包 minor 仍然是 `0.1`,但 patch 飘了)——本 spec 用 lockstep 检查放过 `0.y.*`,所以不挡 PR;但 follow-up 需要把这条策略写进 versioning-policy
- **changelog 自动化**:`release-cadence.yml` 目前只把 `git log` 塞进 PR body,没用 conventional-commits / changeset。v0 阶段先这样,v1 之前可以接 changesets
- **provenance flag 显式化**:OIDC 模式下 `npm publish` 自动附 provenance,但 NPM_TOKEN fallback 不附。阶段 2 删 fallback 后,publish.mjs 可以加显式 `--provenance` 参数确保 provenance 始终落地
- **release-cadence.yml 的 minor 升级路径**:cron 默认 patch 自增,minor 升级目前要维护者手工改 VERSION + 开 PR。看 v0 后期是否需要 `inputs.bump=patch|minor` 的 workflow_dispatch 选项

---

## 10)spec 自检

- 占位符:无 TBD / TODO / 模糊需求
- 内部一致:VERSION → stamp → publish 链路 §2.2 / §2.3.1 / §4 一致;Trusted Publisher 5 字段 §3.1 / §4.1 一致;阶段 1 / 2 在 §4 / §7 表述一致
- 范围:本 spec 是单一发版治理改造,不混入其他基础设施(满足 `feedback_no_unrelated_fixes`)
- 歧义:已逐条检查,无 "可能 A 也可能 B" 的双解读项;唯一刻意保留的弹性是 §9 第一条 single-package patch 与 lockstep 的边界——已显式说明放过策略并标记 follow-up
