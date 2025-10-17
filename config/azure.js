const { BlobServiceClient } = require('@azure/storage-blob');

class AzureStorageService {
  constructor() {
    this.connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.containerName = process.env.AZURE_CONTAINER_NAME || 'clothing-images';
    this.blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
  }

  async uploadImage(buffer, fileName, mimeType) {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      
      // Create container if it doesn't exist
      await containerClient.createIfNotExists({});

      const blobName = `${Date.now()}-${fileName}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: mimeType
        }
      });

      return blockBlobClient.url;
    } catch (error) {
      console.error('Error uploading to Azure Blob Storage:', error);
      throw error;
    }
  }

  async deleteImage(blobUrl) {
    try {
      const blobName = blobUrl.split('/').pop();
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      await blockBlobClient.deleteIfExists();
      return true;
    } catch (error) {
      console.error('Error deleting from Azure Blob Storage:', error);
      throw error;
    }
  }
}

module.exports = new AzureStorageService();