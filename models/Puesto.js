const mongoose = require('mongoose');

const puestoSchema = new mongoose.Schema(
  {
    nombrePuesto: { 
        type: String, 
        required: true,
        trim: true 
    },
    categoria: { 
        type: String, 
        required: true,
        trim: true 
    },
    descripcionPuesto: { 
        type: String, 
        default: ''
    },
    palabrasClave: [
      {
          type: String,
          trim: true
      }
    ],
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
    comercios: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comercio',
        required: true
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Puesto', puestoSchema);