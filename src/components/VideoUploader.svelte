<script lang="ts">
  let selectedFile: File | null = null;
  let uploading = false;
  let progress = 0;
  let result: { type: 'success' | 'error'; html: string } | null = null;
  let fileInputEl: HTMLInputElement;

  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    selectedFile = input.files?.[0] || null;
    result = null;
  }

  function formatFileSize(bytes: number): string {
    return (bytes / (1024 * 1024)).toFixed(2);
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!selectedFile) {
      result = { type: 'error', html: '<h3>Please select a video file</h3>' };
      return;
    }

    uploading = true;
    progress = 0;
    result = null;

    const progressInterval = setInterval(() => {
      if (progress < 90) {
        progress += Math.random() * 10;
        progress = Math.min(progress, 90);
      }
    }, 300);

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);

      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      progress = 100;

      const data = await response.json();

      if (response.ok && data.success) {
        result = {
          type: 'success',
          html: `
            <h3>✓ Upload Successful!</h3>
            <p><strong>File:</strong> ${data.blobName}</p>
            <p><strong>Size:</strong> ${formatFileSize(data.size)} MB</p>
          `,
        };
        selectedFile = null;
        if (fileInputEl) fileInputEl.value = '';
      } else {
        result = {
          type: 'error',
          html: `
            <h3>✗ Upload Failed</h3>
            <p>${data.error || 'Unknown error occurred'}</p>
            ${data.details ? `<p><small>${data.details}</small></p>` : ''}
          `,
        };
      }
    } catch (error) {
      clearInterval(progressInterval);
      result = {
        type: 'error',
        html: `
          <h3>✗ Upload Failed</h3>
          <p>Network error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        `,
      };
    } finally {
      uploading = false;
      setTimeout(() => {
        progress = 0;
      }, 2000);
    }
  }
</script>

<section class="upload-section">
  <h2>Upload Video</h2>
  <form on:submit={handleSubmit} class="upload-form">
    <div class="form-group">
      <label for="videoFile" class="file-label">
        <span class="file-label-text">Choose Video File</span>
        <input
          bind:this={fileInputEl}
          type="file"
          id="videoFile"
          name="video"
          accept="video/mp4,video/webm,video/ogg,video/quicktime"
          on:change={handleFileSelect}
          required
        />
      </label>
      <p class="help-text">
        Supported formats: MP4, WebM, OGG, MOV (Max 500MB)
      </p>
    </div>

    {#if selectedFile}
      <div class="file-info">
        <strong>Selected file:</strong><br />
        Name: {selectedFile.name}<br />
        Size: {formatFileSize(selectedFile.size)} MB<br />
        Type: {selectedFile.type}
      </div>
    {/if}

    {#if uploading || progress > 0}
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" style="width: {Math.round(progress)}%"></div>
        </div>
        <p class="progress-text">{Math.round(progress)}%</p>
      </div>
    {/if}

    <button type="submit" class="upload-button" disabled={uploading}>
      {uploading ? 'Uploading...' : 'Upload Video'}
    </button>
  </form>

  {#if result}
    <div class="result {result.type}">
      {@html result.html}
    </div>
  {/if}
</section>

<style>
  .upload-section {
    margin-bottom: 2rem;
  }

  h2 {
    font-family: var(--font-family-serif);
    font-size: 2.2em;
    margin: 1.6em 0 1em 0;
    color: var(--primary-color);
    text-align: center;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    letter-spacing: 0.05em;
  }

  .upload-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .file-label {
    display: block;
    position: relative;
    cursor: pointer;
  }

  .file-label-text {
    display: block;
    width: 100%;
    text-align: center;
    padding: 0.75rem 1.5rem;
    background: var(--primary-color);
    color: white;
    border-radius: 6px;
    transition: background 0.2s, box-shadow 0.2s;
    font-family: var(--font-family-sans);
    font-weight: 500;
  }

  .file-label:hover .file-label-text {
    box-shadow: 0 4px 12px rgba(84, 142, 155, 0.3);
  }

  .file-label input[type="file"] {
    position: absolute;
    left: -9999px;
    opacity: 0;
  }

  .help-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .file-info {
    padding: 1rem;
    background: var(--background-body);
    border: 1px solid var(--primary-color);
    border-radius: 6px;
    font-size: 0.875rem;
    color: var(--text-main);
  }

  .progress-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .progress-bar {
    width: 100%;
    height: 24px;
    background: var(--text-secondary);
    border-radius: 12px;
    overflow: hidden;
    opacity: 0.3;
  }

  .progress-fill {
    height: 100%;
    background: var(--primary-color);
    transition: width 0.3s ease;
  }

  .progress-text {
    text-align: center;
    font-weight: 500;
    margin: 0;
    color: var(--text-main);
  }

  .upload-button {
    padding: 1rem 2rem;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-family: var(--font-family-sans);
    font-weight: 600;
    cursor: pointer;
    transition: box-shadow 0.2s, transform 0.2s;
  }

  .upload-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(84, 142, 155, 0.3);
  }

  .upload-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .result {
    margin-top: 1.5rem;
    padding: 1.5rem;
    border-radius: 6px;
    font-size: 0.95rem;
  }

  .result.success {
    background: rgba(84, 142, 155, 0.1);
    border: 1px solid var(--primary-color);
    color: var(--text-main);
  }

  .result.error {
    background: rgba(220, 53, 69, 0.1);
    border: 1px solid #dc3545;
    color: var(--text-main);
  }

  .result :global(h3) {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    font-family: var(--font-family-sans);
  }

  .result :global(p) {
    margin: 0.5rem 0;
    font-size: 1rem;
  }

  .result :global(a) {
    color: var(--primary-color);
    word-break: break-all;
  }
</style>
