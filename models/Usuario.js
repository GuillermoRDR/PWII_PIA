const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema(
  {
    nombreUsuario: {
      type: String,
      required: true,
      trim: true
    },
    correo: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    localidad: {
      type: String,
      default: ''
    },
    tipoUsuario: {
      type: String,
      required: true,
      enum: ['cliente', 'comerciante', 'administrador'],
      default: 'cliente'
    },
    descripcionPerfil: {
      type: String,
      default: ''
    },
    genero: {
      type: String,
      default: ''
    },
    edad: {
      type: Number,
      min: 0
    },
    fotoPerfil: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);


module.exports = mongoose.model('Usuario', usuarioSchema);