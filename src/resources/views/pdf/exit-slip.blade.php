<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        @page { margin: 0px; size: A4 landscape; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11px; color: #172554; margin: 0; padding: 0; }
        
        /* ESTILOS PARA LA PLANTILLA TRADICIONAL (STAFF) */
        .staff-body { padding: 40px; }
        .staff-body h1 { text-align: center; font-size: 18px; margin-bottom: 5px; }
        .staff-body h2 { font-size: 13px; text-align: center; margin-top: 0; margin-bottom: 20px; }
        .staff-body table { width: 100%; border-collapse: collapse; margin: 18px 0; }
        .staff-body td, .staff-body th { border: 1px solid #94a3b8; padding: 10px; text-align: left; }
        .staff-body th { background-color: #f1f5f9; width: 30%; }
        .staff-body .muted { color: #64748b; font-size: 9px; }
        .staff-body .signature { height: 75px; max-width: 150px; }
        .staff-body .center { text-align: center; }
        .staff-body p { line-height: 1.6; }
        .staff-body .logo-container { position: absolute; top: 20px; left: 20px; width: 120px; height: 60px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999; }
        
        .watermark { position: absolute; top: 30%; left: 15%; font-size: 80px; color: rgba(255, 0, 0, 0.1); transform: rotate(-30deg); z-index: -1; font-weight: bold; }
        
        /* ESTILOS PARA LA PLANTILLA DE PRACTICANTES (IMAGEN DE FONDO) */
        .bg-image { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -10; }
        .prac-field { position: absolute; font-size: 14px; color: #0f172a; font-family: 'Helvetica', Arial, sans-serif; }
        
        /* COORDENADAS EXPORTADAS DESDE EL CALIBRADOR */
        .prac-digit { position: absolute; font-weight: bold; font-size: 16px; font-family: 'Helvetica', Arial, sans-serif; color: #0f172a; }
        
        .f-fecha-emision-0 { top: 36px; left: 897px; }
        .f-fecha-emision-1 { top: 36px; left: 924px; }
        .f-fecha-emision-2 { top: 36px; left: 950px; }
        .f-fecha-emision-3 { top: 36px; left: 977px; }
        .f-fecha-emision-4 { top: 36px; left: 1004px; }
        .f-fecha-emision-5 { top: 36px; left: 1031px; }
        .f-apellidos { top: 190px; left: 180px; }
        .f-nombres { top: 218px; left: 180px; }
        .f-cargo { top: 220px; left: 609px; }
        .f-mot-essalud { top: 328px; left: 89px; font-size: 20px; font-weight: bold; color: #000; }
        .f-mot-personal { top: 401px; left: 89px; font-size: 20px; font-weight: bold; color: #000; }
        .f-mot-comision { top: 479px; left: 91px; font-size: 20px; font-weight: bold; color: #000; }
        .f-mot-otros { top: 550px; left: 93px; font-size: 20px; font-weight: bold; color: #000; }
        .f-detalle { top: 288px; left: 487px; width: 550px; line-height: 1.5; }
        .f-fecha-aut-0 { top: 396px; left: 498px; }
        .f-fecha-aut-1 { top: 396px; left: 521px; }
        .f-fecha-aut-2 { top: 395px; left: 555px; }
        .f-fecha-aut-3 { top: 394px; left: 583px; }
        .f-fecha-aut-4 { top: 394px; left: 609px; }
        .f-fecha-aut-5 { top: 393px; left: 629px; }
        .f-fecha-aut-6 { top: 394px; left: 651px; }
        .f-fecha-aut-7 { top: 395px; left: 673px; }
        .f-hora-desde { top: 390px; left: 914px; }
        .f-hora-hasta { top: 393px; left: 1005px; }
        .f-firma-prac { position: absolute; top: 465px; left: 320px; width: 140px; height: 90px; object-fit: contain; }
        .f-firma-jefe { position: absolute; top: 463px; left: 530px; width: 140px; height: 90px; object-fit: contain; }
        .f-firma-rrhh { position: absolute; top: 465px; left: 925px; width: 140px; height: 90px; object-fit: contain; }
    </style>
</head>
<body>
    @if(!$slip->isFullyApproved())
        <div class="watermark">BORRADOR / PENDIENTE</div>
    @endif

    @if($slip->templateType->value === 'practitioner')
        <!-- ========== PLANTILLA DE PRACTICANTES CON IMAGEN ========== -->
        @php
            $bgPath = resource_path('images/Autorizacion_salida_practicante_EPSEL_Full_HD.png');
            $bgData = file_exists($bgPath) ? base64_encode(file_get_contents($bgPath)) : '';
        @endphp
        
        @if($bgData)
            <img class="bg-image" src="data:image/png;base64,{{ $bgData }}" alt="Plantilla">
        @endif
        
        <!-- DATOS SOBREPUESTOS -->
        @php
            $emisionChars = str_split($slip->issueDate->format('dmy')); // 6 dígitos (ej: 280926)
            $autorizadaChars = str_split($slip->authorizedDate->format('dmY')); // 8 dígitos (ej: 28092026)
        @endphp
        
        @foreach($emisionChars as $i => $char)
            <div class="prac-digit f-fecha-emision-{{ $i }}">{{ $char }}</div>
        @endforeach
        
        @php
            // Intentar separar nombres y apellidos asumiendo formato "Nombre1 Nombre2 Apellido1 Apellido2"
            $nameParts = explode(' ', trim($slip->fullNameSnapshot));
            $nombresPdf = '';
            $apellidosPdf = '';
            if(count($nameParts) >= 4) {
                $nombresPdf = $nameParts[0] . ' ' . $nameParts[1];
                $apellidosPdf = $nameParts[2] . ' ' . $nameParts[3];
            } elseif(count($nameParts) === 3) {
                $nombresPdf = $nameParts[0];
                $apellidosPdf = $nameParts[1] . ' ' . $nameParts[2];
            } else {
                $nombresPdf = $slip->fullNameSnapshot;
                $apellidosPdf = '';
            }
        @endphp
        
        <div class="prac-field f-apellidos">{{ $apellidosPdf }}</div>
        <div class="prac-field f-nombres">{{ $nombresPdf }}</div>
        <div class="prac-field f-cargo">{{ $slip->designationSnapshot }}</div>
        
        @if($slip->reason->value === 'essalud') <div class="prac-field f-mot-essalud">X</div> @endif
        @if($slip->reason->value === 'personal') <div class="prac-field f-mot-personal">X</div> @endif
        @if($slip->reason->value === 'commission') <div class="prac-field f-mot-comision">X</div> @endif
        @if($slip->reason->value === 'other') <div class="prac-field f-mot-otros">X</div> @endif
        
        <div class="prac-field f-detalle">{{ $slip->reasonDetail }}</div>
        
        @foreach($autorizadaChars as $i => $char)
            <div class="prac-digit f-fecha-aut-{{ $i }}">{{ $char }}</div>
        @endforeach
        
        @if($slip->authorizedTime)
            <div class="prac-field f-hora-desde">{{ substr($slip->authorizedTime->from, 0, 5) }}</div>
            <div class="prac-field f-hora-hasta">{{ substr($slip->authorizedTime->until, 0, 5) }}</div>
        @endif
        
        <!-- FIRMAS SOBREPUESTAS -->
        @if($signatures['practicante'])
            <img class="f-firma-prac" src="{{ $signatures['practicante'] }}">
        @endif
        @if($signatures['jefe'])
            <img class="f-firma-jefe" src="{{ $signatures['jefe'] }}">
        @endif
        @if($signatures['rrhh'])
            <img class="f-firma-rrhh" src="{{ $signatures['rrhh'] }}">
        @endif

    @else
        <!-- ========== PLANTILLA TRADICIONAL PARA STAFF ========== -->
        <div class="staff-body">
            @if(file_exists(public_path('images/logo-epsel.png')))
                <img src="data:image/png;base64,{{ base64_encode(file_get_contents(public_path('images/logo-epsel.png'))) }}" style="position: absolute; top: 20px; left: 20px; width: 120px;" alt="Logo EPSEL">
            @else
                <div class="logo-container">[LOGO OFICIAL DE EPSEL]</div>
            @endif

            <h1>EPSEL S.A.</h1>
            <h2>PAPELETA DE AUTORIZACIÓN DE SALIDA</h2>
            
            <p class="center">
                <strong>Tipo:</strong> Personal Nombrado/Contratado &nbsp;&nbsp;|&nbsp;&nbsp; 
                <strong>Código:</strong> {{ $slip->codigo }} &nbsp;&nbsp;|&nbsp;&nbsp; 
                <strong>Estado:</strong> {{ strtoupper($slip->status->value) }}
            </p>

            <table>
                <tr>
                    <th>Apellidos y nombres</th>
                    <td>{{ $slip->fullNameSnapshot }}</td>
                </tr>
                <tr>
                    <th>Cargo / designación</th>
                    <td>{{ $slip->designationSnapshot }}</td>
                </tr>
                <tr>
                    <th>Fecha de emisión</th>
                    <td>{{ $slip->issueDate->format('d/m/Y') }}</td>
                </tr>
                <tr>
                    <th>Motivo</th>
                    <td>{{ strtoupper($slip->reason->value) }}</td>
                </tr>
                <tr>
                    <th>Detalle</th>
                    <td>{{ $slip->reasonDetail }}</td>
                </tr>
                <tr>
                    <th>Fecha autorizada</th>
                    <td>{{ $slip->authorizedDate->format('d/m/Y') }}</td>
                </tr>
                @if($slip->authorizedTime)
                <tr>
                    <th>Horario autorizado</th>
                    <td>{{ substr($slip->authorizedTime->from, 0, 5) }} a {{ substr($slip->authorizedTime->until, 0, 5) }}</td>
                </tr>
                @endif
            </table>

            <table>
                <tr>
                    <td class="center" style="width: 33%;">
                        @if($signatures['practicante'])
                            <img class="signature" src="{{ $signatures['practicante'] }}">
                        @else
                            <br><br><p>Pendiente de firma</p><br>
                        @endif
                        <br><strong>Solicitante</strong>
                    </td>
                    <td class="center" style="width: 33%;">
                        @if($signatures['jefe'])
                            <img class="signature" src="{{ $signatures['jefe'] }}">
                        @else
                            <br><br><p>Pendiente de firma</p><br>
                        @endif
                        <br><strong>Jefe de Área</strong>
                        @if($slip->approvedByHeadAt)
                            <br><span style="font-size: 10px;">Aprobado: {{ $slip->approvedByHeadAt->format('d/m/Y H:i') }}</span>
                        @endif
                    </td>
                    <td class="center" style="width: 33%;">
                        @if($signatures['rrhh'])
                            <img class="signature" src="{{ $signatures['rrhh'] }}">
                        @else
                            <br><br><p>Pendiente de firma</p><br>
                        @endif
                        <br><strong>Recursos Humanos</strong>
                        @if($slip->approvedByHrAt)
                            <br><span style="font-size: 10px;">Aprobado: {{ $slip->approvedByHrAt->format('d/m/Y H:i') }}</span>
                        @endif
                    </td>
                </tr>
            </table>

            <h2 style="margin-top: 30px; text-align: left;">Control de Vigilancia</h2>
            <table>
                <tr>
                    <th>Hora de Salida Real</th>
                    <td>{{ $slip->exitTime ?? 'Pendiente' }}</td>
                </tr>
                <tr>
                    <th>Hora de Retorno Real</th>
                    <td>{{ $slip->returnTime ?? 'Pendiente' }}</td>
                </tr>
                <tr>
                    <th>Supervisor</th>
                    <td>{{ $slip->supervisor ?? '---' }}</td>
                </tr>
                <tr>
                    <th>Observaciones</th>
                    <td>{{ $slip->securityObservations ?? '---' }}</td>
                </tr>
            </table>

            <p class="muted" style="margin-top: 30px;">
                Documento generado automáticamente por el Sistema de Control de Papeletas EPSEL.<br>
                Identificador único: {{ $slip->id }}
            </p>
        </div>
    @endif
</body>
</html>
