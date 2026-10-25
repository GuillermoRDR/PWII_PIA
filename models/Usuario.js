import mongoose from 'mongoose';

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
      required: true,
      select: false
    },
    localidad: {
      type: String,
      default: ''
    },
    tipoUsuario: {
      type: String,
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

const Usuario = mongoose.model('Usuario', usuarioSchema);

export default Usuario;