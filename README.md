# Plivo Status Page

This is a simplified, multi-tenant status page application built with Next.js and Firebase. It allows administrators to manage services, report incidents, and provide a public-facing status page for their users.

## Features

* **User Authentication**: Secure sign-up and login for administrators using Google Authentication.
* **Team Management**: Invite and manage team members within your organization.
* **Service Management**: Add, edit, and delete services and update their status in real-time.
* **Incident Reporting**: Create and update incidents, associating them with affected services to keep users informed.
* **Public Status Pages**: Automatically generated, shareable status pages for each organization that display the current status of all services.
* **Real-time Updates**: Status changes are pushed to clients in real-time using Firestore's real-time capabilities.

## Tech Stack

* **Framework**: Next.js (with Turbopack)
* **Styling**: Tailwind CSS with shadcn/ui
* **Backend**: Firebase (Authentication, Firestore)
* **Language**: TypeScript

## Getting Started

### Prerequisites

* Node.js (v18 or later)
* npm, yarn, or pnpm

### Firebase Setup

1.  **Create a Firebase Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Enable Authentication**: In the Firebase console, navigate to **Authentication** and enable the **Google** sign-in provider.
3.  **Create a Firestore Database**: Go to the **Firestore Database** section and create a new database.
4.  **Get Firebase Config**: In your project settings, find your web app's Firebase configuration snippet. You will need these keys for the next step.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone [https://github.com/54nd339/plivo-status-page.git](https://github.com/54nd339/plivo-status-page.git)
    cd your-repository-name
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Create an environment file**: Create a file named `.env.local` in the root of your project and add your Firebase configuration. You can find the required environment variable names in `.github/workflows/firebase-hosting-merge.yml`:
    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
    NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
    ```

### Running the Development Server

To start the development server, run:

```bash
npm run dev
```

Open http://localhost:3000 in your browser to see the application.

### Deployment

This project is configured for easy deployment to Firebase Hosting. The GitHub Actions workflows in the .github/workflows directory will automatically deploy the application when changes are pushed to the master branch or a pull request is created.

### Project Structure

app/: Contains the pages and layouts of the Next.js application.

components/: Contains reusable React components.

lib/: Contains utility functions and the Firebase configuration.

context/: Contains the authentication context for managing user state.

types/: Contains TypeScript type definitions for the application's data structures. -->