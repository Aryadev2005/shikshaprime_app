# Identity Service

The Identity Service is a microservice responsible for managing user identities within the Instivera backend system. It provides functionalities such as creating, retrieving, updating, and deleting identity information.

## Features

- **Identity Management**: Create, read, update, and delete identity records.
- **Authentication Middleware**: Ensures that all requests are authenticated before accessing protected routes.
- **Error Handling Middleware**: Captures and handles errors gracefully, providing standardized error responses.
- **Database Integration**: Connects to a database to store and manage identity data.

## Project Structure

```
identity-service
├── src
│   ├── config.ts               # Configuration settings for the service
│   ├── db.ts                   # Database connection and setup
│   ├── server.ts               # Entry point of the service
│   ├── controllers             # Contains controllers for handling requests
│   │   └── identity.controller.ts
│   ├── middleware              # Middleware functions for authentication and error handling
│   │   ├── auth-middleware.ts
│   │   └── error-middleware.ts
│   ├── models                  # Data models for the service
│   │   └── identity.model.ts
│   ├── routes                  # Route definitions for the service
│   │   └── identity.routes.ts
│   ├── services                # Business logic related to identity management
│   │   └── identity.service.ts
│   ├── types                   # TypeScript types and interfaces
│   │   └── identity.types.ts
│   └── utils                   # Utility functions and classes
│       ├── api-error.ts
│       └── logger.ts
├── .env.development            # Environment variables for development
├── .env.production             # Environment variables for production
├── package.json                # npm configuration file
├── tsconfig.json              # TypeScript configuration file
└── README.md                   # Documentation for the identity service
```

## Installation

1. Clone the repository.
2. Navigate to the `identity-service` directory.
3. Install dependencies using npm:

   ```
   npm install
   ```

4. Create a `.env.development` file and set the necessary environment variables.
5. Start the service:

   ```
   npm start
   ```

## Usage

The Identity Service exposes a set of RESTful APIs for managing identities. Refer to the API documentation for detailed information on available endpoints and their usage.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.