import { db } from "../index"; // Ensure correct path to your db connection
import { courses } from "../schema"; // Ensure correct path to your schema
import { v4 as uuidv4 } from "uuid";

async function seedCourses() {
  const courseNames = [
    "B.Tech IT",
    "B.Tech IT-BI",
    "B.Tech ECE",
    "M.Tech IT",
    "M.Tech BI",
    "M.Tech ECE",
    "MBA",
    "PHD",
  ];

  const courseValues = courseNames.map((courseName) => ({
    id: uuidv4(),
    name: courseName,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  try {
    for (const course of courseValues) {
      await db.insert(courses).values(course);
      console.log(`Course ${course.name} added successfully`);
    }
  } catch (error) {
    console.error("Error seeding courses:", error);
  }
}

seedCourses();
