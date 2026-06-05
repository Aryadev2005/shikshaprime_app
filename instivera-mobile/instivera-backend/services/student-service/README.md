# Student Service

## Overview
The Student Service is a microservice responsible for managing student-related operations in the Instivera backend. It provides endpoints to create, read, update, and delete student records.

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- TypeScript
- Sequelize (for database interactions)

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd instivera-backend/services/student-service
   ```

2. Install dependencies:
   ```
   npm install
   ```

### Configuration
- Create a `.env.development` file for development environment variables.
- Create a `.env.production` file for production environment variables.

### Running the Service
To start the service in development mode, run:
```
npm run dev
```

The service will start on port 9051 and will include a health check endpoint at `/health`.

### API Endpoints
- `GET /students`: Retrieve a list of all students.
- `POST /students`: Create a new student record.
- `GET /students/:id`: Retrieve a specific student by ID.
- `PUT /students/:id`: Update a specific student by ID.
- `DELETE /students/:id`: Delete a specific student by ID.

### Testing
To run tests, use:
```
npm test
```

### License
This project is licensed under the MIT License. See the LICENSE file for details.