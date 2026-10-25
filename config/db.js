import mongoose from 'mongoose';

const conectarBD = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('No se encontro la variable MONGO_URI');
  }
  await mongoose.connect(process.env.MONGO_URI);

  console.log('Conexión a MongoDB establecida correctamente');
};

export default conectarBD;