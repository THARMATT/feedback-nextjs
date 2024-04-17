

## Getting Started

1. Setup Basic structure & modelling with mongoose and zod

- Open the terminal and start the `next` project & run the basic template.
```bash
npx create-next-app@latest
```
```bash
npm run dev

```
- Open the app and create a folder `model` inside `src` and file `user.model.ts` inside `model`.
- Install dependencies.
```bash
npx i mongoose zod
```
- Setup `user.model.ts` file inside `model` folder.
```typescript
import mongoose, { Document, Schema } from "mongoose";

export interface Message extends Document {
  content: string;
  createdAt: Date;
}
export interface User extends Document {
  username: String;
  password: String;
  email: string;
  verifyCode: String;
  verifyCodeExpiry: Date;
  isVerified: Boolean;
  createdAt: Date;
  isAcceptingMessage: Boolean;
  message: Message[];
}
const MessageSchema: Schema<Message> = new Schema({
  content: {
    type: String,
    required: [true, "content is required"],
  },
  createdAt: {
    type: Date,
    required: true,
  },
});

const UserSchema: Schema<User> = new Schema({
  username: {
    type: String,
    required: [true, "username is required"],
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: [true, "email is required"],
    unique: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifyCode: {
    type: String,
    required: true,
  },
  verifyCodeExpiry: {
    type: Date,
    required: true,
  },

  isAcceptingMessage: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  message: [MessageSchema],
});

const UserModel =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>("User", UserSchema);
export default UserModel;

```
- Setup zod validation & make a folder `schemas` inside `src` with different files for schema Validations

```js

// Signup
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

//Signin
import {z} from 'zod';
export const signInSchema=z.object({
    identifier:z.string(),
    password:z.string(),
})

//VerifySchema
import {z} from 'zod';
 export const verifySchema=z.object({
    code:z.string().length(6,{message:"must contain six charcters"})
 })


//acceptMessage
import {z} from 'zod';
export const acceptMessageSchema=z.object({
    acceptMessages:z.boolean()
})


//MessageSchema
import {z} from 'zod';
export const messageSchema=z.object({
    content:z.string().min(5,{message:"message must be more than 5 charcters"}).max(300,{message:"must b less than 300 characters"})
})
```
