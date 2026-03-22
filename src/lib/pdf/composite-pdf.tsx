import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer"

export function registerFonts() {
  Font.register({
    family: "NotoSansJP",
    fonts: [
      { src: "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/JP/NotoSansJP-Regular.otf", fontWeight: 400 },
      { src: "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/JP/NotoSansJP-Bold.otf", fontWeight: 700 },
    ],
  })
  Font.registerHyphenationCallback(word => [word])
}

registerFonts()

const C = {
  primary: "#1a1a1a",
  secondary: "#666666",
  accent: "#c8a96e",
  border: "#e0e0e0",
}

const s = StyleSheet.create({
  page: { fontFamily: "NotoSansJP", fontSize: 9, color: C.primary, backgroundColor: "#ffffff", paddingTop: 50, paddingBottom: 60, paddingHorizontal: 40 },
  header: { position: "absolute", top: 0, left: 0, right: 0, height: 40, backgroundColor: C.primary, justifyContent: "center", alignItems: "center" },
  headerText: { color: "#ffffff", fontSize: 14, letterSpacing: 8, fontWeight: 700 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, height: 50, backgroundColor: C.primary, flexDirection: "row", justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  footerText: { color: "#aaaaaa", fontSize: 6, marginHorizontal: 8 },
  footerBrand: { color: "#ffffff", fontSize: 8, fontWeight: 700, letterSpacing: 2, marginHorizontal: 8 },

  profileRow: { flexDirection: "row", marginTop: 8 },
  profileLeft: { flex: 1, paddingRight: 16 },
  profileRight: { width: 220 },
  nameJa: { fontSize: 22, fontWeight: 700, marginBottom: 2 },
  nameRomaji: { fontSize: 10, color: C.secondary, letterSpacing: 2, marginBottom: 10 },

  infoGrid: { marginBottom: 10 },
  infoItem: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.border, borderBottomStyle: "solid", paddingVertical: 3, marginBottom: 2 },
  infoLabel: { width: 55, fontSize: 7, color: C.secondary },
  infoValue: { flex: 1, fontSize: 8 },

  sectionTitle: { fontSize: 9, fontWeight: 700, color: C.accent, borderBottomWidth: 1, borderBottomColor: C.accent, borderBottomStyle: "solid", paddingBottom: 2, marginTop: 10, marginBottom: 4 },
  snsItem: { fontSize: 7, color: C.secondary, marginBottom: 2 },
  careerText: { fontSize: 7.5, lineHeight: 1.5 },

  photo: { width: "100%", objectFit: "contain" },
  photoBust: { height: 300, marginBottom: 8 },
  photoFull: { height: 400 },

  photoGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  photoGridItem: { width: "48%", marginRight: "2%", marginBottom: 12 },
  photoGridImage: { width: "100%", height: 330, objectFit: "contain" },

  workItem: { flexDirection: "row", marginTop: 12, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: C.border, borderBottomStyle: "solid" },
  workPhoto: { width: 200, height: 150, objectFit: "contain", marginRight: 12 },
  workCaption: { flex: 1, fontSize: 9, paddingTop: 4 },
})

function PageHeader() {
  return (
    <View style={s.header} fixed>
      <Text style={s.headerText}>P R O F I L E</Text>
    </View>
  )
}

function PageFooter() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerBrand}>VOZEL</Text>
      <Text style={s.footerText}>株式会社iRup</Text>
      <Text style={s.footerText}>〒108-0014 東京都港区芝5-15-2 UB.TASUKIMITA 9F</Text>
      <Text style={s.footerText}>TEL: 03-4400-2448</Text>
    </View>
  )
}

