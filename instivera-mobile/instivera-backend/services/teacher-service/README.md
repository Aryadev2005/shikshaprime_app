# Teacher Service

The Teacher Service is a microservice responsible for managing teacher-related functionalities in the Instivera backend. This service is designed to handle operations such as creating, updating, retrieving, and deleting teacher records.

## Service Overview

- **Port**: 9060
- **Health Check Endpoint**: `/health`
- **Environment Variables**: 
  - Development: `.env.development`
  - Production: `.env.production`

## Directory Structure

```
teacher-service/
├── src/
│   ├── config.ts
│   ├── db.ts
│   ├── server.ts
│   ├── controllers/
│   │   └── teacher.controller.ts
│   ├── middleware/
│   │   ├── auth-middleware.ts
│   │   └── error-middleware.ts
│   ├── models/
│   │   └── teacher.model.ts
│   ├── routes/
│   │   └── teacher.routes.ts
│   ├── services/
│   │   └── teacher.service.ts
│   ├── types/
│   │   └── teacher.types.ts
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

1. **Clone the Repository**: 
   ```
   git clone <repository-url>
   cd instivera-backend/services/teacher-service
   ```

2. **Install Dependencies**: 
   ```
   npm install
   ```

3. **Set Up Environment Variables**: 
   Copy `.env.example` to `.env.development` and `.env.production`, and fill in the required values.

4. **Run the Service**: 
   ```
   npm run start
   ```

5. **Access the Service**: 
   Open your browser or API client and navigate to `http://localhost:9060/health` to check if the service is running.

## API Documentation

Refer to the `teacher.controller.ts` file for the available endpoints and their usage.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.