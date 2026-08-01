import { executorService } from "../services/executor.service.js";

export const executorController = {
  async run(req, res, next) {
    try {
      const { language, code, testcases } = req.body;
      const result = await executorService.runCode(language, code, testcases);
      const { status, ...body } = result;
      res.status(status).json(body);
    } catch (err) {
      next(err);
    }
  },

  async submit(req, res, next) {
    try {
      const { language, code, testcases, expected, judge_type } = req.body;
      const result = await executorService.submitCode(language, code, testcases, expected, judge_type);
      const { status, ...body } = result;
      res.status(result.status).json(body);
    } catch (err) {
      next(err);
    }
  },
};
