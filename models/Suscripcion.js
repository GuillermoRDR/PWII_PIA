import mongoose from 'mongoose';

const suscripcionSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },
    titulo: {
      type: String,
      required: true
    },
    descripcion: {
      type: String,
      required: true
    },
    fechaInicio: {
      type: Date,
      required: true,
      default: Date.now
    },
    fechaFin: {
      type: Date,
      required: true
    },
    precio: {
      type: Number,
      required: true
    },
    metodoPago: {
      type: String,
      required: true
    },
    imagenSuscripcion: {
    type: String,
    default: ''
  },
    activa: {
      type: Boolean,
      default: true
    },
  },
  {
    timestamps: true
  }
);
  
const Suscripcion = mongoose.model('Suscripcion', suscripcionSchema);

export default Suscripcion;