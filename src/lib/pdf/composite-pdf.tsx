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

Font.register({
  family: "NotoSansJP",
  fonts: [
    { src: "https://fonts.gstatic.com/s/notosansjp/v53/8xJ_pC1EinGcSv41Nh-xTg.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/notosansjp/v53/8xJ_pC1EinGcSv41Nh-xTg.ttf", fontWeight: 700 },
  ],
})

const COLORS = {
  primary: "#1a1a1a",
  secondary: "#666666",
  accent: "#c8a96e",
  bg: "#ffffff",
  lightGray: "#f5f5f5",
  border: "#e0e0e0",
}

const s = StyleSheet.create({
  page: { fontFamily: "NotoSansJP", fontSize: 9, color: COLORS.primary, backgroundColor: COLORS.bg, paddingTop: 50, paddingBottom: 60, paddingHorizontal: 40 },
  header: { position: "absolute", top: 0, left: 0, right: 0, height: 40, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  headerText: { color: "#ffffff", fontSize: 14, letterSpacing: 8, fontWeight: 700 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, height: 50, backgroundColor: COLORS.primary, flexDirection: "row", justifyContent: "center", alignItems: "center", paddingHorizontal: 40, gap: 16 },
  footerText: { color: "#aaaaaa", fontSize: 6 },
  footerBrand: { color: "#ffffff", fontSize: 8, fontWeight: 700, letterSpacing: 2 },

  profileRow: { flexDirection: "row", gap: 20, marginTop: 8 },
  profileLeft: { flex: 1 },
  profileRight: { width: 220, gap: 8 },
  nameJa: { fontSize: 22, fontWeight: 700, marginBottom: 2 },
  nameRomaji: { fontSize: 10, color: COLORS.secondary, letterSpacing: 2, marginBottom: 10 },

  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 10 },
  infoItem: { width: "48%", flexDirection: "row", borderBottom: `0.5 solid ${COLORS.border}`, paddingVertical: 3 },
  infoLabel: { width: 55, fontSize: 7, color: COLORS.secondary },
  infoValue: { flex: 1, fontSize: 8 },

  sectionTitle: { fontSize: 9, fontWeight: 700, color: COLORS.accent, borderBottom: `1 solid ${COLORS.accent}`, paddingBottom: 2, marginTop: 10, marginBottom: 4 },
  snsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  snsItem: { fontSize: 7, color: COLORS.secondary },
  careerText: { fontSize: 7.5, lineHeight: 1.5 },

  photo: { width: "100%", objectFit: "cover" },
  photoBust: { height: 160 },
  photoFull: { flex: 1 },

  galleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  galleryItem: { width: "47%" },
  galleryPhoto: { width: "100%", height: 280, objectFit: "cover" },

  workItem: { flexDirection: "row", gap: 12, marginTop: 12, paddingBottom: 12, borderBottom: `0.5 solid ${COLORS.border}` },
  workPhoto: { width: 200, height: 150, objectFit: "cover" },
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

function formatBirthDate(d: Date | null | undefined): string {
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

function sizeString(t: TalentData): string {
  const parts: string[] = []
  if (t.bust) parts.push(`B${t.bust}`)
  if (t.waist) parts.push(`W${t.waist}`)
  if (t.hip) parts.push(`H${t.hip}`)
  if (t.shoeSize) parts.push(`靴${t.shoeSize}cm`)
  return parts.join(" / ")
}

function ProfilePage({ talent }: { talent: TalentData }) {
  const bustPhoto = talent.photos[0]?.url || talent.profileImage
  const fullPhoto = talent.photos[1]?.url

  const infoItems = ([
    ["生年月日", formatBirthDate(talent.birthDate)],
    ["年齢", calcAge(talent.birthDate)],
    ["身長", talent.height ? `${talent.height}cm` : ""],
    ["サイズ", sizeString(talent)],
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
          {talent.nameRomaji && <Text style={s.nameRomaji}>{talent.nameRomaji}</Text>}
          {talent.category && <Text style={{ fontSize: 8, color: COLORS.secondary, marginBottom: 8 }}>{talent.category}</Text>}

          <View style={s.infoGrid}>
            {infoItems.map(([label, value]) => (
              <View style={s.infoItem} key={label}>
                <Text style={s.infoLabel}>{label}</Text>
                <Text style={s.infoValue}>{value}</Text>
              </View>
            ))}
          </View>

          {snsItems.length > 0 && (
            <>
              <Text style={s.sectionTitle}>SNS</Text>
              <View style={s.snsRow}>
                {snsItems.map(([label, url]) => (
                  <Text style={s.snsItem} key={label}>{label}: {url}</Text>
                ))}
              </View>
            </>
          )}

          {talent.career && (
            <>
              <Text style={s.sectionTitle}>CAREER</Text>
              <Text style={s.careerText}>{talent.career}</Text>
            </>
          )}

          {talent.representativeWork && (
            <>
              <Text style={s.sectionTitle}>代表作</Text>
              <Text style={s.careerText}>{talent.representativeWork}</Text>
            </>
          )}
        </View>

        <View style={s.profileRight}>
          {bustPhoto && <Image style={[s.photo, s.photoBust]} src={bustPhoto} />}
          {fullPhoto && <Image style={[s.photo, s.photoFull]} src={fullPhoto} />}
        </View>
      </View>
      <PageFooter />
    </Page>
  )
}

function GalleryPage({ photos }: { photos: { url: string }[] }) {
  return (
    <Page size="A4" style={s.page}>
      <PageHeader />
      <View style={s.galleryGrid}>
        {photos.map((p, i) => (
          <View style={s.galleryItem} key={i}>
            <Image style={s.galleryPhoto} src={p.url} />
          </View>
        ))}
      </View>
      <PageFooter />
    </Page>
  )
}

function WorksPage({ works }: { works: { imageUrl: string; caption: string }[] }) {
  return (
    <Page size="A4" style={s.page}>
      <PageHeader />
      {works.map((w, i) => (
        <View style={s.workItem} key={i}>
          <Image style={s.workPhoto} src={w.imageUrl} />
          <Text style={s.workCaption}>{w.caption}</Text>
        </View>
      ))}
      <PageFooter />
    </Page>
  )
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}

export function CompositePDF({ talent }: { talent: TalentData }) {
  const galleryPhotos = talent.photos.slice(2)
  const galleryPages = chunk(galleryPhotos, 4)
  const worksPages = chunk(talent.works, 3)

  return (
    <Document>
      <ProfilePage talent={talent} />
      {galleryPages.map((photos, i) => (
        <GalleryPage key={`gallery-${i}`} photos={photos} />
      ))}
      {worksPages.map((works, i) => (
        <WorksPage key={`works-${i}`} works={works} />
      ))}
    </Document>
  )
}
