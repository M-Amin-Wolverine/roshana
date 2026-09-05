class Telemetry {
    #prefix = "⚡ TELEMETRY";

    log(event, payload = {}) {
        const timestamp = new Date().toISOString();

        console.log(
            `\n${this.#prefix} :: ${event.toUpperCase()}`,
            {
                timestamp,
                ...payload
            }
        );
    }

    success(event, payload = {}) {
        this.log(`✅ ${event}`, payload);
    }

    error(event, payload = {}) {
        this.log(`💀 ${event}`, payload);
    }

    warn(event, payload = {}) {
        this.log(`⚠️ ${event}`, payload);
    }
}

module.exports = new Telemetry();