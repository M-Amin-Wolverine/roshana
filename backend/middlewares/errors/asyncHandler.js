/**

* SAFE ASYNC WRAPPER
  */

module.exports = (fn) => {
return async (req, res, next) => {


    try {
        await Promise.resolve(fn(req, res, next));

    } catch (err) {

        next(err);
    }
};


};
