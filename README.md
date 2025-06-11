# Eugene Server

## Overview
Eugene Server is a Node.js Express application designed for user and session management, with additional responsibilities for handling measurement data storage. This server facilitates user authentication, session management, and data handling for associated client applications.

## Features

### User Authentication
- **Account Creation and Login**: Supports user registration and login using either email or username along with a password.
- **Credential Storage**: Securely stores user credentials and generates tokens for authentication.
- **API Endpoints**: Provides endpoints for user registration (`POST /auth/register`) and login (`POST /auth/login`).

### Session Management
- **Session Data Handling**: Manages session data with a structure including Name, ID, and UserID.
- **Session Operations**: Allows loading of existing sessions or creation of new ones based on user requests.
- **User Association**: Associates sessions with specific user IDs for personalized management.
- **Access Control**: Non-admin users can only manage their own sessions, while admin users have full access to all sessions.

### Measurement Data Storage
- **Data Reception**: Receives measurement data from the client app in chunks of raw hex bytes.
- **Data Packaging**: Packages data into `.bin` files with metadata including user ID, session ID, and timestamps.
- **Server Storage**: Stores the packaged data securely on the server for future access or analysis.

## API Endpoints

### Users
- `GET /user/api` - Retrieve all users (JSON response)
- `GET /user/api/:id` - Retrieve a specific user by ID (JSON response)
- `POST /user/api` - Create a new user (JSON response)
- `PATCH /user/api/:id` - Update a specific user by ID (JSON response)
- `DELETE /user/api/:id` - Delete a specific user by ID (JSON response)

### Sessions
- `GET /session/api` - Retrieve all sessions (JSON response)
- `GET /session/api/:id` - Retrieve a specific session by ID (JSON response)
- `POST /session/api` - Create a new session (JSON response)
- `PATCH /session/api/:id` - Update a specific session by ID (JSON response)
- `DELETE /session/api/:id` - Delete a specific session by ID (JSON response)
- `GET /session/api/user/:userId` - Retrieve sessions for a specific user by user ID (JSON response)

### Authentication
- `POST /auth/login` - Authenticate a user with username or email and password
- `POST /auth/register` - Register a new user with required fields
- `GET /auth/logout` - Log out the current user

## View Endpoints

### Users
- `GET /user` - List all users (Admin only)
- `GET /user/new` - Form to create a new user
- `GET /user/:id` - View a specific user's details
- `GET /user/:id/edit` - Form to edit a specific user's details
- `POST /user` - Create a new user
- `PATCH /user/:id` - Update a specific user's details
- `POST /user/:id/delete` - Delete a specific user and their associated sessions (Admin or self only)
- `POST /user/:id/password` - Update a specific user's password
- `GET /user/verify-email/:token` - Verify a user's email address via token

### Sessions
- `GET /session` - List sessions (All for Admin, user-specific for non-Admin)
- `GET /session/new` - Form to create a new session
- `GET /session/:id` - View a specific session's details
- `GET /session/:id/edit` - Form to edit a specific session
- `POST /session` - Create a new session
- `PATCH /session/:id` - Update a specific session
- `DELETE /session/:id` - Delete a specific session

### Home and Authentication
- `GET /` - Home page with login and registration forms (toggle between them)
- `POST /auth/login` - Login form submission
- `POST /auth/register` - Registration form submission
- `GET /auth/logout` - Logout action

## Security and Restrictions
- **User Authentication**: All views except the home page require login. Login can be done with either username or email.
- **Admin Restrictions**: Only admin users can view all users (`/user`) and create sessions for other users. Non-admin users are restricted to their own profile and sessions.
- **Session Management**: Non-admin users can only create/edit sessions for themselves, with user ID hidden in forms. Admin users can manage sessions for any user.
- **Email Verification**: Upon registration, a verification email is sent if the email service is configured.
- **User Deletion**: Users can delete their own account, and admins can delete any user. Deletion removes the user and all associated sessions.

## User Interface
- **Navigation**:  For logged-in users, it shows 'My Profile', 'Sessions', and 'Logout'. For admin users, 'My Profile' is replaced with 'Users' to access the full user list.
- **UI Design**: Utilizes Bootstrap for a modern look, with a dark-themed header and footer.

## Notes
- All redirects using 'back' have been updated to use `req.get('Referrer') || '/'` to address deprecation warnings.
- The system no longer uses flash messages for success or error notifications.

## Contact
If you have any questions or need further clarification on any endpoint or feature, please contact the development team.

## Node.js Modules Used

This project relies on several key Node.js modules to function effectively:

- **Express**: A web application framework for Node.js, used for building the server-side application, handling HTTP requests, and defining API endpoints and view routes.
- **Mongoose**: An ODM (Object-Document Mapping) library for MongoDB and Node.js, used for interacting with the MongoDB database, defining schemas, and performing CRUD operations on users and sessions.
- **EJS**: A templating engine for generating HTML markup with plain JavaScript, used for rendering dynamic content in views, allowing server-side logic to be embedded in HTML.
- **EJS-Mate**: An extension for EJS that provides layout support, used to define reusable layout templates for consistent page structure.
- **Nodemailer**: A module for Node.js applications to send emails, used for sending email verification links to users upon registration.
- **Bcrypt**: A library for hashing passwords, used for securely storing user passwords by hashing them before storage in the database.
- **JSONWebToken (JWT)**: A library for creating and verifying JSON Web Tokens, used for secure authentication by generating tokens for user sessions.
- **Express-Session**: A middleware for Express to manage session data, used in conjunction with Connect-Mongo to store session information in the MongoDB database.
- **Connect-Mongo**: A MongoDB session store for Express, used to persist session data in the database for scalability and reliability.

## Layout Syntax in Views

In the views of this application, you will notice the use of `<% layout('layout') -%>` (or similar syntax depending on the templating engine). This syntax is specific to EJS (Embedded JavaScript) templating with the `ejs-mate` middleware:

- **Purpose**: The `layout('layout')` function call tells the templating engine to use a specific layout file (e.g., `layout.ejs`) as the base template for the current view. This allows for a consistent structure across multiple pages (like headers, footers, and navigation bars) without duplicating code.
- **Why Use It**: Using layouts helps maintain a DRY (Don't Repeat Yourself) codebase by centralizing common HTML structure and styling. It simplifies updates to the UI since changes to the layout file automatically reflect across all views that use it.
- **How It Works**: When a view includes `<% layout('layout') -%>`, the content of that view is injected into the specified layout file at a designated point (usually defined by `<%- body -%>` in the layout file), combining the shared layout with the unique content of the view.
