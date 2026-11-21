import mongoose from 'mongoose';

const suscripcionUsuarioSchema = new mongoose.Schema(
    {
        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
            index: true
        },
        suscripcion: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Suscripcion',
            required: true
    },
    fechaInicio: {
        type: Date,
        required: true
    },
    fechaFin: {
        type: Date,
        required: true
    },  
    precioPagado: {
        type: Number,
        required: true,
        min: 0
    }
},
{
    timestamps: true
}
);

export default mongoose.model('SuscripcionUsuario', suscripcionUsuarioSchema);
    