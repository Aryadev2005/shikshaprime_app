# instivera-backend

## Overview

The `instivera-backend` project is a microservices-based backend application built with Node.js and TypeScript. It consists of several independent services, each responsible for a specific domain of functionality. The services communicate with each other and can be deployed independently.

## Services

The following services are included in this project:

1. **Identity Service**
   - **Port:** 9050
   - **Description:** Manages user identities and authentication.

2. **Student Service**
   - **Port:** 9051
   - **Description:** Handles student-related operations and data.

3. **Payment Service**
   - **Port:** 9053
   - **Description:** Manages payment processing and transactions.

4. **Fees Service**
   - **Port:** 9056
   - **Description:** Handles fee management and billing.

5. **Teacher Service**
   - **Port:** 9060
   - **Description:** Manages teacher-related operations and data.

6. **Chat Service**
   - **Port:** 9055
   - **Description:** Facilitates chat functionality between users.

7. **Notice Service**
   - **Port:** 9057
   - **Description:** Manages notifications and announcements.

## Getting Started

To get started with the project, follow these steps:

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd instivera-backend
   ```

2. **Install dependencies:**
   For each service, navigate to the service directory and run:
   ```
   npm install
   ```

3. **Set up environment variables:**
   Create `.env.development` and `.env.production` files in each service directory and populate them with the necessary environment variables.

4. **Run the services:**
   Each service can be started independently. Navigate to the service directory and run:
   ```
   npm run start
   ```

5. **Access the services:**
   Each service can be accessed via its designated port. For example, the Identity Service can be accessed at `http://localhost:9050`.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.