/**
 * Base class for resource providers
 */

import type { ResourceContent, ResourceProvider, ResourceTemplate } from './types.js';

export abstract class BaseResourceProvider implements ResourceProvider {
  protected cache: Map<string, { content: ResourceContent; timestamp: number }> = new Map();
  protected cacheTTL: number = 60000; // 1 minute default cache TTL

  constructor(protected uriPrefix: string) {}

  /**
   * Check if a URI matches this provider's pattern
   */
  canHandle(uri: string): boolean {
    return uri.startsWith(this.uriPrefix);
  }

  /**
   * Parse URI to extract parts
   */
  protected parseUri(uri: string): string[] {
    const prefix = this.uriPrefix;
    if (!uri.startsWith(prefix)) {
      throw new Error(`Invalid URI for this provider: ${uri}`);
    }
    const path = uri.substring(prefix.length);
    return path.split('/').filter(part => part.length > 0);
  }

  /**
   * Get cached content if available and not expired
   */
  protected getCached(uri: string): ResourceContent | null {
    const cached = this.cache.get(uri);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < this.cacheTTL) {
        return cached.content;
      }
      // Remove expired cache entry
      this.cache.delete(uri);
    }
    return null;
  }

  /**
   * Cache resource content
   */
  protected setCache(uri: string, content: ResourceContent): void {
    this.cache.set(uri, {
      content,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache for a specific URI or all cached resources
   */
  clearCache(uri?: string): void {
    if (uri) {
      this.cache.delete(uri);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Read a resource with caching
   */
  async readResource(uri: string): Promise<ResourceContent | null> {
    // Check cache first
    const cached = this.getCached(uri);
    if (cached) {
      return cached;
    }

    // Generate content
    const content = await this.generateContent(uri);
    if (content) {
      this.setCache(uri, content);
    }

    return content;
  }

  /**
   * Generate resource content - must be implemented by subclasses
   */
  protected abstract generateContent(uri: string): Promise<ResourceContent | null>;

  /**
   * List all resources this provider manages
   */
  abstract listResources(): Promise<Array<{ uri: string; name: string; mimeType: string }>>;

  /**
   * List resource templates for dynamic resources (optional)
   */
  listTemplates?(): Promise<ResourceTemplate[]>;
}

/**
 * Helper class for managing multiple resource providers
 */
export class ResourceProviderRegistry {
  private providers: ResourceProvider[] = [];

  /**
   * Register a resource provider
   */
  register(provider: ResourceProvider): void {
    this.providers.push(provider);
  }

  /**
   * Find provider that can handle a URI
   */
  findProvider(uri: string): ResourceProvider | null {
    return this.providers.find(p => p.canHandle(uri)) || null;
  }

  /**
   * List all resources from all providers
   */
  async listAllResources(): Promise<Array<{ uri: string; name: string; mimeType: string }>> {
    const allResources = await Promise.all(this.providers.map(p => p.listResources()));
    return allResources.flat();
  }

  /**
   * List all templates from all providers
   */
  async listAllTemplates(): Promise<ResourceTemplate[]> {
    const allTemplates = await Promise.all(
      this.providers.filter(p => p.listTemplates).map(p => p.listTemplates!())
    );
    return allTemplates.flat();
  }

  /**
   * Read a resource using the appropriate provider
   */
  async readResource(uri: string): Promise<ResourceContent | null> {
    const provider = this.findProvider(uri);
    if (!provider) {
      return null;
    }
    return provider.readResource(uri);
  }
}
