const cache = require("memory-cache");
const logger = require("../utils/logger");

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const cacheMiddleware = (duration = CACHE_DURATION) => {
  return (req, res, next) => {
    try {
      // Skip caching for non-GET requests or if cache is disabled
      if (req.method !== "GET" || process.env.DISABLE_CACHE === "true") {
        return next();
      }

      // Create a cache key from the request URL and any query parameters
      const key = `__express__${req.originalUrl || req.url}`;

      // Try to get from cache
      try {
        const cachedBody = cache.get(key);
        if (cachedBody) {
          logger.debug(`Cache hit for ${key}`);
          return res.json(cachedBody);
        }
      } catch (error) {
        logger.error(`Error reading from cache: ${error.message}`);
        // Continue without caching
        return next();
      }

      // Store the original send function
      const originalJson = res.json;

      // Override res.json method
      res.json = function (body) {
        try {
          if (res.statusCode === 200) {
            // Only cache successful responses
            cache.put(key, body, duration);
            logger.debug(`Cached response for ${key}`);
          }
        } catch (error) {
          logger.error(`Error writing to cache: ${error.message}`);
          // Continue without caching
        }

        // Restore original json function
        res.json = originalJson;
        // Call it with our body
        return res.json(body);
      };

      next();
    } catch (error) {
      logger.error(`Cache middleware error: ${error.message}`);
      // Continue without caching
      next();
    }
  };
};

// Function to clear cache for specific patterns
const clearCache = (pattern) => {
  try {
    const keys = cache.keys();
    const matchingKeys = keys.filter((key) => key.includes(pattern));
    matchingKeys.forEach((key) => {
      try {
        cache.del(key);
        logger.debug(`Cleared cache for key: ${key}`);
      } catch (error) {
        logger.error(`Error clearing cache for key ${key}: ${error.message}`);
      }
    });
    logger.info(
      `Cleared ${matchingKeys.length} cache entries for pattern: ${pattern}`
    );
  } catch (error) {
    logger.error(`Error in clearCache: ${error.message}`);
  }
};

// Function to clear all cache
const clearAllCache = () => {
  try {
    cache.clear();
    logger.info("Cleared all cache");
  } catch (error) {
    logger.error(`Error clearing all cache: ${error.message}`);
  }
};

module.exports = {
  cacheMiddleware,
  clearCache,
  clearAllCache,
};
