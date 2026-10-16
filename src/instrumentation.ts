import type { Instrumentation } from "next";

// 本番で画面やAPIが落ちたら、齊藤さんの秘書LINEへ知らせる（中身は src/lib/error-alert.ts）
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.VERCEL_ENV !== "production") return;
  try {
    const { reportServerError } = await import("@/lib/error-alert");
    await reportServerError({
      message: err instanceof Error ? err.message : String(err),
      digest: typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined,
      method: request.method,
      path: request.path,
      routePath: context.routePath,
      routeType: context.routeType,
    });
  } catch {
    // 知らせる側が落ちても、元の処理には影響させない
  }
};
