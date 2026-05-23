# PowerShell script to test assignment API

# Step 1: Login to get JWT token
Write-Host "Testing login..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "http://localhost:9050/api/identity/authenticate-user" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body '{"username": "teacher123", "password": "password123"}' `
    -ErrorAction Stop

Write-Host "Login Response:" -ForegroundColor Green
$loginResponse | ConvertTo-Json -Depth 3

# Extract token
$token = $loginResponse.token
Write-Host "Token: $token" -ForegroundColor Cyan

# Step 2: Test assignment creation
Write-Host "`nTesting assignment creation..." -ForegroundColor Yellow
$assignmentData = @{
    title = "Test Assignment via API"
    description = "This is a test assignment created via PowerShell"
    type = "Assignment"
    subject_id = 1
    program_id = 1
    section_id = 1
    due_date = "2026-02-15"
    due_time = "23:59"
    max_marks = 100
    instructions = "Complete all questions"
} | ConvertTo-Json

$assignmentResponse = Invoke-RestMethod -Uri "http://localhost:9052/api/teacher/assignments" `
    -Method POST `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    } `
    -Body $assignmentData `
    -ErrorAction Stop

Write-Host "Assignment Creation Response:" -ForegroundColor Green
$assignmentResponse | ConvertTo-Json -Depth 3

# Step 3: Get all assignments
Write-Host "`nTesting get assignments..." -ForegroundColor Yellow
$getResponse = Invoke-RestMethod -Uri "http://localhost:9052/api/teacher/assignments" `
    -Method GET `
    -Headers @{
        "Authorization" = "Bearer $token"
    } `
    -ErrorAction Stop

Write-Host "Get Assignments Response:" -ForegroundColor Green
$getResponse | ConvertTo-Json -Depth 3