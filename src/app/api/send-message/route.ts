import { getServerSession, User } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user.model";
import mongoose from "mongoose";
import { Message } from "@/model/user.model";

export async function POST(req:Request){
await dbConnect()
const {username,content}=await req.json();
try {
  const user=await UserModel.findOne({username}) ;
  if(!user){
    return Response.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
        }
      );
  }

  //is User accepting the message

  if(!user.isAcceptingMessage){
    return Response.json(
        {
          success: false,
          message: "User is not accepting message",
        },
        {
          status: 403,
        }
      );

  }

  const newMessage={content,createdAt:new Date()}
  user.message.push(newMessage as Message);
  return Response.json(
    {
      success: true,
      message: "message send successfully",
    },
    {
      status: 200,
    }
  );
} catch (error) {
    console.log("Error while sending message");
    
}
}

