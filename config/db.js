const mongoose = require('mongoose');

const conectarBD = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Local conectado correctamente');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = conectarBD;