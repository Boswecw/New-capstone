# Server Configuration

This document outlines the environment variables required by the backend server and how to configure them on [Render](https://render.com).

## Environment Variables

### Mandatory

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string. |
| `JWT_SECRET` | Secret key used to sign JSON Web Tokens. |

### Optional

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLOUD_PROJECT_ID` | Google Cloud project identifier used for accessing Google Cloud Storage. |
| `GCS_BUCKET` | Name of the Google Cloud Storage bucket for pet images. |
| `FRONTEND_URL` | URL of the frontend application used for CORS checks. |

## Configure on Render

1. Log in to your Render dashboard.
2. Select the backend service for this project.
3. Navigate to the **Environment** tab.
4. Add the variables listed above, supplying values for the mandatory ones and any optional ones you need.
5. Click **Save** to apply the changes. Render will restart the service with the new configuration.

