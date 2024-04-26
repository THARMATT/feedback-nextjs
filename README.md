
# Documentation 

## 1. Setup Basic structure & modelling with mongoose and  Validations with zod

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

## 2. Database Connection with MongoDB

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

## 3. Configure Resend
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

---
## 4. SignUp API 
- Created a `route.ts` file inside `signup` and this folder inside `src/api` folder.

```typescript
import UserModel from "@/model/user.model";
import dbConnect from "@/lib/dbConnect";
import bcrypt from "bcryptjs";

import { sendVerificationEmail } from "@/helpers/resendEmailVerification";

export async function POST(req: Request) {
  await dbConnect();
  try {
    const { username, email, password, isVerified, verifyCode } =
      await req.json();
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
      if (existingUserwithEmail.isVerified) {
        return Response.json(
          {
            success: false,
            message: "User already exists with this email",
          },
          {
            status: 400,
          }
        );
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        existingUserwithEmail.password = hashedPassword;
        existingUserwithEmail.verifyCode = verifyCode;
        existingUserwithEmail.verifyCodeExpiry = new Date(Date.now() + 3600000);
        await existingUserwithEmail.save();
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

    const emailResponse = await sendVerificationEmail(
      email,
      username,
      verifyCode
    );
    if (!emailResponse.success) {
      return Response.json(
        {
          success: false,
          message: "Failed to send Email response",
        },
        {
          status: 400,
        }
      );
    }

    return Response.json(
      {
        success: false,
        message:
          "Username is registered succesfully and please verify your Email",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.log("Error while Signup", error);
    return Response.json(
      { message: "Failed to signup", success: false },
      { status: 500 }
    );
  }
}

```
---
## 05. Auth.js/Next-Auth Guide

- Install dependency

```bash
npm i next-auth
```
- Make a folder named `auth` inside `api`  folder & make another folder `[...nextauth]` inside `auth`.
- Now there is always two files are made for any implementation[google-login, credentials, github-login ]
   - options.ts
   - route.ts
