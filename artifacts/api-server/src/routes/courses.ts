import { Router, type IRouter } from "express";
import { db, coursesTable } from "@workspace/db";
import { ListCoursesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/courses", async (_req, res): Promise<void> => {
  const courses = await db.select().from(coursesTable).orderBy(coursesTable.id);
  res.json(ListCoursesResponse.parse(courses.map(c => ({
    ...c,
    price: Number(c.price),
    completionRate: Number(c.completionRate),
    rating: Number(c.rating),
  }))));
});

export default router;
