import { EventEmitter } from '../core/EventEmitter.js';

export class Camera extends EventEmitter {
  constructor(viewportWidth, viewportHeight, worldWidth, worldHeight) {
    super();

    // Viewport dimensions
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    // World boundaries
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    // Camera position (top-left corner of viewport in world coordinates)
    this.x = 0;
    this.y = 0;

    // Target position for smooth movement
    this.targetX = 0;
    this.targetY = 0;

    // Smoothing factor (0 = no smoothing, 1 = instant)
    this.smoothing = 0.1;

    // Optional bounds padding
    this.boundsPadding = 0;

    // Follow target
    this.target = null;
    this.followOffset = { x: 0, y: 0 };

    // Shake effect properties
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTime = 0;

    // Zoom properties
    this.zoom = 1;
    this.targetZoom = 1;
    this.minZoom = 0.5;
    this.maxZoom = 2;
    this.zoomSmoothing = 0.1;
  }

  /**
   * Set the target entity for the camera to follow
   * @param {Object} target - Object with x and y properties
   * @param {boolean} instant - Whether to move instantly to target
   */
  follow(target, instant = false) {
    this.target = target;
    if (instant && target) {
      this.centerOn(target.x, target.y, true);
    }
  }

  /**
   * Stop following any target
   */
  unfollow() {
    this.target = null;
  }

  /**
   * Center camera on specific world coordinates
   * @param {number} worldX - X position in world coordinates
   * @param {number} worldY - Y position in world coordinates
   * @param {boolean} instant - Whether to move instantly
   */
  centerOn(worldX, worldY, instant = false) {
    this.targetX = worldX - this.viewportWidth / 2;
    this.targetY = worldY - this.viewportHeight / 2;

    if (instant) {
      this.x = this.targetX;
      this.y = this.targetY;
    }
  }

  /**
   * Move camera by a specific amount
   * @param {number} dx - Delta X
   * @param {number} dy - Delta Y
   */
  move(dx, dy) {
    this.targetX += dx;
    this.targetY += dy;
  }

  /**
   * Set camera position directly
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  setPosition(x, y) {
    this.targetX = x;
    this.targetY = y;
    this.x = x;
    this.y = y;
  }

  /**
   * Apply camera shake effect
   * @param {number} intensity - Shake intensity in pixels
   * @param {number} duration - Shake duration in seconds
   */
  shake(intensity = 10, duration = 0.5) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTime = 0;
    this.emit('shakeStart', { intensity, duration });
  }

  /**
   * Set zoom level
   * @param {number} zoom - Zoom level (1 = normal, 2 = 2x zoom in, 0.5 = 2x zoom out)
   * @param {boolean} instant - Whether to zoom instantly
   */
  setZoom(zoom, instant = false) {
    this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    if (instant) {
      this.zoom = this.targetZoom;
    }
  }

  /**
   * Zoom in/out by a factor
   * @param {number} factor - Zoom factor (positive = zoom in, negative = zoom out)
   */
  adjustZoom(factor) {
    this.setZoom(this.targetZoom + factor);
  }

  /**
   * Update camera position and effects
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    // Follow target if set
    if (this.target) {
      this.centerOn(
        this.target.x + this.followOffset.x,
        this.target.y + this.followOffset.y
      );
    }

    // Wrap camera position to world bounds
    const wrap = (v, max) => ((v % max) + max) % max;
    this.targetX = wrap(this.targetX, this.worldWidth);
    this.targetY = wrap(this.targetY, this.worldHeight);

    // Smooth camera movement
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;

    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
      this.x += dx * this.smoothing;
      this.y += dy * this.smoothing;
      this.emit('move', { x: this.x, y: this.y });
    }

    // Update shake effect
    if (this.shakeDuration > 0 && this.shakeTime < this.shakeDuration) {
      this.shakeTime += deltaTime;
      if (this.shakeTime >= this.shakeDuration) {
        this.shakeIntensity = 0;
        this.emit('shakeEnd');
      }
    }

    // Smooth zoom
    const zoomDiff = this.targetZoom - this.zoom;
    if (Math.abs(zoomDiff) > 0.001) {
      this.zoom += zoomDiff * this.zoomSmoothing;
      this.emit('zoom', { zoom: this.zoom });
    }
  }

  /**
   * Get current camera offset including shake
   * @returns {Object} Object with x and y offset
   */
  getOffset() {
    let offsetX = -this.x;
    let offsetY = -this.y;

    // Add shake offset
    if (this.shakeIntensity > 0 && this.shakeDuration > 0) {
      const progress = this.shakeTime / this.shakeDuration;
      const currentIntensity = this.shakeIntensity * (1 - progress);

      offsetX += (Math.random() - 0.5) * currentIntensity * 2;
      offsetY += (Math.random() - 0.5) * currentIntensity * 2;
    }

    return { x: offsetX, y: offsetY };
  }

  /**
   * Convert screen coordinates to world coordinates
   * @param {number} screenX - X position on screen
   * @param {number} screenY - Y position on screen
   * @returns {Object} World coordinates
   */
  screenToWorld(screenX, screenY) {
    return {
      x: screenX + this.x,
      y: screenY + this.y
    };
  }

  /**
   * Convert world coordinates to screen coordinates
   * @param {number} worldX - X position in world
   * @param {number} worldY - Y position in world
   * @returns {Object} Screen coordinates
   */
  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.x,
      y: worldY - this.y
    };
  }

  /**
   * Check if a world position is visible on screen
   * @param {number} worldX - X position in world
   * @param {number} worldY - Y position in world
   * @param {number} padding - Extra padding to check beyond screen bounds
   * @returns {boolean} Whether position is visible
   */
  isVisible(worldX, worldY, padding = 0) {
    const screenPos = this.worldToScreen(worldX, worldY);
    return (
      screenPos.x >= -padding &&
      screenPos.x <= this.viewportWidth + padding &&
      screenPos.y >= -padding &&
      screenPos.y <= this.viewportHeight + padding
    );
  }

  /**
   * Get visible world bounds
   * @returns {Object} Bounds object with left, top, right, bottom
   */
  getVisibleBounds() {
    // When zoomed out, we can see more of the world
    const visibleWidth = this.viewportWidth / this.zoom;
    const visibleHeight = this.viewportHeight / this.zoom;

    return {
      left: this.x,
      top: this.y,
      right: this.x + visibleWidth,
      bottom: this.y + visibleHeight
    };
  }

  /**
   * Update viewport dimensions (useful for window resize)
   * @param {number} width - New viewport width
   * @param {number} height - New viewport height
   */
  resize(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.emit('resize', { width, height });
  }
}