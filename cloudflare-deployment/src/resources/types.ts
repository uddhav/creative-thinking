/**
 * MCP Resource types and interfaces
 */

/**
 * Metadata for a resource
 */
export interface ResourceMetadata {
  name: string;
  title?: string;
  description?: string;
  mimeType: string;
}

/**
 * Full resource content including metadata
 */
export interface ResourceContent extends ResourceMetadata {
  uri: string;
  text?: string;
  blob?: string; // Base64 encoded binary data
}

/**
 * Resource template for dynamic URIs
 */
export interface ResourceTemplate {
  uriTemplate: string;
  name: string;
  description?: string;
  mimeType: string;
}

/**
 * Resource subscription
 */
export interface ResourceSubscription {
  uri: string;
  connectionId: string;
  subscribedAt: number;
}

/**
 * Resource provider interface
 */
export interface ResourceProvider {
  /**
   * List all resources this provider manages
   */
  listResources(): Promise<Array<{ uri: string; name: string; mimeType: string }>>;

  /**
   * Read a specific resource
   */
  readResource(uri: string): Promise<ResourceContent | null>;

  /**
   * List resource templates for dynamic resources
   */
  listTemplates?(): Promise<ResourceTemplate[]>;

  /**
   * Check if a URI matches this provider's pattern
   */
  canHandle(uri: string): boolean;
}

/**
 * Export formats supported
 */
export type ExportFormat = 'json' | 'markdown' | 'csv';

/**
 * Session export options
 */
export interface SessionExportOptions {
  format: ExportFormat;
  includeMetrics?: boolean;
  includeInsights?: boolean;
  includeHistory?: boolean;
}
