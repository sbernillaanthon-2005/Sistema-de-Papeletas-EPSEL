<?php

declare(strict_types=1);

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\ExitSlip;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Módulo exclusivo para RRHH:
 * muestra todos los usuarios que han enviado papeletas al área,
 * con nombre completo, código de papeleta, motivo, fecha/hora
 * en que se envió a RRHH y estado actual.
 */
class HrSolicitantesController extends Controller
{
    // Estados que RRHH puede ver (mismo scope que ExitSlipController)
    private const HR_STATES = [
        'submitted_to_hr',
        'approved_by_hr',
        'submitted_to_security',
        'completed',
        'rejected',
    ];

    public function index(Request $request)
    {
        // Sólo accesible para RRHH
        abort_unless($request->user()->rol->value === 'hr', 403);

        $request->validate([
            'q'      => 'nullable|string|max:120',
            'estado' => ['nullable', Rule::in(self::HR_STATES)],
        ]);

        $q      = $request->filled('q')      ? trim($request->q)      : null;
        $estado = $request->filled('estado') ? $request->estado        : null;

        /*
         * Consulta principal:
         * - Trae los exit_slips visibles para RRHH
         * - Hace JOIN con users para obtener nombre del solicitante
         * - Hace un subquery en exit_slip_transitions para obtener la
         *   fecha/hora exacta en que la papeleta llegó a RRHH
         *   (estado_destino = 'submitted_to_hr')
         */
        $query = ExitSlip::query()
            ->whereIn('exit_slips.estado', self::HR_STATES)
            ->join('users', 'users.id', '=', 'exit_slips.user_id')
            // Subquery: momento en que llegó a RRHH
            ->leftJoinSub(
                DB::table('exit_slip_transitions')
                    ->select('exit_slip_id', DB::raw('min(created_at) as enviado_rrhh_at'))
                    ->where('estado_destino', 'submitted_to_hr')
                    ->groupBy('exit_slip_id'),
                'tr',
                'tr.exit_slip_id',
                '=',
                'exit_slips.id'
            )
            ->select([
                'exit_slips.id',
                'exit_slips.codigo',
                'exit_slips.estado',
                'exit_slips.motivo_salida',
                'exit_slips.fecha_autorizada',
                'exit_slips.user_id',
                'users.nombres',
                'users.apellidos',
                'users.dni',
                'users.cargo_designado',
                'tr.enviado_rrhh_at',
            ]);

        // Búsqueda por nombre/DNI/código
        if ($q) {
            $term = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $q) . '%';
            $query->where(function ($sub) use ($term) {
                $sub->where('exit_slips.codigo', 'ilike', $term)
                    ->orWhere('users.nombres',   'ilike', $term)
                    ->orWhere('users.apellidos', 'ilike', $term)
                    ->orWhere('users.dni',       'ilike', $term);
            });
        }

        // Filtro por estado
        if ($estado) {
            $query->where('exit_slips.estado', $estado);
        }

        // Orden: más recientes primero (por fecha de envío a RRHH)
        $query->orderByRaw('tr.enviado_rrhh_at DESC NULLS LAST')
              ->orderBy('exit_slips.created_at', 'desc');

        $page  = $query->paginate(20)->withQueryString();

        // Etiquetas de motivo y estado (ya casteados por Eloquent)
        $items = $page->getCollection()->map(function ($row) {
            return [
                'id'               => $row->id,
                'codigo'           => $row->codigo,
                'estado'           => $row->estado->value,
                'estado_label'     => $row->estado->label(),
                'motivo_label'     => $row->motivo_salida->label(),
                'fecha_autorizada' => $row->fecha_autorizada->toDateString(),
                'enviado_rrhh_at'  => $row->enviado_rrhh_at,   // timestamp ISO
                'solicitante' => [
                    'nombres'          => $row->nombres,
                    'apellidos'        => $row->apellidos,
                    'dni'              => $row->dni,
                    'cargo_designado'  => $row->cargo_designado,
                ],
            ];
        });

        // KPIs específicos para la vista de Solicitantes
        $baseQuery = ExitSlip::query()->whereIn('estado', self::HR_STATES);
        
        $uniqueUsers = (clone $baseQuery)->distinct('user_id')->count('user_id');
        
        $thisMonth = (clone $baseQuery)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
            
        $pending = (clone $baseQuery)->where('estado', 'submitted_to_hr')->count();

        return Inertia::render('HR/Solicitantes', [
            'items'       => $items,
            'pagination'  => [
                'current_page' => $page->currentPage(),
                'last_page'    => $page->lastPage(),
                'total'        => $page->total(),
                'prev_page_url'=> $page->previousPageUrl(),
                'next_page_url'=> $page->nextPageUrl(),
            ],
            'kpis' => [
                'uniqueUsers' => $uniqueUsers,
                'thisMonth'   => $thisMonth,
                'pending'     => $pending,
            ],
            'filters'     => $request->only('q', 'estado'),
        ]);
    }
}
