import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 20,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      maxlength: 50,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    
    role: {
      type: String,
      enum: ['store', 'orphanage'], // Roles for role-based navigation
      default: 'store',
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt fields
);

const Users = mongoose.model('User', userSchema);
export default Users;
