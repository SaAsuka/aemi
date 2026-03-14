export default function Home() {
  return (
    <main className="min-h-screen">
      {/* ヒーロー */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 py-24 md:py-32 text-center">
          <p className="text-accent text-sm font-semibold tracking-widest mb-4">
            BUSINESS DX CONSULTING
          </p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            業務を仕組み化して
            <br />
            <span className="text-accent">利益に集中</span>できる体制へ
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
            面倒な手作業、属人化した業務フローを
            <br className="hidden md:block" />
            可視化・自動化して、あなたのビジネスを加速します。
          </p>
          <a
            href="#contact"
            className="inline-block bg-accent hover:bg-accent-dark text-foreground font-bold px-8 py-4 rounded-full text-lg transition-colors"
          >
            無料で相談する
          </a>
        </div>
      </section>

      {/* 課題 */}
      <section className="py-20 px-6 bg-muted">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            こんなお悩みありませんか？
          </h2>
          <p className="text-center text-foreground/60 mb-12">
            一つでも当てはまったら、業務改善のチャンスです
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: "😰",
                title: "手作業が多すぎて時間が足りない",
                desc: "案件の展開、履歴書の送付、スケジュール入力…全部手動でやっていませんか？",
              },
              {
                icon: "📋",
                title: "管理がスプシ頼みで限界",
                desc: "スケジュールの重複、入力漏れ、誰が何の案件か把握しきれない…",
              },
              {
                icon: "💸",
                title: "請求・入金管理が煩雑",
                desc: "請求書の発行タイミング、入金確認、サブスク解約の管理が追いつかない",
              },
              {
                icon: "📩",
                title: "集客が属人化している",
                desc: "インスタDMの送信、フォローアップを個人の感覚で回している",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-foreground/60 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* サービス内容 */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            aemi が提供するDXソリューション
          </h2>
          <p className="text-center text-foreground/60 mb-12">
            現状の業務フローを可視化し、段階的に自動化を実現します
          </p>
          <div className="space-y-8">
            {[
              {
                step: "01",
                title: "業務フローの可視化・整理",
                desc: "現在の業務を丁寧にヒアリングし、フロー図として可視化。ボトルネックや無駄を特定します。",
                tags: ["ヒアリング", "フロー図作成", "課題抽出"],
              },
              {
                step: "02",
                title: "案件配信・マッチングの自動化",
                desc: "案件情報の受信から登録者への配信までを自動化。条件に合った人材に自動でマッチングします。",
                tags: ["LINE連携", "自動配信", "条件フィルタ"],
              },
              {
                step: "03",
                title: "書類作成・スケジュール管理の自動化",
                desc: "履歴書等の提出資料を自動生成。スケジュール管理表への自動記録と重複アラートで、ミスを防ぎます。",
                tags: ["資料自動生成", "重複検知", "アラート"],
              },
              {
                step: "04",
                title: "集客・DM送信の効率化",
                desc: "ターゲットリストに基づくインスタDMの自動送信、フォローアップの自動リマインドを構築します。",
                tags: ["Instagram連携", "自動DM", "リマインド"],
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-6 items-start bg-muted rounded-2xl p-6 md:p-8"
              >
                <span className="text-4xl font-bold text-primary/20 shrink-0">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-foreground/60 mb-3">{item.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 導入効果 */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">導入による効果</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { value: "80%", label: "手作業の削減", sub: "案件配信・書類作成" },
              {
                value: "0件",
                label: "ダブルブッキング",
                sub: "自動重複チェック",
              },
              { value: "2x", label: "集客効率UP", sub: "DM自動送信" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-5xl font-bold text-accent mb-2">
                  {item.value}
                </p>
                <p className="text-lg font-semibold">{item.label}</p>
                <p className="text-white/60 text-sm">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 導入ステップ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            導入までの流れ
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "無料相談",
                desc: "現在の業務内容・課題をヒアリング",
              },
              {
                step: "2",
                title: "フロー整理",
                desc: "業務フローを可視化し、改善ポイントを特定",
              },
              {
                step: "3",
                title: "提案・見積",
                desc: "自動化プラン・導入スケジュールをご提案",
              },
              {
                step: "4",
                title: "構築・運用",
                desc: "システム構築から運用サポートまで伴走",
              },
            ].map((item, i) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-foreground/60 text-sm">{item.desc}</p>
                {i < 3 && (
                  <div className="hidden md:block text-primary/30 text-2xl mt-4">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-20 px-6 bg-muted">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            まずは無料でご相談ください
          </h2>
          <p className="text-foreground/60 mb-8">
            業務フローの整理だけでもOK。
            <br />
            お気軽にDMまたはLINEからお問い合わせください。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 bg-[#06C755] hover:bg-[#05b34a] text-white font-bold px-8 py-4 rounded-full text-lg transition-colors"
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              LINEで相談
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888] hover:opacity-90 text-white font-bold px-8 py-4 rounded-full text-lg transition-opacity"
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              Instagramで相談
            </a>
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
