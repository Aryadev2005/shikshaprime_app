# Student Service API Documentation

## Base URL
```
http://localhost:9051/api
```

## Authentication
All endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

## Student Management APIs

### 1. Create Student from Registration
Creates a new student by fetching data from Identity Service using registration_id.

**Endpoint:** `POST /student/create`  
**Auth:** Admin required  
**Request Body:**
```json
{
  "registration_id": "REG123456"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "student_id": "STSC001",
    "roll_number": "STSC001",
    "mode": "ONLINE",
    "first_name": "John",
    "last_name": "Doe",
    "student_name": "John Doe",
    "gender": "MALE",
    "date_of_birth": "2000-01-15",
    "class_id": 1,
    "department_id": 2,
    "academic_year_id": 1,
    "father_name": "Robert Doe",
    "mother_name": "Jane Doe",
    "mobile": "9876543210",
    "email": "john.doe@example.com",
    "address_line": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pin_code": "400001",
    "previous_school_name": "ABC High School",
    "last_class_passed": "12th",
    "board_university": "CBSE",
    "status": "ACTIVE",
    "remarks": null,
    "entered_by_user_id": 1,
    "entered_by_name": "Admin User",
    "created_at": "2026-01-28T10:00:00.000Z",
    "updated_at": "2026-01-28T10:00:00.000Z"
  },
  "message": "Student created successfully from registration"
}
```

### 2. Get All Students
Retrieves all students with pagination support.

**Endpoint:** `GET /students`  
**Auth:** Required  

**Response:**
```json
{
  "status": "success",
  "data": [...], // Array of student objects
  "count": 25,
  "message": "Students fetched successfully"
}
```

### 3. Get Student by ID
Retrieves a specific student by database ID.

**Endpoint:** `GET /student/:id`  
**Auth:** Required  

**Response:** Single student object (same structure as create response)

### 4. Get Student by Student ID
Retrieves a student by their generated student_id (e.g., STSC001).

**Endpoint:** `GET /student/by-student-id/:student_id`  
**Auth:** Required  

**Response:** Single student object

### 5. Update Student
Updates student information.

**Endpoint:** `PUT /student/:id`  
**Auth:** Admin required  

**Request Body:** (All fields optional)
```json
{
  "first_name": "Updated Name",
  "mobile": "9876543210",
  "email": "updated@example.com",
  "status": "INACTIVE",
  "remarks": "Student suspended"
}
```

**Response:** Updated student object

### 6. Delete Student
Deletes a student record.

**Endpoint:** `DELETE /student/:id`  
**Auth:** Admin required  

**Response:**
```json
{
  "status": "success",
  "message": "Student deleted successfully"
}
```

## Student Filtering & Search APIs

### 7. Get Students by Department
**Endpoint:** `GET /students/by-department/:department_id`  
**Auth:** Required  

### 8. Get Students by Class
**Endpoint:** `GET /students/by-class/:class_id`  
**Auth:** Required  

### 9. Get Students by Academic Year
**Endpoint:** `GET /students/by-academic-year/:academic_year_id`  
**Auth:** Required  

### 10. Search Students
Advanced search with multiple filters.

**Endpoint:** `GET /students/search`  
**Auth:** Required  

**Query Parameters:**
- `query` - Search in names, student_id, roll_number, email, mobile
- `department_id` - Filter by department
- `class_id` - Filter by class
- `academic_year_id` - Filter by academic year
- `status` - Filter by status (ACTIVE, INACTIVE, etc.)

**Example:**
```
GET /students/search?query=john&department_id=2&status=ACTIVE
```

### 11. Get Student Statistics
Provides statistical overview of students.

**Endpoint:** `GET /students/statistics`  
**Auth:** Admin required  

**Response:**
```json
{
  "status": "success",
  "data": {
    "total_students": 150,
    "active_students": 140,
    "inactive_students": 10,
    "by_department": [
      {"department_id": 1, "count": 50},
      {"department_id": 2, "count": 60}
    ],
    "by_class": [
      {"class_id": 1, "count": 75},
      {"class_id": 2, "count": 75}
    ],
    "by_academic_year": [
      {"academic_year_id": 1, "count": 150}
    ],
    "by_status": [
      {"status": "ACTIVE", "count": 140},
      {"status": "INACTIVE", "count": 10}
    ]
  },
  "message": "Student statistics fetched successfully"
}
```

## Database Fields

### Students Table Schema
```sql
- id (Primary Key)
- student_id (Generated: STSC001)
- roll_number (Generated: STSC001)
- mode (ONLINE/OFFLINE)
- first_name, last_name
- gender, date_of_birth
- class_id, department_id, academic_year_id
- father_name, mother_name
- mobile, email
- address_line, city, state, pin_code
- previous_school_name, last_class_passed, board_university
- status, remarks
- entered_by_user_id, entered_by_name
- created_at, updated_at
```

## Error Handling

### Common Error Responses
```json
{
  "status": "error",
  "message": "Error description",
  "code": 400/404/500
}
```

### Validation Errors
```json
{
  "status": "error",
  "message": "Validation failed: Invalid email format, Mobile number must be 10 digits"
}
```

## Student ID Generation Logic

**Format:** `[COLLEGE_CODE][DEPARTMENT_CODE][SERIAL_NUMBER]`

**Example:** `STSC001`
- `ST` = College Code (Shiksha Prime)
- `SC` = Department Code (Science)
- `001` = Serial Number

**Department Codes:**
- Science: SC
- Commerce: CM
- Arts: AR
- Engineering: EN
- Computer Science: CS
- Information Technology: IT
- Mathematics: MT
- Physics: PH
- Chemistry: CH
- Biology: BI

## Integration with Identity Service

The student creation process:
1. Client sends `registration_id`
2. Student Service fetches complete registration data from Identity Service
3. Student ID and Roll Number are auto-generated
4. All data is saved to Students table
5. Student record is returned with generated IDs

This ensures seamless data flow from registration to student management while maintaining data integrity and avoiding duplication.