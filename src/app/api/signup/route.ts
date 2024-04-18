import UserModel from '@/model/user.model';
import dbConnect from '@/lib/dbConnect';
// import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/helpers/resendEmailVerification';


export async function POST(req:Request){
    await dbConnect()
    try {
      const {username,email,password}  = await req.json();
      await UserModel
        
    } catch (error) {
      console.log("Error while Signup",error);
      return Response.json({message:"Failed to signup",success:false},{status:500})
    }
}