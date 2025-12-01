import { createClient, RedisClientType } from 'redis';

class RedisClient {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    if (this.isConnected) return;

    // Skip Redis if not configured
    if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
      console.log('⚠️  Redis not configured - running without cache');
      return;
    }

    try {
      // Support both URL and host/port configuration
      if (process.env.REDIS_URL) {
        // Use Redis URL (for cloud services like Redis Cloud, Upstash, etc.)
        this.client = createClient({
          url: process.env.REDIS_URL
        });
      } else {
        // Use host/port configuration
        this.client = createClient({
          socket: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || '6379')
          },
          password: process.env.REDIS_PASSWORD || undefined
        });
      }

      this.client.on('error', (err: Error) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Redis connection failed:', error);
      console.log('⚠️  Continuing without Redis caching');
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected || !this.client) return null;
    
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: string, expirationInSeconds: number = 3600): Promise<void> {
    if (!this.isConnected || !this.client) return;
    
    try {
      await this.client.setEx(key, expirationInSeconds, value);
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Redis DEL PATTERN error:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

export default new RedisClient();
