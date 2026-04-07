import { Router, type IRouter } from "express";
import healthRouter from "./health";
import leadsRouter from "./leads";
import enrollmentsRouter from "./enrollments";
import workflowsRouter from "./workflows";
import analyticsRouter from "./analytics";
import coursesRouter from "./courses";
import contentRouter from "./content";

const router: IRouter = Router();

router.use(healthRouter);
router.use(leadsRouter);
router.use(enrollmentsRouter);
router.use(workflowsRouter);
router.use(analyticsRouter);
router.use(coursesRouter);
router.use(contentRouter);

export default router;
