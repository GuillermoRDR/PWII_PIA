import mongoose from 'mongoose';

const comentarioSchema = new mongoose.Schema(
  {
    contenido: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },

    puesto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Puesto',
      required: true,
      index: true
    },

    activo: {
      type: Boolean,
      default: true
    },

    editado: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

comentarioSchema.index({ puesto: 1, activo: 1, createdAt: -1 });

const Comentario = mongoose.model('Comentario', comentarioSchema);

export default Comentario;