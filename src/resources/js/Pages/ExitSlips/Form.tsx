import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { PageProps } from '@/types';

interface ExitSlipForm {
    id?: string;
    tipo_plantilla: string;
    fecha_emision: string;
    designado: string;
    motivo_salida: string;
    motivo_detalle: string;
    fecha_autorizada: string;
    hora_desde?: string;
    hora_hasta?: string;
}

export default function Form({ auth, exitSlip }: PageProps<{ exitSlip?: ExitSlipForm }>) {
    const isEdit = !!exitSlip;
    const [isEditingSignature, setIsEditingSignature] = useState(false);

    const { data, setData, post, put, processing, errors } = useForm({
        tipo_plantilla: exitSlip?.tipo_plantilla || 'practitioner',
        fecha_emision: exitSlip?.fecha_emision || new Date().toISOString().split('T')[0],
        designado: exitSlip?.designado || auth.user.cargo_designado || '',
        motivo_salida: exitSlip?.motivo_salida || 'other',
        motivo_detalle: exitSlip?.motivo_detalle || '',
        fecha_autorizada: exitSlip?.fecha_autorizada || new Date().toISOString().split('T')[0],
        hora_desde: exitSlip?.hora_desde || '',
        hora_hasta: exitSlip?.hora_hasta || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEdit && exitSlip?.id) {
            put(route('exit-slips.update', exitSlip.id));
        } else {
            post(route('exit-slips.store'));
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">{isEdit ? 'Editar Papeleta' : 'Nueva Papeleta'}</h2>}
        >
            <Head title={isEdit ? 'Editar Papeleta' : 'Nueva Papeleta'} />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            
                            <form onSubmit={submit} className="space-y-6">
                                <div>
                                    <label htmlFor="tipo_plantilla" className="block text-sm font-medium text-gray-700">
                                        Tipo de Plantilla
                                    </label>
                                    <select
                                        id="tipo_plantilla"
                                        value={data.tipo_plantilla}
                                        onChange={(e) => setData('tipo_plantilla', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    >
                                        <option value="practitioner">Practicante</option>
                                        <option value="staff">Personal Nombrado/Contratado</option>
                                    </select>
                                    {errors.tipo_plantilla && <p className="mt-2 text-sm text-red-600">{errors.tipo_plantilla}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="fecha_emision" className="block text-sm font-medium text-gray-700">Fecha de Emisión</label>
                                        <input
                                            type="date"
                                            id="fecha_emision"
                                            value={data.fecha_emision}
                                            onChange={e => setData('fecha_emision', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                        {errors.fecha_emision && <p className="mt-2 text-sm text-red-600">{errors.fecha_emision}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="designado" className="block text-sm font-medium text-gray-700">Designado (Cargo)</label>
                                        <input
                                            type="text"
                                            id="designado"
                                            value={data.designado}
                                            onChange={e => setData('designado', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                        {errors.designado && <p className="mt-2 text-sm text-red-600">{errors.designado}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="motivo_salida" className="block text-sm font-medium text-gray-700">
                                        Motivo de Salida
                                    </label>
                                    <select
                                        id="motivo_salida"
                                        value={data.motivo_salida}
                                        onChange={(e) => setData('motivo_salida', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    >
                                        <option value="personal">Asuntos Personales</option>
                                        <option value="essalud">Salud (EsSalud)</option>
                                        <option value="commission">Comisión de Servicio</option>
                                        <option value="other">Otro</option>
                                    </select>
                                    {errors.motivo_salida && <p className="mt-2 text-sm text-red-600">{errors.motivo_salida}</p>}
                                </div>

                                <div>
                                    <label htmlFor="motivo_detalle" className="block text-sm font-medium text-gray-700">
                                        Especificar Motivo
                                    </label>
                                    <textarea
                                        id="motivo_detalle"
                                        rows={3}
                                        value={data.motivo_detalle}
                                        onChange={(e) => setData('motivo_detalle', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        required
                                    />
                                    {errors.motivo_detalle && <p className="mt-2 text-sm text-red-600">{errors.motivo_detalle}</p>}
                                </div>

                                <div>
                                    <label htmlFor="fecha_autorizada" className="block text-sm font-medium text-gray-700">
                                        Fecha Autorizada
                                    </label>
                                    <input
                                        type="date"
                                        id="fecha_autorizada"
                                        value={data.fecha_autorizada}
                                        onChange={(e) => setData('fecha_autorizada', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        required
                                    />
                                    {errors.fecha_autorizada && <p className="mt-2 text-sm text-red-600">{errors.fecha_autorizada}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="hora_desde" className="block text-sm font-medium text-gray-700">
                                            Hora Salida (Opcional)
                                        </label>
                                        <input
                                            type="time"
                                            id="hora_desde"
                                            value={data.hora_desde}
                                            onChange={(e) => setData('hora_desde', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                        {errors.hora_desde && <p className="mt-2 text-sm text-red-600">{errors.hora_desde}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="hora_hasta" className="block text-sm font-medium text-gray-700">
                                            Hora Retorno (Opcional)
                                        </label>
                                        <input
                                            type="time"
                                            id="hora_hasta"
                                            value={data.hora_hasta}
                                            onChange={(e) => setData('hora_hasta', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                        {errors.hora_hasta && <p className="mt-2 text-sm text-red-600">{errors.hora_hasta}</p>}
                                    </div>
                                </div>

                                {/* Información de Firma */}
                                <div className="mt-8 bg-gray-50 p-4 rounded-md border border-gray-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-sm font-medium text-gray-900">Firma Digital</h4>
                                        {auth.user.has_signature && !isEditingSignature && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if(confirm('¿Seguro que quieres editar tu firma?')) {
                                                        setIsEditingSignature(true);
                                                    }
                                                }}
                                                className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                                            >
                                                Editar firma
                                            </button>
                                        )}
                                        {isEditingSignature && (
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingSignature(false)}
                                                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                                            >
                                                Cancelar edición
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex flex-col">
                                        {auth.user.has_signature ? (
                                            <div className="flex flex-col">
                                                <div className="flex items-center mb-2">
                                                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    <span className="text-sm text-gray-700">Tu firma está registrada y se adjuntará automáticamente a la papeleta.</span>
                                                </div>
                                                
                                                <div className="mt-2 relative inline-block self-start">
                                                    <div className="p-2 border border-gray-200 rounded-md bg-white inline-block">
                                                        <img src={`/signatures/${auth.user.signature_id}`} alt="Tu firma digital" className="max-h-24 object-contain" />
                                                    </div>
                                                    {isEditingSignature && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if(confirm('¿Seguro que deseas eliminar la imagen actual?')) {
                                                                    router.delete(route('signatures.destroy'), { preserveScroll: true, onSuccess: () => setIsEditingSignature(false) });
                                                                }
                                                            }}
                                                            className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors z-10"
                                                            title="Borrar firma"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {isEditingSignature && (
                                                    <div className="mt-4 border-t border-gray-200 pt-4">
                                                        <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150">
                                                            Subir nueva imagen
                                                            <input 
                                                                type="file" 
                                                                className="hidden" 
                                                                accept="image/png, image/jpeg, image/jpg" 
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        router.post(route('signatures.store'), { signature: file }, { preserveScroll: true, forceFormData: true, onSuccess: () => setIsEditingSignature(false) });
                                                                    }
                                                                }}
                                                            />
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-start">
                                                <div className="flex items-center mb-4">
                                                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                    <span className="text-sm text-red-700">No tienes una firma registrada. Sube una imagen para poder enviar la papeleta.</span>
                                                </div>
                                                <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150">
                                                    Subir firma aquí
                                                    <input 
                                                        type="file" 
                                                        className="hidden" 
                                                        accept="image/png, image/jpeg, image/jpg" 
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                router.post(route('signatures.store'), { signature: file }, { preserveScroll: true, forceFormData: true });
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                                    <Link
                                        href={route('exit-slips.index')}
                                        className="text-sm text-gray-600 hover:text-gray-900"
                                    >
                                        Cancelar
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        {isEdit ? 'Actualizar Borrador' : 'Guardar Borrador'}
                                    </button>
                                </div>
                            </form>

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
