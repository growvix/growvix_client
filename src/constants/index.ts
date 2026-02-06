// Pagination Constants
export const PAGE_SIZE_OPTIONS = [15, 30, 50, 70, 100] as const

export const DEFAULT_PAGE_SIZE = 15

export const DEFAULT_TEAM_PAGE_SIZE = 5

// Chart Configuration Colors
export const CHART_COLORS = {
  desktop: "#bcbcbcff",
  mobile: "#646464ff",
} as const


export const DATE_RANGE_PRESETS = {
  TODAY: "today",
  YESTERDAY: "yesterday",
  LAST_7_DAYS: "last7days",
  LAST_MONTH: "lastmonth",
  LAST_6_MONTHS: "last6months",
  CUSTOM: "custom",
} as const


export const PERFORMANCE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 75,
  AVERAGE: 60,
} as const
