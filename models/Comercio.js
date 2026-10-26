import mongoose from 'mongoose';

const horarioSchema = new mongoose.Schema({
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
}, { _id: false });

const comercioSchema = new mongoose.Schema({
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
  horario: {
    type: [horarioSchema],
    default: []
  },
  imagenComercio: {
    type: String,
    default: ''
  },
  propietario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    index: true
  },
  activo: {
    type: Boolean,
    default: true,
    index: true
  },
  fechaBaja: {
    type: Date,
    default: null
  },
  desactivadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  }
}, {
  timestamps: true
});

const Comercio = mongoose.model('Comercio', comercioSchema);

export default Comercio;