<?php

namespace App\Http\Controllers;

use App\Domain\ExitSlip\Enums\ExitReason;
use App\Domain\ExitSlip\Enums\ExitSlipTemplate;
use App\Domain\ExitSlip\ExitSlip;
use App\Domain\ExitSlip\Repositories\ExitSlipRepositoryInterface;
use App\Domain\ExitSlip\ValueObjects\TimeRange;
use DateTimeImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\User;

class ExitSlipController extends Controller
{
    public function __construct(
        private ExitSlipRepositoryInterface $repository
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        
        if ($user->rol?->value === 'area_head') {
            // Jefes ven las que están en SUBMITTED de su área
            $slips = array_merge(
                $this->repository->findPendingForArea((string)$user->area_id),
                // optionally also show ones they approved? We'll just show pending for now, or find all in area.
                // The repo currently has findPendingForArea.
            );
            // Alternatively, let's just get all slips for their area if we want history, but the repo might not have it.
        } elseif ($user->rol?->value === 'hr') {
            $slips = $this->repository->findByStatus(\App\Domain\ExitSlip\Enums\ExitSlipStatus::SUBMITTED_TO_HR);
        } else {
            $slips = $this->repository->findByPractitioner($user->id);
        }
        
        $mappedSlips = array_map(function(ExitSlip $slip) {
            $displayFullName = $slip->fullNameSnapshot;
            if (in_array($slip->status->value, ['draft', 'submitted'])) {
                $slipUser = \App\Models\User::find($slip->practitionerId);
                if ($slipUser) {
                    $displayFullName = trim($slipUser->nombres . ' ' . $slipUser->apellidos);
                }
            }
            
            return [
                'id' => $slip->id,
                'codigo' => $slip->codigo,
                'fecha_emision' => $slip->issueDate->format('Y-m-d'),
                'motivo_salida' => $slip->reason->value,
                'motivo_label' => $slip->reason->label(),
                'estado' => $slip->status->value,
                'estado_label' => $slip->status->label(),
                'apellidos_nombres' => $displayFullName,
            ];
        }, $slips);

        return Inertia::render('ExitSlips/Index', [
            'exitSlips' => $mappedSlips,
        ]);
    }

