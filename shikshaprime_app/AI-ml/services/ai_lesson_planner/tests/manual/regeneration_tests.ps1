# =============================================================================
# AI Lesson Planner — Regeneration API Tests (PowerShell)
# =============================================================================
# HOW TO RUN:
#   1. Start the server first:
#      uv run uvicorn app.main:app --reload
#
#   2. Open a NEW terminal, go to the project folder, then run:
#      .\tests\manual\regeneration_tests.ps1
#
#   3. To run ONE specific test only, call it by name:
#      .\tests\manual\regeneration_tests.ps1 -Test 2
# =============================================================================

param(
    [int]$Test = 0   # 0 = run all tests
)

$BASE_URL = "http://localhost:8000"
$HEADERS  = @{ "Content-Type" = "application/json" }

# Shared existing plan used in every test
$EXISTING_PLAN = @{
    objectives     = @(
        "Define photosynthesis using the correct equation",
        "Explain the role of chlorophyll in capturing light"
    )
    prerequisites  = @("Know plant cell structure")
    materials      = @("NCERT textbook Ch.1", "Whiteboard")
    activities     = @{
        intro               = "Show a wilting plant and ask what it needs."
        instruction         = "Draw the photosynthesis equation on the board."
        guidedPractice      = "Teacher reads steps while students copy."
        independentPractice = "Label a blank chloroplast diagram."
        closure             = "Exit ticket: name one reactant and one product."
    }
    assessment     = @{
        formative  = "Thumbs up/down on three statements."
        summative  = "Q1: Write the equation. Q2: Why are leaves green?"
    }
    differentiation = @{
        slowLearners     = "Provide a partially filled diagram."
        advancedLearners = "Research how C4 plants differ."
    }
    homework       = "Task 1: Draw and label the photosynthesis process."
    standards      = @("CBSE Science Grade 7.LP-S1: Define photosynthesis")
    timeBreakdown  = @{
        intro               = 5
        instruction         = 15
        guidedPractice      = 9
        independentPractice = 11
        closure             = 5
    }
}

# Base request fields shared by all tests
$BASE = @{
    grade        = "7"
    subject      = "Science"
    topic        = "Photosynthesis"
    duration     = 45
    board        = "CBSE"
    teachingStyle = "Activity-based"
    depth        = "Standard"
    existingPlan = $EXISTING_PLAN
}

