# VOZEL (AEMI) プロジェクト

## 技術スタック
- Next.js 16 (App Router) + Prisma + Vercel Blob (private) + Vercel デプロイ
- 認証: iron-session（Cookie名 `aemi_session`）
- Node.js 22必須（20だとPrisma CLIがESMエラー）

## 認証パターン

### SessionData
`{ talentId?: string, role?: "talent" | "admin" }`

### 認証関数 (`src/lib/auth.ts`)
- `requireAdmin()` — admin以外は `/admin/login` にリダイレクト
- `requireTalent()` — talent認証 + セットアップ完了チェック（nameKana未設定なら `/setup` へ）
  - select: id, name, nameKana, stageName, category, status, gender, birthDate, height, email, subscriptionStatus, currentPeriodEnd
- `requireTalentRaw()` — セットアップ未完了も許可

### Server Actionの認証
- talent-photo/talent-work: 全関数冒頭で `verifyTalentAccess(talentId)` を呼ぶ
  - admin → 任意のtalentId操作可 / talent → 自分のIDのみ / それ以外 → throw
- talent-mypage: `getSession()` で自身のtalentIdを取得（他人のID指定不可）
- talent.ts（管理画面用）: ページ側で `requireAdmin()` 済み

## DBクエリ使い分け (`src/lib/actions/talent.ts`)

| 関数 | 用途 | データ量 |
|------|------|---------|
| `getTalent(id)` | 管理画面タレント詳細 | 全include + accessToken生成 |
| `getTalentApplications(talentId)` | マイページ応募履歴 | applicationsのみ |
| `getTalentForSettings(talentId)` | マイページ設定 | photos+worksのみ |
| `getTalents(filters)` | 管理画面一覧 | select（軽量） |
| `getTalentByToken(token)` | 外部アクセス | select（最小限） |

## キャッシュ戦略
- 管理画面のタレント更新: `updateTag("talents")` のみ
- マイページからの更新: `revalidatePath` + `updateTag("talents")`
- 写真/作品: `revalidatePath` で該当パスのみ

## Prisma カスケード
- TalentPhoto/TalentWork → Talent: Cascade あり
- Application → Talent: なし（手動削除）
- Schedule → Application: なし（手動削除）
- deleteTalent: schedule → application → talent の順で削除

## 環境構成
- **本番環境**: `main` ブランチ
- **テスト環境**: `vozel-test` ブランチ

## 環境運用ルール
- **本番環境（main）へのマージはユーザーの明示的な許可なく行わない**
- 作業開始時は、本番（main）・テスト（vozel-test）両ブランチを最新に pull してから始める

## ブラウザ互換性

フォームや画面を新規実装・修正する際は以下を確認すること。

### フォーム
- **`<form>` には必ず `noValidate` を付ける**
  iOS SafariではブラウザネイティブバリデーションがReactの `onSubmit` より先に発火し、独自エラーメッセージが表示されない場合がある
- **バリデーションはZod（サーバー）またはReact（クライアント）で実装する**
  HTMLの `required`・`minLength`・`type="email"` などブラウザ標準バリデーションには依存しない

### レイアウト
- **`min-h-screen`（100vh）はiOS Safariで高さが不足することがある**
  アドレスバーの表示・非表示により入力欄やボタンが隠れる場合がある。必要に応じて `100dvh` や `min-h-[100dvh]` を使用する
- **仮想キーボード表示時は `position: fixed` の表示を確認する**
  iOS Safari・Android Chromeではキーボード表示時に位置がずれることがある

### 入力
- **`type="date"`・`time`・`datetime-local` はブラウザごとにUIが異なる**
  デザインや操作性に依存する場合はライブラリ（例：Flatpickr）を使用する
- **`autocomplete` を適切に設定する**
  Safari・Chromeで自動入力挙動が異なるため、ログイン・会員登録画面では確認する

### CSS
- **SafariやWebViewで未対応・挙動差のあるCSSを使用していないか確認する**
  `backdrop-filter`・`position: sticky`・`100vh`・`overflow: hidden`・`:has()`・`aspect-ratio`
  新しいCSSを使用する場合は対応ブラウザを確認する

### JavaScript
- **Clipboard API・Share APIなどブラウザ依存APIはフォールバックを用意する**
- **`Intl`・`URL` など新しいAPIを利用する場合は対象ブラウザで動作確認する**

### このプロジェクト固有
- **LINE内蔵ブラウザ（WebView）に注意する**
  タレントがLINEアプリ経由でアクセスするケースがあり、写真アップロード（カメラ・ライブラリアクセス）などでSafari・Chromeと挙動が異なる場合がある

### 動作確認
最低限以下のブラウザで確認する。

| ブラウザ | 確認内容 |
|---------|---------|
| Chrome | PC・Android |
| Safari | iPhone・iPad |
| Edge | Windows |
| Firefox | PC（必要に応じて） |

## 既知の注意点
- Vercel Blob `addRandomSuffix: false` → ブラウザキャッシュ問題 → `blobProxyUrl` にtimestamp付与
- Route Handler内の `revalidatePath` はクライアント側に効かない → Server Action経由で呼ぶ
- Vercel Serverlessで短時間DB大量アクセス → プール枯渇注意
- ビルドスクリプトに `prisma migrate deploy` 追加済み
