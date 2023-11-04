const { Course } = require("../models");
const ErrorHandler = require("../middlewares/error");

const courseCtrl = {
  getCourses: async (req, res, next) => {
    try {
      const courses = await Course.find()
        .sort("-createdAt")
        .populate("videos", "_id videoTitle videoUrl")
        .populate("createdBy", "_id username name");
      res.json({
        success: true,
        message: "list of all courses",
        data: {
          courses,
        },
      });
    } catch (e) {
      next(e);
    }
  },
  getCoursesByCategory: async (req, res, next) => {
    try {
      const category = req.params.category;
      // const courses = await Course.find({ category, isPublished: true })
      //   .sort("-createdAt")
      //   .populate("videos", "_id videoTitle videoUrl")
      //   .populate("createdBy", "_id username name");

      const courses = await Course.aggregate([
        {
          $match: {
            category,
            isPublished: true,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $lookup: {
            from: "Video",
            localField: "videos",
            foreignField: "_id",
            as: "videos",
          },
        },
        {
          $lookup: {
            from: "User",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdBy",
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            price: 1,
            duration: 1,
            totalStudents: 1,
            category: 1,
            rating: 1,
            thumbnail: 1,
            videos: { _id: 1, videoTitle: 1, videoUrl: 1 },
            createdBy: { _id: 1, username: 1, name: 1 },
          },
        },
      ]);
      if (!courses) {
        return next(
          new ErrorHandler(400, "No course is available with selected category")
        );
      }
      res.json({
        success: true,
        message: "List of all courses with selected category",
        data: {
          courses,
        },
      });
    } catch (e) {
      next(e);
    }
  },
};
module.exports = courseCtrl;
