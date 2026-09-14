const mongoose = require('mongoose');

const comercioSchema = new mongoose.Schema(
  {
    codigoComercio: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    nombreComercio: {
      type: String,
      required: true,
      trim: true
    },
    direccion: {
      type: String,
      required: true,
      trim: true
    },
      descripcionComercio: {
      type: String,
      default: ''
    },
    categorias: {
      type: [String],
      default: []
    },
    horario: [
      {
        dia: {
          type: String,
          required: true
        },
        apertura: {
          type: String,
          required: true
        },
        cierre: {
          type: String,
          required: true
        }
      }
    ],
    imagenComercio: {
      type: String,
      default: ''
    },
    idVendedor: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Usuario',
      required: true 
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Comercio', comercioSchema);