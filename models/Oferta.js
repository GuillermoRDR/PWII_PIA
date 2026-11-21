import mongoose from 'mongoose';

const ofertaSchema = new mongoose.Schema(
  {
    titulo: { 
      type: String, 
      required: true,
      trim: true 
    },
    descripcion: { 
      type: String, 
      required: true ,
      trim: true
    },
    descuento: { 
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    fechaFin: { 
      type: Date,
      default: null
    },
    imagenOferta: {
      type: String,
      default: ''
    },
    activa: { 
      type: Boolean, 
      default: true 
    },
    idPuesto: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Puesto', 
      required: true,
      index: true 
    },
    codigoOferta: {
      type: String,
      uppercase: true,
      trim: true,
      default: ''
    },
    exclusivoPlus: { 
      type: Boolean, 
      default: false 
    }
  },
  { 
    timestamps: true 
  }
);

export default mongoose.model('Oferta', ofertaSchema);