import { prisma } from "@/lib/db"

export function trackEvent(
  eventName: string,
  options: {
    userId?: string
    userType?: string
    properties?: Record<string, unknown>
    ip?: string
    ua?: string
  } = {}
) {
  prisma.userEvent
    .create({
      data: {
        eventName,
        userId: options.userId ?? null,
        userType: options.userType ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      properties: options.properties as any,
        ip: options.ip ?? null,
        ua: options.ua ?? null,
      },
    })
    .catch((e) => console.error("[trackEvent]", e))
}
