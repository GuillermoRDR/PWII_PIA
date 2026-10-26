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

const puestoSchema = new mongoose.Schema({
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
    default: '',
    trim: true
  },

  palabrasClave: {
    type: [String],
    default: []
  },

  horario: {
    type: [horarioSchema],
    default: []
  },

  imagenPuesto: {
    type: String,
    default: ''
  },

  propietario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    index: true
  },

  comercio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comercio',
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

puestoSchema.index({ propietario: 1, activo: 1 });
puestoSchema.index({ comercio: 1, activo: 1 });

const Puesto = mongoose.model('Puesto', puestoSchema);

export default Puesto;