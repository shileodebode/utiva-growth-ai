import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, contentTable, activityTable } from "@workspace/db";
import {
  ListContentQueryParams,
  ListContentResponse,
  GenerateContentBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const CONTENT_TEMPLATES: Record<string, Record<string, string[]>> = {
  email: {
    professional: [
      "Subject: Advance Your Career with Utiva's {course} Program\n\nDear {audience},\n\nThe demand for {course} professionals in Africa is growing at 35% year-on-year. Utiva's industry-aligned curriculum, built with top employers, will equip you with the skills to capitalize on this opportunity.\n\nOur next cohort begins soon. Spots are limited — apply now to secure your place.\n\nBest regards,\nUtiva Growth Team",
    ],
    casual: [
      "Hey there!\n\nReady to break into {course}? Utiva has helped thousands of professionals make the switch — and now it's your turn.\n\nOur bootcamp is practical, project-based, and taught by real industry pros. No theory fluff — just skills that employers want.\n\nJoin the next cohort. Link below!",
    ],
    urgent: [
      "FINAL REMINDER: Only 5 seats left in our {course} cohort!\n\nDon't miss this opportunity to transform your career. This cohort closes enrollment in 48 hours.\n\nSecure your spot now — before it's too late.",
    ],
    inspirational: [
      "Every expert was once a beginner.\n\nYour journey into {course} starts with one decision. Thousands of Utiva alumni once stood where you are — unsure, but ready. Today, they are building products, leading teams, and earning more.\n\nYour story starts here. Enroll today.",
    ],
  },
  social_post: {
    professional: [
      "Utiva is proud to announce our latest {course} cohort results: 87% job placement rate within 6 months. Our graduates are working at leading companies across Africa and beyond. Applications for the next cohort are now open. #Utiva #TechEducation #{course}",
    ],
    casual: [
      "Guess what? Our {course} students just completed their capstone projects — and the results are incredible. Real products. Real impact. Real jobs. Next cohort is forming now! #LearningAtUtiva",
    ],
    urgent: [
      "Only 48 HOURS left to apply for our {course} bootcamp! This cohort fills up fast. Don't wait — secure your seat NOW. Link in bio. #Utiva #TechJobs",
    ],
    inspirational: [
      "Your career shift starts with a single step. Our {course} alumni have taken that step — and never looked back. You are one decision away from the career you deserve. #UtivaAlumni #TechAfrica",
    ],
  },
  whatsapp: {
    professional: [
      "Hello! I am reaching out from Utiva to share an exciting opportunity. Our {course} program is accepting applications for the upcoming cohort. With a 94% completion rate and strong employer partnerships, this is a proven path to a tech career. Would you like more details?",
    ],
    casual: [
      "Hi! Are you still thinking about getting into {course}? The next Utiva cohort is starting soon and spots are filling up. It could be the move that changes everything for you! Want me to send you the course details?",
    ],
    urgent: [
      "Quick update: The Utiva {course} cohort closes applications in 24 hours! If you have been thinking about it, now is the time. Reply YES and I will send you the enrollment link right away.",
    ],
    inspirational: [
      "Hello! I wanted to share something exciting. One of our {course} graduates just landed a role at a top tech company — after completing the same program you have been considering. Your moment could be next. Ready to take the leap?",
    ],
  },
  ad_copy: {
    professional: [
      "Master {course} in 12 weeks. Industry-certified. Job-ready. Utiva graduates earn 40% more on average. Apply now — cohort forming.",
    ],
    casual: [
      "Tired of being left behind in tech? Learn {course} with Utiva. Real projects, real mentors, real results. Your career upgrade starts today.",
    ],
    urgent: [
      "LAST CHANCE: {course} Bootcamp | Limited Seats | Enrollment Closes Soon | Join 5,000+ Utiva Alumni | Apply Now",
    ],
    inspirational: [
      "The career you want is one skill away. Learn {course} at Utiva. Transform your future. Change your story.",
    ],
  },
  blog: {
    professional: [
      "# Why {course} Skills Are the Most In-Demand in Africa Right Now\n\nThe African tech ecosystem is experiencing unprecedented growth. Companies across fintech, health tech, and e-commerce are desperately seeking qualified {course} professionals...\n\n[Full article: 5-minute read covering market trends, salary data, and Utiva's curriculum approach]",
    ],
    casual: [
      "# I Changed My Career in 12 Weeks — Here's Exactly How\n\nSix months ago, I was stuck in a job I did not love. Today, I work as a {course} professional at a company I am proud of. This is the story of how Utiva changed my life...",
    ],
    urgent: [
      "# The Window to Enter {course} Is Closing — Here's What You Need to Do Now\n\nThe job market for {course} professionals is competitive, but it won't stay this accessible forever. Here is your action plan...",
    ],
    inspirational: [
      "# From Doubt to Employed: The Utiva {course} Journey\n\nEvery big career shift starts with a moment of doubt. But the Utiva alumni who have come before you prove one thing: doubt is just the beginning of transformation...",
    ],
  },
};

function generateContent(type: string, targetCourse: string, targetAudience: string, tone: string): string {
  const templates = CONTENT_TEMPLATES[type]?.[tone] ?? CONTENT_TEMPLATES[type]?.["professional"] ?? ["Generated content for {course} targeting {audience}."];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template
    .replace(/{course}/g, targetCourse)
    .replace(/{audience}/g, targetAudience ?? "tech enthusiasts");
}

function generateTitle(type: string, targetCourse: string, tone: string): string {
  const titles: Record<string, string> = {
    email: `${tone === "urgent" ? "URGENT: " : ""}${targetCourse} Enrollment — ${tone.charAt(0).toUpperCase() + tone.slice(1)} Outreach`,
    social_post: `${targetCourse} Social Post (${tone})`,
    whatsapp: `${targetCourse} WhatsApp Message (${tone})`,
    ad_copy: `${targetCourse} Ad Copy — ${tone.charAt(0).toUpperCase() + tone.slice(1)}`,
    blog: `Blog: ${targetCourse} — ${tone.charAt(0).toUpperCase() + tone.slice(1)} Angle`,
  };
  return titles[type] ?? `${targetCourse} Content`;
}

router.get("/content", async (req, res): Promise<void> => {
  const params = ListContentQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db.select().from(contentTable).$dynamic();

  if (params.data.status) {
    query = query.where(eq(contentTable.status, params.data.status));
  }

  const items = await query.orderBy(desc(contentTable.createdAt));
  res.json(ListContentResponse.parse(items.map(i => ({
    ...i,
    targetCourse: i.targetCourse ?? undefined,
    targetAudience: i.targetAudience ?? undefined,
    scheduledFor: i.scheduledFor ?? undefined,
  }))));
});

router.post("/content/generate", async (req, res): Promise<void> => {
  const parsed = GenerateContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { type, targetCourse, targetAudience, tone = "professional" } = parsed.data;
  const body = generateContent(type, targetCourse, targetAudience ?? "", tone);
  const title = generateTitle(type, targetCourse, tone);

  const [item] = await db
    .insert(contentTable)
    .values({
      title,
      body,
      type,
      targetCourse,
      targetAudience: targetAudience ?? null,
      status: "draft",
      aiGenerated: true,
    })
    .returning();

  await db.insert(activityTable).values({
    type: "content_generated",
    description: `AI generated ${type} content for ${targetCourse}`,
    affectedEntity: title,
  });

  res.status(201).json(item);
});

export default router;
