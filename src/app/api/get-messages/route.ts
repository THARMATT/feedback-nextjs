import { getServerSession, User } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user.model";
import mongoose from "mongoose";


export async function GET(req:Request){
    await dbConnect()
    const session = await getServerSession(authOptions);
  const user = session?.user as User;
  if (!session || !session.user) {
    return Response.json(
      {
        success: false,
        message: "Not Authenticated",
      },
      {
        status: 401,
      }
    );
  }
  const userId = new mongoose.Types.ObjectId(user._id);
  try {
    

const user=await UserModel.aggregate([
    {
        $match:{id:userId}
    },{
        $unwind:'$messages'
    },{
        $sort:{
            'messages.createdAt':-1
        }
    },{
        $group:{_id:'$_id',messages:{
            $push:'$messages'
        }}
    }
])
if(!user || user.length===0){
return Response.json({
    success:false,
message:"User not found"
},{
    status:404
})
}
return Response.json({
    success:true,
    messages:user[0].messages,
message:"User is Authenticated "
},{
    status:200
})

  } catch (error) {
    
  }
}