# Payment Service

## Overview
The Payment Service is a microservice responsible for handling payment-related operations within the Instivera backend. It provides endpoints for processing payments, managing payment records, and integrating with external payment gateways.

## Service Structure
The Payment Service follows a modular structure, making it easy to maintain and extend. Below is a brief overview of the key components:

- **src/**: Contains the source code for the service.
  - **config.ts**: Configuration settings for the service, including environment variables.
  - **db.ts**: Database connection setup using Sequelize for multi-tenancy.
  - **server.ts**: Entry point for the service, initializes the Express application and starts the server.
  - **controllers/**: Contains the business logic for handling payment requests.
    - **payment.controller.ts**: Handles incoming payment requests and responses.
  - **middleware/**: Middleware functions for request processing.
    - **auth-middleware.ts**: Ensures that requests are authenticated.
    - **error-middleware.ts**: Centralized error handling for the service.
    - **tenant-middleware.ts**: Extracts tenant information from requests.
  - **models/**: Defines the data models used by the service.
    - **payment.model.ts**: Sequelize model for payment records.
  - **routes/**: Defines the API endpoints for the service.
    - **payment.routes.ts**: Contains route definitions for payment-related operations.
  - **services/**: Contains service-specific logic.
    - **payment.service.ts**: Business logic related to payment processing.
  - **types/**: Type definitions for TypeScript.
    - **payment.types.ts**: Type definitions related to payment operations.
  - **utils/**: Utility functions and helpers.
    - **api-error.ts**: Custom error handling utilities.
    - **logger.ts**: Logging utilities using pino.
    - **response.ts**: Helper functions for sending standardized responses.

## Environment Variables
The service uses environment variables for configuration. The following variables are expected in the `.env` files:

- `DATABASE_URL`: Connection string for the database.
- `PORT`: Port number for the service (default is 9053).
- `JWT_SECRET`: Secret key for JWT authentication.
- `PAYMENT_GATEWAY_URL`: URL for the external payment gateway.

## Running the Service
To run the Payment Service, follow these steps:

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables in the `.env.development` or `.env.production` file.

3. Start the service:
   ```
   npm run start
   ```

4. The service will be available at `http://localhost:9053`.

## API Endpoints
- **GET /health**: Health check endpoint to verify if the service is running.
- **POST /payments**: Endpoint to process a new payment.

## Testing
Unit tests are located in the `tests/` directory. To run the tests, use the following command:
```
npm test
```

## License
This project is licensed under the MIT License. See the LICENSE file for details.