type TalentData = {
  name: string
  nameKana: string
  nameRomaji?: string | null
  birthDate?: Date | null
  height?: number | null
  bust?: number | null
  waist?: number | null
  hip?: number | null
  shoeSize?: number | null
  skills?: string | null
  hobbies?: string | null
  qualifications?: string | null
  career?: string | null
  category?: string | null
  birthplace?: string | null
  representativeWork?: string | null
  instagramUrl?: string | null
  xUrl?: string | null
  tiktokUrl?: string | null
  websiteUrl?: string | null
  profileImage?: string | null
  photos: { url: string }[]
  works: { imageUrl: string; caption: string }[]
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return ""
  const dt = new Date(d)
  return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日`
}

function calcAge(d: Date | null | undefined): string {
  if (!d) return ""
  const bd = new Date(d)
  const now = new Date()
  let age = now.getFullYear() - bd.getFullYear()
  if (now.getMonth() < bd.getMonth() || (now.getMonth() === bd.getMonth() && now.getDate() < bd.getDate())) age--
  return `${age}歳`
}

function sizeStr(t: TalentData): string {
  const p: string[] = []
  if (t.bust) p.push(`B${t.bust}`)
  if (t.waist) p.push(`W${t.waist}`)
  if (t.hip) p.push(`H${t.hip}`)
  if (t.shoeSize) p.push(`靴${t.shoeSize}cm`)
  return p.join(" / ")
}

// 1ページ目: 左にプロフィール、右にバストアップ＋全身
function ProfilePage({ talent }: { talent: TalentData }) {
  const bustPhoto = talent.photos[0]?.url || talent.profileImage || null
  const fullPhoto = talent.photos[1]?.url || null

  const infoItems = ([
    ["生年月日", fmtDate(talent.birthDate)],
    ["年齢", calcAge(talent.birthDate)],
    ["身長", talent.height ? `${talent.height}cm` : ""],
    ["サイズ", sizeStr(talent)],
    ["出身地", talent.birthplace || ""],
    ["特技", talent.skills || ""],
    ["趣味", talent.hobbies || ""],
    ["資格", talent.qualifications || ""],
  ] as [string, string][]).filter(([, v]) => v)

  const snsItems = ([
    ["Instagram", talent.instagramUrl || ""],
    ["X", talent.xUrl || ""],
    ["TikTok", talent.tiktokUrl || ""],
    ["HP", talent.websiteUrl || ""],
  ] as [string, string][]).filter(([, v]) => v)

  return (
    <Page size="A4" style={s.page}>
      <PageHeader />
      <View style={s.profileRow}>
        <View style={s.profileLeft}>
          <Text style={s.nameJa}>{talent.name}</Text>
          {talent.nameRomaji ? <Text style={s.nameRomaji}>{talent.nameRomaji}</Text> : null}
          {talent.category ? <Text style={{ fontSize: 8, color: C.secondary, marginBottom: 8 }}>{talent.category}</Text> : null}

          <View style={s.infoGrid}>
            {infoItems.map(([label, value]) => (
              <View style={s.infoItem} key={label}>
                <Text style={s.infoLabel}>{label}</Text>
                <Text style={s.infoValue}>{value}</Text>
              </View>
            ))}
          </View>

          {snsItems.length > 0 ? (
            <View>
              <Text style={s.sectionTitle}>SNS</Text>
              {snsItems.map(([label, url]) => (
                <Text style={s.snsItem} key={label}>{label}: {url}</Text>
              ))}
            </View>
          ) : null}
        </View>

        <View style={s.profileRight}>
          {bustPhoto ? <Image style={[s.photo, s.photoBust]} src={bustPhoto} /> : null}
          {fullPhoto ? <Image style={[s.photo, s.photoFull]} src={fullPhoto} /> : null}
        </View>
      </View>
      <PageFooter />
    </Page>
  )
}

// 2ページ目: 写真4枚グリッド
function PhotoGridPage({ photos }: { photos: { url: string }[] }) {
  return (
    <Page size="A4" style={s.page}>
      <PageHeader />
      <View style={s.photoGrid}>
        {photos.map((p, i) => (
          <View style={s.photoGridItem} key={i}>
            <Image style={s.photoGridImage} src={p.url} />
          </View>
        ))}
      </View>
      <PageFooter />
    </Page>
  )
}

// 3ページ目以降: 経歴・代表作・出演実績
function CareerPage({ talent }: { talent: TalentData }) {
  return (
    <Page size="A4" style={s.page}>
      <PageHeader />
      <Text style={s.nameJa}>{talent.name}</Text>
      {talent.nameRomaji ? <Text style={s.nameRomaji}>{talent.nameRomaji}</Text> : null}

      {talent.career ? (
        <View>
          <Text style={s.sectionTitle}>CAREER</Text>
          <Text style={s.careerText}>{talent.career}</Text>
        </View>
      ) : null}

      {talent.representativeWork ? (
        <View>
          <Text style={s.sectionTitle}>代表作</Text>
          <Text style={s.careerText}>{talent.representativeWork}</Text>
        </View>
      ) : null}

      {talent.works.length > 0 ? (
        <View>
          <Text style={s.sectionTitle}>出演実績</Text>
          {talent.works.map((w, i) => (
            <View style={s.workItem} key={i}>
              <Image style={s.workPhoto} src={w.imageUrl} />
              <Text style={s.workCaption}>{w.caption}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <PageFooter />
    </Page>
  )
}

export function CompositePDF({ talent }: { talent: TalentData }) {
  const gridPhotos = talent.photos.slice(2, 6)
  const hasCareer = talent.career || talent.representativeWork || talent.works.length > 0

  return (
    <Document>
      <ProfilePage talent={talent} />
      {gridPhotos.length > 0 && <PhotoGridPage photos={gridPhotos} />}
      {hasCareer && <CareerPage talent={talent} />}
    </Document>
  )
}
