import Submission from "../models/Submission.js";

export const submissionService = {
  async create(data) {
    return Submission.create(data);
  },
};
