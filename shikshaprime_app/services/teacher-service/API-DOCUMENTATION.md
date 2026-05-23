# Teacher Service API Documentation

## Overview

The Teacher Service manages faculty members and their assignments. It runs on port **9060**.

**Base URL:** `http://localhost:9060/api/teacher`

## Authentication

All endpoints (except health checks) require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Token is obtained from identity-service login endpoint.

---

## Endpoints

### Health Checks

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Liveness check | No |
| GET | `/ready` | Readiness check (DB) | No |

---

### Faculty CRUD

#### Create Faculty
```
POST /api/teacher/faculty
```

**Role Required:** `admin`

**Request Body:**
```json
{
  "employee_id": "EMP002",
  "employee_name": "Dr. Jane Smith",
  "email": "jane.smith@school.com",
  "password": "password123",
  "designation": "PROFESSOR",
  "department_id": 1,
  "specialization": "Machine Learning",
  "qualification": "Ph.D. Computer Science",
  "experience_years": 10.5,
  "is_hod": false,
  "joining_date": "2020-01-15",
  "mobile": "9876543210"
}
```

**Response:**
```json
{
  "status": 1,
  "message": "Faculty created successfully",
  "data": { ... }
}
```

---

#### Get All Faculty
```
GET /api/teacher/faculty
```

**Query Parameters:**
- `department_id` (optional): Filter by department
- `designation` (optional): Filter by designation
- `is_hod` (optional): Filter HODs (`true`/`false`)

**Response:**
```json
{
  "status": 1,
  "message": "Faculty fetched successfully",
  "count": 10,
  "data": [...]
}
```

---

#### Get Faculty by ID
```
GET /api/teacher/faculty/:id
```

---

#### Get Faculty by Employee ID
```
GET /api/teacher/faculty/by-employee-id/:employeeId
```

---

#### Update Faculty
```
PUT /api/teacher/faculty/:id
```

**Role Required:** `admin`

---

#### Delete Faculty (Soft Delete)
```
DELETE /api/teacher/faculty/:id
```

**Role Required:** `admin`

---

### Search & Filters

#### Search Faculty
```
GET /api/teacher/faculty/search?q=john
```

Searches by: name, employee_id, email, mobile, designation, specialization

---

#### Get Faculty by Department
```
GET /api/teacher/faculty/by-department/:departmentId
```

---

#### Get HODs
```
GET /api/teacher/faculty/hods
```

---

#### Get Faculty Statistics
```
GET /api/teacher/faculty/stats
```

**Role Required:** `admin`

**Response:**
```json
{
  "status": 1,
  "data": {
    "total_faculty": 50,
    "active_faculty": 48,
    "total_hods": 5,
    "departments_with_faculty": 8
  }
}
```

---

### Faculty Assignments

#### Create Assignment
```
POST /api/teacher/faculty/:id/assignments
```

**Role Required:** `admin`

**Request Body:**
```json
{
  "program_id": 1,
  "semester_id": 3,
  "section_id": 1,
  "academic_year_id": 1,
  "is_class_incharge": true
}
```

---

#### Get Faculty Assignments
```
GET /api/teacher/faculty/:id/assignments
```

---

#### Delete Assignment
```
DELETE /api/teacher/assignments/:assignmentId
```

**Role Required:** `admin`

---

#### Get Class Incharges
```
GET /api/teacher/class-incharges
```

**Query Parameters:**
- `academic_year_id` (optional): Filter by academic year

---

## Error Responses

All errors follow this format:

```json
{
  "status": 0,
  "error": "Error message here"
}
```

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing token |
| 403 | Forbidden - Invalid token or insufficient role |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate entry |
| 500 | Internal Server Error |

---

## Running the Service

```bash
cd services/teacher-service
npm install
npm run dev
```

The service will start on `http://localhost:9060`
