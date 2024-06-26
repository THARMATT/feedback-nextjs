import mongoose, { Document, Schema } from "mongoose";

export interface Message extends Document {
  content: string;
  createdAt?: Date;
}
export interface User extends Document {
  username: string;
  password: string;
  email: string;
  verifyCode: string;
  verifyCodeExpiry: Date;
  isVerified: boolean;
  createdAt: Date;
  isAcceptingMessage: boolean;
  message: Message[];
}
const MessageSchema: Schema<Message> = new Schema({
  content: {
    type: String,
    required: [true, "content is required"],
  },
  createdAt: {
    type: Date,
  },
});

const UserSchema: Schema<User> = new Schema({
  username: {
    type: String,
    required: [true, "username is required"],
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: [true, "email is required"],
    unique: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifyCode: {
    type: String,
  },
  verifyCodeExpiry: {
    type: Date,
  },

  isAcceptingMessage: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
  },
  message: [MessageSchema],
});

const UserModel =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>("User", UserSchema);
export default UserModel;
