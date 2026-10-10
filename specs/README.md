# SDD（仕様駆動開発）の進め方

GitHub公式の [spec-kit](https://github.com/github/spec-kit) を導入しています。

```
.specify/memory/constitution.md   ← 開発原則（最初に1度読む。普段は参照のみ）
specs/NNN-機能名/
  spec.md         ← 何を作るか・なぜ（要件）
  plan.md          ← どう作るか（技術設計）
  tasks.md         ← 実行可能な作業単位への分解
```

## 使うコマンド（Claude Codeのスラッシュコマンドとして）

| コマンド | 役割 |
|---|---|
| `/speckit-constitution` | 開発原則(constitution.md)の確認・更新 |
| `/speckit-specify <説明>` | 新しい機能の仕様(spec.md)を作る |
| `/speckit-clarify` | spec.mdの曖昧な点を対話で詰める（plan前に推奨） |
| `/speckit-plan` | 技術計画(plan.md)を作る |
| `/speckit-checklist` | 要件の抜け漏れチェックリストを作る（任意） |
| `/speckit-tasks` | 作業タスク(tasks.md)に分解する |
| `/speckit-analyze` | spec/plan/tasks間の矛盾がないか横断チェック（実装前に推奨） |
| `/speckit-implement` | tasks.mdに沿って実装する |

## 基本の流れ

```
/speckit-specify タレントのプラン変更機能
  → spec.md ができる → 内容を確認
/speckit-clarify（任意・曖昧な点があれば）
/speckit-plan
  → plan.md ができる → 内容を確認
/speckit-analyze（任意・矛盾チェック）
/speckit-tasks
  → tasks.md ができる → 内容を確認
/speckit-implement
  → 実装
```

各段階でユーザーの確認を挟んでから次に進むこと。spec.mdが曖昧なままplan.mdに進まない。

## 技術的な決まりごとは別ファイル

- コーディング規約・認証パターン・既知の罠 → `../CLAUDE.md`
- 進行中・積み残しのタスク → `../../TODO.md`（gitリポジトリの外、`あすかさんタスク/TODO.md`）
- 開発プロセスの原則 → `../.specify/memory/constitution.md`
