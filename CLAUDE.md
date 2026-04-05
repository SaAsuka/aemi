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

## 既知の注意点
- Vercel Blob `addRandomSuffix: false` → ブラウザキャッシュ問題 → `blobProxyUrl` にtimestamp付与
- Route Handler内の `revalidatePath` はクライアント側に効かない → Server Action経由で呼ぶ
- Vercel Serverlessで短時間DB大量アクセス → プール枯渇注意
- ビルドスクリプトに `prisma migrate deploy` 追加済み
