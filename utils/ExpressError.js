// This is a custom error class that extends the built-in Error
// It lets us create errors with a specific status code and message
class ExpressError extends Error {
    constructor(status, message) {
        super();
        this.status = status;
        this.message = message;
    }
}

module.exports = ExpressError;