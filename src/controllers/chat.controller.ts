import { Response, NextFunction } from "express";
import Chat from "../models/Chat.model";
import User from "../models/User.model";
import { AuthRequest } from "../middleware/auth.middleware";

// @desc    Get chat history with a specific user
// @route   GET /api/chat/history/:userId
// @access  Private
export const getChatHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUserId = req.user?._id;
    const otherUserId = req.params.userId;

    const chats = await Chat.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      chats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of recent chats (for instructors/admins)
// @route   GET /api/chat/recent
// @access  Private (Admin/Instructor)
export const getRecentChats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUserId = req.user?._id;

    // Aggregate to find unique users who have chatted with the current user
    const recentChats = await Chat.aggregate([
      {
        $match: {
          $or: [{ sender: currentUserId }, { receiver: currentUserId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", currentUserId] },
              "$receiver",
              "$sender",
            ],
          },
          lastMessage: { $first: "$message" },
          lastMessageDate: { $first: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", currentUserId] },
                    { $eq: ["$isRead", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $project: {
          _id: 1,
          name: "$userInfo.name",
          email: "$userInfo.email",
          avatar: "$userInfo.avatar",
          lastMessage: 1,
          lastMessageDate: 1,
          unreadCount: 1,
        },
      },
      {
        $sort: { lastMessageDate: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      recentChats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chat/read/:userId
// @access  Private
export const markMessagesAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUserId = req.user?._id;
    const otherUserId = req.params.userId;

    await Chat.updateMany(
      { sender: otherUserId, receiver: currentUserId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available support agents
// @route   GET /api/chat/support-agents
// @access  Private
export const getSupportAgents = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Find users with admin or instructor role
    const agents = await User.find({
      role: { $in: ["admin", "instructor"] },
    })
      .select("_id name email avatar role")
      .limit(5);

    res.status(200).json({
      success: true,
      agents,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message
// @route   POST /api/chat/send
// @access  Private
export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { receiver, message } = req.body;
    const sender = req.user?._id;

    if (!receiver || !message) {
      res.status(400).json({
        success: false,
        message: "Receiver and message are required",
      });
      return;
    }

    const newChat = await Chat.create({
      sender,
      receiver,
      message,
      isRead: false,
    });

    res.status(201).json({
      success: true,
      chat: newChat,
    });
  } catch (error) {
    next(error);
  }
};
