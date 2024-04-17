import mongoose from 'mongoose';

type connectionObject={
    isConnected?:number
}
const connection:connectionObject={};

async function dbConnect():Promise<void>{
    if(connection.isConnected){
        console.log("Already Connected");
        return
    }

    try {
        const db= await mongoose.connect(process.env.MONGODB_URI ||"",{})
        console.log(db);
       connection.isConnected= db.connections[0].readyState

       console.log('DB connected successfully');
       
    } catch (error) {
       console.log("Database connection Failed",error);
        
    }
}

export default dbConnect;