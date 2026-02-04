import { BlobServiceClient } from "@azure/storage-blob";
import type { APIRoute } from "astro";

interface VideoItem {
  name: string;
  url: string;
  size: number;
  createdOn: string;
}

export const GET: APIRoute = async () => {
  try {
    const connectionString = import.meta.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName =
      import.meta.env.AZURE_STORAGE_CONTAINER_NAME || "videos";

    if (!connectionString) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Storage not configured",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const exists = await containerClient.exists();
    if (!exists) {
      return new Response(JSON.stringify({ success: true, videos: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const videos: VideoItem[] = [];

    for await (const blob of containerClient.listBlobsFlat({
      includeMetadata: true,
    })) {
      const blobClient = containerClient.getBlobClient(blob.name);
      videos.push({
        name: blob.name,
        url: blobClient.url,
        size: blob.properties.contentLength || 0,
        createdOn: blob.properties.createdOn?.toISOString() || "",
      });
    }

    videos.sort(
      (a, b) =>
        new Date(b.createdOn).valueOf() - new Date(a.createdOn).valueOf(),
    );

    return new Response(JSON.stringify({ success: true, videos }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("List videos error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to list videos",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const prerender = false;
