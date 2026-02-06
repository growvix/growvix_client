import {
  CalendarBody,
  CalendarDate,
  CalendarDatePagination,
  CalendarDatePicker,
  CalendarHeader,
  CalendarItem,
  CalendarMonthPicker,
  CalendarProvider,
  CalendarYearPicker,
} from '@/components/ui/shadcn-io/calendar';
import { useEffect } from "react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const statuses = [
  { id: 'planned', name: 'Planned', color: '#6B7280' },
  { id: 'in-progress', name: 'In Progress', color: '#F59E0B' },
  { id: 'done', name: 'Done', color: '#10B981' },
];
// Only one feature for Mark, using today's date
const exampleFeatures = [
  {
    id: 'site-visit-7',
    name: 'site visit [7]',
    startAt: new Date(TODAY),
    endAt: new Date(TODAY),
    status: statuses[2],
    isToday: true,
  },
  {
    id: 'absent-3',
    name: 'absent [3]',
    startAt: new Date(TODAY),
    endAt: new Date(TODAY),
    status: statuses[1],
    isToday: true,
  },
];
export default function Example() {
  const { setBreadcrumbs } = useBreadcrumb()

  useEffect(() => {
    setBreadcrumbs([
      { label: "user_calendar" }
    ])
  }, [setBreadcrumbs])
  const earliestYear = exampleFeatures[0].startAt.getFullYear();
  const latestYear = exampleFeatures[0].endAt.getFullYear();

  return (
    <div className="px-5" >
      <CalendarProvider className='p-2 border-1 rounded-lg shadow-sm ' >
        <CalendarDate>
          <CalendarDatePicker>
            <CalendarMonthPicker />
            <CalendarYearPicker end={latestYear} start={earliestYear} />
          </CalendarDatePicker>
          <CalendarDatePagination />
        </CalendarDate>
        <CalendarHeader />
        <CalendarBody features={exampleFeatures} >
          {({ feature }) => <CalendarItem feature={feature} key={feature.id} />}
        </CalendarBody>
      </CalendarProvider>
    </div>
  );
}