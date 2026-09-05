async function withRetry(fn, retries = 3, delay = 1000) {

    let lastError;

    for (let i = 0; i < retries; i++) {

        try {

            return await fn();

        } catch (error) {

            lastError = error;

            console.log(
                ?? Retry Attempt: /
            );

            await new Promise(resolve =>
                setTimeout(resolve, delay)
            );
        }
    }

    throw lastError;
}

module.exports = withRetry;
