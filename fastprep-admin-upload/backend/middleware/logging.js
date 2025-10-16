const { ActivityLog } = require('../models');

const logActivity = (action, entityType = null, entityId = null) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log activity after response is sent
      if (req.user && res.statusCode < 400) {
        ActivityLog.create({
          userId: req.user.id,
          action,
          entityType,
          entityId,
          description: `${req.user.firstName} ${req.user.lastName} ${action}${entityType ? ` ${entityType}` : ''}`,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          metadata: {
            method: req.method,
            url: req.originalUrl,
            body: req.method !== 'GET' ? req.body : undefined
          }
        }).catch(err => {
          console.error('Failed to log activity:', err);
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

const logUserActivity = (action, entityType = null) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      if (req.user && res.statusCode < 400) {
        const entityId = req.params.id || req.body.id;
        
        ActivityLog.create({
          userId: req.user.id,
          action,
          entityType,
          entityId,
          description: `${req.user.firstName} ${req.user.lastName} ${action}${entityType ? ` ${entityType}` : ''}`,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          metadata: {
            method: req.method,
            url: req.originalUrl,
            changes: req.method === 'PUT' || req.method === 'PATCH' ? req.body : undefined
          }
        }).catch(err => {
          console.error('Failed to log activity:', err);
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  logActivity,
  logUserActivity
};
