# Attendance OCR Service

This service provides an automated pipeline to extract attendance data from images of handwritten or printed attendance sheets. It utilizes a combination of Computer Vision preprocessing, Mistral OCR, and Google Gemini AI to convert raw images into structured JSON data.

## 🚀 Pipeline Overview

The attendance extraction process consists of four distinct stages:

1.  **Image Upload & Validation**:
    - Validates that the uploaded file is an image.
    - Assigns a unique `request_id` for tracking.

2.  **Preprocessing**:
    - Resizes the image to an optimal resolution (max width 2000px).
    - Applies standard preprocessing to enhance text visibility.
    - Saves the processed image to `outputs/processed_images/`.

3.  **Mistral OCR (Optical Character Recognition)**:
    - Sends the preprocessed image to Mistral's OCR model.
    - Converts the visual text into a structured Markdown format.
    - Saves the Markdown output to `outputs/ocr_markdown/`.

4.  **Semantic Parsing (Gemini AI)**:
    - Sends the Markdown content and original image context to Google Gemini.
    - Parses the data into a strict JSON schema representing the attendance record.
    - Saves the final JSON to `outputs/extracted_json/`.

## 🛠️ Prerequisites

- **Python 3.13+**
- **uv**: An extremely fast Python package and project manager. [Install uv](https://docs.astral.sh/uv/getting-started/installation/) if you haven't already.

## ⚙️ Setup

1.  **Navigate to the service directory:**
    ```bash
    cd ShikshaPrime_new/AI-ml/services/attendance
    ```

2.  **Configure Environment Variables:**
    - Create a `.env` file in the current directory (`services/attendance`).
    - You can use `.env.example` as a template:
        ```bash
        cp .env.example .env
        ```
    - **Required Keys:**
        - `GOOGLE_API_KEY`: API key for Google Gemini.
        - `MISTRAL_API_KEY`: API key for Mistral AI.

    **Note:** The application looks for the `.env` file in `services/attendance/app/.env`, `services/attendance/.env`, or `services/.env` (in that order of priority). It is recommended to keep it in `services/attendance/.env`.

## 🏃‍♂️ How to Run

We use `uv` to manage dependencies and run the application. This ensures a consistent environment without manually activating virtual environments.

**Run the following command from the `services/attendance` directory:**


```bash
uv run -m uvicorn app.main:app --reload --port 8000
```


- `--reload`: Enables auto-reload on code changes (useful for development).
- `--port 8000`: Runs the server on port 8000.

### Accessing the API

- **Interactive Documentation (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/](http://localhost:8000/)

## 📂 Directory Structure

```
attendance/
├── app/
│   ├── api/            # API endpoints
│   ├── core/           # Config and logging
│   ├── services/       # Logic for Gemini, Mistral, and Image processing
│   └── main.py         # Application entry point
├── outputs/            # Generated artifacts (Images, Markdown, JSON, Logs)
├── .env.example        # Example environment variables
└── README.md           # This documentation
```

## 📝 Logging

Logs are output to both the **terminal** and file storage:
- **Terminal**: Real-time colorful logs.
- **Files**: Stored in `outputs/logs/` (rotated and compressed automatically).
