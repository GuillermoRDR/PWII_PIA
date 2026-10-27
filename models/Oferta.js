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
      required: true 
    },
    descuento: { 
      type: Number,
      default: 0 
    },
    fechaInicio: { 
      type: Date, 
      default: Date.now 
    },
    fechaFin: { 
      type: Date 
    },
    activa: { 
      type: Boolean, 
      default: true 
    },
    idPuesto: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Puesto', 
      required: true 
    },
    codigoOferta: {
      type: String,
      uppercase: true,
      trim: true
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

const Oferta = mongoose.model('Oferta', ofertaSchema);

export default Oferta;