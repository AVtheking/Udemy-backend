const { Course, Category, User } = require("../models");
const ErrorHandler = require("../middlewares/error");
// const redis = require("redis");
const { paramSchema } = require("../utils/validator");

// const redisClient = redis.createClient();
// redisClient.connect().catch(console.error);

const DEFAULT_EXPIRATION = 3600;
const courseCtrl = {
  getCourses: async (req, res, next) => {
    const key = req.originalUrl;
    // const cachedData = await redisClient.get(key);
    // if (cachedData) {
    //   return res.json(JSON.parse(cachedData));
    // }
    try {
      const courses = await Course.find()
        .sort("-createdAt")
        .populate("videos", "_id videoTitle videoUrl")
        .populate({
          path: "createdBy",
          select: "_id username name",
        });
      // .populate("createdBy", "_id username name createdCourse ");
      const value = {
        success: true,
        message: "list of all courses",
        data: {
          courses,
        },
      };
      res.json(value);
      // redisClient.setEx(key, DEFAULT_EXPIRATION, JSON.stringify(value));
    } catch (e) {
      next(e);
    }
  },
  getCourseByid: async (req, res, next) => {
    try {
      const id = req.params.courseId;
      const result = await paramSchema.validateAsync({ id });
      const courseId = result.params;
      const course = await Course.findById(courseId);
      if (!course) {
        return next(new ErrorHandler(400, "No course found"));
      }
      res.json({
        success: true,
        message: "Course Found",
        data: {
          course,
        },
      });
    } catch (e) {
      next(e);
    }
  },
  getCoursesByCategory: async (req, res, next) => {
    const key = req.originalUrl;
    // const cachedData = await redisClient.get(key);
    // if (cachedData) {
    //   return res.json(JSON.parse(cachedData));
    // }
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
            from: "videos",
            localField: "videos",
            foreignField: "_id",
            as: "videos",
          },
        },
        {
          $lookup: {
            from: "users",
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
      // redisClient.setEx(key, DEFAULT_EXPIRATION, JSON.stringify(courses));
    } catch (e) {
      next(e);
    }
  },
  getCategoriesName: async (req, res, next) => {
    // const key = req.originalUrl;
    // const cachedData = await redisClient.get(key);
    // if (cachedData) {
    //   return res.json(JSON.parse(cachedData));
    // }
    try {
      const categories = await Category.find().lean();
      const categoryName = categories.map((category) => category.name);
      const value = {
        success: true,
        message: "List of categories",
        data: {
          categories: categoryName,
        },
      };

      res.json({
        value,
      });

      // redisClient.setEx(key, DEFAULT_EXPIRATION, JSON.stringify(value));
    } catch (e) {
      next(e);
    }
  },
  getCategoriesData: async (req, res, next) => {
    // const key = req.originalUrl;
    // const cachedData = await redisClient.get(key);
    // if (cachedData) {
    //   return res.json(JSON.parse(cachedData));
    // }
    try {
      const categories = await Category.find()
        .populate({
          path: "courses",
          select: "_id title description category price rating duration ",
          populate: {
            path: "createdBy",
            select: "_id username name",
          },
        })
        .lean();
      const value = {
        success: true,
        message: "Data of all courses in particular category",
        data: {
          categories,
        },
      };

      res.json({
        value,
      });
      // redisClient.setEx(key, DEFAULT_EXPIRATION, JSON.stringify(value));
    } catch (e) {
      next(e);
    }
  },
  addCourseToCart: async (req, res, next) => {
    try {
      const courseid = req.params.courseId;
      const result = await paramSchema.validateAsync({ params: courseid });
      const courseId = result.params;
      const user = await User.findById(req.user);
      user.cart.push(courseId);
      await user.save();
      res.json({
        success: true,
        message: "Course added to cart successfully",
      });
    } catch (e) {
      next(e);
    }
  },
  deleteCourseFromCart: async (req, res, next) => {
    try {
      const courseid = req.param.courseId;
      const result = await paramSchema.validateAsync({ params: courseid });
      const courseId = result.params;
      const user = await User.findById(courseId);
      const courseIndex = user.cart.indexOf(courseId);
      if (courseIndex == -1) {
        return next(new ErrorHandler(400, "No course found"));
      }
      user.cart.splice(courseIndex, 1);
      await user.save();
      res.json({
        success: true,
        message: "Course removed from cart successfully",
      });
    } catch (e) {
      next(e);
    }
  },
  getCoursesInCart: async (req, res, next) => {
    try {
      const user = await User.findById(req.user).populate("cart");
      res.json({
        success: true,
        message: "Courses in the cart ",
        data: {
          courses: user.cart,
        },
      });
    } catch (e) {
      next(e);
    }
  },
  getWishlist: async (req, res, next) => {
    try {
      const user = await User.findById(req.user).populate("wishlist");
      user.wishlist.push(courseId);
      await user.save();
      res.json({
        success: true,
        message: "wishlist of the user",
        data: {
          wishlist: user.wishlist,
        },
      });
    } catch (e) {
      next(e);
    }
  },
  addToWishlist: async (req, res, next) => {
    try {
      const courseid = req.param.courseId;
      const result = await paramSchema.validateAsync({ params: courseid });
      const courseId = result.params;
      const user = await User.findById(req.user);
      user.wishlist.push(courseId);
      await user.save();
      res.json({
        success: true,
        message: "course added to wishlist",
        data: {
          wishlist: user.wishlist,
        },
      });
    } catch (e) {
      next(e);
    }
  },
  deleteCourseFromWishlist: async (req, res, next) => {
    const courseid = req.param.courseId;
    const result = await paramSchema.validateAsync({ params: courseid });
    const courseId = result.params;
    const user = await user.findById(req.user);
    const courseIndex = user.wishlist.indexOf(courseId);
    if (courseIndex == -1) {
      return next(new ErrorHandler(400, "No course found"));
    }
    user.wishlist.splice(courseIndex, 1);
    await user.save();
    res.json({
      success: true,
      message: "Course deleted from wishlist successfully",
    });
  },
};
module.exports = courseCtrl;
