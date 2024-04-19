
## Documentation 

### 1. Setup Basic structure & modelling with mongoose and  Validations with zod

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

### 2. Database Connection with MongoDB

- Created a `lib` folder inside `src` and `dbConnect.ts` file inside `lib` for database connection.

```typescript
// dbConnect.ts

import mongoose from "mongoose";

type connectionObject = {
  isConnected?: number;
};
const connection: connectionObject = {};

async function dbConnect(): Promise<void> {
  if (connection.isConnected) {
    console.log("Already Connected");
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI || "", {});
    console.log(db);
    connection.isConnected = db.connections[0].readyState;

    console.log("DB connected successfully");
  } catch (error) {
    console.log("Database connection Failed", error);
  }
}

export default dbConnect;

```

### 3. Configure Resend
- Explore [resend](https://resend.com/docs/send-with-nextjs) and [ react-email ](https://react.email/docs/getting-started/manual-setup) and install the dependencies.
```bash
npm i resend react-email
```
- Make a `email` folder in root directory and `verficationEmail.ts` file inside it.
  - `VerificationEmail.ts` just contain normal `HTML` copy pasted from `react-email`
```typescript
import {
  Button,
  Html,
  Head,
  Font,
  Preview,
  Heading,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface VerificatonEmailProps {
  username: string;
  otp: string;
}

export default function VerificationEmail({
  username,
  otp,
}: VerificatonEmailProps) {
  return (
    <Html>
      <Head>
        <title>Verification Code</title>
        <Font fontFamily="Roboto" fallbackFontFamily={"Verdana"}></Font>
      </Head>
      <Preview>Your six didgit OTP is: {otp}</Preview>
      <Section>
        <Heading>Hello {username}</Heading>
      </Section>
      <Row>
        <Heading>Thankyou for registering</Heading>
      </Row>
    </Html>
  );
}

```
- Make a folder `types` and file `ApiResponse.ts` inside `types`

```typescript
//ApiResponse.ts

import { Message } from "@/model/user.model";

export interface ApiResponse {
  success: boolean;
  message: string;
  isAcceptingMessage?: boolean;
  messages?: Array<Message>;
}

```
- Created a file `resend.ts` inside `lib` folder which export the resend Api Key.
```typescript
//resend.ts

import { Resend } from "resend";
export const resend = new Resend(process.env.RESEND_API_KEY);

```
- Created a `helper` folder for `resendEmailVerfication`
  - `resendEmailVerication.ts` contain code to send email.
```typescript
//resendEmailVerication.ts
import { resend } from "@/lib/resend";
import VerificationEmail from "../../email/verificationEmail";
import { ApiResponse } from "@/types/ApiResponse";
export async function sendVerificationEmail(
  email: string,
  username: string,
  verifyCode: string
): Promise<ApiResponse> {
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Verification Code",
      react: VerificationEmail({ username, otp: verifyCode }),
    });
    return { success: true, message: "Email sended successfully" };
  } catch (error) {
    console.error("Email sending error", error);
    return { success: false, message: "Failed to send email verification" };
  }
}

```
### 4. SignUp Api 
- Created a `route.ts` file inside `signup` and this folder inside `src/api` folder.

```typescript
import UserModel from "@/model/user.model";
import dbConnect from "@/lib/dbConnect";
import bcrypt from "bcryptjs";

import { sendVerificationEmail } from "@/helpers/resendEmailVerification";


export async function POST(req: Request) {
  await dbConnect();
  try {
    const { username, email, password, isVerified, verifyCode } = await req.json();
    const existingUserwithUsername = await UserModel.findOne({
      username,
      isVerified: true,
    });
    if (existingUserwithUsername) {
      return Response.json(
        {
          success: false,
          message: "username is already taken",
        },
        { status: 400 }
      );
    }
    const existingUserwithEmail = await UserModel.findOne({
      email,
    });
    if (existingUserwithEmail) {
      if(existingUserwithEmail.isVerified){
        return Response.json({
      
          success:false,
          message:"User already exists with this email",
        },{
          status:400
        },)
      }
      else{
        const hashedPassword= await bcrypt.hash(password,10);
        existingUserwithEmail.password=hashedPassword;
        existingUserwithEmail.verifyCode=verifyCode;
        existingUserwithEmail.verifyCodeExpiry=new Date(Date.now()+3600000);
        await existingUserwithEmail.save()

      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1);

      const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
      const newUser = new UserModel({
        username,
        password: hashedPassword,
        email,
        verifyCode,
        verifyCodeExpiry: expiryDate,
        isVerified: false,
        isAcceptingMessage: true,
        message: [],
      });
      await newUser.save();
    }

    const emailResponse=await sendVerificationEmail(
      email,
      username,
      verifyCode,
    )
    if(!emailResponse.success){
      return Response.json({
      
        success:false,
        message:"Failed to send Email response",
      },{
        status:400
      },)
    }

    return Response.json({
      
      success:false,
      message:"Username is registered succesfully and please verify your Email",
    },{
      status:200
    },)
  } catch (error) {
    console.log("Error while Signup", error);
    return Response.json(
      { message: "Failed to signup", success: false },
      { status: 500 }
    );
  }
}
```