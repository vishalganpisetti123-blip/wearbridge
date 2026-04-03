import { Router, type IRouter } from "express";
import healthRouter from "./health";
import watchRouter from "./watch";

const router: IRouter = Router();

router.use(healthRouter);
router.use(watchRouter);

export default router;