- Now explore some docs of [Next Auth](https://next-auth.js.org/getting-started/example) where we find we have three types of `Providers` [OAuth,Email,Credentials]
- Login with Github,Google or any third party is easy because it takes only `clientId` and `clientSectret`.
- Credentials  are love because they are secure enough, now lets explore [Pages](https://next-auth.js.org/configuration/pages) and [Callbacks](https://next-auth.js.org/configuration/callbacks).
- `Callbacks` gives `signin`, `jwt`, `session` & `reDirect`
```bash
...
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      return true
    },
    async redirect({ url, baseUrl }) {
      return baseUrl
    },
    async session({ session, user, token }) {
      return session
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      return token
    }
...
}
```
- Max work we do in `option.ts` because data remains segregated.
  - We have to modyfy callbacks in `options.ts`  because we dont have user types.

```typescript
import { NextAuthOptions } from "next-auth";
import dbConnect from "@/lib/dbConnect";

import bcrypt from "bcryptjs";

import UserModel from "@/model/user.model";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      id: "credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "Aghori" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any): Promise<any> {
        await dbConnect();
        try {
          const user = await UserModel.findOne({
            $or: [
              {
                email: credentials.identifier,
              },
              {
                username: credentials.identifier,
              },
            ],
          });
          if (!user) {
            throw new Error("No user found with this email");
          }
          if (!user.isVerified) {
            throw new Error("Please verify your account ");
          }

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (isPasswordCorrect) {
            return user;
          } else {
            throw new Error("Incorrect Password");
          }
        } catch (error: any) {
          throw new Error(error);
        }
      },
    }),
  ],
  //Make a types file
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user._id = token._id; //
        session.user.isVerified = token.isVerified;
        session.user.isAcceptingMessages = token.isAcceptingMessages;
        session.user.username = token.username;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token._id = user._id?.toString();
        token.isVerified = user.isVerified;
        token.isAcceptingMessages = user.isAcceptingMessages;
        token.username = user.username;
      }
      return token;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.SECRET_NEXT_AUTH,
};

```
- Make a `next-auth.d.ts` inside `types` folder to modify types for `user`
```typescript
//next-auth.d.ts-
import "next-auth";
import { DefaultSession } from "next-auth";
declare module "next-auth" {
  interface User {
    _id?: string;
    isVerified?: boolean;
    isAcceptingMessages?: boolean;
    username?: string;
  }
  interface Session {
    user: {
      _id?: string;
      isVerified?: boolean;
      isAcceptingMessages?: boolean;
      username?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    _id?: string;
    isVerified?: boolean;
    isAcceptingMessages?: boolean;
    username?: string;
  }
}

```
- Now there is less pain because all the work is done in authorize method and now  we dont have to query again and again to Database
- Now make `route.ts` 
```typescript
import NextAuth from "next-auth/next";
import { authOptions } from "./options";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

```
- Now make a Middleware file `middleware.ts`
```typescript
//middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
export { default } from "next-auth/middleware";
import { getToken } from "next-auth/jwt";
// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const url = request.nextUrl;
  if (
    token &&
    (url.pathname.startsWith("/sign-in") ||
      url.pathname.startsWith("/sign-up") ||
      url.pathname.startsWith("/verify") ||
      url.pathname.startsWith("/"))
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (!token && url.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    "/sign-in",
    "/sign-up",
    "/",
    "/dashboard/:path*",
    "/verify/:path* ",
  ],
};

```
- Make a testing file for `login` inside `sign-in` folder which is under `(auth)` folder
```typescript
"use-client";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Component() {
  const { data: session } = useSession();
  if (session) {
    return (
      <>
        Signed in as {session.user.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }
  return (
    <>
      Not signed in <br />
      <button onClick={() => signIn()}>Sign in</button>
    </>
  );
}

```
- Make a `context` folder for ` AuthProvider.ts`
```typescript
"use-client";

import { SessionProvider } from "next-auth/react";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}

```
- Wrap layout body inside AuthProvider
```typescript
<AuthProvider>
  {" "}
  <body className={inter.className}>{children}</body>
</AuthProvider>;

```

### Summary of Next Auth
- Two main things we needed one is callback and other is Provider.
- So we created a folder inside api and two main files` route.ts and option.ts` inside [...nextauth].
- `option.ts` is just to organize the data.
- Now inside Provider if we have github/other provider we just have to put credentials and secret.
- We had `CredentialProvider` so we have two fields `email` and `password`.
- We have our own authorize strategy for checking password, database query.
- Then we modify our callbacks so that we dont have to query again and again to database; we can easily take our data from session and token.
- Then we configure middleware which has two parts:
    - config (kon kon se path pr middleware run krna hai...) 
- Make a bundle (auth) and go to sign-in and wrap our layout inside SessionProvider
---
## 6. Routes for OTP-Verification and Unique Username

- Littlebit testing with Postman and dowloaded Postman in machine for local testing.
- Test our POST route
```bash
http://localhost:3000/api/sign-up
```
- We got response
```bash
{
    "success": true,
    "message": "Username is registered succesfully and please verify your Email"
}
```
- For `sign-in` route we got Errors because we dont handles `Next-Auth`
- Now we have to check uniqueness of User, so make a file`route.ts` inside folder `unique-username` inside `api` folder.
- Write the logic for unique username and then test it through Postman and Mongodb by manipulating Data.
```typescript
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user.model";

import { z } from "zod";

import { usernameValidation } from "@/schemas/signUpSchema";

//Make query schema
const userNameQuerySchema = z.object({
  username: usernameValidation,
});

//Make a GET method while typing that username is unique or not
export async function GET(req: Request) {
  //connect database
  await dbConnect();

  try {
    //check username from url
    const { searchParams } = new URL(req.url);
    const queryParam = {
      username: searchParams.get("username"),
    };

    //validate with zod
    const result = userNameQuerySchema.safeParse(queryParam);

    //log for detail info
    console.log(result);

    if (!result.success) {
      const usernameErrors = result.error.format().username?._errors || [];
      return Response.json(
        {
          success: false,
          message: "Invalid query parameters :" + usernameErrors,
        },
        { status: 400 }
      );
    }

    const { username } = result.data;

    const existingVerifyUser = await UserModel.findOne({
      username,
      isVerified: true,
    });

    if (existingVerifyUser) {
      return Response.json(
        {
          success: false,
          message: "Username is already taken",
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Username is available",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in checking username", error);
    return Response.json(
      {
        success: false,
        message: "Error checking username",
      },
      {
        status: 500,
      }
    );
  }
}

```
- Test for the GET method for url `http://localhost:3000/api/unique-username?username=one` and try to manuplate `isVerified:true` in MongoDb.

- Now we have to verify OTP, so make a file`route.ts` inside folder `verify-code` inside `api` folder.

```typescript
//TODO:ZOD validation
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user.model";

export async function POST(req: Request) {
  //connect database
  await dbConnect();

  try {
    //from frontend
    const { username, code } = await req.json();

   //to get proper url and to decode url
    const decodedUsername = decodeURIComponent(username);

//query to find user 
    const user = await UserModel.findOne({
      username: decodedUsername,
    });

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 500,
        }
      );
    }


     // make variables for code exipy and valid otp
    const isCodeValid = user.verifyCode === code;
    const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date();

    if (isCodeValid && isCodeNotExpired) {
      user.isVerified = true;
      await user.save();
      return Response.json(
        {
          success: true,
          message: "Account verified successfully",
        },
        {
          status: 200,
        }
      );
    } 
    //code is expired
    else if (!isCodeNotExpired) {
      return Response.json(
        {
          success: false,
          message: "verification-code is expired",
        },
        {
          status: 400,
        }
      );
    } 
    
    //invalid otp
    else {
      return Response.json(
        {
          success: false,
          message: "Incorrect Verification Code",
        },
        {
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error("Error in verify username", error);
    return Response.json(
      {
        success: false,
        message: "Error while Verify username",
      },
      {
        status: 500,
      }
    );
  }
}

```
## 7. OpenAI API integration and backend route
- Created a folder named `suggest-messages` folder for writing backend logic for OpenAI API .
- Install dependencies and setup Open API key in `.env`
```bash
npm install openai ai
```
- Explore the [Vercel doc](https://sdk.vercel.ai/docs/guides/providers/openai) and copy pasted and add a prompt.

```typescript
import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { NextResponse } from "next/server";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {

    const prompt="Create a list of three open-ended and enganging questions formatted in a single string.Each question should be seprated by '||' ";
    const { messages } = await req.json();

    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await openai.completions.create({
        model: 'gpt-3.5-turbo-instruct',
        max_tokens: 200,
        stream: true,
        prompt,
      });

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);
    // Respond with the stream
    return new StreamingTextResponse(stream);
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      const { name, status, headers, message } = error;
      return NextResponse.json(
        {
          name,
          status,
          headers,
          message,
        },
        { status }
      );
    } else {
      console.log("error related to openAi", error);
      throw error;
    }
  }
}
```

# Mesage API with Aggregation pipeline