import { connect } from 'mongoose';

const conectarBD = async () => {
  try {
    await connect(process.env.MONGO_URI);
    console.log('MongoDB Local conectado correctamente');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

export default conectarBD;