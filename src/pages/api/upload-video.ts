import { BlobServiceClient } from "@azure/storage-blob";
import type { APIRoute } from "astro";

// Allowed video MIME types
const ALLOWED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime", // .mov files
];

// Maximum file size: 500MB
const MAX_FILE_SIZE = 500 * 1024 * 1024;

// Sanitize filename to prevent path traversal and special characters
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .substring(0, 200);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get environment variables
    const connectionString = import.meta.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName =
      import.meta.env.AZURE_STORAGE_CONTAINER_NAME || "videos";

    if (!connectionString) {
      console.error("Azure Storage connection string not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Storage not configured",
          details: "Azure Storage connection string is missing",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("video") as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No file provided",
          details: "Please select a video file to upload",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error(`Invalid file type: ${file.type}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid file type",
          details: `Allowed types: MP4, WebM, OGG, MOV. Received: ${file.type}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.error(`File too large: ${file.size} bytes`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "File too large",
          details: `Maximum file size is 500MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Connect to Azure Blob Storage
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Auto-create container with public blob access if it doesn't exist
    await containerClient.createIfNotExists({ access: "blob" });

    // Generate unique blob name
    const sanitizedName = sanitizeFilename(file.name);
    const blobName = `${Date.now()}-${sanitizedName}`;

    // Get blob client and upload
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const arrayBuffer = await file.arrayBuffer();

    await blockBlobClient.uploadData(arrayBuffer, {
      blobHTTPHeaders: {
        blobContentType: file.type,
      },
    });

    console.log(`Successfully uploaded: ${blobName} (${file.size} bytes)`);

    return new Response(
      JSON.stringify({
        success: true,
        blobName,
        size: file.size,
        url: blockBlobClient.url,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Upload failed",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

// Disable prerendering for this API endpoint
export const prerender = false;
