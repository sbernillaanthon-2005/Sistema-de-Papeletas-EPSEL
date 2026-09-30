import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import bgImage from '../../images/Fondo de login.png';
import logoGif from '../../images/EPSEL-saludo-transparente.gif';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div 
            className="flex min-h-screen relative bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('${bgImage}')` }}
        >
            <div className="absolute inset-0 bg-slate-900/10"></div>
            
            {/* Panel lateral izquierdo - Altura completa */}
            <div className="relative z-10 flex min-h-screen w-full flex-col justify-center px-8 sm:px-16 lg:w-5/12 xl:w-[35%] bg-sky-100/90 backdrop-blur-xl shadow-[30px_0_60px_rgba(0,0,0,0.15)] border-r border-sky-200/50">
                <div className="w-full max-w-sm mx-auto">
                    <div className="flex justify-center mb-10">
                        <Link href="/">
                            <img 
                                src={logoGif} 
                                alt="EPSEL Logo Animado" 
                                className="h-72 w-auto object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300"
                            />
                        </Link>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
