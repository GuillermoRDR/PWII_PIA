import mongoose from 'mongoose';

const comentarioSchema = new mongoose.Schema(
  {
    contenido: {
      type: String,
      required: true
    },
    cantidadEstrellas: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 5
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },
    comercio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comercio',
      required: true
    }
  },
  {
    timestamps: true 
  }
);

const Comentario = mongoose.model('Comentario', comentarioSchema);

export default Comentario;