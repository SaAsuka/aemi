# Specification Quality Checklist: KAMITE案件の提出物を応募フォームで受け取る

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-10
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain（コンポジットの扱いはA：作り直さず管理画面に表示 に決定）
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- 「KAMITEの受け口」「コンポジットPDF」は既存の業務用語として記載（実装の指定ではない）
- 2026-10-10 レビュー反映：プロフィール書き戻し（名前・身長）、コンポジ未登録時は応募不可（サーバー側でも確認）、
  VOZEL案件にも自由項目を追加可能に（US5）、エラー時のふるまい（US6）、本人確認（FR-018）を追加
- 2026-10-10 追加反映：アップロード失敗時は「あとで別途送る」で応募可（送付手段はLINE等の既存運用、システムに機能追加しない）、
  管理者は未提出が分かり応募詳細で回答を登録・修正できる（FR-025a〜c・FR-027a〜b）
- 2026-10-10 analyze 反映：応募フォームからプロフィールは一切書き換えない（名前・身長とも）、
  端末側の失敗報告（/api/form-errors・受付番号は端末で作る・届かなければ後で送る）、
  アップロード30秒停止で中止・送信30秒で操作を戻して応募済み確認（FR-025d〜f）、
  代理応募はコンポジ不問のまま（FR-016）、自動判定の見直し（保護者氏名・プロフィール写真を除外）、
  KAMITE再送で管理者の判定修正を引き継ぐ、未提出は hasMissingAnswers カラムで絞り込む、
  マイグレーションはSQLを見せて承認後に適用（開発原則 第3条）
- 2026-10-10 analyze 2回目反映：削除時は提出物の保存場所を丸ごと消す、「応募済み」でも別途送る案内を出す、
  止まったとき等の確認シナリオをUS6に追加、429は送り直さない、コンポジ判定は最初の依頼どおり
  （「プロフィール」「コンポジ」を含む項目はすべて）に戻す。回数制限後の記録漏れ・KAMITE再送で管理者が
  足した項目が消えることは承知の上での割り切りとして Assumptions に明記
- 2026-10-10 最終 analyze 反映：コンポジットは回答に保存せず、応募詳細でタレントに登録済みのものを表示
  （コンポジットの仕組みは変えない）、削除時に自由項目のファイルは消さない（削除処理は変更しない）、
  回答の読み込みは1件ずつ検証、生年月日未登録なら年齢は入力欄、入力中に項目が変わったら開き直しを案内、
  失敗理由の値を固定、ファイルの確認は案件まで一致、報告の送り直し判定をテスト対象に
- 2026-10-11 再点検反映：管理者の代理応募は自由項目の必須を問わない（回答なしで作り「未提出あり」）、
  コンポジ項目を必須・突き合わせから外す処理を US1（T028）に移動、本人確認できない拒否は
  form_error_logs に記録しない（logger のみ）、絞り込みは応募管理一覧だけ、SC-007a に回数制限の例外を明記
- 決定済み：写真の一括ダウンロードは応募1件ぶん／写真・ファイルは1項目1つ（複数枚は項目を分ける）
- 項目名の言葉での判断は、保存時に確定させ管理画面で直せる形にする（plan.mdで設計）
