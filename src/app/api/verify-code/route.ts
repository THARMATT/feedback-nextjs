import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user.model";

import { date, z } from "zod";

import { usernameValidation } from "@/schemas/signUpSchema";


export async function POST(req:Request){
    await dbConnect();
    try {
        
const {username,code}=await req.json()

const decodedUsername=decodeURIComponent(username);

const user=await UserModel.findOne({
    username:decodedUsername
})
if(!user){
    return Response.json({
        success:false,
        message:"User not found"
    },
{
    status:500
})
}

const isCodeValid=user.verifyCode===code;
const isCodeNotExpired=new Date(user.verifyCodeExpiry)> new Date()

if(isCodeValid && isCodeNotExpired){
    user.isVerified=true;
    await user.save()
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
else if(!isCodeNotExpired){
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
else{
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