const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
});

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must be at most 100 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().trim().email().lowercase().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.pattern.base':
        'Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, and one number.',
      'any.required': 'Password is required',
    }),
  confirmPassword: Joi.any().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Please confirm your password',
  }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  newPassword: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
    .required()
    .messages({
      'string.pattern.base':
        'New password must be at least 8 characters and include uppercase, lowercase, and number.',
      'any.required': 'New password is required',
    }),
  confirmNewPassword: Joi.any().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'New passwords do not match',
    'any.required': 'Please confirm new password',
  }),
});

const validate = (schema) => (req, _res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (!error) return next();
  const errors = error.details.map((d) => d.message);
  const err = new Error(errors.join(' '));
  err.statusCode = 400;
  err.status = 'fail';
  err.isOperational = true;
  return next(err);
};

module.exports = {
  loginSchema,
  signupSchema,
  changePasswordSchema,
  validateLogin: validate(loginSchema),
  validateSignup: validate(signupSchema),
  validateChangePassword: validate(changePasswordSchema),
};
