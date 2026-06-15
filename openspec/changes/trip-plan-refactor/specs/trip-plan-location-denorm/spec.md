## ADDED Requirements

### Requirement: TripPlan stores location data as denormalized name strings

The `TripPlan` entity SHALL store location data as plain name strings instead of FK references. The three FK columns (`pickup_location_id`, `load_unload_location_id`, `dropoff_location_id`) SHALL be removed. Three new nullable String columns SHALL be added: `pickup_location_name`, `load_unload_location_name`, `dropoff_location_name`.

The existing `Location` master table is unchanged. It serves as a suggestion source for combobox inputs but is NOT linked by FK from `TripPlan`.

#### Scenario: TripPlan created with location name stored directly

- **WHEN** `POST /api/trip-plans` is called with `{ pickupLocationName: "Cát Lái" }`
- **THEN** the `trip_plans` row has `pickup_location_name = "Cát Lái"` with no FK reference

#### Scenario: Location name stored even if Location master record deleted

- **WHEN** a Location record named "Depot 5A" is deleted after a TripPlan references it by name
- **THEN** the TripPlan row still has `pickup_location_name = "Depot 5A"` — no cascade effect

#### Scenario: TripPlan created without location stores NULL

- **WHEN** `POST /api/trip-plans` is called without `pickupLocationName`
- **THEN** `pickup_location_name` is NULL on the created row

---

### Requirement: Trip plan API accepts and returns location name strings

`POST /api/trip-plans` and `PATCH /api/trip-plans/:id` SHALL accept `pickupLocationName`, `loadUnloadLocationName`, and `dropoffLocationName` as optional String fields (replacing the previous `pickupLocationId`, `loadUnloadLocationId`, `dropoffLocationId` FK fields).

`GET /api/trip-plans` and `GET /api/trip-plans/:id` SHALL return these three name string fields instead of the previous nested location objects.

#### Scenario: Create request uses name fields not id fields

- **WHEN** `POST /api/trip-plans` is called with `{ pickupLocationName: "Cát Lái", ... }`
- **THEN** HTTP 201 is returned and `pickup_location_name` is persisted

#### Scenario: List response returns location name strings

- **WHEN** `GET /api/trip-plans` is called
- **THEN** each item in `data` contains `pickupLocationName`, `loadUnloadLocationName`, `dropoffLocationName` as strings (or null), NOT nested location objects with `id`

---

### Requirement: Location combobox in trip plan form

The three location fields in the trip plan create and edit modal SHALL use a `Combobox` component. The combobox fetches suggestions from `GET /api/locations` (returns `{ id, name, locationType }` array). Behavior:

1. On focus/click, dropdown opens and shows all active locations ordered by name
2. As the user types, the list filters to locations whose name contains the typed text (case-insensitive)
3. If the user selects a location from the list, the name string from that location is stored
4. If the user types a custom name not in the list, that custom text string is stored
5. In both cases, only the **name string** is submitted in the POST/PATCH body — no `locationId`

#### Scenario: Combobox shows all locations on focus

- **WHEN** the user clicks the Pickup Location field
- **THEN** a dropdown lists all active locations from `GET /api/locations`

#### Scenario: Typing filters location list

- **WHEN** the user types "cát" in the Pickup Location field
- **THEN** the dropdown shows only locations whose name contains "cát" (case-insensitive)

#### Scenario: Selecting location populates name string

- **WHEN** the user selects "Cảng Cát Lái" from the dropdown
- **THEN** the field shows "Cảng Cát Lái" and the form will submit `pickupLocationName: "Cảng Cát Lái"`

#### Scenario: Custom text entry accepted without template lock

- **WHEN** the user types "Kho A mới" without selecting from the dropdown
- **THEN** the form submits `pickupLocationName: "Kho A mới"` — the field is not locked

#### Scenario: Table displays location name columns

- **WHEN** the trip plans list table renders a row
- **THEN** the Điểm Lấy, Điểm Đóng/Rút, Điểm Hạ columns show the stored name string from the respective name fields
