yaml
title: "Routing Documentation"
description: "Comprehensive guide to the routing structure in Bailapp, including pages, dynamic segments, and navigation patterns."
icon: "🗺️"
order: 3
```

# Routing Documentation

Bailapp utilizes React-Router v6 to manage navigation within the application. This document outlines the routing structure, including defined routes, dynamic segments, and navigation patterns.

## Core Concepts

- **Single Page Application (SPA)**: Bailapp is structured as a SPA, allowing for seamless navigation without full page reloads.
- **Dynamic Segments**: Routes can include dynamic segments (e.g., `:id`) to represent variable data.
- **Query Parameters**: Additional data can be passed via query parameters (e.g., `?ownerId=...`).
- **Transient Navigation State**: The `location.state` object is used to carry transient data, such as toast messages, between navigations.

## Route Definitions

The following routes are defined in the application:

### 1. `/choreographies`

- **Component**: `<Choreographies />`
- **Path Parameters**: None
- **Description**: Displays a list of choreographies.

### 2. `/choreographies/:id`

- **Component**: `<ChoreographyDetail />`
- **Path Parameters**:
  - `id` (string): Represents the choreography document ID.
- **Query Parameters**:
  - `ownerId` (string|null): If present and not equal to the current user's UID, the component fetches a public choreography.
- **Description**: Displays details for a specific choreography.

### 3. `/discover`

- **Component**: `<Discover />`
- **Path Parameters**: None
- **Description**: Provides a discovery interface for users to explore choreographies.

## Navigation State

The navigation state is structured as follows:

- **Toast Message**: 
  - `location.state?.toast`
    - Type: `{ message: string; type: 'success' | 'info' | 'error' } | null`
    - On render, if present, it is stored in local component state and cleared via `history.replaceState`.

## Hooks

The following hooks are utilized for routing:

- **useParams**: 
  ```typescript
  const { id } = useParams<{ id: string }>();
  ```
- **useSearchParams**: 
  ```typescript
  const [searchParams] = useSearchParams();
  const ownerId = searchParams.get('ownerId');
  ```
- **useLocation**: 
  ```typescript
  const location = useLocation();
  ```
- **useNavigate**: 
  ```typescript
  const navigate = useNavigate();
  ```

## Usage Examples

### 1. Reading a Dynamic Segment and Optional Query Parameter

In the `ChoreographyDetail` component, you can access the dynamic segment and query parameter as follows:

```typescript
// apps/web/src/pages/ChoreographyDetail.tsx
const { id } = useParams<{ id: string }>();
const [searchParams] = useSearchParams();
const ownerId = searchParams.get('ownerId');  // Public view key
const isViewingPublic = ownerId && ownerId !== user?.uid;
```

### 2. Carrying a Toast Message Through Navigation State

To navigate from another page and carry a toast message:

```typescript
// Navigate from another page:
navigate('/choreographies', { state: { toast: { message: 'Saved!', type: 'success' } } });

// In Choreographies component:
useEffect(() => {
  if (location.state?.toast) {
    setToast(location.state.toast);
    window.history.replaceState({ ...location.state, toast: null }, '');
  }
}, [location.state]);
```

## Conclusion

This document provides a comprehensive overview of the routing structure in Bailapp. Understanding these routes and navigation patterns is essential for effective development and user experience within the application. For further details, refer to the source code or other documentation sections.
