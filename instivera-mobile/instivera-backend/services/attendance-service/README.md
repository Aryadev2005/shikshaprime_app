# Attendance Service

The Attendance Service is a microservice responsible for managing attendance records in the Instivera backend system. It provides endpoints for creating, updating, retrieving, and deleting attendance records for students.

## Features

- **Create Attendance Record**: Allows the creation of new attendance records.
- **Update Attendance Record**: Enables updating existing attendance records.
- **Retrieve Attendance Records**: Fetches attendance records for students based on various criteria.
- **Delete Attendance Record**: Removes attendance records as needed.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- TypeScript
- Sequelize (for database interactions)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the attendance service directory:
   ```
   cd instivera-backend/services/attendance-service
   ```

3. Install dependencies:
   ```
   npm install
   ```

### Configuration

- Create a `.env.development` file based on the `.env.example` provided, and fill in the necessary environment variables.
- Ensure your database is set up and accessible.

### Running the Service

To start the Attendance Service, run the following command:
```
npm run start:dev
```

The service will start on port 9052 and will include a health check endpoint at `/health`.

### API Endpoints

- **GET /attendance**: Retrieve attendance records.
- **POST /attendance**: Create a new attendance record.
- **PUT /attendance/:id**: Update an existing attendance record.
- **DELETE /attendance/:id**: Delete an attendance record.

### Testing

To run tests for the Attendance Service, use:
```
npm test
```

### License

This project is licensed under the MIT License. See the LICENSE file for details.