import { relations, sql } from "drizzle-orm";
import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  text,
  boolean,
  mysqlEnum,
  decimal,
  date,
} from "drizzle-orm/mysql-core";

// Users table for both admin and students
export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "student"]).notNull().default("student"),
  emailVerified: timestamp("email_verified").default(sql`NULL`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Courses table
export const courses = mysqlTable("courses", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Student profiles with additional details
export const studentProfiles = mysqlTable("student_profiles", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  rollNo: varchar("roll_no", { length: 20 }).unique().notNull(),
  courseId: varchar("course_id", { length: 255 })
    .notNull()
    .references(() => courses.id),
  contactNo: varchar("contact_no", { length: 20 }).notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  address: text("address").notNull(),
  roomId: varchar("room_id", { length: 255 }).references(() => rooms.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Rooms table
export const rooms = mysqlTable("rooms", {
  id: varchar("id", { length: 255 }).primaryKey(),
  roomNumber: varchar("room_number", { length: 20 }).unique().notNull(),
  capacity: int("capacity").notNull(),
  occupiedSeats: int("occupied_seats").notNull().default(0),
  floor: int("floor").notNull(),
  block: varchar("block", { length: 100 }).notNull(),
  is_active: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Queries/Issues table
export const queries = mysqlTable("queries", {
  id: varchar("id", { length: 255 }).primaryKey(),
  studentId: varchar("student_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "resolved"])
    .notNull()
    .default("pending"),
  adminResponse: text("admin_response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Payments table
export const payments = mysqlTable("payments", {
  id: varchar("id", { length: 255 }).primaryKey(),
  studentId: varchar("student_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  type: mysqlEnum("type", ["hostel", "mess"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  dueDate: date("due_date").notNull(),
  status: mysqlEnum("status", ["pending", "partial", "paid"])
    .notNull()
    .default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

// Fee structures table
export const feeStructures = mysqlTable("fee_structures", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  year: int("year").notNull(),
  semester: mysqlEnum("semester", ["JAN-MAY", "JUL-DEC"]).notNull(),
  singleRoomFees: int("single_room_fees").notNull(),
  doubleRoomFees: int("double_room_fees").notNull(),
  tripleRoomFees: int("triple_room_fees").notNull(),
  hostelFees: int("hostel_fees").notNull(),
  messFees: int("mess_fees").notNull(),
  dueDate: date("due_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});

// Define relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  studentProfile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
  }),
  queries: many(queries),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  students: many(studentProfiles),
}));

export const studentProfilesRelations = relations(
  studentProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [studentProfiles.userId],
      references: [users.id],
    }),
    course: one(courses, {
      fields: [studentProfiles.courseId],
      references: [courses.id],
    }),
    room: one(rooms, {
      fields: [studentProfiles.roomId],
      references: [rooms.id],
    }),
  })
);

export const roomsRelations = relations(rooms, ({ many }) => ({
  students: many(studentProfiles),
}));

export const queriesRelations = relations(queries, ({ one }) => ({
  student: one(users, {
    fields: [queries.studentId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  student: one(users, {
    fields: [payments.studentId],
    references: [users.id],
  }),
}));

export const verificationTokens = mysqlTable("verification_tokens", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).primaryKey(),
  expires: timestamp("expires").notNull(),
});
