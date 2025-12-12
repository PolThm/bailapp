# Routing Setup in BailApp

## Overview

BailApp utilizes React Router for managing navigation across various pages, including Discover, Home, Profile, and others. This document outlines the routing setup, including the key routes, their components, and any specific considerations for each route.

## Routes

### Home Route

- **Path**: `/`
- **Component**: `Home`
- **Description**: The landing page of the application, featuring options for navigation to other sections such as Discover, Favorites, and Choreographies.
- **Key Features**:
  - Displays a welcome message and a logo.
  - Provides links to various sections of the app with descriptive cards.

### Discover Route

- **Path**: `/discover`
- **Component**: `Discover`
- **Description**: The main area for users to explore dance figures and shorts.
- **Key Features**:
  - Supports advanced filtering options.
  - Displays figures and shorts in a responsive layout.
  - Handles screen size changes to optimize the user experience.
  - Includes modals for authentication, adding new figures, and advanced filters.

### Profile Route

- **Path**: `/profile`
- **Component**: `Profile`
- **Description**: This route will manage user profiles, allowing users to view and edit their information.
- **Key Features**: (To be defined based on implementation)

### Favorites Route

- **Path**: `/favorites`
- **Component**: (To be defined based on implementation)
- **Description**: This route will allow users to view their favorite figures.
- **Key Features**: (To be defined based on implementation)

### Choreographies Route

- **Path**: `/choreographies`
- **Component**: (To be defined based on implementation)
- **Description**: This route will enable users to create and manage their choreographies.
- **Key Features**: (To be defined based on implementation)

## Navigation

Navigation between these routes is handled using the `Link` component from `react-router-dom`. Each link is styled for a responsive and touch-friendly experience.

### Example Navigation in Home Component

```javascript
const options = [
  {
    title: t('home.options.discover.title'),
    link: '/discover',
  },
  {
    title: t('home.options.favorites.title'),
    link: '/favorites',
  },
  {
    title: t('home.options.choreographies.title'),
    link: '/choreographies',
  },
];

return (
  <div>
    {options.map((option) => (
      <Link key={option.link} to={option.link}>
        {option.title}
      </Link>
    ))}
  </div>
);
```

## Route-Specific Considerations

- **Responsive Design**: The Discover page is designed to adapt to different screen sizes, ensuring a seamless experience on both mobile and desktop devices.
- **Modals**: The Discover component features several modals (e.g., `AuthModal`, `NewFigureModal`, `AdvancedFiltersModal`) that enhance user interaction without navigating away from the current page.
- **State Management**: The Discover page utilizes local state and hooks to manage visibility for various components and modals.

## Conclusion

The routing setup in BailApp is structured to provide a user-friendly experience while allowing for easy navigation between different sections of the application. Each route is designed with specific functionalities to enhance user engagement and interaction.
