import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage().props.auth.user;
    const [isEditing, setIsEditing] = useState(false);

    const { data, setData, patch, errors, processing, recentlySuccessful, reset } =
        useForm({
            nombres: user.nombres,
            apellidos: user.apellidos,
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.update'), {
            onSuccess: () => setIsEditing(false),
        });
    };

    return (
        <section className={className}>
            <header className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
                <div>
                    <h2 className="text-lg font-medium text-gray-900">
                        Información del Perfil
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                        Actualiza la información personal de tu cuenta.
                    </p>
                </div>
                {!isEditing && (
                    <SecondaryButton onClick={() => setIsEditing(true)}>
                        Actualizar Datos
                    </SecondaryButton>
                )}
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="nombres" value="Nombres" />

                    <TextInput
                        id="nombres"
                        className="mt-1 block w-full"
                        value={data.nombres}
                        onChange={(e) => setData('nombres', e.target.value)}
                        required
                        isFocused={isEditing}
                        disabled={!isEditing}
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.nombres} />
                </div>
                
                <div>
                    <InputLabel htmlFor="apellidos" value="Apellidos" />

                    <TextInput
                        id="apellidos"
                        className="mt-1 block w-full"
                        value={data.apellidos}
                        onChange={(e) => setData('apellidos', e.target.value)}
                        required
                        disabled={!isEditing}
                        autoComplete="family-name"
                    />

                    <InputError className="mt-2" message={errors.apellidos} />
                </div>

                <div className="flex items-center gap-4">
                    {isEditing && (
                        <>
                            <PrimaryButton disabled={processing}>Guardar</PrimaryButton>
                            <SecondaryButton 
                                type="button" 
                                onClick={() => {
                                    setIsEditing(false);
                                    reset();
                                }}
                            >
                                Cancelar
                            </SecondaryButton>
                        </>
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
