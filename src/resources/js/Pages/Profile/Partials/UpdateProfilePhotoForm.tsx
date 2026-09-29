import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Transition } from '@headlessui/react';
import { useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { PageProps } from '@/types';
import DangerButton from '@/Components/DangerButton';

export default function UpdateProfilePhotoForm({
    className = '',
}: {
    className?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const { data, setData, post, processing, errors, recentlySuccessful, delete: destroy } = useForm<{
        photo: File | null;
    }>({
        photo: null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (data.photo) {
            post(route('profile-photo.update'), {
                preserveScroll: true,
                onSuccess: () => {
                    setPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                },
            });
        }
    };

    const deletePhoto = () => {
        destroy(route('profile-photo.destroy'), {
            preserveScroll: true,
            onSuccess: () => {
                setPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('photo', file);
            setPreview(URL.createObjectURL(file));
        } else {
            setData('photo', null);
            setPreview(null);
        }
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Foto de Perfil
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Actualiza tu foto de perfil. Esta foto será visible para otros usuarios del sistema.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div className="flex items-center gap-6">
                    <div className="shrink-0">
                        <img
                            src={preview || auth.user.profile_photo_url}
                            alt={auth.user.nombres}
                            className="h-20 w-20 rounded-full object-cover border border-gray-200"
                        />
                    </div>
                    <div>
                        <input
                            id="photo"
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={handleFileChange}
                        />

                        <SecondaryButton 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Seleccionar Nueva Foto
                        </SecondaryButton>

                        {auth.user.profile_photo_path && (
                            <DangerButton 
                                type="button" 
                                className="mt-2 sm:mt-0 sm:ml-2"
                                onClick={deletePhoto}
                            >
                                Eliminar Foto
                            </DangerButton>
                        )}

                        <InputError message={errors.photo} className="mt-2" />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {preview && (
                        <PrimaryButton disabled={processing || !data.photo}>
                            Guardar
                        </PrimaryButton>
                    )}

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">
                            Guardado.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
