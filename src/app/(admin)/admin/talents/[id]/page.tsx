import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowUpRight, ChevronLeft, ChevronRight, Mail, Phone, TrainFront, AlertTriangle } from "lucide-react"
import { getTalent } from "@/lib/actions/talent"
import { TalentEditSheet } from "@/components/admin/talent-edit-sheet"
import { DeleteButton } from "@/components/admin/delete-button"
import { CompositePdfButton } from "@/components/admin/composite-pdf-button"
import { SetPasswordDialog } from "@/components/admin/set-password-dialog"
import { TalentPhotos } from "@/components/admin/talent-photos"
import { TalentWorks } from "@/components/admin/talent-works"
import { TalentAvatar } from "@/components/admin/talent-avatar"
import {
  APPLICATION_TONE,
  StatusChip,
  SUBSCRIPTION_TONE,
  TALENT_STATUS_TONE,
} from "@/components/admin/status-chip"
import { BTN_PRIMARY, BTN_SECONDARY, FIELD, PANEL } from "@/components/admin/styles"
import {
  APPLICATION_STATUS_LABELS,
  GENDER_LABELS,
  TALENT_STATUS_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/types"
import { formatDate, calcAge } from "@/lib/utils/date"

const SOCIAL_LABELS: Record<string, string> = {
  INSTAGRAM: "Instagram",
  X: "X",
  TIKTOK: "TikTok",
  WEBSITE: "公式サイト",
}

// 共通部品（写真・出演写真・コンポジ）の中のボタンを、この画面の黒×白にそろえる
const INNER_BUTTON = `${BTN_SECONDARY} h-9 text-sm`
const DANGER_BUTTON =
  "inline-flex h-9 items-center justify-center rounded-lg border border-red-300 bg-white px-4 text-sm font-medium text-red-600 transition-colors hover:border-red-400 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30"

function Section({
  title,
  count,
  description,
  children,
  className = "",
}: {
  title: string
  count?: number
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`${PANEL} p-5 sm:p-6 ${className}`}>
      <div className="flex items-baseline gap-2">
        <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
        {count !== undefined && <span className="text-sm text-neutral-500">{count}</span>}
      </div>
      {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">{children}</p>
}

export default async function TalentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let talent
  try {
    talent = await getTalent(id)
  } catch (e) {
    console.error(`[TalentDetail] getTalent failed id=${id}`, e instanceof Error ? e.message : e)
    throw e
  }

  if (!talent) notFound()

  const photo = talent.photos[0]?.url ?? talent.profileImage
  const subStatus = talent.subscription?.status ?? "NONE"
  const sub = talent.subscription
  const photoCount = talent.photos.length
  const subtitle = [talent.nameKana, talent.nameRomaji].filter(Boolean).join(" ・ ")
  const hasMeasurements = Boolean(talent.bust || talent.waist || talent.hip)

  const facts = [
    {
      label: "年齢",
      value: talent.birthDate ? `${calcAge(talent.birthDate)}歳` : null,
      sub: talent.birthDate ? formatDate(talent.birthDate) : null,
    },
    { label: "性別", value: talent.gender ? GENDER_LABELS[talent.gender] ?? talent.gender : null },
    { label: "身長", value: talent.height ? `${talent.height}cm` : null },
    {
      label: "B / W / H",
      value: hasMeasurements ? `${talent.bust ?? "—"} / ${talent.waist ?? "—"} / ${talent.hip ?? "—"}` : null,
    },
    { label: "靴", value: talent.shoeSize ? `${talent.shoeSize}cm` : null },
  ]

  const profileItems = [
    { label: "芸名", value: talent.stageName },
    { label: "芸能カテゴリ", value: talent.category },
    { label: "出身地", value: talent.birthplace },
    { label: "特技", value: talent.skills },
    { label: "趣味", value: talent.hobbies },
    { label: "資格", value: talent.qualifications },
  ].filter((item) => item.value)

  const hasProfile =
    profileItems.length > 0 || talent.career || talent.representativeWork || talent.socialLinks.length > 0

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-4">
      <Link
        href="/admin/talents"
        className="-ml-1 inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-sm text-neutral-500 transition-colors hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        タレント管理
      </Link>

      {/* 顔写真・名前・状態・連絡先 */}
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-4 sm:gap-5">
          <TalentAvatar url={photo} name={talent.name} className="size-20 rounded-xl text-2xl sm:size-24" />
          <div className="min-w-0 pt-0.5">
            <h1 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">{talent.name}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <StatusChip
                tone={TALENT_STATUS_TONE[talent.status] ?? "gray"}
                label={TALENT_STATUS_LABELS[talent.status] ?? talent.status}
              />
              <StatusChip
                tone={talent.lineUserId ? "green" : "gray"}
                label={talent.lineUserId ? "LINE連携済" : "LINE未連携"}
              />
              <StatusChip
                tone={SUBSCRIPTION_TONE[subStatus] ?? "gray"}
                label={`サブスク ${SUBSCRIPTION_STATUS_LABELS[subStatus] ?? "未契約"}`}
              />
            </div>
            {(talent.email || talent.phone || talent.nearestStation) && (
              <ul className="mt-3 flex flex-col gap-1.5 text-sm text-neutral-700 sm:flex-row sm:flex-wrap sm:gap-x-5">
                {talent.email && (
                  <li className="min-w-0">
                    <a
                      href={`mailto:${talent.email}`}
                      className="inline-flex max-w-full items-center gap-1.5 hover:text-neutral-950 hover:underline"
                    >
                      <Mail className="size-4 shrink-0 text-neutral-400" aria-hidden="true" />
                      <span className="truncate">{talent.email}</span>
                    </a>
                  </li>
                )}
                {talent.phone && (
                  <li>
                    <a
                      href={`tel:${talent.phone.replace(/[^\d+]/g, "")}`}
                      className="inline-flex items-center gap-1.5 hover:text-neutral-950 hover:underline"
                    >
                      <Phone className="size-4 shrink-0 text-neutral-400" aria-hidden="true" />
                      {talent.phone}
                    </a>
                  </li>
                )}
                {talent.nearestStation && (
                  <li className="inline-flex items-center gap-1.5">
                    <TrainFront className="size-4 shrink-0 text-neutral-400" aria-hidden="true" />
                    {talent.nearestStation}
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
          <TalentEditSheet talent={talent} className={`${BTN_PRIMARY} h-10 sm:h-9`} />
          <SetPasswordDialog talentId={talent.id} talentName={talent.name} className={`${BTN_SECONDARY} h-10 sm:h-9`} />
        </div>
      </div>

      {/* 体格などの要点 */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-5">
        {facts.map((fact, i) => (
          <div
            key={fact.label}
            className={`bg-white px-4 py-3.5 sm:px-5 ${i === facts.length - 1 ? "col-span-2 sm:col-span-1" : ""}`}
          >
            <dt className="text-xs text-neutral-500">{fact.label}</dt>
            <dd className={`mt-1 text-lg font-semibold tracking-tight ${fact.value ? "text-neutral-950" : "text-neutral-300"}`}>
              {fact.value ?? "未登録"}
            </dd>
            {fact.sub && <dd className="text-xs text-neutral-500">{fact.sub}生まれ</dd>}
          </div>
        ))}
      </dl>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <Section title="プロフィール">
            {hasProfile ? (
              <div className="space-y-5">
                {profileItems.length > 0 && (
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    {profileItems.map((item) => (
                      <div key={item.label} className="min-w-0">
                        <dt className="text-xs text-neutral-500">{item.label}</dt>
                        <dd className="mt-1 break-words text-sm text-neutral-950">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {talent.career && (
                  <div className="border-t border-neutral-100 pt-5">
                    <p className="text-xs text-neutral-500">経歴</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-neutral-950">{talent.career}</p>
                  </div>
                )}
                {talent.representativeWork && (
                  <div className="border-t border-neutral-100 pt-5">
                    <p className="text-xs text-neutral-500">代表作</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-neutral-950">
                      {talent.representativeWork}
                    </p>
                  </div>
                )}
                {talent.socialLinks.length > 0 && (
                  <div className="border-t border-neutral-100 pt-5">
                    <p className="text-xs text-neutral-500">SNS・Webサイト</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {talent.socialLinks.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${BTN_SECONDARY} h-8 px-3 text-xs`}
                        >
                          {SOCIAL_LABELS[link.platform] ?? link.platform}
                          <ArrowUpRight className="text-neutral-400" aria-hidden="true" />
                          <span className="sr-only">（新しいタブで開きます）</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Empty>まだ登録されていません。「編集」から追加できます。</Empty>
            )}
          </Section>

          <Section
            title="宣材写真"
            count={photoCount}
            description="ドラッグで並べ替えできます。並び順はコンポジにそのまま使われます。"
          >
            <TalentPhotos talentId={talent.id} photos={talent.photos} buttonClassName={INNER_BUTTON} tileClassName="border-neutral-200" />
            {photoCount === 0 && <div className="mt-4"><Empty>まだ写真がありません。「写真を追加」から登録できます。</Empty></div>}
          </Section>

          <Section title="過去の出演写真" count={talent.works.length} description="作品名などを入力してから「追加」で写真を選びます。">
            <TalentWorks
              talentId={talent.id}
              works={talent.works}
              buttonClassName={INNER_BUTTON}
              inputClassName={`${FIELD} h-9`}
              itemClassName="border-neutral-200"
            />
          </Section>

          <Section title="応募履歴" count={talent.applications.length}>
            {talent.applications.length === 0 ? (
              <Empty>まだ応募はありません</Empty>
            ) : (
              <ul className="-mx-5 divide-y divide-neutral-100 border-t border-neutral-100 sm:-mx-6">
                {talent.applications.map((app) => (
                  <li key={app.id}>
                    <Link
                      href={`/admin/jobs/${app.job.id}`}
                      className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-neutral-50 sm:px-6"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-950">{app.job.title}</p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          応募日 {formatDate(app.appliedAt)}
                          {app.schedule?.date && <> ・ 予定日 {formatDate(app.schedule.date)}</>}
                        </p>
                      </div>
                      <StatusChip
                        tone={APPLICATION_TONE[app.status] ?? "gray"}
                        label={APPLICATION_STATUS_LABELS[app.status] ?? app.status}
                      />
                      <ChevronRight
                        className="size-4 shrink-0 text-neutral-300 transition-colors group-hover:text-neutral-950"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <aside className="min-w-0 space-y-6">
          <Section title="コンポジ（PDF）">
            <p className="text-sm text-neutral-700">
              {talent.resume
                ? talent.resumeSource === "manual"
                  ? "作成済み（手動でアップロードしたPDF）"
                  : "作成済み（宣材写真から自動作成）"
                : "まだ作成されていません"}
            </p>
            {photoCount < 6 && (
              <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-yellow-50 px-3 py-2.5 text-xs leading-relaxed text-yellow-800">
                <AlertTriangle className="mt-px size-4 shrink-0" aria-hidden="true" />
                自動で作成するには宣材写真が6枚以上必要です（いま{photoCount}枚）。PDFをお持ちなら、アップロードもできます。
              </p>
            )}
            <div className="mt-4">
              <CompositePdfButton
                talentId={talent.id}
                resumeUrl={talent.resume}
                resumeSource={talent.resumeSource}
                photoCount={photoCount}
                buttonClassName={INNER_BUTTON}
              />
            </div>
          </Section>

          <Section title="契約・連携">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs text-neutral-500">サブスク</dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusChip
                    tone={SUBSCRIPTION_TONE[subStatus] ?? "gray"}
                    label={SUBSCRIPTION_STATUS_LABELS[subStatus] ?? "未契約"}
                  />
                  {sub?.currentPeriodEnd && (
                    <span className="text-neutral-700">{formatDate(sub.currentPeriodEnd)}まで</span>
                  )}
                </dd>
                {sub?.stripeCustomerId && (
                  <dd className="mt-2">
                    <a
                      href={`https://dashboard.stripe.com/customers/${sub.stripeCustomerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-neutral-950 underline-offset-4 hover:underline"
                    >
                      Stripeで契約を見る
                      <ArrowUpRight className="size-3.5 text-neutral-400" aria-hidden="true" />
                      <span className="sr-only">（新しいタブで開きます）</span>
                    </a>
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-xs text-neutral-500">LINE</dt>
                <dd className="mt-1">
                  <StatusChip tone={talent.lineUserId ? "green" : "gray"} label={talent.lineUserId ? "連携済" : "未連携"} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">登録日</dt>
                <dd className="mt-1 text-neutral-950">{formatDate(talent.createdAt)}</dd>
              </div>
            </dl>
          </Section>

          <Section title="備考" description="社内用のメモです。タレント本人には表示されません。">
            {talent.note ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-950">{talent.note}</p>
            ) : (
              <Empty>備考はありません</Empty>
            )}
          </Section>
        </aside>
      </div>

      {/* 削除はうっかり押さないよう、いちばん下に離して置く */}
      <section className="rounded-xl border border-red-200 bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">このタレントを削除</h2>
          <p className="mt-1 text-sm text-neutral-500">
            応募履歴・予定・宣材写真・出演写真もすべて消え、元に戻せません。
          </p>
        </div>
        <DeleteButton
          id={talent.id}
          type="talent"
          label="削除する"
          className={`${DANGER_BUTTON} mt-4 w-full sm:mt-0 sm:w-auto`}
          confirmMessage={`${talent.name}さんを削除します。\n応募履歴・予定・宣材写真・出演写真もすべて消え、元に戻せません。\n本当に削除しますか？`}
        />
      </section>
    </div>
  )
}
