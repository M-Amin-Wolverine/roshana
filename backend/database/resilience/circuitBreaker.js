class CircuitBreaker {

    constructor() {

        this.failures = 0;

        this.threshold = 5;

        this.cooldown = 10000;

        this.state = 'CLOSED';

        this.lastFailure = null;
    }

    async execute(fn) {

        if (this.state === 'OPEN') {

            const now = Date.now();

            if (
                now - this.lastFailure <
                this.cooldown
            ) {

                throw new Error(
                    '?? Circuit Breaker OPEN'
                );
            }

            this.state = 'HALF_OPEN';
        }

        try {

            const result = await fn();

            this.failures = 0;

            this.state = 'CLOSED';

            return result;

        } catch (error) {

            this.failures++;

            this.lastFailure = Date.now();

            if (this.failures >= this.threshold) {

                this.state = 'OPEN';
            }

            throw error;
        }
    }
}

module.exports = new CircuitBreaker();
