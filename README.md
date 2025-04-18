# Hostel Management System

A modern web application for managing hostel operations, built with Next.js, React, TypeScript, and Tailwind CSS.

## Features

### Admin Dashboard

- **Student Management**

  - View all students in a searchable table
  - Add, edit, and view student details
  - Track room assignments

- **Room Management**

  - Monitor room occupancy and availability
  - Manage room types and fees
  - Track room status (active/inactive)

- **Query Management**
  - Handle student queries and complaints
  - Track query status (pending/in progress/resolved)
  - Respond to student queries

### Student Dashboard

- **Personal Information**

  - View and update profile details
  - Check room assignment
  - Monitor attendance

- **Payment Information**

  - Track hostel fees
  - View mess charges
  - Get payment due date notifications

- **Query System**
  - Raise new queries
  - Track query status
  - View admin responses

## Tech Stack

- **Frontend**

  - Next.js 14 (App Router)
  - React 19
  - TypeScript
  - Tailwind CSS
  - Lucide Icons
  - shadcn/ui Components

- **Backend**
  - Next.js API Routes
  - Drizzle ORM
  - MySQL Database
  - NextAuth.js for Authentication

## Prerequisites

- Node.js 18 or higher
- MySQL 8.0 or higher
- npm or yarn package manager

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=hostel_management

# NextAuth Configuration
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000

# SMTP Configuration
EMAIL_SERVICE="gmail"
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_SERVER_SECURE=true
```

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/hostel-management-system.git
cd hostel-management-system
```

2. Install dependencies:

```bash
npm install
```

3. Initialize the database:

```bash
npm run db:init
```

4. Run database migrations:

```bash
npm run db:push
```

5. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Database Schema

The application uses the following main tables:

- `users` - Stores user authentication and role information
- `student_profiles` - Contains detailed student information
- `rooms` - Manages hostel room details
- `queries` - Handles student queries and complaints

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build the application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate database migrations
- `npm run db:push` - Apply database migrations
- `npm run db:studio` - Open Drizzle Studio for database management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
