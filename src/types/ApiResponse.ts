import {Message} from '@/model/user.model'

export interface ApiResponse{
    success:boolean,
    message:string,
    isAcceptingMessage?:boolean,
    messages?:Array<Message>
}
