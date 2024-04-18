import {resend} from '@/lib/resend';
import VerificationEmail from '../../email/verificationEmail';
import {ApiResponse} from '@/types/ApiResponse'
export async function sendVerificationEmail(email:string, username:string, verifyCode:string,):Promise<ApiResponse>{
try {
   await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Verification Code',
       react:VerificationEmail({username, otp:verifyCode})
      });
      return {success:true,message:"Email sended successfully"}
} catch (error) {
    console.error("Email sending error",error)
    return{success:false,message:"Failed to send email verification"}
}
}
