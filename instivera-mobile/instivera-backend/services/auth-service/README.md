# Auth Service

The Auth Service is responsible for handling user authentication and authorization within the Instivera backend. It provides endpoints for user login, registration, and token management.

## Service Structure

- **src/**: Contains the source code for the service.
  - **config.ts**: Configuration file that reads environment variables and exports a typed configuration object.
  - **db.ts**: Implements a Sequelize multi-tenant connection pool with a `getTenantSequelize(tenant: string)` function.
  - **server.ts**: Bootstraps the Express app, registers routes, and starts listening on port 9052. Includes a `/health` GET endpoint.
  - **controllers/**: Contains the controller logic for handling requests.
    - **auth.controller.ts**: Manages authentication-related requests.
  - **middleware/**: Contains middleware functions for request processing.
    - **auth-middleware.ts**: Middleware for authentication.
    - **error-middleware.ts**: Middleware for error handling.
  - **models/**: Contains the data models for the service.
    - **auth.model.ts**: Defines the user model for authentication.
  - **routes/**: Contains route definitions for the service.
    - **auth.routes.ts**: Defines the routes for authentication-related endpoints.
  - **services/**: Contains service logic for handling business rules.
    - **auth.service.ts**: Contains the business logic for authentication.
  - **types/**: Contains TypeScript types for the service.
    - **auth.types.ts**: Defines types related to authentication.
  - **utils/**: Contains utility functions.
    - **api-error.ts**: Implements error handling utilities.
    - **logger.ts**: Implements logging using pino.

## Environment Variables

The service uses environment variables for configuration. Make sure to set the following in your `.env.development` and `.env.production` files:

- `PORT`: The port on which the service will run (default is 9052).
- `DATABASE_URL`: The connection string for the database.
- `JWT_SECRET`: The secret key for signing JWT tokens.

## Running the Service

1. Install dependencies:
   ```
   npm install
   ```

2. Start the service:
   ```
   npm run start
   ```

3. Access the service at `http://localhost:9052`.

## Health Check

You can check the health of the service by accessing the `/health` endpoint:
```
GET http://localhost:9052/health
```

## License

This project is licensed under the MIT License. See the LICENSE file for details.