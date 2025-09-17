import { Response } from 'express';
import { EventEmitter } from 'events';
import type { IStorage } from '../storage';

// SSE message types
export interface SSEMessage {
  id?: string;
  event?: string;
  data: any;
  retry?: number;
}

// Connection info
interface SSEConnection {
  id: string;
  userId: number;
  response: Response;
  lastHeartbeat: Date;
}

// System notification data
export interface SystemNotificationData {
  title: string;
  title_ar?: string;
  message: string;
  message_ar?: string;
  type: 'system' | 'order' | 'production' | 'maintenance' | 'quality' | 'hr';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  recipient_type: 'user' | 'group' | 'role' | 'all';
  recipient_id?: string;
  context_type?: string;
  context_id?: string;
  sound?: boolean;
  icon?: string;
}

export class NotificationManager extends EventEmitter {
  private connections = new Map<string, SSEConnection>();
  private storage: IStorage;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(storage: IStorage) {
    super();
    this.storage = storage;
    
    // Set up periodic tasks
    this.startHeartbeat();
    this.startCleanup();
    
    // Listen for process termination to cleanup
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  /**
   * Add SSE connection for a user
   */
  addConnection(connectionId: string, userId: number, response: Response): void {
    console.log(`[NotificationManager] Adding SSE connection for user ${userId}, connection: ${connectionId}`);
    
    // Set SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Send initial connection message
    this.sendToConnection(connectionId, response, {
      event: 'connected',
      data: { 
        message: 'اتصال ناجح', 
        timestamp: new Date().toISOString(),
        connectionId 
      }
    });

    // Store connection
    const connection: SSEConnection = {
      id: connectionId,
      userId,
      response,
      lastHeartbeat: new Date()
    };
    
    this.connections.set(connectionId, connection);

    // Handle client disconnect
    response.on('close', () => {
      console.log(`[NotificationManager] Connection closed for user ${userId}, connection: ${connectionId}`);
      this.removeConnection(connectionId);
    });

    response.on('error', (error) => {
      console.error(`[NotificationManager] Connection error for user ${userId}:`, error);
      this.removeConnection(connectionId);
    });

    // Send recent unread notifications to this user
    this.sendRecentNotifications(userId, connectionId, response);
  }

  /**
   * Remove SSE connection
   */
  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      try {
        connection.response.end();
      } catch (error) {
        console.error(`[NotificationManager] Error ending connection ${connectionId}:`, error);
      }
      this.connections.delete(connectionId);
      console.log(`[NotificationManager] Removed connection ${connectionId}, active connections: ${this.connections.size}`);
    }
  }

  /**
   * Send notification to specific user
   */
  async sendToUser(userId: number, notificationData: SystemNotificationData): Promise<void> {
    try {
      // Save notification to database
      const notification = await this.storage.createNotification({
        title: notificationData.title,
        title_ar: notificationData.title_ar,
        message: notificationData.message,
        message_ar: notificationData.message_ar,
        type: notificationData.type,
        priority: notificationData.priority,
        recipient_type: 'user',
        recipient_id: userId.toString(),
        context_type: notificationData.context_type,
        context_id: notificationData.context_id,
        status: 'sent'
      });

      // Send via SSE to connected clients
      const userConnections = Array.from(this.connections.values())
        .filter(conn => conn.userId === userId);

      if (userConnections.length > 0) {
        const sseData = {
          event: 'notification',
          data: {
            id: notification.id,
            title: notification.title,
            title_ar: notification.title_ar,
            message: notification.message,
            message_ar: notification.message_ar,
            type: notification.type,
            priority: notification.priority,
            context_type: notification.context_type,
            context_id: notification.context_id,
            created_at: notification.created_at,
            sound: notificationData.sound || this.shouldPlaySound(notification.priority || 'normal'),
            icon: notificationData.icon || this.getIconForType(notification.type)
          }
        };

        userConnections.forEach(conn => {
          this.sendToConnection(conn.id, conn.response, sseData);
        });

        console.log(`[NotificationManager] Sent notification to ${userConnections.length} connections for user ${userId}`);
      } else {
        console.log(`[NotificationManager] No active connections for user ${userId}, notification saved to database only`);
      }

    } catch (error) {
      console.error(`[NotificationManager] Error sending notification to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users by role
   */
  async sendToRole(roleId: number, notificationData: SystemNotificationData): Promise<void> {
    try {
      // Get users with this role
      const users = await this.storage.getSafeUsersByRole(roleId);
      
      // Send to each user
      const promises = users.map(user => 
        this.sendToUser(user.id, notificationData)
      );
      
      await Promise.all(promises);
      console.log(`[NotificationManager] Sent notification to ${users.length} users in role ${roleId}`);
      
    } catch (error) {
      console.error(`[NotificationManager] Error sending notification to role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Send notification to all users
   */
  async sendToAll(notificationData: SystemNotificationData): Promise<void> {
    try {
      // Get all active users
      const users = await this.storage.getSafeUsers();
      const activeUsers = users.filter(user => user.status === 'active');
      
      // Send to each user
      const promises = activeUsers.map(user => 
        this.sendToUser(user.id, notificationData)
      );
      
      await Promise.all(promises);
      console.log(`[NotificationManager] Sent notification to ${activeUsers.length} users`);
      
    } catch (error) {
      console.error(`[NotificationManager] Error sending notification to all users:`, error);
      throw error;
    }
  }

  /**
   * Send recent unread notifications to newly connected user
   */
  private async sendRecentNotifications(userId: number, connectionId: string, response: Response): Promise<void> {
    try {
      // Get recent unread notifications for this user (last 50)
      const notifications = await this.storage.getUserNotifications(userId, {
        unreadOnly: true,
        limit: 50
      });

      if (notifications.length > 0) {
        const recentData = {
          event: 'recent_notifications',
          data: {
            notifications: notifications.map(n => ({
              id: n.id,
              title: n.title,
              title_ar: n.title_ar,
              message: n.message,
              message_ar: n.message_ar,
              type: n.type,
              priority: n.priority,
              context_type: n.context_type,
              context_id: n.context_id,
              created_at: n.created_at,
              icon: this.getIconForType(n.type)
            })),
            count: notifications.length
          }
        };

        this.sendToConnection(connectionId, response, recentData);
        console.log(`[NotificationManager] Sent ${notifications.length} recent notifications to user ${userId}`);
      }
    } catch (error) {
      console.error(`[NotificationManager] Error sending recent notifications to user ${userId}:`, error);
    }
  }

  /**
   * Send SSE message to specific connection
   */
  private sendToConnection(connectionId: string, response: Response, message: SSEMessage): void {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        console.warn(`[NotificationManager] Connection ${connectionId} not found`);
        return;
      }

      let sseMessage = '';
      
      if (message.id) {
        sseMessage += `id: ${message.id}\n`;
      }
      
      if (message.event) {
        sseMessage += `event: ${message.event}\n`;
      }
      
      if (message.retry) {
        sseMessage += `retry: ${message.retry}\n`;
      }
      
      sseMessage += `data: ${JSON.stringify(message.data)}\n\n`;
      
      response.write(sseMessage);
      
      // Update heartbeat
      connection.lastHeartbeat = new Date();
      
    } catch (error) {
      console.error(`[NotificationManager] Error sending message to connection ${connectionId}:`, error);
      this.removeConnection(connectionId);
    }
  }

  /**
   * Send heartbeat to all connections
   */
  private sendHeartbeat(): void {
    const heartbeatMessage: SSEMessage = {
      event: 'heartbeat',
      data: { timestamp: new Date().toISOString() }
    };

    this.connections.forEach((connection, connectionId) => {
      this.sendToConnection(connectionId, connection.response, heartbeatMessage);
    });

    console.log(`[NotificationManager] Sent heartbeat to ${this.connections.size} connections`);
  }

  /**
   * Start heartbeat interval
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Start cleanup interval for stale connections
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = new Date();
      const staleConnections: string[] = [];

      this.connections.forEach((connection, connectionId) => {
        const timeSinceHeartbeat = now.getTime() - connection.lastHeartbeat.getTime();
        
        // Remove connections that haven't responded to heartbeat in 2 minutes
        if (timeSinceHeartbeat > 120000) {
          staleConnections.push(connectionId);
        }
      });

      staleConnections.forEach(connectionId => {
        console.log(`[NotificationManager] Removing stale connection: ${connectionId}`);
        this.removeConnection(connectionId);
      });

      if (staleConnections.length > 0) {
        console.log(`[NotificationManager] Cleaned up ${staleConnections.length} stale connections, active: ${this.connections.size}`);
      }
    }, 60000); // Check every minute
  }

  /**
   * Get icon for notification type
   */
  private getIconForType(type: string): string {
    const icons: Record<string, string> = {
      system: '⚙️',
      order: '📋',
      production: '🏭',
      maintenance: '🔧',
      quality: '✅',
      hr: '👥',
      whatsapp: '📱',
      sms: '💬',
      email: '📧'
    };
    return icons[type] || '🔔';
  }

  /**
   * Determine if sound should play for priority
   */
  private shouldPlaySound(priority: string): boolean {
    return priority === 'high' || priority === 'urgent';
  }

  /**
   * Get connection statistics
   */
  getStats(): { activeConnections: number; connectionsByUser: Record<number, number> } {
    const connectionsByUser: Record<number, number> = {};
    
    this.connections.forEach(connection => {
      connectionsByUser[connection.userId] = (connectionsByUser[connection.userId] || 0) + 1;
    });

    return {
      activeConnections: this.connections.size,
      connectionsByUser
    };
  }

  /**
   * Shutdown notification manager
   */
  shutdown(): void {
    console.log('[NotificationManager] Shutting down...');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Close all connections
    this.connections.forEach((connection, connectionId) => {
      this.removeConnection(connectionId);
    });
    
    console.log('[NotificationManager] Shutdown complete');
  }
}

// Singleton instance
let notificationManager: NotificationManager | null = null;

export function getNotificationManager(storage: IStorage): NotificationManager {
  if (!notificationManager) {
    notificationManager = new NotificationManager(storage);
  }
  return notificationManager;
}