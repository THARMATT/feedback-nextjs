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
