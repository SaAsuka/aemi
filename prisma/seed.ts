import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // 既存データ全削除（依存順）
  await prisma.schedule.deleteMany()
  await prisma.application.deleteMany()
  await prisma.job.deleteMany()
  await prisma.talent.deleteMany()
  await prisma.client.deleteMany()

  // === タレント ===
  const reika = await prisma.talent.create({
    data: {
      name: "れいか",
      nameKana: "レイカ",
      gender: "FEMALE",
      birthDate: new Date("2003-08-03"),
      height: 163,
      bust: 82,
      waist: 79,
      hip: 86,
      shoeSize: 23.5,
      skills: "15時間しゃべり続けること、インドネシア語",
      hobbies: "お洋服、アニメ、海外旅行",
      career: [
        "non-no 専属読者モデル ミスコングランプリ",
        "TVCM「きらめきパラダイス」千鳥さんとメイン出演",
        "TVCM「ガスター10」",
        "TBS出演",
        "マルイモデル",
        "振袖モデル",
      ].join("\n"),
      status: "ACTIVE",
    },
  })

  const tomo = await prisma.talent.create({
    data: {
      name: "山本トモ",
      nameKana: "ヤマモトトモ",
      gender: "FEMALE",
      birthDate: new Date("1986-06-19"),
      height: 166,
      bust: 78,
      waist: 58,
      hip: 77,
      shoeSize: 24,
      hobbies: "ホットヨガ",
      career: [
        "2021年 ミセスグローバルアース関東ファイナリスト",
        "損保ジャパン",
        "グランドハイアット系列雑誌撮影",
        "各種広告モデル",
      ].join("\n"),
      status: "ACTIVE",
    },
  })

  const yamato = await prisma.talent.create({
    data: {
      name: "大和",
      nameKana: "ヤマト",
      gender: "MALE",
      birthDate: new Date("1995-02-20"),
      height: 180,
      bust: 95,
      waist: 75,
      hip: 85,
      shoeSize: 27.5,
      skills: "ソフトテニス、殺陣",
      hobbies: "釣り、料理、ゴルフ",
      career: [
        "ハリウッド映画「プリズナーズオブゴーストランド」",
        "Netflix「愛なき森で叫べ」",
        "ドラマ「執事西園寺の名推理2」",
        "ドラマ「神様のカルテ」",
        "宮本亜門演出 舞台「降臨」",
      ].join("\n"),
      status: "ACTIVE",
    },
  })

  // === クライアント ===
  const asahi = await prisma.client.create({
    data: {
      companyName: "アサヒビール",
      note: "ビール・飲料メーカー",
    },
  })

  const kao = await prisma.client.create({
    data: {
      companyName: "花王",
      note: "キュレル等スキンケアブランド",
    },
  })

  const medical = await prisma.client.create({
    data: {
      companyName: "製薬会社（医療コンテンツ）",
      note: "医療従事者向け動画制作",
    },
  })

  // === 案件 ===
  const jobAsahi = await prisma.job.create({
    data: {
      clientId: asahi.id,
      title: "アサヒビール 阿部寛さんスタンドイン",
      description: [
        "阿部寛さんご本人：身長189cm 年齢61歳",
        "スタンドイン募集",
        "",
        "※朝からの予定の為、始発で何時にスタジオ到着できるかも記載願います。",
        "身長差は前後2～3cm差まで",
      ].join("\n"),
      location: "246スタジオ（神奈川県川崎市高津区久地2丁目22-12）",
      fee: 15000,
      ageMin: 20,
      ageMax: 55,
      heightMin: 186,
      heightMax: 192,
      startsAt: new Date("2026-03-26T00:00:00"),
      endsAt: new Date("2026-03-26T23:59:59"),
      deadline: new Date("2026-03-23T12:00:00"),
      capacity: 1,
      status: "OPEN",
      note: "金額は税別・交通費込",
    },
  })

  const jobKao = await prisma.job.create({
    data: {
      clientId: kao.id,
      title: "花王キュレル WEBCMスタンドイン",
      description: [
        "キュレルのWEBCM撮影にて、メインキャストのスタンドインを募集",
        "夏の酷暑見舞いという設定のもと、化粧水・乳液・クリームを使用",
      ].join("\n"),
      location: "都内スタジオ（予定）",
      genderReq: "FEMALE",
      deadline: new Date("2026-03-23T16:00:00"),
      status: "OPEN",
      note: "詳細条件は別途確認",
    },
  })

  const jobMedical = await prisma.job.create({
    data: {
      clientId: medical.id,
      title: "医療従事者向け動画 ナレーション・演者",
      description: [
        "条件（対象）",
        "ナレーション/医師役：30～40代の男性の方",
        "専任看護師役/患者役：30～40代の女性の方",
        "※男女各1名の合計2名起用予定ですが、1人2役をお願いする予定です。",
        "※声のみのご出演ですので顔出し等はございません。",
        "",
        "媒体：営業ツール、学会や講演会で使用、医療従事者向けHP",
        "※一般公開ではなく医師向けの動画",
        "使用期間：買取",
        "競合：なし",
        "",
        "選考：書類・ボイスサンプル選考",
        "※プロフィールはJPGまたはPDFでお願い致します。",
      ].join("\n"),
      location: "都内予定",
      ageMin: 30,
      ageMax: 49,
      startsAt: new Date("2026-04-13T00:00:00"),
      endsAt: new Date("2026-04-19T23:59:59"),
      capacity: 2,
      status: "OPEN",
      note: "4/13〜4/19のうち1日。使用期間は買取。",
    },
  })

  console.log("シードデータ投入完了")
  console.log(`タレント: ${reika.name}, ${tomo.name}, ${yamato.name}`)
  console.log(`クライアント: ${asahi.companyName}, ${kao.companyName}, ${medical.companyName}`)
  console.log(`案件: ${jobAsahi.title}, ${jobKao.title}, ${jobMedical.title}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
