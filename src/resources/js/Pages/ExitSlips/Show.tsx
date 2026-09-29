import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';

interface ExitSlip {
    id: string;
    codigo: string;
    fecha_emision: string;
    motivo_salida: string;
    motivo_label: string;
    motivo_detalle: string;
    fecha_autorizada: string;
    hora_desde?: string;
    hora_hasta?: string;
    estado: string;
    estado_label: string;
    apellidos_nombres: string;
    designado: string;
}

export default function Show({ auth, exitSlip }: PageProps<{ exitSlip: ExitSlip }>) {
    
    // Inertia form for transitions
    const { post, processing } = useForm();

    const handleTransition = (action: string) => {
        post(route('exit-slips.transition', { exitSlip: exitSlip.id, action }));
    };

    // Configuración de colores por estado
    const statusColors: Record<string, string> = {
        'draft': 'bg-gray-100 text-gray-800',
        'submitted': 'bg-yellow-100 text-yellow-800',
        'approved_by_area': 'bg-blue-100 text-blue-800',
        'submitted_to_hr': 'bg-purple-100 text-purple-800',
        'approved_by_hr': 'bg-indigo-100 text-indigo-800',
        'completed': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800',
    };
    
    const colorClass = statusColors[exitSlip.estado] || 'bg-gray-100 text-gray-800';

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Detalle de Papeleta: {exitSlip.codigo}</h2>}
        >
            <Head title={`Papeleta ${exitSlip.codigo}`} />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                                        Información de la Solicitud
                                    </h3>
                                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                        Papeleta de autorización de salida.
                                    </p>
                                </div>
                                <div>
                                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${colorClass}`}>
                                        {exitSlip.estado_label.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-gray-200">
                                <dl>
                                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                        <dt className="text-sm font-medium text-gray-500">Solicitante</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{exitSlip.apellidos_nombres}</dd>
                                    </div>
                                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                        <dt className="text-sm font-medium text-gray-500">Cargo</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{exitSlip.designado}</dd>
                                    </div>
                                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                        <dt className="text-sm font-medium text-gray-500">Motivo de Salida</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{exitSlip.motivo_label.toUpperCase()}</dd>
                                    </div>
                                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                        <dt className="text-sm font-medium text-gray-500">Detalle del Motivo</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{exitSlip.motivo_detalle}</dd>
                                    </div>
                                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                        <dt className="text-sm font-medium text-gray-500">Fecha Autorizada</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{exitSlip.fecha_autorizada}</dd>
                                    </div>
                                    {(exitSlip.hora_desde || exitSlip.hora_hasta) && (
                                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                            <dt className="text-sm font-medium text-gray-500">Rango de Horas</dt>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                                {exitSlip.hora_desde || '--:--'} hasta {exitSlip.hora_hasta || '--:--'}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            <div className="mt-8 flex justify-between border-t border-gray-200 pt-5">
                                <div className="flex gap-4">
                                    <Link
                                        href={route('exit-slips.index')}
                                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Volver
                                    </Link>
                                    
                                    {/* Botones de Transición */}
                                    {exitSlip.estado === 'draft' && (
                                        <button
                                            onClick={() => handleTransition('submit')}
                                            disabled={processing}
                                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                        >
                                            Enviar a Aprobación
                                        </button>
                                    )}

                                    {exitSlip.estado === 'approved_by_area' && auth.user.rol === 'practitioner' && (
                                        <button
                                            onClick={() => handleTransition('submit_to_hr')}
                                            disabled={processing}
                                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                        >
                                            Enviar a Recursos Humanos
                                        </button>
                                    )}

                                    {((exitSlip.estado === 'submitted' && auth.user.rol === 'area_head') || 
                                      (exitSlip.estado === 'submitted_to_hr' && auth.user.rol === 'hr')) && (
                                        <>
                                            <button
                                                onClick={() => handleTransition('approve')}
                                                disabled={processing}
                                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                            >
                                                Aprobar Papeleta
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const reason = prompt('Motivo de rechazo:');
                                                    if (reason) {
                                                        alert('El rechazo requiere un modal para el comentario. (Pendiente)');
                                                    }
                                                }}
                                                disabled={processing}
                                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                            >
                                                Rechazar
                                            </button>
                                        </>
                                    )}
                                </div>
                                
                                <a
                                    href={route('exit-slips.pdf', exitSlip.id)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    <svg className="w-5 h-5 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Ver PDF
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
