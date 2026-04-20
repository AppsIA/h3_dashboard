import type { ReactNode } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { SkeletonTableRow } from '../atoms/Skeleton'
import { Text } from '../atoms/Typography'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  width?: string
}

interface SortState {
  key: string
  direction: 'asc' | 'desc'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  loading?: boolean
  skeletonRows?: number
  sort?: SortState
  onSort?: (key: string) => void
  emptyMessage?: string
  caption?: string
  className?: string
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  loading = false,
  skeletonRows = 5,
  sort,
  onSort,
  emptyMessage = 'Nenhum dado disponível.',
  caption,
  className = '',
}: DataTableProps<T>) {
  return (
    <div className={`w-full overflow-x-auto rounded-sm border border-border ${className}`}>
      <table className="w-full border-collapse text-body-sm font-sans" role="grid">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-border bg-surface-elevated">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={[
                  'px-4 py-3 text-caption font-mono uppercase tracking-widest text-text-tertiary whitespace-nowrap',
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                  col.sortable && onSort ? 'cursor-pointer select-none hover:text-text-secondary' : '',
                  col.width ? col.width : '',
                ].filter(Boolean).join(' ')}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                aria-sort={
                  sort?.key === col.key
                    ? sort.direction === 'asc' ? 'ascending' : 'descending'
                    : col.sortable ? 'none' : undefined
                }
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span aria-hidden className="flex flex-col opacity-40">
                      <ChevronUp size={10} className={sort?.key === col.key && sort.direction === 'asc' ? 'opacity-100 text-amber-400' : ''} />
                      <ChevronDown size={10} className={sort?.key === col.key && sort.direction === 'desc' ? 'opacity-100 text-amber-400' : ''} />
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && Array.from({ length: skeletonRows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={columns.length} />
          ))}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center">
                <Text size="sm" variant="tertiary">{emptyMessage}</Text>
              </td>
            </tr>
          )}

          {!loading && rows.map((row) => (
            <tr
              key={getRowKey(row)}
              className="border-b border-border last:border-0 hover:bg-surface-elevated/50 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={[
                    'px-4 py-3 text-text-secondary',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                  ].join(' ')}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
