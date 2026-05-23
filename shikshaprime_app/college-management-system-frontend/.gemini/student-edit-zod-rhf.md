# Student Edit Feature - Zod & React Hook Form Implementation

## Overview
Implemented comprehensive form validation using **Zod** schema validation and **React Hook Form** for the student edit functionality with role-based field editing.

## Key Features

### 1. **Zod Schema Validation**
Created a dynamic schema that adapts based on user role:

```typescript
const createStudentEditSchema = (isAdmin: boolean) => {
    const baseSchema = {
        mobile: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number is too long").optional().or(z.literal('')),
        guardian_mobile: z.string().min(10, "Guardian mobile must be at least 10 digits").max(15, "Phone number is too long").optional().or(z.literal('')),
        father_email: z.string().email("Invalid email address").optional().or(z.literal('')),
    };

    if (isAdmin) {
        return z.object({
            ...baseSchema,
            present_district: z.string().optional(),
            present_pin_code: z.string().min(6, "Pin code must be 6 digits").max(6, "Pin code must be 6 digits").optional().or(z.literal('')),
            present_state: z.string().optional(),
            present_village: z.string().optional(),
        });
    }

    return z.object(baseSchema);
};
```

### 2. **Validation Rules**

#### All Users:
- **Mobile**: 10-15 digits, optional
- **Guardian Mobile**: 10-15 digits, optional
- **Father Email**: Valid email format, optional

#### Admin Only:
- **Present District**: Optional text
- **Present Pin Code**: Exactly 6 digits, optional
- **Present State**: Optional text
- **Present Village**: Optional text

### 3. **React Hook Form Integration**

```typescript
const form = useForm<StudentEditFormData>({
    resolver: zodResolver(createStudentEditSchema(isAdmin)),
    defaultValues: {
        mobile: '',
        guardian_mobile: '',
        father_email: '',
        ...(isAdmin && {
            present_district: '',
            present_pin_code: '',
            present_state: '',
            present_village: '',
        }),
    },
});
```

### 4. **Form Field Implementation**

Each editable field uses the `FormField` component with proper validation:

```typescript
<FormField
    control={form.control}
    name="mobile"
    render={({ field }) => (
        <FormItem className="flex-1">
            <FormControl>
                <Input
                    {...field}
                    placeholder="Enter phone number"
                    className="editable-input"
                />
            </FormControl>
            <FormMessage />
        </FormItem>
    )}
/>
```

### 5. **Form Submission**

```typescript
const onSubmit = async (data: StudentEditFormData) => {
    if (!student) return;
    
    console.log("Form submitted with data:", data);
    
    setIsLoading(true);
    try {
        await callUpdateStudent(student.id, data);
        notifySuccess("Student updated successfully!");
        await fetchStudent();
        router.push(`/dashboard/students/${studentId}`);
    } catch (err) {
        console.error("Error updating student:", err);
        notifyError("Failed to update student");
    } finally {
        setIsLoading(false);
    }
};
```

## Files Created/Modified

### Created:
1. **`components/ui/form.tsx`** - Form component wrapper for React Hook Form
   - Provides `Form`, `FormField`, `FormItem`, `FormControl`, `FormLabel`, `FormMessage` components
   - Integrates with Shadcn UI design system

### Modified:
1. **`app/dashboard/students/[id]/page.tsx`**
   - Added Zod schema validation
   - Integrated React Hook Form
   - Replaced manual state management with form state
   - Added proper error handling and validation messages

2. **`app/dashboard/students/[id]/student-details.css`**
   - Added styles for form error messages
   - Added styles for form field containers
   - Ensured proper layout for validation messages

## Benefits

### ✅ **Type Safety**
- Full TypeScript support with inferred types from Zod schema
- Compile-time type checking for form data

### ✅ **Validation**
- Client-side validation before submission
- Real-time error messages
- Field-level validation rules

### ✅ **User Experience**
- Clear error messages for invalid inputs
- Visual feedback on validation errors
- Prevents invalid data submission

### ✅ **Developer Experience**
- Declarative form validation
- Easy to maintain and extend
- Consistent validation logic

## Form Data Structure

When the form is submitted, the data logged to console will look like:

```javascript
{
    "mobile": "8637859578",
    "guardian_mobile": "7890745870",
    "father_email": "example@email.com",
    // Admin only fields (if user is admin):
    "present_district": "kolkata",
    "present_pin_code": "700056",
    "present_state": "west bengal",
    "present_village": "42/4/f"
}
```

## Error Handling

### Validation Errors:
- **Phone numbers**: Must be 10-15 digits
- **Email**: Must be valid email format
- **Pin code**: Must be exactly 6 digits

### Display:
- Error messages appear below the input field in red text
- Input border turns red when validation fails
- Form submission is blocked until all errors are resolved

## Testing the Implementation

1. Navigate to students page
2. Click "Edit" on any student
3. Try entering invalid data:
   - Phone number with less than 10 digits
   - Invalid email format
   - Pin code with more/less than 6 digits
4. Observe validation error messages
5. Correct the errors and submit
6. Check console for submitted data
7. Verify success notification and data update

## Dependencies Required

Make sure these packages are installed:
```bash
npm install react-hook-form @hookform/resolvers zod
npm install @radix-ui/react-label @radix-ui/react-slot
```
