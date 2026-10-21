"use client"

// 写真などをドラッグで並べ替えるグリッド（宣材写真の並べ替えで使う）
// ブラウザ標準のドラッグ（HTML5 Drag and Drop）はスマホ・タブレットで動かず、Firefox では掴めないため、
// マウス・タッチ・キーボードのどれでも動く dnd-kit を使う。
// - マウス：5px 動かしたら掴む（ボタンのクリックは今までどおり効く）
//   中に文字の入力欄がある並び（過去作品など）は dragFrom="handle" にして、つまみからだけ掴む
// - タッチ：0.25 秒長押ししたら掴む（それより前に指を動かせば、ふつうに画面がスクロールする）
// - キーボード：つまみ（handleProps を付けた要素）に移動して Space で掴み、矢印キーで動かし、Space で置く

import { useId } from "react"
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

export type SortableRenderState = {
  // つまみ（キーボード操作・読み上げ用）に付ける属性
  handleProps: React.HTMLAttributes<HTMLElement> & { ref: (element: HTMLElement | null) => void }
  isDragging: boolean
}

export function SortableGrid<T extends { id: string }>({
  items,
  onReorder,
  className,
  renderItem,
  dragFrom = "item",
  unit = "枚",
}: {
  items: T[]
  // 並べ替えたあとの並び（新しい配列）。保存はここで行う
  onReorder: (next: T[]) => void
  className?: string
  renderItem: (item: T, index: number, state: SortableRenderState) => React.ReactNode
  // item：枠のどこを掴んでも動かせる / handle：つまみ（handleProps を付けた要素）からだけ動かせる
  dragFrom?: "item" | "handle"
  // 読み上げで使う数え方（写真なら「枚」、作品なら「件」）
  unit?: string
}) {
  // 読み上げ用の説明の id をサーバーとブラウザでそろえる（自動の連番だと表示のずれの警告が出る）
  const dndId = useId()
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = items.findIndex((i) => i.id === active.id)
    const to = items.findIndex((i) => i.id === over.id)
    if (from < 0 || to < 0) return
    onReorder(arrayMove(items, from, to))
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{
        screenReaderInstructions: {
          draggable: "Space キーで掴み、矢印キーで動かして、もう一度 Space キーで置きます。Esc キーで取り消します。",
        },
        announcements: {
          onDragStart: ({ active }) => `${items.findIndex((i) => i.id === active.id) + 1} ${unit}目を掴みました`,
          onDragOver: ({ over }) => (over ? `${items.findIndex((i) => i.id === over.id) + 1} ${unit}目の位置` : ""),
          onDragEnd: ({ over }) => (over ? `${items.findIndex((i) => i.id === over.id) + 1} ${unit}目に置きました` : "置く場所がありません"),
          onDragCancel: () => "並べ替えを取り消しました",
        },
      }}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        <div className={className}>
          {items.map((item, index) => (
            <SortableItem key={item.id} id={item.id} dragFrom={dragFrom}>
              {(state) => renderItem(item, index, state)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function SortableItem({
  id,
  dragFrom,
  children,
}: {
  id: string
  dragFrom: "item" | "handle"
  children: (state: SortableRenderState) => React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  // キーボードで掴むのはつまみだけ（枠全体で受けると、中の削除ボタンで Enter を押したときにも掴んでしまう）
  const { onKeyDown, ...pointerListeners } = listeners ?? {}
  const fromItem = dragFrom === "item"

  return (
    <div
      ref={setNodeRef}
      // item のときは、マウス・タッチは写真のどこを掴んでも動かせるよう枠全体で受け取る
      {...(fromItem ? pointerListeners : {})}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        // iOS で長押ししたとき、画像の保存メニューや文字の選択が出ないようにする
        WebkitTouchCallout: fromItem ? "none" : undefined,
      }}
      className={fromItem ? `touch-manipulation select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}` : undefined}
    >
      {children({
        handleProps: {
          ...attributes,
          ...(fromItem ? {} : pointerListeners),
          onKeyDown: onKeyDown as React.KeyboardEventHandler<HTMLElement> | undefined,
          ref: setActivatorNodeRef,
        },
        isDragging,
      })}
    </div>
  )
}