    public function create()
    {
        return Inertia::render('ExitSlips/Form');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tipo_plantilla' => 'required|string',
            'fecha_emision' => 'required|date',
            'designado' => 'required|string',
            'motivo_salida' => 'required|string',
            'motivo_detalle' => 'required|string',
            'fecha_autorizada' => 'required|date|after_or_equal:today',
            'hora_desde' => 'nullable|date_format:H:i',
            'hora_hasta' => 'nullable|date_format:H:i',
        ]);

        /** @var User $user */
        $user = $request->user();

        // For this test, we must pass positional arguments to bypass IDE bug.
        $slip = new ExitSlip(
            Str::uuid()->toString(),
            'PAP-' . date('Ymd') . '-' . strtoupper(Str::random(4)),
            $user->id,
            ExitSlipTemplate::from($validated['tipo_plantilla']),
            new DateTimeImmutable($validated['fecha_emision']),
            $user->nombres . ' ' . $user->apellidos,
            $validated['designado'],
            ExitReason::from($validated['motivo_salida']),
            $validated['motivo_detalle'],
            new DateTimeImmutable($validated['fecha_autorizada']),
            $validated['hora_desde'] ? new TimeRange($validated['hora_desde'], $validated['hora_hasta']) : null,
            \App\Domain\ExitSlip\Enums\ExitSlipStatus::DRAFT,
            $user->jefe_id,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            new DateTimeImmutable()
        );

        $this->repository->save($slip);

        return redirect()->route('exit-slips.index')->with('success', 'Borrador creado.');
    }

    public function show(string $id)
    {
        $slip = $this->repository->findById($id);
        if (!$slip) abort(404);

        // $this->authorize('view', \App\Models\ExitSlip::find($id)); 
        // We use Eloquent model for policy authorization

        $slipUser = \App\Models\User::find($slip->practitionerId);
        $displayFullName = $slip->fullNameSnapshot;
        if ($slipUser && in_array($slip->status->value, ['draft', 'submitted'])) {
            $displayFullName = trim($slipUser->nombres . ' ' . $slipUser->apellidos);
        }

        return Inertia::render('ExitSlips/Show', [
            'exitSlip' => [
                'id' => $slip->id,
                'codigo' => $slip->codigo,
                'fecha_emision' => $slip->issueDate->format('Y-m-d'),
                'motivo_salida' => $slip->reason->value,
                'motivo_label' => $slip->reason->label(),
                'motivo_detalle' => $slip->reasonDetail,
                'fecha_autorizada' => $slip->authorizedDate->format('Y-m-d'),
                'hora_desde' => $slip->authorizedTime?->from,
                'hora_hasta' => $slip->authorizedTime?->until,
                'estado' => $slip->status->value,
                'estado_label' => $slip->status->label(),
                'apellidos_nombres' => $displayFullName,
                'designado' => $slip->designationSnapshot,
            ]
        ]);
    }

    public function edit(string $id)
    {
        $slip = $this->repository->findById($id);
        if (!$slip) abort(404);
        
        // $this->authorize('update', \App\Models\ExitSlip::find($id));

        return Inertia::render('ExitSlips/Form', [
            'exitSlip' => [
                'id' => $slip->id,
                'tipo_plantilla' => $slip->templateType->value,
                'fecha_emision' => $slip->issueDate->format('Y-m-d'),
                'designado' => $slip->designationSnapshot,
                'motivo_salida' => $slip->reason->value,
                'motivo_detalle' => $slip->reasonDetail,
                'fecha_autorizada' => $slip->authorizedDate->format('Y-m-d'),
                'hora_desde' => $slip->authorizedTime?->from,
                'hora_hasta' => $slip->authorizedTime?->until,
            ]
        ]);
    }

    public function update(Request $request, string $id)
    {
        $slip = $this->repository->findById($id);
        if (!$slip) abort(404);

        // $this->authorize('update', \App\Models\ExitSlip::find($id));

        $validated = $request->validate([
            'tipo_plantilla' => 'required|string',
            'fecha_emision' => 'required|date',
            'designado' => 'required|string',
            'motivo_salida' => 'required|string',
            'motivo_detalle' => 'required|string',
            'fecha_autorizada' => 'required|date',
            'hora_desde' => 'nullable|date_format:H:i',
            'hora_hasta' => 'nullable|date_format:H:i',
        ]);

        $slipUser = \App\Models\User::find($slip->practitionerId);
        $currentFullName = $slipUser ? trim($slipUser->nombres . ' ' . $slipUser->apellidos) : $slip->fullNameSnapshot;

        $updatedSlip = new ExitSlip(
            $slip->id,
            $slip->codigo,
            $slip->practitionerId,
            ExitSlipTemplate::from($validated['tipo_plantilla']),
            new DateTimeImmutable($validated['fecha_emision']),
            $currentFullName,
            $validated['designado'],
            ExitReason::from($validated['motivo_salida']),
            $validated['motivo_detalle'],
            new DateTimeImmutable($validated['fecha_autorizada']),
            $validated['hora_desde'] ? new TimeRange($validated['hora_desde'], $validated['hora_hasta']) : null,
            $slip->status,
            $slip->assignedHeadId,
            $slip->approvedByHeadId,
            $slip->approvedByHeadAt,
            $slip->approvedByHrId,
            $slip->approvedByHrAt,
            $slip->practitionerSignaturePath,
            $slip->areaHeadSignaturePath,
            $slip->hrSignaturePath,
            $slip->lineManagerSignaturePath,
            $slip->exitTime,
            $slip->returnTime,
            $slip->securityObservations,
            $slip->supervisor,
            $slip->rejectionReason,
            $slip->finalPdfPath,
            $slip->createdAt
        );

        $this->repository->save($updatedSlip);

        return redirect()->route('exit-slips.index')->with('success', 'Borrador actualizado.');
    }

    public function transition(Request $request, string $id, string $action)
    {
        $slip = $this->repository->findById($id);
        if (!$slip) abort(404);

        $user = $request->user();
        $slipUser = \App\Models\User::find($slip->practitionerId);
        $currentFullName = $slipUser ? trim($slipUser->nombres . ' ' . $slipUser->apellidos) : $slip->fullNameSnapshot;
        
        $newStatus = $slip->status;
        $fullNameSnapshot = $slip->fullNameSnapshot;
        $practitionerSignaturePath = $slip->practitionerSignaturePath;
        $areaHeadSignaturePath = $slip->areaHeadSignaturePath;
        $hrSignaturePath = $slip->hrSignaturePath;
        $approvedByHeadId = $slip->approvedByHeadId;
        $approvedByHeadAt = $slip->approvedByHeadAt;
        $approvedByHrId = $slip->approvedByHrId;
        $approvedByHrAt = $slip->approvedByHrAt;
        $rejectionReason = $slip->rejectionReason;

        if ($action === 'submit' && $slip->canBeSubmitted()) {
            $newStatus = \App\Domain\ExitSlip\Enums\ExitSlipStatus::SUBMITTED;
            $fullNameSnapshot = $currentFullName; // Lock the snapshot at the time of submission
            $practitionerSignaturePath = $user->signature?->ruta_archivo; // Capture signature
            if ($slip->assignedHeadId) {
                \App\Models\Notification::create([
                    'user_id' => $slip->assignedHeadId,
                    'tipo' => 'submit',
                    'exit_slip_id' => $slip->id,
                    'titulo' => 'Nueva papeleta para revisión',
                    'mensaje' => 'El practicante ' . $currentFullName . ' ha enviado una papeleta para aprobación.',
                ]);
                event(new \App\Events\NotificationCreated($slip->assignedHeadId));
            }
        } elseif ($action === 'approve') {
            if ($user->rol?->value === 'area_head' && $slip->canBeApprovedByArea()) {
                $newStatus = \App\Domain\ExitSlip\Enums\ExitSlipStatus::APPROVED_BY_AREA;
                $areaHeadSignaturePath = $user->signature?->ruta_archivo;
                $approvedByHeadId = (string) $user->id;
                $approvedByHeadAt = new DateTimeImmutable();
                
                \App\Models\Notification::create([
                    'user_id' => $slip->practitionerId,
                    'tipo' => 'approve',
                    'exit_slip_id' => $slip->id,
                    'titulo' => 'Papeleta firmada',
                    'mensaje' => 'Tu papeleta ' . $slip->codigo . ' ha sido firmada por tu jefe de área.',
                ]);
                event(new \App\Events\NotificationCreated($slip->practitionerId));
            } elseif ($user->rol?->value === 'hr' && $slip->canBeApprovedByHR()) {
                $newStatus = \App\Domain\ExitSlip\Enums\ExitSlipStatus::APPROVED_BY_HR;
                $hrSignaturePath = $user->signature?->ruta_archivo;
                $approvedByHrId = (string) $user->id;
                $approvedByHrAt = new DateTimeImmutable();
                
                \App\Models\Notification::create([
                    'user_id' => $slip->practitionerId,
                    'tipo' => 'approve_hr',
                    'exit_slip_id' => $slip->id,
                    'titulo' => 'Papeleta aprobada por RRHH',
                    'mensaje' => 'Tu papeleta ' . $slip->codigo . ' ha sido aprobada por Recursos Humanos.',
                ]);
                event(new \App\Events\NotificationCreated($slip->practitionerId));
            } else {
                abort(403, 'Acción no permitida.');
            }
        } elseif ($action === 'submit_to_hr') {
            if ($slip->canBeSubmittedToHR() && (string) $user->id === (string) $slip->practitionerId) {
                $newStatus = \App\Domain\ExitSlip\Enums\ExitSlipStatus::SUBMITTED_TO_HR;
                
                // Notify all HR users
                $hrUsers = \App\Models\User::where('rol', 'hr')->get();
                foreach ($hrUsers as $hrUser) {
                    \App\Models\Notification::create([
                        'user_id' => $hrUser->id,
                        'tipo' => 'submit',
                        'exit_slip_id' => $slip->id,
                        'titulo' => 'Papeleta pendiente de Recursos Humanos',
                        'mensaje' => 'La papeleta ' . $slip->codigo . ' ha sido enviada a Recursos Humanos.',
                    ]);
                    event(new \App\Events\NotificationCreated($hrUser->id));
                }
            }
        } elseif ($action === 'reject' && $slip->canBeRejected()) {
            $newStatus = \App\Domain\ExitSlip\Enums\ExitSlipStatus::REJECTED;
            $rejectionReason = $request->input('reason', 'Rechazado sin motivo explícito.');
            
            \App\Models\Notification::create([
                'user_id' => $slip->practitionerId,
                'tipo' => 'reject',
                'exit_slip_id' => $slip->id,
                'titulo' => 'Papeleta rechazada',
                'mensaje' => 'Tu papeleta ' . $slip->codigo . ' ha sido rechazada.',
            ]);
            event(new \App\Events\NotificationCreated($slip->practitionerId));
        } else {
            abort(400, 'Transición no válida.');
        }

        $updatedSlip = new ExitSlip(
            $slip->id,
            $slip->codigo,
            $slip->practitionerId,
            $slip->templateType,
            $slip->issueDate,
            $fullNameSnapshot,
            $slip->designationSnapshot,
            $slip->reason,
            $slip->reasonDetail,
            $slip->authorizedDate,
            $slip->authorizedTime,
            $newStatus,
            $slip->assignedHeadId,
            $approvedByHeadId,
            $approvedByHeadAt,
            $approvedByHrId,
            $approvedByHrAt,
            $practitionerSignaturePath,
            $areaHeadSignaturePath,
            $hrSignaturePath,
            $slip->lineManagerSignaturePath,
            $slip->exitTime,
            $slip->returnTime,
            $slip->securityObservations,
            $slip->supervisor,
            $rejectionReason,
            $slip->finalPdfPath,
            $slip->createdAt
        );

        $this->repository->save($updatedSlip);

        return back()->with('success', 'Papeleta actualizada exitosamente.');
    }

    public function generatePdf(string $id)
    {
        $slip = $this->repository->findById($id);
        if (!$slip) abort(404);

        // $this->authorize('generatePdf', \App\Models\ExitSlip::find($id));

        $user = \App\Models\User::with('signature')->find($slip->practitionerId);
        $practitionerSignaturePath = $slip->practitionerSignaturePath;
        if (!$practitionerSignaturePath && in_array($slip->status->value, ['draft', 'submitted'])) {
            $practitionerSignaturePath = $user?->signature?->ruta_archivo;
        }

        $signatures = [
            'practicante' => $this->getSignatureBase64($practitionerSignaturePath),
            'jefe' => $this->getSignatureBase64($slip->areaHeadSignaturePath),
            'rrhh' => $this->getSignatureBase64($slip->hrSignaturePath),
        ];

        $pdf = Pdf::loadView('pdf.exit-slip', [
            'slip' => $slip, 
            'signatures' => $signatures,
            'user' => $user
        ]);
        
        $pdf->setPaper('A4', 'landscape');
        $pdf->setOption('isRemoteEnabled', false);

        return $pdf->stream($slip->codigo . '.pdf');
    }

    private function getSignatureBase64(?string $path): ?string
    {
        if (!$path || !\Illuminate\Support\Facades\Storage::disk('private')->exists($path)) {
            return null;
        }
        $mime = \Illuminate\Support\Facades\Storage::disk('private')->mimeType($path);
        $content = base64_encode(\Illuminate\Support\Facades\Storage::disk('private')->get($path));
        return "data:$mime;base64,$content";
    }
}
