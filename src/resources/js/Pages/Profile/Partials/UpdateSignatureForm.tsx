import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import { useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { PageProps } from '@/types';

export default function UpdateSignatureForm({
    className = '',
}: {
    className?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm<{
        signature: File | null;
    }>({
        signature: null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Important: Inertia uses POST with FormData to upload files
        post(route('signatures.store'), {
            preserveScroll: true,
            onSuccess: () => {
                if (fileInputRef.current) fileInputRef.current.value = '';
                setPreview(null);
            },
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('signature', file);
            setPreview(URL.createObjectURL(file));
        } else {
            setData('signature', null);
            setPreview(null);
        }
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Firma Digital
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Actualiza tu firma digital. Esta firma será estampada en las papeletas de salida que generes o apruebes. 
                    Por favor, sube una imagen con fondo transparente en formato PNG o JPG.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="signature" value="Archivo de Firma (PNG/JPG)" />

                    <input
                        id="signature"
                        ref={fileInputRef}
                        type="file"
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileChange}
                    />

                    <InputError message={errors.signature} className="mt-2" />
                </div>

                {preview && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Vista previa de nueva firma:</p>
                        <div className="border border-dashed border-gray-300 p-4 rounded-md inline-block">
                            <img src={preview} alt="Vista previa" className="max-h-32 object-contain" />
                        </div>
                    </div>
                )}
                
                {auth.user.has_signature && !preview && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Firma actual:</p>
                        <div className="border border-gray-300 p-4 rounded-md inline-block bg-white">
                            {/* The SignatureController@show serves the file */}
                            <img src={`/signatures/${auth.user.signature_id}`} alt="Firma actual" className="max-h-32 object-contain" />
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing || !data.signature}>
                        {auth.user.has_signature ? 'Actualizar Firma' : 'Subir Firma'}
                    </PrimaryButton>

                    {recentlySuccessful && (
                        <p className="text-sm text-gray-600">
                            Guardado.
                        </p>
                    )}
                </div>
            </form>
        </section>
    );
}
