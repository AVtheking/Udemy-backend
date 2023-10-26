const Joi = require("joi");

const authSchema = Joi.object({
  username: Joi.string().required(),
  firstname: Joi.string().min(3).required(),
  lastname: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
const teacherSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

module.exports = {
  authSchema,
  teacherSchema,
};
