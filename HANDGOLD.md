# HANDGOLD — relink-logs-gold fork 交接文档

面向未来维护者（人或 AI 会话）的状态交接。项目说明见 [GOLDME.md](./GOLDME.md)（英文）。

## 仓库与分支布局

- **上游**:`villith/relink-logs`，本地 remote 名 `origin`，默认分支 `dev`
- **fork**:`fishing-dev-sm/relink-logs-gold`，本地 remote 名 `fork`
  - URL 用 SSH 别名:`git@github-fishing:fishing-dev-sm/relink-logs-gold.git`
  - 别名定义在 `~/.ssh/config`(`Host github-fishing`)，绑定专用 key `~/.ssh/id_ed25519_fishing_dev_sm`（只加在 fishing-dev-sm 账号上；本机默认 key 属于 simasteria，对该仓库无权限）
- **本地工作目录**:`/home/sim/code/gbfr-logs/relink-logs-linux/`（注意：这个目录里还有另一个分支 `dev` = 激进本地版，含出警/自动观星/bridge 等 25 个本地提交，**与 fork 无关，不要推**)
- **fork 的工作分支**：本地 `gold-rule-toggles`,tracking `fork/dev`
  - 因为本地/远端分支名不同，裸 `git push` 会被 push.default=simple 拒绝；用 `git push fork gold-rule-toggles:dev`，或设一次 `git config push.default upstream`

## 已发布状态（2026-08-09 更新）

- 已发 release:`1.12.10-9000`（功能版）、`1.12.10-9001`（GOLD 品牌版）
- **已合并上游 1.12.11 + 1.12.12**（合并提交 `9806be7`，版本 `1.12.12-9000`,4 个版本文件 + CHANGELOG 已更新，检查通过：tsc 干净，vitest 失败集与上游基线完全一致，cargo check 通过）,**待 dispatch Gold Release**
- 合并时 fork dev 顶端提交序列（旧→新）:
  1. `28f86e9` legality：恢复完美召唤兽报告（RULES_VERSION 10）
  2. `36a85ce` 金色规则开关化（两个 checkbox)
  3. `8322e4a` fork README
  4. `309185f` 版本号 1.12.10-gold
  5. `76b5365` README 链接指向改名后仓库
  6. `7be3a9f` gold-release workflow + fork updater 端点/公钥
  7. `5a98fd4` 版本号改数字预发布（-9000 系列）
  8. `7999f96`/`2506ea1`/`2397182` GOLD 品牌（标题/悬浮窗/产品名/元数据/三语文案）
  9. `cc89f43`/`cdd1115`/`d0b10d5` README 概率表（真实掉落表数字）
  10. `f5c79e8` chore(release): 1.12.10-9001

## 关键设计决策（为什么这么定）

- **checkbox1 完美召唤兽（默认开）**：关 = 前端完全隐藏该 finding（复刻上游 1.12.10)，不是标红——上游从未把它当红。隐藏纯前端做（`visibleFindings`),Rust 审计照常记录，开关即开即有，无需重扫
- **checkbox2 完美上限突破（默认关）**：关 = 红色（上游行为）；开 = 金色 lucky
- **纯函数策略参数化**:`violations.ts` 的 `violationTone/toneOfViolations/findingsTone` 全部要求显式传 `GoldRules`，没有默认值——防止任何调用点漏传而退回隐式策略
- **Cheat Audit 页**:checkbox1 关时，仅被完美召唤兽命中的玩家整人从列表消失（`visibleFlaggedPlayers`)
- **出警功能不在 fork**：上游没有 cheaterCallout，fork 也不带（那是激进版的东西）
- **版本号 9000 系列而不用 `-gold` 字面量**:WiX 的 `convert_version` 对 MSI 目标硬性要求预发布段为纯数字（tauri-bundler wix.rs，已读源码确认）,`-gold` 直接 bail
- **updater 隔离**：端点 + minisign 公钥都指向 fork 自己，双渠道互不染指

## 凭据位置

- minisign 私钥：`~/.tauri/relink-logs-gold.key`（公钥 `.key.pub`，已写进 tauri.conf.json)；私钥内容已配为仓库 secret `TAURI_PRIVATE_KEY`。**私钥丢失 = 永远无法再签发更新，建议备份**
- GitHub 推送：SSH key `~/.ssh/id_ed25519_fishing_dev_sm`（公钥已加到 fishing-dev-sm 账号）
- 仓库 secrets/variables 只需 `TAURI_PRIVATE_KEY` 一个；无密码（`TAURI_KEY_PASSWORD` 不设）

## 本机环境坑（与 fork 改动无关，别再踩）

- **eslint 插件冲突**：根目录 `/home/sim/code/gbfr-logs/` 也有自己的 `.eslintrc.json` + node_modules，嵌套仓库里跑 eslint 会报 "@typescript-eslint plugin not unique"。绕法：`npx eslint --no-eslintrc -c .eslintrc.json`。husky pre-commit 的 lint-staged 因此在这台机器必挂，提交用 `git commit --no-verify`(prettier/eslint 手动跑过）
- **vitest 环境问题**:`usePlayerRow.legality.test.ts` 等写 persist store 的测试整文件失败（localStorage undefined)，干净上游代码同样失败，是基线问题
- **cargo test 跑不起来**：系统 libjxl 已升到 0.12，测试二进制要 0.11；编译能通过，运行不行
- **`time` crate**：上游 lock 里的 0.3.34 在新 rustc 上编译失败，激进版 pin 了 0.3.36;fork 没跟这个 pin（避免无关分歧），本地验证时临时 `cargo update -p time --precise 0.3.36` 后记得还原 Cargo.lock
- **WiX 版本号**：见上"关键设计决策"

## 日常维护流程（上游更新时）

```bash
cd /home/sim/code/gbfr-logs/relink-logs-linux
git checkout gold-rule-toggles
git fetch origin
git merge origin/dev          # 冲突守住两条：RULES_VERSION 取较高值;violations.ts 保持 GoldRules 参数化
npx vitest run && npx tsc --noEmit
# 版本号改为新基底:1.12.11-9000(4 个文件:package.json / tauri.conf.json / Cargo.toml / Cargo.lock)
# CHANGELOG.md 加对应小节(发版正文来源)
git commit --no-verify -am "merge upstream 1.12.11" && git push fork gold-rule-toggles:dev
# 然后 GitHub Actions → Gold Release → Run workflow(dev)
```

## 待办/可选

- [ ] 代码签名：目前未签名（SmartScreen "unknown publisher")。候选：Azure Trusted Signing(~$10/月，上游同款）或 SignPath.io（开源免费，需申请）。用户倾向不付费，暂搁置
- [ ] Scoop 分发可绕过 SmartScreen（包管理器下载不带 MOTW)，未实现
- [ ] 激进版（dev）的金色规则目前是硬编码策略，可反向 port 开关化（未做）
