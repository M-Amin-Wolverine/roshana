/**

* ENTERPRISE ERROR HANDLER
  */

module.exports = async (err, req, res, next) => {


const statusCode = err.statusCode || 500;

const response = {
    success: false,
    error: {
        message: err.message,
        code: err.errorCode || 'INTERNAL_ERROR'
    },
    timestamp: new Date().toISOString()
};

if (process.env.NODE_ENV !== 'production') {

    response.stack = err.stack;
}

res.status(statusCode).json(response);


};
