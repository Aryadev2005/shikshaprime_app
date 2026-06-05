# Notification Service

The Notification Service is a microservice responsible for handling notifications within the Instivera backend system. It provides endpoints for creating, retrieving, and managing notifications for users.

## Service Overview

- **Port**: 9057
- **Health Check Endpoint**: `/health`

## Environment Variables

This service requires the following environment variables to be set in the `.env.development` and `.env.production` files:

- `DATABASE_URL`: The connection string for the database.
- `NODE_ENV`: The environment in which the service is running (development or production).
- `JWT_SECRET`: Secret key for JWT authentication.

## Directory Structure

```
notification-service/
├── src/
│   ├── config.ts
│   ├── db.ts
│   ├── server.ts
│   ├── controllers/
│   │   └── notification.controller.ts
│   ├── middleware/
│   │   ├── auth-middleware.ts
│   │   └── error-middleware.ts
│   ├── models/
│   │   └── notification.model.ts
│   ├── routes/
│   │   └── notification.routes.ts
│   ├── services/
│   │   └── notification.service.ts
│   ├── types/
│   │   └── notification.types.ts
│   └── utils/
│       ├── api-error.ts
│       └── logger.ts
├── .env.development
├── .env.production
├── .gitignore
├── package.json
└── tsconfig.json
```

## Getting Started

1. Clone the repository.
2. Navigate to the `notification-service` directory.
3. Install dependencies using `npm install`.
4. Set up your environment variables in the `.env.development` file.
5. Start the service using `npm run start`.

## API Endpoints

- `POST /notifications`: Create a new notification.
- `GET /notifications`: Retrieve all notifications.
- `GET /notifications/:id`: Retrieve a specific notification by ID.
- `DELETE /notifications/:id`: Delete a specific notification by ID.

## Testing

Run tests using the command:

```
npm test
```

## License

This project is licensed under the MIT License. See the LICENSE file for details.