import { z } from "zod";

export const usernameValidation = z
  .string()
  .min(2, "username must b atleast of 2 charahters")
  .max(20, "username must not b more than 20 charahters")
  .regex(/^[a-zA-Z0-9_]+$/, "username must not contain special charcters");
export const signUpValidation = z.object({
  username: usernameValidation,
  email: z.string().email({message:"Invalid email"}),
  password: z.string().min(6, {message:"password must contain six characters"}),
});
