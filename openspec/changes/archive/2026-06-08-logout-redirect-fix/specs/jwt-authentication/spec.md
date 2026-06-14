## MODIFIED Requirements

### Requirement: Logout clears the tms_token cookie

The system SHALL provide a `POST /api/auth/logout` route handler that deletes the `tms_token` cookie. After logout, the client MUST perform a hard browser navigation (full page reload) to `/login`, not a client-side SPA navigation, so that the Next.js Router Cache is flushed and middleware re-evaluates authentication on the next request.

#### Scenario: Logout clears the session

- **WHEN** the user triggers a logout action
- **THEN** the `tms_token` cookie is cleared and the user is redirected to `/login`

#### Scenario: Back navigation after logout is blocked by middleware

- **WHEN** the user triggers logout and then navigates back to an authenticated route (via browser Back, direct URL, or bookmark)
- **THEN** middleware detects the absent `tms_token` cookie and redirects the user to `/login`

#### Scenario: Logout does not leave cached authenticated pages accessible

- **WHEN** the user logs out
- **THEN** the Next.js Router Cache is cleared (full page reload), preventing authenticated page payloads from being served without a valid cookie
