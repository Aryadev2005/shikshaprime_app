# instivera-backend/services/assignment-service/README.md

# Assignment Service

This service is responsible for managing assignments within the Instivera backend system.

## Features

- Create, read, update, and delete assignments.
- Assignments can be associated with specific courses and students.
- Middleware for authentication and error handling.

## Environment Variables

This service requires the following environment variables to be set in the `.env.development` and `.env.production` files:

- `DATABASE_URL`: The connection string for the database.
- `PORT`: The port on which the service will run (default is 9052).

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the assignment service directory:
   ```
   cd services/assignment-service
   ```

3. Install dependencies:
   ```
   npm install
   ```

## Running the Service

To start the service in development mode, use the following command:
```
npm run dev
```

The service will be available at `http://localhost:9052`.

## API Endpoints

- `GET /assignments`: Retrieve all assignments.
- `POST /assignments`: Create a new assignment.
- `GET /assignments/:id`: Retrieve a specific assignment by ID.
- `PUT /assignments/:id`: Update a specific assignment by ID.
- `DELETE /assignments/:id`: Delete a specific assignment by ID.

## Testing

To run tests for this service, use the following command:
```
npm test
```

## License

This project is licensed under the MIT License. See the LICENSE file for details.