import { defineSchema } from "convex/server";
import { USERS_SCHEMA } from "./users";

export default defineSchema({
  users: USERS_SCHEMA,
});
