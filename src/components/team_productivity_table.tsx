import * as React from "react"
import {
  type ColumnDef,
} from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { TeamMember } from "@/types"
import { teamMembersData } from "@/data/team-members"
import { DEFAULT_TEAM_PAGE_SIZE } from "@/constants"
import { DataTable } from "@/components/ui/data-table"


export const columns: ColumnDef<TeamMember>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          ID
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => <div>{row.getValue("id")}</div>,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Team Member
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "callsMade",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Calls Made
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => <div>{row.getValue("callsMade")}</div>,
  },
  {
    accessorKey: "leadsConverted",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Leads Converted
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => <div>{row.getValue("leadsConverted")}</div>,
  },
  {
    accessorKey: "avgCallDuration",
    header: "Avg. Call Duration",
    cell: ({ row }) => <div>{row.getValue("avgCallDuration")}</div>,
  },
  {
    accessorKey: "performanceScore",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Performance Score
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => {
      const score = row.getValue("performanceScore") as number
      return <div className="text-right font-medium">{score}%</div>
    },
  },
]

export default function TeamProductivityTable() {
  return (
    <DataTable
      columns={columns}
      data={teamMembersData}
      initialPageSize={DEFAULT_TEAM_PAGE_SIZE}
    // Assuming we don't want the filter input for this table as per original inspection
    // or we can add it if needed: filterColumn="name"
    // Based on original file, there was no filter UI visible, so I'll omit filterColumn for now
    // effectively hiding the search box if the component logic supports it (it checks for filterColumn)
    />
  )
}
