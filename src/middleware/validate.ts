const { httpStatusCode } = require('../constants');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate({ ...req.query, ...req.body });
  if (error) {
    return res.status(httpStatusCode.BAD_REQUEST)
      .send({ message: error.details[0].message });
  }
  next();
};

export default validate;
