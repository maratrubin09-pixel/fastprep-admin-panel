const { Customer, Lead, Task, Conversation, Message, User } = require('../models');

const getDashboardMetrics = async (req, res) => {
  try {
    // Get counts
    const [
      totalCustomers,
      totalLeads,
      totalTasks,
      totalMessages,
      newLeadsToday,
      completedTasksToday,
      unreadMessages
    ] = await Promise.all([
      Customer.count(),
      Lead.count(),
      Task.count(),
      Message.count(),
      Lead.count({
        where: {
          createdAt: {
            [require('sequelize').Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      Task.count({
        where: {
          status: 'done',
          completedAt: {
            [require('sequelize').Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      Message.count({
        where: {
          isRead: false,
          senderType: 'customer'
        }
      })
    ]);

    // Calculate conversion rate
    const convertedLeads = await Lead.count({
      where: { status: 'converted' }
    });
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    const metrics = {
      totalCustomers,
      totalLeads,
      totalTasks,
      totalMessages,
      newLeadsToday,
      completedTasksToday,
      unreadMessages,
      conversionRate
    };

    res.json({
      message: 'Dashboard metrics retrieved successfully',
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      message: 'Failed to fetch dashboard metrics',
      error: error.message
    });
  }
};

const getReports = async (req, res) => {
  try {
    res.json({
      message: 'Reports endpoint - coming soon',
      data: []
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};

const getMetrics = async (req, res) => {
  try {
    res.json({
      message: 'Metrics endpoint - coming soon',
      data: []
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      message: 'Failed to fetch metrics',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardMetrics,
  getReports,
  getMetrics
};