function Run-Test {
    param(
        [int]    $Number,
        [string] $Name,
        [hashtable] $Body,
        [int]    $ExpectedStatus = 200,
        [string] $ExpectKey = ""
    )

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "TEST $Number — $Name" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "POST $BASE_URL/regenerate"
    Write-Host "regenerateSection: $($Body.regenerateSection)"
    if ($Body.userInstruction) {
        Write-Host "userInstruction: $($Body.userInstruction)"
    }

    $json = $Body | ConvertTo-Json -Depth 20 -Compress

    try {
        if ($ExpectedStatus -eq 200) {
            $response = Invoke-RestMethod `
                -Uri "$BASE_URL/regenerate" `
                -Method POST `
                -Headers $HEADERS `
                -Body $json
            Write-Host "STATUS: 200 OK" -ForegroundColor Green
            Write-Host "RESPONSE:" -ForegroundColor Yellow
            $response | ConvertTo-Json -Depth 10
            if ($ExpectKey -and -not $response.PSObject.Properties[$ExpectKey]) {
                Write-Host "WARN: expected key '$ExpectKey' not found in response" -ForegroundColor Red
            } else {
                Write-Host "KEY CHECK '$ExpectKey': PASS" -ForegroundColor Green
            }
        } else {
            # For tests that expect 4xx errors
            Invoke-RestMethod `
                -Uri "$BASE_URL/regenerate" `
                -Method POST `
                -Headers $HEADERS `
                -Body $json `
                -ErrorAction Stop
            Write-Host "FAIL — expected $ExpectedStatus but got 200" -ForegroundColor Red
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "STATUS: $statusCode (expected $ExpectedStatus)" -ForegroundColor Green
            Write-Host "PASS — validation rejected the request correctly" -ForegroundColor Green
        } else {
            Write-Host "STATUS: $statusCode (expected $ExpectedStatus)" -ForegroundColor Red
            Write-Host "ERROR: $_" -ForegroundColor Red
        }
    }
}

# ===========================================================================
# HEALTH CHECK
# ===========================================================================
function Test-Health {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "HEALTH CHECK" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    try {
        $r = Invoke-RestMethod -Uri "$BASE_URL/health" -Method GET
        Write-Host "STATUS: 200 OK" -ForegroundColor Green
        Write-Host "RESPONSE: $($r | ConvertTo-Json)"
    } catch {
        Write-Host "FAIL — server not running. Start it with:" -ForegroundColor Red
        Write-Host "  uv run uvicorn app.main:app --reload" -ForegroundColor Yellow
        exit 1
    }
}

# ===========================================================================
# TEST DEFINITIONS
# ===========================================================================

function Test-1 {
    Run-Test -Number 1 `
        -Name "Regenerate objectives (no instruction)" `
        -Body ($BASE + @{ regenerateSection = "objectives" }) `
        -ExpectedStatus 200 `
        -ExpectKey "objectives"
}

function Test-2 {
    Run-Test -Number 2 `
        -Name "Regenerate activities.guidedPractice — more student-led" `
        -Body ($BASE + @{
            regenerateSection = "activities.guidedPractice"
            userInstruction   = "make it more student-led, not teacher-driven"
        }) `
        -ExpectedStatus 200 `
        -ExpectKey "guidedPractice"
}

function Test-3 {
    Run-Test -Number 3 `
        -Name "Regenerate assessment.summative — MCQ questions" `
        -Body ($BASE + @{
            regenerateSection = "assessment.summative"
            userInstruction   = "use MCQ questions instead of written answers"
        }) `
        -ExpectedStatus 200 `
        -ExpectKey "summative"
}

function Test-4 {
    Run-Test -Number 4 `
        -Name "Regenerate full activities section — hands-on experiments" `
        -Body ($BASE + @{
            regenerateSection = "activities"
            userInstruction   = "use more hands-on experiments throughout"
        }) `
        -ExpectedStatus 200 `
        -ExpectKey "activities"
}

function Test-5 {
    Run-Test -Number 5 `
        -Name "Regenerate homework — textbook questions only" `
        -Body ($BASE + @{
            regenerateSection = "homework"
            userInstruction   = "assign from textbook exercise questions only, no drawing tasks"
        }) `
        -ExpectedStatus 200 `
        -ExpectKey "homework"
}

function Test-6 {
    Run-Test -Number 6 `
        -Name "Regenerate differentiation.slowLearners — visual aids" `
        -Body ($BASE + @{
            regenerateSection = "differentiation.slowLearners"
            userInstruction   = "focus on visual aids and peer support strategies"
        }) `
        -ExpectedStatus 200 `
        -ExpectKey "slowLearners"
}

function Test-7 {
    Run-Test -Number 7 `
        -Name "Regenerate timeBreakdown — more independent practice time" `
        -Body ($BASE + @{
            regenerateSection = "timeBreakdown"
            userInstruction   = "give more time to independent practice, reduce instruction time"
        }) `
        -ExpectedStatus 200 `
        -ExpectKey "timeBreakdown"
}

function Test-8 {
    Run-Test -Number 8 `
        -Name "Regenerate prerequisites" `
        -Body ($BASE + @{ regenerateSection = "prerequisites" }) `
        -ExpectedStatus 200 `
        -ExpectKey "prerequisites"
}

function Test-9 {
    Run-Test -Number 9 `
        -Name "Regenerate materials" `
        -Body ($BASE + @{ regenerateSection = "materials" }) `
        -ExpectedStatus 200 `
        -ExpectKey "materials"
}

function Test-10 {
    Run-Test -Number 10 `
        -Name "Regenerate standards" `
        -Body ($BASE + @{ regenerateSection = "standards" }) `
        -ExpectedStatus 200 `
        -ExpectKey "standards"
}

# --- VALIDATION TESTS (all should return 422) ---

function Test-11 {
    Run-Test -Number 11 `
        -Name "VALIDATION — unknown section name (should fail 422)" `
        -Body ($BASE + @{ regenerateSection = "somethingFake" }) `
        -ExpectedStatus 422
}

function Test-12 {
    Run-Test -Number 12 `
        -Name "VALIDATION — missing grade field (should fail 422)" `
        -Body @{
            regenerateSection = "objectives"
            subject           = "Science"
            topic             = "Photosynthesis"
            duration          = 45
            board             = "CBSE"
            teachingStyle     = "Activity-based"
            depth             = "Standard"
            existingPlan      = @{}
        } `
        -ExpectedStatus 422
}

function Test-13 {
    Run-Test -Number 13 `
        -Name "VALIDATION — invalid depth value (should fail 422)" `
        -Body ($BASE + @{
            regenerateSection = "objectives"
            depth             = "Expert"
        }) `
        -ExpectedStatus 422
}

function Test-14 {
    Run-Test -Number 14 `
        -Name "VALIDATION — duration zero (should fail 422)" `
        -Body ($BASE + @{
            regenerateSection = "objectives"
            duration          = 0
        }) `
        -ExpectedStatus 422
}

function Test-15 {
    $longInstruction = "a" * 501
    Run-Test -Number 15 `
        -Name "VALIDATION — userInstruction too long over 500 chars (should fail 422)" `
        -Body ($BASE + @{
            regenerateSection = "objectives"
            userInstruction   = $longInstruction
        }) `
        -ExpectedStatus 422
}

# ===========================================================================
# RUNNER
# ===========================================================================

Test-Health

if ($Test -eq 0) {
    Write-Host ""
    Write-Host "Running all 15 tests..." -ForegroundColor Magenta

    Test-1
    Test-2
    Test-3
    Test-4
    Test-5
    Test-6
    Test-7
    Test-8
    Test-9
    Test-10
    Test-11
    Test-12
    Test-13
    Test-14
    Test-15

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Magenta
    Write-Host "All tests complete." -ForegroundColor Magenta
    Write-Host "========================================" -ForegroundColor Magenta
} else {
    & "Test-$Test"
}
