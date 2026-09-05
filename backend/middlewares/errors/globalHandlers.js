/**

* GLOBAL PROCESS ERROR TRAPS
  */

module.exports = () => {


process.on('unhandledRejection', (reason) => {

    console.error('UNHANDLED REJECTION:', reason);
});

process.on('uncaughtException', (err) => {

    console.error('UNCAUGHT EXCEPTION:', err);

    if (process.env.NODE_ENV === 'production') {

        process.exit(1);
    }
});


};
