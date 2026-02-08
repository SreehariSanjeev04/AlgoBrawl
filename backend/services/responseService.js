class ApiResponse {
  constructor({ success, message, data = null, error = null, meta = null }) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
    this.meta = meta;
  }

  static success(message, data, meta = null) {
    return new ApiResponse({ success: true, message, data, meta });
  }

  static error(message, error = null, meta = null) {
    return new ApiResponse({ success: false, message, error, meta });
  }
}

export default ApiResponse;
