import {z} from 'zod';
export const messageSchema=z.object({
    content:z.string().min(5,{message:"message must be more than 5 charcters"}).max(300,{message:"must b less than 300 characters"})
})