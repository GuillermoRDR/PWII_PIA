import mongoose from 'mongoose';

const suscripcionSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true
    },
    descripcion: {
      type: String,
      required: true,
      trim: true
    },
    precio: {
      type: Number,
      required: true,
      min: 0
    },
    duracion: {
      type: Number,
      required: true,
      min: 1
    },
    imagenSuscripcion: {
    type: String,
    default: ''
  },
    activa: {
      type: Boolean,
      default: true
    },
    creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Suscripcion', suscripcionSchema);