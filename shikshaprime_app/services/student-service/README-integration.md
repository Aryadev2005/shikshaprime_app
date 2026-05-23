# Student Service - Registration Integration

This service has been updated to integrate with the Identity Service for student creation from registration data.

## New Features

### 1. Student Creation from Registration
- Students are now created by providing a `registration_id` from the Identity Service
- All student data is automatically fetched from the Identity Service
- Student ID and Roll Number are automatically generated

### 2. Automatic ID Generation
- **Student ID Format**: `STSC001` (College Code + Department Code + Serial Number)
- **Roll Number**: Same format as Student ID
- **College Code**: `ST` (configurable)
- **Department Codes**:
  - Science: `SC`
  - Commerce: `CM`
  - Arts: `AR`
  - Engineering: `EN`
  - Computer Science: `CS`
  - etc.

### 3. Database Schema Updates
The students table now includes all fields from the registration table:
- registration_id (reference to registration)
- mode, gender, academic_year_id
- father_name, mother_name, mobile
- address_line, city, state, pin_code
- educational background fields
- status and administrative fields

## API Endpoints

### Create Student
```bash
POST /api/student/create
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "registration_id": "REG123456"
}
```

### Get All Students
```bash
GET /api/students
Authorization: Bearer <jwt-token>
```

### Get Student by ID
```bash
GET /api/student/:id
Authorization: Bearer <jwt-token>
```

### Get Student by Student ID
```bash
GET /api/student/by-student-id/:student_id
Authorization: Bearer <jwt-token>
```

### Update Student
```bash
PUT /api/student/:id
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "status": "ACTIVE",
  "remarks": "Updated student info"
}
```

### Delete Student
```bash
DELETE /api/student/:id
Authorization: Bearer <jwt-token>
```

## Configuration

Add to your `.env` file:
```env
IDENTITY_SERVICE_URL=http://localhost:3001/api
```

## Database Migration

Run the migration script to update the students table:
```sql
-- Run the migration file
source migrations/001_recreate_students_table.sql
```

## Error Handling

The service handles various error scenarios:
- Registration not found in Identity Service
- Student already exists for registration
- Identity Service unavailable
- Invalid department data
- Database connection issues

## Dependencies

- **axios**: For Identity Service communication
- **sequelize**: ORM for database operations
- **express**: Web framework

## Development

1. Install dependencies: `npm install`
2. Update environment variables
3. Run migration script
4. Start development server: `npm run dev`

## Testing

Example workflow:
1. Create a registration in Identity Service
2. Use the registration_id to create student
3. Student data is automatically populated
4. Student ID and Roll Number are generated

## Architecture

```
Identity Service --> Student Service
     |                    |
Registration Data --> Student Creation
     |                    |
   REG123       --> STSC001 (Student ID)
```

The Student Service acts as a consumer of registration data, creating academic records with generated identifiers.