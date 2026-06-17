## ADDED Requirements

### Requirement: Trips trend endpoint returns daily trip counts

The system SHALL expose `GET /dashboard/trips-trend?from=&to=` returning an array of objects `{ date: string, count: number }` where `date` is an ISO date string (YYYY-MM-DD) and `count` is the number of TripPlan rows with `tripDate` equal to that date. Only dates with at least one trip SHALL be included.

#### Scenario: Trend data covers the requested date range

- **WHEN** the client calls `GET /dashboard/trips-trend?from=2026-06-01&to=2026-06-07`
- **THEN** the response is an array of at most 7 items, one per day that has trips, with the correct count for each day

#### Scenario: Days with no trips are omitted

- **WHEN** no trips exist on 2026-06-03 within the range
- **THEN** the response contains no item with `date = "2026-06-03"`

### Requirement: Dashboard renders a Line chart for daily trip trends

The frontend SHALL render a Recharts `LineChart` component showing daily trip counts over the selected trip date range. The X-axis displays dates; the Y-axis displays trip count. Data comes from `GET /dashboard/trips-trend`.

#### Scenario: Line chart appears on the dashboard

- **WHEN** the dashboard is loaded with a multi-day trip date range
- **THEN** a line chart labeled "Chuyến theo ngày" is visible with data points for each day that has trips

#### Scenario: Line chart is empty when no trips exist in range

- **WHEN** no trips exist in the selected trip date range
- **THEN** the chart area shows an empty state message rather than a broken chart

### Requirement: Dashboard renders a Pie chart for trip status distribution

The frontend SHALL render a Recharts `PieChart` showing the proportion of trips in each status (PLANNED, DISPATCHED, IN_TRANSIT, COMPLETED, CANCELLED) within the trip date range. Each slice SHALL be labeled with the Vietnamese status name and count.

#### Scenario: Pie chart slices match trip status counts

- **WHEN** the selected range has 5 PLANNED, 3 IN_TRANSIT, and 2 COMPLETED trips
- **THEN** the pie chart shows three slices with proportional sizes and correct labels

#### Scenario: Pie chart hides zero-count statuses

- **WHEN** no trips have status CANCELLED in the range
- **THEN** no CANCELLED slice appears in the pie chart

### Requirement: Dashboard renders a Bar chart for expiry breakdown

The frontend SHALL render a Recharts `BarChart` with four grouped bars showing the count of expiring records per category: ĐK xe, CàVẹt xe, ĐK mooc, CàVẹt mooc. Data is sourced from the four expiry stat fields. The chart updates when the expiry date range changes.

#### Scenario: Bar chart shows four categories

- **WHEN** the dashboard expiry stats are loaded
- **THEN** the bar chart displays four bars labeled "ĐK xe", "Cà vẹt xe", "ĐK mooc", "Cà vẹt mooc" with heights matching the respective counts

### Requirement: Recharts is added as a web dependency

The system SHALL add `recharts` to `apps/web/package.json` dependencies. All chart components SHALL be rendered only on the client side (no SSR rendering of chart SVG).

#### Scenario: Chart components do not throw SSR errors

- **WHEN** the dashboard page is server-side rendered during navigation
- **THEN** no Recharts-related hydration or window-is-not-defined errors appear in the console
