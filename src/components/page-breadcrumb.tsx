import * as React from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface BreadcrumbItemType {
  label: React.ReactNode
  href?: string
}

interface PageBreadcrumbProps {
  items: BreadcrumbItemType[]
}

export function PageBreadcrumb({ items }: PageBreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <div className="ps-4 ">
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, idx) => (
            <React.Fragment key={idx}>
              <BreadcrumbItem>
                {item.href ? (
                  <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {idx < items.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}
