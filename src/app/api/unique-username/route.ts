import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user.model";

import { z } from "zod";

import { usernameValidation } from "@/schemas/signUpSchema";

const userNameQuerySchema = z.object({
  username: usernameValidation,
});
export async function GET(req: Request) {
    // if(req.method!=='GET'){
    //     return Response.json(
    //         {
    //           success: false,
    //           message: "Method not allowed",
    //         },
    //         { status: 405 })
    // }
  await dbConnect();
  // loclhost:300/api/cuu?username=ninam
  try {
    const { searchParams } = new URL(req.url);
    const queryParam = {
      username: searchParams.get("username"),
    };
    //validate with zod
    const result = userNameQuerySchema.safeParse(queryParam);
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
