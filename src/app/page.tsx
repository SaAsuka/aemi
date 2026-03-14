export default function Home() {
  return (
    <main className="min-h-screen">
      {/* ヒーロー */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-black text-white min-h-screen flex items-center">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center w-full">
          <div className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm mb-8">
            月額 ¥4,000 で案件が届き続ける
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            もう案件探しに
            <br />
            <span className="text-accent">時間をかけない。</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10">
            aemiに登録するだけで、あなたに合った案件が続々届く。
            <br className="hidden md:block" />
            モデル・タレントのための案件マッチングプラットフォーム。
          </p>
          <a
            href="#register"
            className="inline-block bg-white text-primary font-bold px-10 py-4 rounded-full text-lg hover:bg-white/90 transition-colors"
          >
            今すぐ登録する
          </a>
          <p className="text-white/40 text-sm mt-4">
            ※ 登録は1分で完了します
          </p>
        </div>
      </section>

      {/* 数字で見るaemi */}
      <section className="py-16 px-6 border-b border-border">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: "500+", label: "月間案件数" },
            { value: "¥4,000", label: "月額料金" },
            { value: "最短即日", label: "案件紹介" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-3xl md:text-4xl font-bold text-primary">
                {item.value}
              </p>
              <p className="text-foreground/50 text-sm mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* こんな悩みありませんか */}
      <section className="py-20 px-6 bg-muted">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            こんな悩み、ありませんか？
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                text: "事務所に所属してないから案件が回ってこない",
              },
              {
                text: "自分で営業するのが苦手で、仕事が安定しない",
              },
              {
                text: "SNSで来る案件は怪しいものばかりで不安",
              },
            ].map((item) => (
              <div
                key={item.text}
                className="bg-white rounded-2xl p-6 border border-border text-center"
              >
                <p className="text-foreground/80 font-medium">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-primary font-bold text-xl mt-10">
            aemiなら、全部解決できます。
          </p>
        </div>
      </section>

      {/* aemiとは */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">aemiとは？</h2>
          <p className="text-center text-foreground/60 mb-12 max-w-2xl mx-auto">
            月額¥4,000で、あなたに合った案件が自動で届くモデル・タレント専用の案件マッチングプラットフォームです。
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "📩",
                title: "案件が届く",
                desc: "登録するだけでLINEに案件情報が届きます。自分から探す必要はありません。",
              },
              {
                icon: "✅",
                title: "審査済み案件のみ",
                desc: "すべての案件は事前に審査済み。怪しい案件は一切ありません。",
              },
              {
                icon: "⚡",
                title: "応募はワンタップ",
                desc: "気になる案件はLINEからワンタップで応募。面倒な手続きは不要です。",
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <span className="text-4xl block mb-4">{item.icon}</span>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-foreground/60 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 案件ジャンル */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary via-primary-dark to-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">取り扱い案件ジャンル</h2>
          <p className="text-white/60 mb-12">
            幅広いジャンルの案件を取り揃えています
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "広告モデル",
              "ファッションショー",
              "雑誌撮影",
              "CM出演",
              "イベント出演",
              "SNS案件",
              "ブライダルモデル",
              "フィッティング",
            ].map((genre) => (
              <div
                key={genre}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl py-4 px-3"
              >
                <p className="font-medium">{genre}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 料金 */}
      <section className="py-20 px-6">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">料金プラン</h2>
          <div className="bg-white border-2 border-primary rounded-3xl p-8 text-center shadow-lg shadow-primary/10">
            <p className="text-sm text-primary font-semibold mb-2">
              MONTHLY PLAN
            </p>
            <div className="flex items-end justify-center gap-1 mb-2">
              <span className="text-5xl font-bold">¥4,000</span>
              <span className="text-foreground/50 mb-1">/月</span>
            </div>
            <p className="text-foreground/50 text-sm mb-8">税込</p>
            <ul className="text-left space-y-4 mb-8">
              {[
                "案件の紹介が無制限で届く",
                "LINEでかんたん応募",
                "審査済みの安心案件のみ",
                "プロフィール登録サポート",
                "いつでも解約OK",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <span className="text-primary mt-0.5">●</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <a
              href="#register"
              className="block w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-full text-lg transition-colors"
            >
              登録する
            </a>
          </div>
        </div>
      </section>

      {/* 利用者の声 */}
      <section className="py-20 px-6 bg-muted">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">利用者の声</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Aさん（20代女性）",
                text: "事務所に入らなくても案件が来るのが本当にありがたい。登録して1週間で初案件が決まりました！",
              },
              {
                name: "Bさん（20代男性）",
                text: "月4,000円でこれだけ案件が届くのはコスパ良すぎ。副業モデルでも無理なく続けられます。",
              },
              {
                name: "Cさん（30代女性）",
                text: "自分で営業しなくていいから本業に集中できる。案件の質も高くて安心です。",
              },
            ].map((item) => (
              <div
                key={item.name}
                className="bg-white rounded-2xl p-6 border border-border"
              >
                <p className="text-foreground/70 text-sm mb-4">
                  &ldquo;{item.text}&rdquo;
                </p>
                <p className="text-sm font-bold text-foreground/50">
                  {item.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 登録ステップ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            登録はかんたん3ステップ
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "LINE登録",
                desc: "公式LINEを友達追加するだけ",
              },
              {
                step: "2",
                title: "プロフィール入力",
                desc: "写真・経歴・希望条件を登録",
              },
              {
                step: "3",
                title: "案件が届く",
                desc: "あなたに合った案件がLINEに届きます",
              },
            ].map((item, i) => (
              <div key={item.step} className="text-center relative">
                <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-foreground/60 text-sm">{item.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-7 -right-4 text-primary/30 text-3xl">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="register"
        className="py-24 px-6 bg-gradient-to-br from-primary via-primary-dark to-black text-white"
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            案件探しは、もう終わり。
          </h2>
          <p className="text-white/60 mb-10">
            aemiに登録して、あなたに合った案件を受け取りましょう。
          </p>
          <a
            href="#"
            className="inline-flex items-center justify-center gap-3 bg-[#06C755] hover:bg-[#05b34a] text-white font-bold px-10 py-5 rounded-full text-xl transition-colors shadow-lg shadow-black/30"
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            LINEで今すぐ登録
          </a>
          <p className="text-white/30 text-sm mt-4">
            月額¥4,000（税込）・いつでも解約可能
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">よくある質問</h2>
          <div className="space-y-6">
            {[
              {
                q: "未経験でも登録できますか？",
                a: "はい、未経験の方も大歓迎です。プロフィール登録のサポートも行っています。",
              },
              {
                q: "案件を断ることはできますか？",
                a: "もちろんです。届いた案件の中から、興味のあるものだけに応募すればOKです。",
              },
              {
                q: "解約はいつでもできますか？",
                a: "はい、LINEからいつでも解約可能です。違約金などは一切ありません。",
              },
              {
                q: "どんな案件がありますか？",
                a: "広告モデル、ファッションショー、雑誌撮影、CM、イベント出演など幅広いジャンルの案件を取り扱っています。",
              },
            ].map((item) => (
              <div key={item.q} className="border-b border-border pb-6">
                <h3 className="font-bold mb-2">Q. {item.q}</h3>
                <p className="text-foreground/60">A. {item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="py-8 px-6 text-center text-foreground/40 text-sm border-t border-border">
        <p>&copy; 2025 aemi. All rights reserved.</p>
      </footer>
    </main>
  );
}
