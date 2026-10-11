<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ExitSlip;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $user  = $request->user();
        $rol   = $user->rol->value;
        $now   = Carbon::now('America/Lima');
        $month = $now->month;
        $year  = $now->year;

        // ── Ámbito base (igual que ExitSlipController::index) ──────────────
        $base = ExitSlip::query();
        match ($rol) {
            'admin'    => null,
            'area_head'=> $base->where(fn ($q) => $q
                ->where('user_id', $user->id)
                ->orWhere(fn ($q) => $q
                    ->where('jefe_asignado_id', $user->id)
                    ->where('estado', '!=', 'draft')
                )
            ),
            'hr'       => $base->whereIn('estado', [
                'submitted_to_hr', 'approved_by_hr',
                'submitted_to_security', 'completed', 'rejected',
            ]),
            'security' => $base->whereIn('estado', ['submitted_to_security', 'completed']),
            default    => $base->where('user_id', $user->id),
        };

        // ── Totales globales (ámbito del usuario) ────────────────────────
        $counts = (clone $base)
            ->selectRaw('estado, count(*) as total')
            ->groupBy('estado')
            ->pluck('total', 'estado')
            ->toArray();

        $total     = array_sum($counts);
        $completed = (int) ($counts['completed'] ?? 0);
        $rejected  = (int) ($counts['rejected']  ?? 0);
        $pending   = $this->pendingCount($rol, $counts);

        // ── Papeletas del mes actual ─────────────────────────────────────
        $thisMonth = (clone $base)
            ->whereMonth('created_at', $month)
            ->whereYear('created_at', $year)
            ->count();

        // ── Papeletas del mes anterior (para calcular tendencia) ─────────
        $prevMonth = (clone $base)
            ->whereMonth('created_at', $now->copy()->subMonth()->month)
            ->whereYear('created_at', $now->copy()->subMonth()->year)
            ->count();

        $trend = $prevMonth > 0
            ? round((($thisMonth - $prevMonth) / $prevMonth) * 100, 1)
            : ($thisMonth > 0 ? 100.0 : 0.0);

        // ── Desglose semanal últimas 4 semanas (para mini gráfico) ───────
        $weekly = [];
        for ($i = 3; $i >= 0; $i--) {
            $start = $now->copy()->subWeeks($i)->startOfWeek();
            $end   = $now->copy()->subWeeks($i)->endOfWeek();
            $weekly[] = [
                'label' => $start->format('d/m'),
                'value' => (clone $base)
                    ->whereBetween('created_at', [$start, $end])
                    ->count(),
            ];
        }

        // ── Últimas papeletas (para lista rápida) ────────────────────────
        $recentSlips = (clone $base)
            ->latest()
            ->limit(5)
            ->get(['id', 'codigo', 'estado', 'fecha_autorizada', 'motivo_salida', 'apellidos_nombres'])
            ->map(fn ($s) => [
                'id'               => $s->id,
                'codigo'           => $s->codigo,
                'estado'           => $s->estado->value,
                'estado_label'     => $s->estado->label(),
                'fecha_autorizada' => $s->fecha_autorizada->toDateString(),
                'motivo_label'     => $s->motivo_salida->label(),
            ]);

        // ── Ratio de aprobación (solo roles que ven todo el flujo) ───────
        $approvalRate = ($completed + $rejected) > 0
            ? round(($completed / ($completed + $rejected)) * 100, 1)
            : null;

        return Inertia::render('Dashboard', [
            'stats' => [
                'total'        => $total,
                'pending'      => $pending,
                'completed'    => $completed,
                'rejected'     => $rejected,
                'thisMonth'    => $thisMonth,
                'trend'        => $trend,          // % vs mes anterior
                'approvalRate' => $approvalRate,   // % completadas / (completadas+rechazadas)
            ],
            'weekly'      => $weekly,
            'recentSlips' => $recentSlips,
        ]);
    }

    // ── Helper: el "pendiente relevante" varía por rol ──────────────────
    private function pendingCount(string $rol, array $counts): int
    {
        return match ($rol) {
            'hr'       => (int) ($counts['submitted_to_hr']       ?? 0),
            'security' => (int) ($counts['submitted_to_security'] ?? 0),
            'area_head'=> (int) ($counts['submitted']             ?? 0),
            'admin'    => (int) ($counts['submitted']             ?? 0)
                        + (int) ($counts['submitted_to_hr']       ?? 0),
            default    => (int) ($counts['draft']                 ?? 0),  // practicante/worker
        };
    }
}
