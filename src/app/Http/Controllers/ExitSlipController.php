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
        $slips = $this->repository->findByPractitioner($request->user()->id);
        
        $mappedSlips = array_map(fn(ExitSlip $slip) => [
            'id' => $slip->id,
            'codigo' => $slip->codigo,
            'fecha_emision' => $slip->issueDate->format('Y-m-d'),
            'motivo_salida' => $slip->reason->value,
            'motivo_label' => $slip->reason->label(),
            'estado' => $slip->status->value,
            'estado_label' => $slip->status->label(),
        ], $slips);

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
                'apellidos_nombres' => $slip->fullNameSnapshot,
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

        $updatedSlip = new ExitSlip(
            $slip->id,
            $slip->codigo,
            $slip->practitionerId,
            ExitSlipTemplate::from($validated['tipo_plantilla']),
            new DateTimeImmutable($validated['fecha_emision']),
            $slip->fullNameSnapshot,
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

    public function generatePdf(string $id)
    {
        $slip = $this->repository->findById($id);
        if (!$slip) abort(404);

        // $this->authorize('generatePdf', \App\Models\ExitSlip::find($id));

        $signatures = [
            'practicante' => $this->getSignatureBase64($slip->practitionerSignaturePath),
            'jefe' => $this->getSignatureBase64($slip->areaHeadSignaturePath),
            'rrhh' => $this->getSignatureBase64($slip->hrSignaturePath),
        ];

        $pdf = Pdf::loadView('pdf.exit-slip', ['slip' => $slip, 'signatures' => $signatures]);
        
        $pdf->setPaper('A4', 'landscape');
        $pdf->setOption('isRemoteEnabled', false);

        return $pdf->stream($slip->codigo . '.pdf');
    }

    private function getSignatureBase64(?string $path): ?string
    {
        if (!$path || !\Illuminate\Support\Facades\Storage::disk('local')->exists($path)) {
            return null;
        }
        $mime = \Illuminate\Support\Facades\Storage::disk('local')->mimeType($path);
        $content = base64_encode(\Illuminate\Support\Facades\Storage::disk('local')->get($path));
        return "data:$mime;base64,$content";
    }
}
