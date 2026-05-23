# Assignment API Test Script
# Make sure your services are running:
# - Identity Service: port 9050
# - Teacher Service: port 9052

# Step 1: Login to get JWT token
Write-Host "Step 1: Testing login..." -ForegroundColor Yellow

$loginBody = @{
    username = "teacher123"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:9050/api/identity/authenticate-user" -Method POST -Body $loginBody -ContentType "application/json"
    
    if ($loginResponse.token) {
        $token = $loginResponse.token
        Write-Host "✅ Login successful! Token received." -ForegroundColor Green
        Write-Host "User: $($loginResponse.user.first_name) $($loginResponse.user.last_name)" -ForegroundColor Cyan
        Write-Host "Role: $($loginResponse.user.role)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Login failed - no token received" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Create an assignment
Write-Host "`nStep 2: Testing assignment creation..." -ForegroundColor Yellow

$assignmentBody = @{
    title = "Math Assignment - PowerShell Test"
    description = "This is a test assignment created via PowerShell API call"
    type = "Assignment"
    subject = "Mathematics"
    class_section = "10-A"
    due_date = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss")
    total_marks = 100
} | ConvertTo-Json

try {
    $assignmentResponse = Invoke-RestMethod -Uri "http://localhost:9052/api/teacher/assignments" -Method POST -Body $assignmentBody -ContentType "application/json" -Headers @{
        "Authorization" = "Bearer $token"
    }
    
    Write-Host "✅ Assignment created successfully!" -ForegroundColor Green
    Write-Host "Assignment ID: $($assignmentResponse.data.id)" -ForegroundColor Cyan
    Write-Host "Title: $($assignmentResponse.data.title)" -ForegroundColor Cyan
    Write-Host "Due Date: $($assignmentResponse.data.due_date)" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Assignment creation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

# Step 3: Get assignments list
Write-Host "`nStep 3: Testing assignments list..." -ForegroundColor Yellow

try {
    $listResponse = Invoke-RestMethod -Uri "http://localhost:9052/api/teacher/assignments" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
    }
    
    Write-Host "✅ Assignments fetched successfully!" -ForegroundColor Green
    Write-Host "Total assignments: $($listResponse.data.assignments.Count)" -ForegroundColor Cyan
    
    if ($listResponse.data.assignments.Count -gt 0) {
        Write-Host "`nRecent assignments:" -ForegroundColor White
        $listResponse.data.assignments | ForEach-Object {
            Write-Host "- ID: $($_.id) | Title: $($_.title) | Type: $($_.type)" -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "❌ Failed to fetch assignments: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🏁 API testing complete!" -ForegroundColor Green
Write-Host "Check your database to verify the assignment was saved." -ForegroundColor Yellow