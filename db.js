import mongoose from 'mongoose';
import dotenv from 'dotenv';


dotenv.config();

const connectDB = async () => {
  try {
    mongoose.set('debug', true); // Adăugați această linie pentru a vedea interogările
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connected successfully!');
    console.log('Database Name:', mongoose.connection.db.databaseName);
    console.log('Collections:', await mongoose.connection.db.listCollections().toArray());
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

export default connectDB;